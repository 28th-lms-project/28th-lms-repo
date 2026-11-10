package com.learningworks.common.action;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * ROLE_SUPER_ADMIN만 호출할 수 있는 API.
 *
 * 권한 설정 화면에서 다른 역할에 부여할 수 없으며, 권한 코드 목록(GET /action-codes)에도 나타나지 않는다.
 * 역할 생성 · 순서 변경, 권한 설정 저장처럼 권한 체계 자체를 바꾸는 기능에 사용한다.
 *
 * 같은 메서드에 @RequireAction과 함께 붙이면 서버가 시작되지 않는다.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireSuperAdmin {

}
