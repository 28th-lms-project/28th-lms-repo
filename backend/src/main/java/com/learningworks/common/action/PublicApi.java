package com.learningworks.common.action;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 로그인하지 않은 사용자도 호출할 수 있는 API. 권한 검사를 하지 않는다.
 *
 * 공개 공지 조회, 오류 응답(/error)처럼 누구에게나 열려 있어야 하는 기능에만 사용한다.
 * 권한 어노테이션이 하나도 없는 API는 SUPER_ADMIN만 호출할 수 있으므로(app.access-check.default-super-admin),
 * 공개 API에는 반드시 이 어노테이션을 붙일 것.
 *
 * 다른 권한 어노테이션(@RequireAction, @RequireSuperAdmin, @LoginRequired)과 함께 붙이면 서버가 시작되지 않는다.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PublicApi {

}
