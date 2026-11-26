package com.learningworks.security.auth.filter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.security.auth.JsonWebTokenProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@RequiredArgsConstructor
public class ValidateJwtAuthenticationFilter extends OncePerRequestFilter {

  // Bearer?
  // => Http 표준 Authorization 인증 방식
  // => Bearer 인증 방식이 아닌 인증 방식일 경우 무시하는 등의 설정 가능
  // 단, 프론트에서 Api 호출시에도 헤더에 Authorization: Bearer 붙여야 호출 가능
  private static final String BEARER_PREFIX = "Bearer ";
  private static final RequestMatcher LOGIN_REQUEST =
      PathPatternRequestMatcher.pathPattern(HttpMethod.POST, "/login");

  private final JsonWebTokenProvider jsonWebTokenProvider;
  private final JsonMapper jsonMapper;

  private void writeUnauthorized(HttpServletResponse response) throws IOException {
    ApiResponse<?> apiResponse = ApiResponse.ERROR(ErrorCode.GLOBAL_UNAUTHORIZED);
    response.setStatus(apiResponse.getHttpStatusCode());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    this.jsonMapper.writeValue(response.getWriter(), apiResponse);
  }

  /**
   * 로그인 요청은 Token 이 없는 상태이므로 이 필터에서 패스, LoginJwtAuthenticationFilter로 전달
   */
  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    return ValidateJwtAuthenticationFilter.LOGIN_REQUEST.matches(request);
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    // Header 의 Authorization 을 가져온다.
    String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
    // Authorization 이 null 이거나 Header 의 인증방식이 Bearer 가 아닐 경우
    // 즉, 토큰이 없다고 판단하여 로그인 Filter 로 통과 시킨다.
    if (authorization == null
        || !authorization.startsWith(ValidateJwtAuthenticationFilter.BEARER_PREFIX)) {
      filterChain.doFilter(request, response);
      return;
    }

    // 접두어 Bearer 는 잘라내고 토큰만 남긴다.
    String token =
        authorization.substring(ValidateJwtAuthenticationFilter.BEARER_PREFIX.length()).trim();

    // 토큰 내용 꺼내기
    Claims claims;
    try {
      // 토큰 내용 꺼내어 claims 에 할당
      claims = this.jsonWebTokenProvider.getClaims(token);
    } catch (JwtException | IllegalArgumentException jie) {
      ValidateJwtAuthenticationFilter.log.debug("jwt 검증 실패: {}", jie.getMessage());
      this.writeUnauthorized(response);
      return;
    }

    // 토큰 속 권한 문자열을 GrantedAuthority 객체로 변환
    List<GrantedAuthority> authorities = new ArrayList<>();
    for (String role : this.jsonWebTokenProvider.getRoles(claims)) {
      authorities.add(new SimpleGrantedAuthority(role));
    }

    // 인증객체 생성 - principal = ID, credential = null
    Authentication authentication =
        UsernamePasswordAuthenticationToken.authenticated(claims.getSubject(), null, authorities);

    // Security Context 에 저장 후 다음 필터로
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authentication);
    SecurityContextHolder.setContext(context);

    // 다음 필터가 있다면 그 필터를 실행시켜라
    filterChain.doFilter(request, response);
  }

}
