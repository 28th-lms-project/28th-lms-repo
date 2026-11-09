package com.learningworks.common.utils;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * 로그인 한 사용자의 정보를 SecurityContext 에서 꺼낸다.
 * 
 * JWT 검증 필터가 principal 에 ID 를 넣으므로, 회원 상세 정보는 ID 를 통해 DB 에서 추출한다.
 */
// Lombok 으로 생성자를 만들지만 접근하지 못하게 private 로 선언한다.
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class AuthUtil {

  private static final String ROLE_PREFIX = "ROLE_";

  private static Authentication getLoginAuthentication() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
      return null;
    }
    return auth;
  }

  /**
   * 로그인한 사용자의 ID 가져오기
   */
  public static String getLoginId() {
    Authentication auth = AuthUtil.getLoginAuthentication();
    if (auth == null) {
      throw new LearningworksException(ErrorCode.GLOBAL_UNAUTHORIZED);
    }
    return auth.getName();
  }

  public static boolean isGranted(String roleName) {
    if (roleName == null || roleName.isBlank()) {
      return false;
    }

    Authentication auth = AuthUtil.getLoginAuthentication();
    if (auth == null) {
      return false;
    }


    roleName = roleName.toUpperCase();
    if (!roleName.startsWith(AuthUtil.ROLE_PREFIX)) {
      roleName = AuthUtil.ROLE_PREFIX + roleName;
    }

    for (GrantedAuthority authority : auth.getAuthorities()) {
      if (roleName.equals(authority.getAuthority())) {
        return true;
      }
    }
    return false;
  }
}
