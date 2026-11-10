package com.learningworks.common.action;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * 컨트롤러 메서드의 @RequireAction · @RequireSuperAdmin을 읽어 권한을 검사한다.
 *
 * 권한이 없으면 LearningworksException(401 / 403)을 던지며, GlobalExceptionHandler가 공통 응답으로 변환한다.
 * 요청자 ID는 SecurityContext의 Authentication.getName()을 사용한다 (JWT 인증 필터가 설정).
 *
 * ActionCodeRegistry를 주입받지 않는다 (MVC 설정과 순환 의존 방지).
 */
@Component
@RequiredArgsConstructor
public class ActionCheckInterceptor implements HandlerInterceptor {

  private final AccessChecker accessChecker;

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
      Object handler) {
    // 정적 리소스, CORS preflight 등 컨트롤러 메서드가 아닌 요청
    if (!(handler instanceof HandlerMethod handlerMethod)) {
      return true;
    }

    if (handlerMethod.hasMethodAnnotation(RequireSuperAdmin.class)) {
      this.accessChecker.checkSuperAdmin(ActionCheckInterceptor.currentUserId());
      return true;
    }

    RequireAction requireAction = handlerMethod.getMethodAnnotation(RequireAction.class);
    if (requireAction != null) {
      this.accessChecker.checkAction(ActionCheckInterceptor.currentUserId(),
          ActionCodeRules.toActionCode(requireAction));
    }
    return true;
  }

  /** 로그인 사용자 ID. 비로그인이면 null */
  private static String currentUserId() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()
        || authentication instanceof AnonymousAuthenticationToken) {
      return null;
    }
    return authentication.getName();
  }

}
