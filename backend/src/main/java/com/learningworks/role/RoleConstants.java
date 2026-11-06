package com.learningworks.role;

import java.util.Set;

/**
 * 역할(ROLE) 관련 공통 상수.
 */
public final class RoleConstants {

  /** 최고 권한. ROLE_RANK 항상 맨 위(1) */
  public static final String SUPER_ADMIN_ROLE = "ROLE_SUPER_ADMIN";

  /** 가장 낮은 기본 권한. ROLE_RANK 항상 맨 아래 */
  public static final String DEFAULT_ROLE = "ROLE_STUDENT";

  /** 삭제할 수 없고, 순서가 고정된 시스템 역할 */
  public static final Set<String> PROTECTED_ROLES = Set.of(SUPER_ADMIN_ROLE, DEFAULT_ROLE);

  /**
   * 역할 ID 규칙: 'ROLE_' 접두어 필수, 대문자(A-Z)·숫자(0-9)만 사용, 단어 구분은 언더스코어(_)
   * 예> ROLE_ADMIN, ROLE_SUPER_ADMIN
   */
  public static final String ROLE_ID_PATTERN = "^ROLE_[A-Z0-9]+(_[A-Z0-9]+)*$";

  /**
   * @NotBlank와 함께 쓸 때 사용. 빈 문자열이면 @NotBlank 메시지만 내려가도록(중복 메시지 방지) "^$|"를 붙였다.
   */
  public static final String ROLE_ID_PATTERN_ALLOW_EMPTY = "^$|" + ROLE_ID_PATTERN;

  private RoleConstants() {}

}
