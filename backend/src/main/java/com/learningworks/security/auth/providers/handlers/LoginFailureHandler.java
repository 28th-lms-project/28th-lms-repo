package com.learningworks.security.auth.providers.handlers;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.member.service.MemberService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@RequiredArgsConstructor
public class LoginFailureHandler implements AuthenticationFailureHandler {

  private final MemberService memberService;
  private final JsonMapper jsonMapper;

  @Override
  public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
      AuthenticationException exception) throws IOException, ServletException {

    // 1. 서버 내부 오류 (DB 장애 등)
    if (exception instanceof InternalAuthenticationServiceException) { // ★
      LoginFailureHandler.log.error("로그인 처리 중 내부 오류", exception);
      this.writeResponse(response, ApiResponse.ERROR(ErrorCode.GLOBAL_SYSTEM_ERROR));
      return;
    }

    // 2. 비밀번호 불일치 (없는 ID 포함 — UPDATE 0건)
    // 잠김(Locked)·삭제(Disabled)는 비밀번호 비교 전에 막힌 것이라 증가하지 않음
    if (exception instanceof BadCredentialsException) {

      Authentication loginRequest = exception.getAuthenticationRequest();
      if (loginRequest != null) {

        this.memberService.increaseLoginFailCount(loginRequest.getName(), LocalDateTime.now());
      }
    }

    this.writeResponse(response, ApiResponse.ERROR(ErrorCode.USER_NOT_MATCHED_IDENTIFY));
  }

  /**
   * ApiResponse 를 JSON 으로 응답한다. 상태 코드를 ApiResponse 에서 꺼내므로 본문의 httpStatusCode 와 실제 HTTP 상태가 항상
   * 일치한다.
   */
  private void writeResponse(HttpServletResponse response, ApiResponse<?> apiResponse)
      throws IOException {
    response.setStatus(apiResponse.getHttpStatusCode());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    this.jsonMapper.writeValue(response.getWriter(), apiResponse);
  }

}
