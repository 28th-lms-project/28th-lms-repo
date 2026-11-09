package com.learningworks.common.action;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 이 API를 호출하려면 요청자의 역할에 권한 코드 {domain}_{action}이 허용(ROLE_ACTION)되어 있어야 한다.
 *
 * <pre>
 * &#64;RequireAction(domain = "ROLE", action = "DELETE", description = "역할 삭제")
 * &#64;DeleteMapping("/{roleId}")
 * public ApiResponse&lt;RoleVO&gt; deleteRole(...) { ... }
 * </pre>
 *
 * - 서버 시작 시 ActionCodeRegistry가 모든 @RequireAction을 수집해 권한 코드 목록(GET /action-codes)을 만든다.
 * - domain, action: 대문자 · 숫자 · 언더스코어 (ActionCodeRules.NAME_PATTERN). 합친 권한 코드는 40자 이하.
 * - 같은 권한을 여러 API에 붙일 때는 같은 값을 반복해서 적는다. description이 다르면 서버가 시작되지 않는다.
 * - ROLE_SUPER_ADMIN은 항상 허용된다.
 *
 * @see RequireSuperAdmin 다른 역할에 부여할 수 없는 SUPER_ADMIN 전용 API
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireAction {

  /** 기능 단위 이름 (예: ROLE, COURSE_NOTICE) */
  String domain();

  /** 행위 (예: CREATE, READ, UPDATE, DELETE, ANSWER, USER_MOVE) */
  String action();

  /** 권한 관리 화면에 보여줄 설명 (예: "역할 삭제") */
  String description();

}
