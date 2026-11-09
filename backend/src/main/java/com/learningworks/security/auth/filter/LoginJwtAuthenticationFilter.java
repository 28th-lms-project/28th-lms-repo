package com.learningworks.security.auth.filter;

import java.io.IOException;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.learningworks.member.vo.request.LoginMemberVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * JSON 로그인 필터 — POST /login 의 {"id","password"} 로 인증을 시도한다. 성공/실패 응답은 SecurityConfig 에서 지정한
 * LoginSuccessHandler / LoginFailureHandler 가 처리.
 */
public class LoginJwtAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

  private final JsonMapper jsonMapper;

  public LoginJwtAuthenticationFilter(AuthenticationManager authManager, JsonMapper jsonMapper) {
    super(authManager);
    this.jsonMapper = jsonMapper;
  }

  @Override
  public Authentication attemptAuthentication(HttpServletRequest request,
      HttpServletResponse response) throws AuthenticationException {

    if (!HttpMethod.POST.matches(request.getMethod())) {
      throw new AuthenticationServiceException("지원하지 않는 요청 방식입니다: " + request.getMethod());
    }

    LoginMemberVO loginMemberVO;
    try {
      loginMemberVO = this.jsonMapper.readValue(request.getInputStream(), LoginMemberVO.class);
    } catch (JacksonException | IOException ex) {
      throw new AuthenticationServiceException("로그인 요청 방식이 올바르지 않습니다.", ex);
    }

    String id = loginMemberVO.getId();
    String password = loginMemberVO.getPassword();
    if (id == null || id.isBlank() || password == null || password.isBlank()) {
      throw new BadCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다.");
    }

    UsernamePasswordAuthenticationToken authRequest =
        UsernamePasswordAuthenticationToken.unauthenticated(id, password);
    this.setDetails(request, authRequest);
    return this.getAuthenticationManager().authenticate(authRequest);

  }

}
