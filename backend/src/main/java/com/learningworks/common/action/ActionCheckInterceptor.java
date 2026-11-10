package com.learningworks.common.action;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 컨트롤러 메서드의 권한 어노테이션을 읽어 권한을 검사한다.
 *
 * <pre>
 * &#64;RequireSuperAdmin  SUPER_ADMIN만
 * &#64;RequireAction      권한 코드가 부여된 역할 + SUPER_ADMIN
 * &#64;LoginRequired      로그인한 사용자 누구나
 * &#64;PublicApi          누구나 (비로그인 포함)
 * 어노테이션 없음         SUPER_ADMIN만 (app.access-check.default-super-admin: false이면 누구나)
 * </pre>
 *
 * 권한이 없으면 LearningworksException(401 / 403)을 던지며, GlobalExceptionHandler가 공통 응답으로 변환한다.
 * 요청자 ID는 SecurityContext의 Authentication.getName()을 사용한다 (JWT 인증 필터가 설정).
 *
 * ActionCodeRegistry를 주입받지 않는다 (MVC 설정과 순환 의존 방지).
 */
@Component
public class ActionCheckInterceptor implements HandlerInterceptor {

  private final AccessChecker accessChecker;

  /** 권한 어노테이션이 없는 API를 SUPER_ADMIN 전용으로 볼지 (false면 누구나 통과) */
  private final boolean defaultSuperAdmin;

  public ActionCheckInterceptor(AccessChecker accessChecker,
      @Value("${app.access-check.default-super-admin:true}") boolean defaultSuperAdmin) {
    this.accessChecker = accessChecker;
    this.defaultSuperAdmin = defaultSuperAdmin;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
      Object handler) {
    // 정적 리소스, CORS preflight 등 컨트롤러 메서드가 아닌 요청
    if (!(handler instanceof HandlerMethod handlerMethod)) {
      return true;
    }

    if (handlerMethod.hasMethodAnnotation(PublicApi.class)) {
      return true;
    }

    if (handlerMethod.hasMethodAnnotation(LoginRequired.class)) {
      if (ActionCheckInterceptor.currentUserId() == null) {
        throw new LearningworksException(ErrorCode.GLOBAL_UNAUTHORIZED);
      }
      return true;
    }

    RequireAction requireAction = handlerMethod.getMethodAnnotation(RequireAction.class);
    if (requireAction != null) {
      this.accessChecker.checkAction(ActionCheckInterceptor.currentUserId(),
          ActionCodeRules.toActionCode(requireAction));
      return true;
    }

    // @RequireSuperAdmin, 또는 권한 어노테이션이 없는 API (기본값: SUPER_ADMIN 전용)
    if (handlerMethod.hasMethodAnnotation(RequireSuperAdmin.class) || this.defaultSuperAdmin) {
      this.accessChecker.checkSuperAdmin(ActionCheckInterceptor.currentUserId());
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
