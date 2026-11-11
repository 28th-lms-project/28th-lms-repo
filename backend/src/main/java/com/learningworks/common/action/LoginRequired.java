package com.learningworks.common.action;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 로그인한 사용자라면 역할과 관계없이 누구나 호출할 수 있는 API. 비로그인이면 401.
 *
 * 내 정보 · 내 권한 조회처럼 "본인 데이터"를 다루는 기능에 사용한다.
 * 권한 코드가 없으므로 권한 설정 화면에서 부여 · 해제할 수 없다.
 * 역할에 따라 허용 여부가 달라져야 하면 @RequireAction을 사용할 것.
 *
 * 다른 권한 어노테이션(@RequireAction, @RequireSuperAdmin, @PublicApi)과 함께 붙이면 서버가 시작되지 않는다.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface LoginRequired {

}
