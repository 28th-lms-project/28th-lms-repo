package com.learningworks.security.auth.providers.handlers;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.member.service.MemberService;
import com.learningworks.security.auth.JsonWebTokenProvider;
import com.learningworks.security.auth.LoginUser;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.json.JsonMapper;

@RequiredArgsConstructor
public class LoginSuccessHandler implements AuthenticationSuccessHandler {

  private final MemberService memberService;
  private final JsonWebTokenProvider jsonWebTokenProvider;
  private final JsonMapper jsonMapper;

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
      Authentication authentication) throws IOException, ServletException {

    if (!(authentication.getPrincipal() instanceof LoginUser loginUser)) {
      throw new IllegalStateException("인증 정보에 LoginUser 가 없습니다.");
    }

    // 실패 횟수 초기화
    this.memberService.resetLoginFailCount(loginUser.getUsername());

    String accessToken = this.jsonWebTokenProvider.createAccessToken(loginUser);
    ApiResponse<String> apiResponse = ApiResponse.OK(accessToken);

    response.setStatus(apiResponse.getHttpStatusCode());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    this.jsonMapper.writeValue(response.getWriter(), apiResponse);
  }

}
