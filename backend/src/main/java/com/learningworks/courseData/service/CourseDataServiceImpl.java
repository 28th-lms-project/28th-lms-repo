package com.learningworks.courseData.service;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Safelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.courseData.dao.CourseDataDao;
import com.learningworks.courseData.vo.request.CourseDataRequestVO;
import com.learningworks.courseData.vo.request.CourseDataSearchRequestVO;
import com.learningworks.courseData.vo.response.CourseDataFileResponseVO;
import com.learningworks.courseData.vo.response.CourseDataListResponseVO;
import com.learningworks.courseData.vo.response.CourseDataResponseVO;

@Service
public class CourseDataServiceImpl implements CourseDataService {

	private static final Logger log = LoggerFactory.getLogger(CourseDataServiceImpl.class);

	private static final int DEFAULT_PAGE_SIZE = 20;
	private static final int MAX_PAGE_SIZE = 100;

	/** 업로드 파일 최대 크기 (10MB). spring.servlet.multipart.max-file-size 와 맞춘다 */
	private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
	private static final int MAX_FILE_NAME_LENGTH = 200;

	/** 과정 ID 형식 (파일 저장 경로에 사용하므로 안전한 문자만 허용) */
	private static final Pattern COURSE_ID_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{1,20}$");

	/** 파일 ID 형식: UUID 32자리 + "." + 확장자 */
	private static final Pattern FILE_ID_PATTERN = Pattern.compile("^[0-9a-f]{32}\\.[a-z0-9]{1,5}$");

	/** 교육 자료 ID 형식 (CR-YYYYMMDD-NNNNNN, 예전 데이터는 CD-) */
	private static final Pattern DATA_ID_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{1,20}$");

	private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp", "bmp");

	/** 확장자 → 파일 시그니처 종류. SVG · HTML 등 스크립트를 포함할 수 있는 형식은 허용하지 않는다 */
	private static final Map<String, FileSignature> ALLOWED_EXTENSIONS = Map.ofEntries(
			Map.entry("jpg", FileSignature.JPEG), Map.entry("jpeg", FileSignature.JPEG),
			Map.entry("png", FileSignature.PNG), Map.entry("gif", FileSignature.GIF),
			Map.entry("webp", FileSignature.WEBP), Map.entry("bmp", FileSignature.BMP),
			Map.entry("pdf", FileSignature.PDF),
			Map.entry("zip", FileSignature.ZIP), Map.entry("docx", FileSignature.ZIP),
			Map.entry("xlsx", FileSignature.ZIP), Map.entry("pptx", FileSignature.ZIP),
			Map.entry("hwpx", FileSignature.ZIP),
			Map.entry("doc", FileSignature.OLE), Map.entry("xls", FileSignature.OLE),
			Map.entry("ppt", FileSignature.OLE), Map.entry("hwp", FileSignature.OLE),
			Map.entry("txt", FileSignature.TEXT), Map.entry("csv", FileSignature.TEXT));

	/** CSS 색상 값 (#hex, rgb(), rgba(), 색상 이름). url() · expression() 등은 허용하지 않는다 */
	private static final String COLOR_VALUE =
			"(#[0-9a-f]{3,8}|rgba?\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*(,\\s*(0|1|0?\\.\\d+)\\s*)?\\)|[a-z]{3,20})";

	private static final Pattern TEXT_DECORATION = Pattern.compile(
			"^((underline|line-through|none)\\s*){1,2}$", Pattern.CASE_INSENSITIVE);

	/**
	 * style 속성에서 허용할 CSS (속성 → 값 형식). 허용 목록에 없는 속성 · 값은 제거한다.
	 * 에디터의 글꼴 · 글자 크기 · 색상 · 정렬 · 이미지 크기 · Flex 간격 · 박스 너비 등에 사용
	 */
	private static final Map<String, Pattern> ALLOWED_STYLES = Map.ofEntries(
			Map.entry("text-align", Pattern.compile("^(left|center|right|justify|start|end)$", Pattern.CASE_INSENSITIVE)),
			Map.entry("font-size", Pattern.compile("^\\d{1,3}(\\.\\d+)?(px|pt|em|rem|%)$", Pattern.CASE_INSENSITIVE)),
			Map.entry("font-family", Pattern.compile("^[A-Za-z0-9가-힣 ,'\"\\-]{1,100}$")),
			Map.entry("font-weight", Pattern.compile("^(normal|bold|[1-9]00)$", Pattern.CASE_INSENSITIVE)),
			Map.entry("font-style", Pattern.compile("^(normal|italic)$", Pattern.CASE_INSENSITIVE)),
			Map.entry("text-decoration", TEXT_DECORATION),
			Map.entry("text-decoration-line", TEXT_DECORATION),
			Map.entry("color", Pattern.compile("^" + COLOR_VALUE + "$", Pattern.CASE_INSENSITIVE)),
			Map.entry("background-color", Pattern.compile("^" + COLOR_VALUE + "$", Pattern.CASE_INSENSITIVE)),
			Map.entry("width", Pattern.compile("^\\d{1,4}(\\.\\d+)?(px|%)$", Pattern.CASE_INSENSITIVE)),
			Map.entry("gap", Pattern.compile("^\\d{1,2}px$", Pattern.CASE_INSENSITIVE)),
			Map.entry("margin-left", Pattern.compile("^\\d{1,3}px$", Pattern.CASE_INSENSITIVE)));

	/** 에디터가 만드는 class (허용 목록 외 class 는 제거). frontend/src/components/common/editor/editorContent.css 와 맞춘다 */
	private static final Set<String> ALLOWED_CLASSES = Set.of(
			"editor-file",
			"editor-flex", "editor-flex-item",
			"editor-textbox", "editor-float-left", "editor-float-right",
			"editor-details", "editor-details-body",
			"editor-code", "editor-table",
			"editor-link-card", "editor-link-card-thumb", "editor-link-card-body",
			"editor-link-card-title", "editor-link-card-desc", "editor-link-card-url",
			"editor-img-left", "editor-img-center", "editor-img-right");

	private static final Pattern CODE_LANGUAGE_PATTERN = Pattern.compile("^[a-z0-9+#-]{1,20}$");
	private static final Pattern CELL_SPAN_PATTERN = Pattern.compile("^([1-9]|[1-9]\\d)$");
	private static final Pattern FONT_SIZE_PATTERN = Pattern.compile("^[1-7]$");
	private static final Pattern FILE_SIZE_PATTERN = Pattern.compile("^\\d{1,12}$");

	private enum FileSignature {
		JPEG, PNG, GIF, WEBP, BMP, PDF, ZIP, OLE, TEXT
	}

	private final CourseDataDao courseDataDao;
	private final Path uploadRoot;

	public CourseDataServiceImpl(CourseDataDao courseDataDao,
	                             @Value("${app.course-data.upload-dir}") String uploadDir) {
		this.courseDataDao = courseDataDao;
		this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
	}

	@Override
	@Transactional(readOnly = true)
	public CourseDataListResponseVO getCourseDataList(String courseId, CourseDataSearchRequestVO searchRequestVO) {
		validateCourse(courseId);

		int page = Math.max(searchRequestVO.getPage(), 1);
		int size = searchRequestVO.getSize();
		if (size < 1 || size > MAX_PAGE_SIZE) {
			size = DEFAULT_PAGE_SIZE;
		}

		String dataName = searchRequestVO.getDataName() == null ? "" : searchRequestVO.getDataName().trim();

		searchRequestVO.setCourseId(courseId);
		searchRequestVO.setDataName(dataName);
		searchRequestVO.setDataNameKeyword(escapeLike(dataName));
		searchRequestVO.setPage(page);
		searchRequestVO.setSize(size);
		searchRequestVO.setOffset((long) (page - 1) * size);

		long totalCount = this.courseDataDao.countCourseData(searchRequestVO);
		long totalPages = Math.ceilDiv(totalCount, size);

		List<CourseDataResponseVO> list = totalCount == 0
				? List.of()
				: this.courseDataDao.selectCourseDataList(searchRequestVO);

		return new CourseDataListResponseVO(list, totalCount, page, size, totalPages);
	}

	@Override
	@Transactional(readOnly = true)
	public CourseDataResponseVO getCourseData(String courseId, String id) {
		validateCourse(courseId);
		validateDataId(id);

		CourseDataResponseVO courseData = this.courseDataDao.selectCourseData(courseId, id);
		if (courseData == null) {
			throw new LearningworksException(ErrorCode.COURSE_DATA_NOT_EXISTS);
		}

		// 저장 시 Sanitize 했지만, 출력 시에도 한 번 더 적용 (XSS 방어)
		courseData.setContent(sanitizeContent(courseId, courseData.getContent()));
		return courseData;
	}

	@Override
	@Transactional
	public String createCourseData(String courseId, CourseDataRequestVO courseDataRequestVO) {
		validateCourse(courseId);

		// 자료명 앞뒤 공백 제거 (공백만 입력한 경우는 @NotBlank 에서 차단)
		courseDataRequestVO.setDataName(courseDataRequestVO.getDataName().trim());
		courseDataRequestVO.setCourseId(courseId);

		String content = sanitizeContent(courseId, courseDataRequestVO.getContent());
		if (isEmptyContent(content)) {
			throw new LearningworksException(ErrorCode.COURSE_DATA_EMPTY_CONTENT);
		}
		courseDataRequestVO.setContent(content);

		// ID 는 Mapper 의 selectKey 로 생성 (CR-YYYYMMDD-NNNNNN)
		int insertCount = this.courseDataDao.insertCourseData(courseDataRequestVO);
		if (insertCount != 1) {
			throw new LearningworksException(ErrorCode.COURSE_DATA_FAILURE_CREATE);
		}

		return courseDataRequestVO.getId();
	}

	@Override
	@Transactional
	public void updateCourseData(String courseId, String id, CourseDataRequestVO courseDataRequestVO) {
		validateCourse(courseId);
		validateDataId(id);

		// 현재 과정의 자료인지 확인 (ID + COURSE_ID 로 조회하므로 다른 과정의 자료는 조회되지 않음)
		CourseDataResponseVO saved = this.courseDataDao.selectCourseData(courseId, id);
		if (saved == null) {
			throw new LearningworksException(ErrorCode.COURSE_DATA_NOT_EXISTS);
		}

		// 요청 본문의 id · courseId 는 무시하고 URL 값으로 고정
		courseDataRequestVO.setId(id);
		courseDataRequestVO.setCourseId(courseId);
		courseDataRequestVO.setDataName(courseDataRequestVO.getDataName().trim());

		String content = sanitizeContent(courseId, courseDataRequestVO.getContent());
		if (isEmptyContent(content)) {
			throw new LearningworksException(ErrorCode.COURSE_DATA_EMPTY_CONTENT);
		}
		courseDataRequestVO.setContent(content);

		// CRT_DT 는 그대로, MDFY_DT 만 SYSDATE 로 갱신
		int updateCount = this.courseDataDao.updateCourseData(courseDataRequestVO);
		if (updateCount == 0) {
			throw new LearningworksException(ErrorCode.COURSE_DATA_NOT_EXISTS);
		}
		if (updateCount != 1) {
			throw new LearningworksException(ErrorCode.COURSE_DATA_FAILURE_UPDATE);
		}

		// 수정 전 본문에는 있었지만 수정 후 본문에서 빠진 파일 → 다른 자료에서도 쓰지 않으면 커밋 후 삭제
		Set<String> removedFileIds = extractFileIds(saved.getContent());
		removedFileIds.removeAll(extractFileIds(content));
		deleteUnreferencedFilesAfterCommit(courseId, removedFileIds);
	}

	@Override
	@Transactional
	public void deleteCourseData(String courseId, String id) {
		validateCourse(courseId);
		validateDataId(id);

		CourseDataResponseVO saved = this.courseDataDao.selectCourseData(courseId, id);
		if (saved == null) {
			throw new LearningworksException(ErrorCode.COURSE_DATA_NOT_EXISTS);
		}

		// COURSE_DATA 에는 논리 삭제 컬럼(DEL_YN)이 없으므로 물리 삭제
		int deleteCount = this.courseDataDao.deleteCourseData(courseId, id);
		if (deleteCount == 0) {
			// 조회 직후 다른 요청에서 먼저 삭제된 경우
			throw new LearningworksException(ErrorCode.COURSE_DATA_NOT_EXISTS);
		}
		if (deleteCount != 1) {
			throw new LearningworksException(ErrorCode.COURSE_DATA_FAILURE_DELETE);
		}

		// 삭제한 자료의 첨부 파일 중 다른 자료에서 사용하지 않는 파일만 커밋 후 삭제
		deleteUnreferencedFilesAfterCommit(courseId, extractFileIds(saved.getContent()));
	}

	@Override
	@Transactional(readOnly = true)
	public void checkCourse(String courseId) {
		validateCourse(courseId);
	}

	@Override
	public CourseDataFileResponseVO uploadFile(String courseId, MultipartFile file) {
		validateCourse(courseId);

		if (file == null || file.isEmpty()) {
			throw new LearningworksException(ErrorCode.FILES_BAD_REQUEST);
		}
		if (file.getSize() > MAX_FILE_SIZE) {
			throw new LearningworksException(ErrorCode.FILES_TOO_LARGE);
		}

		String originalFileName = cleanOriginalFileName(file.getOriginalFilename());
		String extension = StringUtils.getFilenameExtension(originalFileName);
		extension = extension == null ? "" : extension.toLowerCase(Locale.ROOT);

		FileSignature signature = ALLOWED_EXTENSIONS.get(extension);
		if (signature == null) {
			throw new LearningworksException(ErrorCode.FILES_NOT_ALLOWED_EXTENSION);
		}

		// Content-Type 은 신뢰하지 않고 실제 파일 내용(시그니처)으로 검증
		byte[] header;
		try (InputStream inputStream = file.getInputStream()) {
			header = inputStream.readNBytes(8192);
		} catch (IOException e) {
			throw new LearningworksException(ErrorCode.FILES_SYSTEM_ERROR, e);
		}
		if (!matchesSignature(signature, header)) {
			throw new LearningworksException(ErrorCode.FILES_INVALID_CONTENT);
		}

		// 서버 저장 파일명은 사용자 입력과 무관한 UUID 로 생성
		String fileId = UUID.randomUUID().toString().replace("-", "") + "." + extension;
		Path target = resolveFilePath(courseId, fileId);

		try {
			Files.createDirectories(target.getParent());
			try (InputStream inputStream = file.getInputStream()) {
				Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
			}
		} catch (IOException e) {
			throw new LearningworksException(ErrorCode.FILES_SYSTEM_ERROR, e);
		}

		return new CourseDataFileResponseVO(fileId,
		                                    originalFileName,
		                                    "/course-data/" + courseId + "/files/" + fileId,
		                                    file.getSize(),
		                                    IMAGE_EXTENSIONS.contains(extension));
	}

	@Override
	public Resource loadFile(String courseId, String fileId) {
		validateCourse(courseId);
		validateFileId(fileId);

		Path path = resolveFilePath(courseId, fileId);
		if (!Files.isRegularFile(path)) {
			throw new LearningworksException(ErrorCode.FILES_NOT_FOUND_FILE);
		}

		try {
			return new UrlResource(path.toUri());
		} catch (MalformedURLException e) {
			throw new LearningworksException(ErrorCode.FILES_SYSTEM_ERROR, e);
		}
	}

	@Override
	@Transactional(readOnly = true)
	public void deleteTemporaryFile(String courseId, String fileId) {
		validateCourse(courseId);
		validateFileId(fileId);

		// 이미 등록된 교육 자료에서 사용 중인 파일은 삭제하지 않는다
		if (this.courseDataDao.countFileReference(courseId, fileId) > 0) {
			throw new LearningworksException(ErrorCode.FILES_IN_USE);
		}

		try {
			Files.deleteIfExists(resolveFilePath(courseId, fileId));
		} catch (IOException e) {
			throw new LearningworksException(ErrorCode.FILES_SYSTEM_ERROR, e);
		}
	}

	// ------------------------------------------------------------------
	// 검증
	// ------------------------------------------------------------------

	private void validateCourse(String courseId) {
		if (courseId == null || courseId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_MISSING_PARAMETER);
		}
		if (!COURSE_ID_PATTERN.matcher(courseId).matches() || this.courseDataDao.countCourse(courseId) == 0) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_EXISTS);
		}
	}

	private void validateDataId(String id) {
		if (id == null || !DATA_ID_PATTERN.matcher(id).matches()) {
			throw new LearningworksException(ErrorCode.COURSE_DATA_NOT_EXISTS);
		}
	}

	private void validateFileId(String fileId) {
		if (fileId == null || !FILE_ID_PATTERN.matcher(fileId).matches()) {
			throw new LearningworksException(ErrorCode.FILES_NOT_FOUND_FILE);
		}
	}

	/** 업로드 루트 하위의 과정별 폴더로 경로를 만든다. 루트를 벗어나면 차단 */
	private Path resolveFilePath(String courseId, String fileId) {
		Path path = this.uploadRoot.resolve(courseId).resolve(fileId).normalize();
		if (!path.startsWith(this.uploadRoot)) {
			throw new LearningworksException(ErrorCode.FILES_BAD_REQUEST);
		}
		return path;
	}

	/** 원본 파일명에서 경로 · 제어 문자를 제거한다 (화면 표시용으로만 사용) */
	private String cleanOriginalFileName(String originalFileName) {
		String raw = originalFileName == null ? "" : originalFileName.replace("\\", "/");
		String name = StringUtils.getFilename(raw);
		name = name == null ? "" : name.replaceAll("\\p{Cntrl}", "").trim();
		if (name.isEmpty()) {
			throw new LearningworksException(ErrorCode.FILES_BAD_REQUEST);
		}
		if (name.length() > MAX_FILE_NAME_LENGTH) {
			String extension = StringUtils.getFilenameExtension(name);
			String suffix = extension == null ? "" : "." + extension;
			name = name.substring(0, Math.max(1, MAX_FILE_NAME_LENGTH - suffix.length())) + suffix;
		}
		return name;
	}

	private boolean matchesSignature(FileSignature signature, byte[] header) {
		return switch (signature) {
			case JPEG -> startsWith(header, 0xFF, 0xD8, 0xFF);
			case PNG -> startsWith(header, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
			case GIF -> startsWith(header, 'G', 'I', 'F', '8');
			case WEBP -> startsWith(header, 'R', 'I', 'F', 'F') && header.length >= 12
					&& header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
			case BMP -> startsWith(header, 'B', 'M');
			case PDF -> startsWith(header, '%', 'P', 'D', 'F', '-');
			case ZIP -> startsWith(header, 'P', 'K', 0x03, 0x04);
			case OLE -> startsWith(header, 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1);
			case TEXT -> isText(header);
		};
	}

	private boolean startsWith(byte[] header, int... signature) {
		if (header.length < signature.length) {
			return false;
		}
		for (int i = 0; i < signature.length; i++) {
			if ((header[i] & 0xFF) != signature[i]) {
				return false;
			}
		}
		return true;
	}

	/** 텍스트 파일: NUL 바이트가 없어야 한다 (실행 파일 등 바이너리 차단) */
	private boolean isText(byte[] header) {
		for (byte b : header) {
			if (b == 0) {
				return false;
			}
		}
		return true;
	}

	// ------------------------------------------------------------------
	// 첨부 파일 정리
	// ------------------------------------------------------------------

	/** 본문 HTML 에서 첨부 파일 ID (data-file-id) 목록 추출 */
	private Set<String> extractFileIds(String html) {
		Set<String> fileIds = new LinkedHashSet<>();
		if (html == null || html.isBlank()) {
			return fileIds;
		}
		for (Element element : Jsoup.parseBodyFragment(html).select("[data-file-id]")) {
			String fileId = element.attr("data-file-id");
			if (FILE_ID_PATTERN.matcher(fileId).matches()) {
				fileIds.add(fileId);
			}
		}
		return fileIds;
	}

	/**
	 * 더 이상 어떤 교육 자료에서도 참조하지 않는 파일을 트랜잭션 커밋 후 삭제한다.
	 * - 참조 여부는 현재 트랜잭션(수정 · 삭제 반영 후) 기준으로 확인 → 다른 자료에서 사용 중인 파일은 보호
	 * - 롤백되면 파일은 그대로 유지
	 * - 파일 삭제 실패는 자료 수정 · 삭제 결과에 영향을 주지 않는다 (로그만 남김)
	 */
	private void deleteUnreferencedFilesAfterCommit(String courseId, Set<String> fileIds) {
		List<Path> targets = new ArrayList<>();
		for (String fileId : fileIds) {
			if (this.courseDataDao.countFileReference(courseId, fileId) == 0) {
				targets.add(resolveFilePath(courseId, fileId));
			}
		}
		if (targets.isEmpty()) {
			return;
		}

		Runnable deleteFiles = () -> {
			for (Path target : targets) {
				try {
					Files.deleteIfExists(target);
				} catch (IOException e) {
					log.warn("교육 자료 첨부 파일 삭제 실패: {}", target, e);
				}
			}
		};

		if (TransactionSynchronizationManager.isSynchronizationActive()) {
			TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
				@Override
				public void afterCommit() {
					deleteFiles.run();
				}
			});
		} else {
			deleteFiles.run();
		}
	}

	/** LIKE 검색어 이스케이프 (ESCAPE '\') */
	private String escapeLike(String keyword) {
		return keyword.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}

	// ------------------------------------------------------------------
	// HTML Sanitize
	// ------------------------------------------------------------------

	private Safelist createSafelist() {
		return Safelist.relaxed()
				.addTags("font", "s", "strike", "hr", "details", "summary")
				.addAttributes("font", "size")
				.addAttributes(":all", "style", "class")
				.addAttributes("a", "target", "data-file-id", "data-file-name", "data-file-size")
				.addAttributes("img", "data-file-id", "data-file-name")
				.addAttributes("details", "open")
				.addAttributes("pre", "data-language")
				.addEnforcedAttribute("a", "rel", "noopener noreferrer");
	}

	/**
	 * 에디터 HTML 의 위험 요소를 제거한다.
	 * - 허용 태그 외 제거 (script, iframe, object, embed, form, svg, style 등)
	 * - on* 이벤트 속성 제거, javascript: 등 허용되지 않은 URL 프로토콜 제거 (jsoup Safelist)
	 * - style 은 허용 목록의 CSS 속성 · 값만, class 는 에디터가 만드는 class 만 허용
	 * - 외부 이미지는 https 만 허용, 첨부 이미지는 data-file-id 로만 표시 (src 는 저장하지 않음)
	 * - 첨부 파일 ID 는 형식과 현재 과정의 실제 파일 존재 여부를 확인
	 * - 코드 블록 내용은 텍스트로만 저장 (내부 태그 제거, 줄바꿈 · 들여쓰기 유지)
	 */
	private String sanitizeContent(String courseId, String html) {
		if (html == null || html.isBlank()) {
			return "";
		}

		Document.OutputSettings outputSettings = new Document.OutputSettings().prettyPrint(false);
		String cleaned = Jsoup.clean(html, "", createSafelist(), outputSettings);

		Document document = Jsoup.parseBodyFragment(cleaned);
		document.outputSettings(outputSettings);

		for (Element element : document.select("[style]")) {
			String style = filterStyle(element.attr("style"));
			if (style.isEmpty()) {
				element.removeAttr("style");
			} else {
				element.attr("style", style);
			}
		}

		for (Element element : document.select("[class]")) {
			List<String> classes = new ArrayList<>();
			for (String className : element.classNames()) {
				if (ALLOWED_CLASSES.contains(className)) {
					classes.add(className);
				}
			}
			if (classes.isEmpty()) {
				element.removeAttr("class");
			} else {
				element.attr("class", String.join(" ", classes));
			}
		}

		for (Element font : document.select("font[size]")) {
			if (!FONT_SIZE_PATTERN.matcher(font.attr("size")).matches()) {
				font.removeAttr("size");
			}
		}

		for (Element element : document.select("[data-file-id]")) {
			String fileId = element.attr("data-file-id");
			boolean valid = FILE_ID_PATTERN.matcher(fileId).matches()
					&& Files.isRegularFile(resolveFilePath(courseId, fileId));
			if (!valid) {
				element.removeAttr("data-file-id");
			}
		}

		// 이미지: 첨부 이미지는 src 를 저장하지 않고(조회 시 권한 확인 후 Blob 으로 표시), 외부 이미지는 https 만 허용
		for (Element image : document.select("img")) {
			if (image.hasAttr("data-file-id")) {
				image.removeAttr("src");
			} else if (!image.attr("src").toLowerCase(Locale.ROOT).startsWith("https://")) {
				image.remove();
			}
		}

		for (Element element : document.select("a[data-file-size]")) {
			if (!FILE_SIZE_PATTERN.matcher(element.attr("data-file-size")).matches()) {
				element.removeAttr("data-file-size");
			}
		}

		for (Element element : document.select("a[target]")) {
			if (!"_blank".equals(element.attr("target"))) {
				element.removeAttr("target");
			}
		}

		for (Element cell : document.select("td, th")) {
			for (String attribute : List.of("colspan", "rowspan")) {
				if (cell.hasAttr(attribute) && !CELL_SPAN_PATTERN.matcher(cell.attr(attribute)).matches()) {
					cell.removeAttr(attribute);
				}
			}
		}

		for (Element pre : document.select("pre[data-language]")) {
			if (!CODE_LANGUAGE_PATTERN.matcher(pre.attr("data-language")).matches()) {
				pre.removeAttr("data-language");
			}
		}

		// 코드 블록: 내부 HTML 태그를 모두 제거하고 텍스트만 <code> 에 저장 (출력 시 이스케이프됨)
		for (Element pre : document.select("pre.editor-code")) {
			String code = pre.wholeText();
			pre.empty();
			pre.appendElement("code").text(code);
		}

		return document.body().html();
	}

	private String filterStyle(String style) {
		List<String> allowed = new ArrayList<>();
		for (String declaration : style.split(";")) {
			int colon = declaration.indexOf(':');
			if (colon < 0) {
				continue;
			}
			String property = declaration.substring(0, colon).trim().toLowerCase(Locale.ROOT);
			String value = declaration.substring(colon + 1).trim();
			Pattern pattern = ALLOWED_STYLES.get(property);
			if (pattern != null && pattern.matcher(value).matches()) {
				allowed.add(property + ": " + value);
			}
		}
		return String.join("; ", allowed);
	}

	private boolean isEmptyContent(String html) {
		Document document = Jsoup.parseBodyFragment(html);
		return document.body().text().isBlank()
				&& document.select("img, a[data-file-id], hr, table").isEmpty();
	}
}
