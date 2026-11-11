package com.learningworks.courseData.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.IDN;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.Charset;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.courseData.vo.response.LinkPreviewResponseVO;

/**
 * 링크 미리보기 (Open Graph 메타 태그 조회)
 *
 * SSRF 방지
 * - http / https, 기본 포트(80 · 443)만 허용, 사용자 정보(user@host) 포함 URL 차단
 * - 호스트의 모든 IP 를 확인하여 루프백 · 사설망 · 링크 로컬(클라우드 메타데이터 포함) · 멀티캐스트 등 내부 주소 차단
 * - 리다이렉트는 자동으로 따라가지 않고, 최대 3회까지 이동할 주소를 다시 검증한 뒤 요청
 * - 연결 3초 · 응답 5초 타임아웃, HTML 응답만 최대 512KB 까지 읽음
 * 한계: 검증과 실제 연결 사이에 DNS 응답이 바뀌는 DNS rebinding 은 완전히 막지 못한다.
 *      운영 환경에서는 서버의 외부 요청을 프록시 · 방화벽으로 제한하는 것을 함께 권장한다.
 */
@Service
public class LinkPreviewServiceImpl implements LinkPreviewService {

	private static final int MAX_URL_LENGTH = 2000;
	private static final int MAX_REDIRECTS = 3;
	private static final int MAX_BODY_BYTES = 512 * 1024;
	private static final int MAX_TITLE_LENGTH = 200;
	private static final int MAX_DESCRIPTION_LENGTH = 300;
	private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);
	private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(5);
	private static final String USER_AGENT = "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)";

	private static final Pattern CHARSET_PATTERN = Pattern.compile("charset=\"?([A-Za-z0-9_.:-]+)", Pattern.CASE_INSENSITIVE);

	private final HttpClient httpClient = HttpClient.newBuilder()
			.followRedirects(HttpClient.Redirect.NEVER)
			.connectTimeout(CONNECT_TIMEOUT)
			.build();

	@Override
	public LinkPreviewResponseVO getLinkPreview(String url) {
		URI uri = validateUri(url);
		String originalUrl = uri.toString();

		for (int redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
			validateHost(uri);

			HttpResponse<InputStream> response = send(uri);
			int status = response.statusCode();

			if (status >= 300 && status < 400) {
				closeQuietly(response.body());
				Optional<String> location = response.headers().firstValue("Location");
				if (location.isEmpty()) {
					break;
				}
				// 이동할 주소도 처음과 같은 기준으로 다시 검증
				uri = validateUri(uri.resolve(location.get().trim()).toString());
				continue;
			}

			if (status != 200) {
				closeQuietly(response.body());
				break;
			}

			String contentType = response.headers().firstValue("Content-Type").orElse("").toLowerCase(Locale.ROOT);
			if (!contentType.contains("text/html") && !contentType.contains("application/xhtml")) {
				closeQuietly(response.body());
				break;
			}

			Document document = readDocument(response, contentType, uri);
			return toPreview(originalUrl, uri, document);
		}

		throw new LearningworksException(ErrorCode.LINK_PREVIEW_FAILURE);
	}

	// ------------------------------------------------------------------
	// URL · 주소 검증
	// ------------------------------------------------------------------

	private URI validateUri(String url) {
		if (url == null || url.isBlank() || url.length() > MAX_URL_LENGTH) {
			throw new LearningworksException(ErrorCode.LINK_PREVIEW_INVALID_URL);
		}

		URI uri;
		try {
			uri = new URI(url.trim()).normalize();
		} catch (URISyntaxException e) {
			throw new LearningworksException(ErrorCode.LINK_PREVIEW_INVALID_URL);
		}

		String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
		if (!scheme.equals("http") && !scheme.equals("https")) {
			throw new LearningworksException(ErrorCode.LINK_PREVIEW_INVALID_URL);
		}
		if (uri.getHost() == null || uri.getHost().isBlank() || uri.getRawUserInfo() != null) {
			throw new LearningworksException(ErrorCode.LINK_PREVIEW_INVALID_URL);
		}

		int port = uri.getPort();
		if (port != -1 && port != 80 && port != 443) {
			throw new LearningworksException(ErrorCode.LINK_PREVIEW_INVALID_URL);
		}
		return uri;
	}

	/** 호스트가 가리키는 모든 IP 가 공인 주소인지 확인 */
	private void validateHost(URI uri) {
		InetAddress[] addresses;
		try {
			addresses = InetAddress.getAllByName(IDN.toASCII(uri.getHost()));
		} catch (UnknownHostException | IllegalArgumentException e) {
			throw new LearningworksException(ErrorCode.LINK_PREVIEW_FAILURE);
		}

		if (addresses.length == 0) {
			throw new LearningworksException(ErrorCode.LINK_PREVIEW_FAILURE);
		}
		for (InetAddress address : addresses) {
			if (!isPublicAddress(address)) {
				throw new LearningworksException(ErrorCode.LINK_PREVIEW_INVALID_URL);
			}
		}
	}

	private boolean isPublicAddress(InetAddress address) {
		if (address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isLinkLocalAddress()
				|| address.isSiteLocalAddress() || address.isMulticastAddress()) {
			return false;
		}

		byte[] bytes = address.getAddress();

		if (address instanceof Inet4Address) {
			int first = bytes[0] & 0xFF;
			int second = bytes[1] & 0xFF;
			int third = bytes[2] & 0xFF;
			return first != 0                                   // 0.0.0.0/8
					&& !(first == 100 && second >= 64 && second <= 127)  // 100.64.0.0/10 (CGNAT)
					&& !(first == 192 && second == 0 && third == 0)       // 192.0.0.0/24
					&& !(first == 198 && (second == 18 || second == 19))  // 198.18.0.0/15
					&& first < 240;                                       // 240.0.0.0/4, 브로드캐스트
		}

		if (address instanceof Inet6Address) {
			if ((bytes[0] & 0xFE) == 0xFC) {
				return false; // fc00::/7 (Unique Local)
			}
			if ((bytes[0] & 0xFF) == 0x00 && (bytes[1] & 0xFF) == 0x64 && (bytes[2] & 0xFF) == 0xFF
					&& (bytes[3] & 0xFF) == 0x9B) {
				return false; // 64:ff9b::/96 (NAT64, 내부 IPv4 우회 방지)
			}
			boolean ipv4Compatible = true; // ::a.b.c.d
			for (int i = 0; i < 12; i++) {
				if (bytes[i] != 0) {
					ipv4Compatible = false;
					break;
				}
			}
			return !ipv4Compatible;
		}
		return false;
	}

	// ------------------------------------------------------------------
	// 요청 · 파싱
	// ------------------------------------------------------------------

	private HttpResponse<InputStream> send(URI uri) {
		HttpRequest request = HttpRequest.newBuilder(uri)
				.timeout(REQUEST_TIMEOUT)
				.header("User-Agent", USER_AGENT)
				.header("Accept", "text/html,application/xhtml+xml")
				.GET()
				.build();
		try {
			return this.httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
		} catch (IOException e) {
			throw new LearningworksException(ErrorCode.LINK_PREVIEW_FAILURE, e);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new LearningworksException(ErrorCode.LINK_PREVIEW_FAILURE, e);
		}
	}

	private Document readDocument(HttpResponse<InputStream> response, String contentType, URI uri) {
		byte[] body;
		try (InputStream inputStream = response.body()) {
			body = inputStream.readNBytes(MAX_BODY_BYTES);
		} catch (IOException e) {
			throw new LearningworksException(ErrorCode.LINK_PREVIEW_FAILURE, e);
		}

		String charset = null;
		Matcher matcher = CHARSET_PATTERN.matcher(contentType);
		if (matcher.find() && Charset.isSupported(matcher.group(1))) {
			charset = matcher.group(1);
		}

		try {
			// charset 이 없으면 jsoup 이 <meta charset> 으로 판단
			return Jsoup.parse(new ByteArrayInputStream(body), charset, uri.toString());
		} catch (IOException e) {
			throw new LearningworksException(ErrorCode.LINK_PREVIEW_FAILURE, e);
		}
	}

	private LinkPreviewResponseVO toPreview(String originalUrl, URI finalUri, Document document) {
		String title = firstNonBlank(meta(document, "og:title"), meta(document, "twitter:title"), document.title());
		if (title == null) {
			throw new LearningworksException(ErrorCode.LINK_PREVIEW_FAILURE);
		}

		String description = firstNonBlank(meta(document, "og:description"), meta(document, "twitter:description"),
		                                   meta(document, "description"));
		String siteName = firstNonBlank(meta(document, "og:site_name"), finalUri.getHost());

		// 썸네일은 브라우저가 직접 불러오므로 https 절대 URL 만 허용
		String image = null;
		Element imageMeta = document.selectFirst("meta[property=og:image], meta[name=og:image], meta[name=twitter:image]");
		if (imageMeta != null) {
			String absolute = imageMeta.absUrl("content");
			if (absolute.toLowerCase(Locale.ROOT).startsWith("https://") && absolute.length() <= MAX_URL_LENGTH) {
				image = absolute;
			}
		}

		return new LinkPreviewResponseVO(originalUrl,
		                                 truncate(title, MAX_TITLE_LENGTH),
		                                 truncate(description, MAX_DESCRIPTION_LENGTH),
		                                 image,
		                                 truncate(siteName, MAX_TITLE_LENGTH));
	}

	private String meta(Document document, String name) {
		Element element = document.selectFirst("meta[property=" + name + "], meta[name=" + name + "]");
		return element == null ? null : element.attr("content");
	}

	private String firstNonBlank(String... values) {
		for (String value : values) {
			if (value != null && !value.isBlank()) {
				return value.replaceAll("\\s+", " ").trim();
			}
		}
		return null;
	}

	private String truncate(String value, int max) {
		if (value == null || value.length() <= max) {
			return value;
		}
		return value.substring(0, max - 1) + "…";
	}

	private void closeQuietly(InputStream inputStream) {
		try {
			inputStream.close();
		} catch (IOException ignored) {
			// 응답 본문을 사용하지 않는 경우이므로 무시
		}
	}
}
