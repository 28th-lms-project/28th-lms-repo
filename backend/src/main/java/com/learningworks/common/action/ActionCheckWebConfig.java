package com.learningworks.common.action;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import lombok.extern.slf4j.Slf4j;

/**
 * 권한 검사 인터셉터 등록.
 *
 * JWT 인증 필터가 적용되기 전에는 모든 요청이 비로그인이라 권한 검사를 켜면 보호된 API가 전부 401이 된다.
 * 그래서 기본값은 꺼짐(false)이며, JWT 적용 후 application.yml에 아래 설정을 추가해 켠다.
 *
 * <pre>
 * app:
 *   access-check:
 *     enabled: true               # 권한 검사 켜기 (기본값 false)
 *     default-super-admin: true   # 권한 어노테이션이 없는 API를 SUPER_ADMIN 전용으로 (기본값 true, false면 누구나)
 * </pre>
 *
 * 꺼져 있어도 권한 코드 수집(ActionCodeRegistry)과 목록 API는 동작한다.
 * 2026-11-10부터 enabled: true, default-super-admin: true로 운영한다.
 */
@Slf4j
@Configuration
public class ActionCheckWebConfig implements WebMvcConfigurer {

  private final ActionCheckInterceptor actionCheckInterceptor;
  private final boolean enabled;

  public ActionCheckWebConfig(ActionCheckInterceptor actionCheckInterceptor,
      @Value("${app.access-check.enabled:false}") boolean enabled) {
    this.actionCheckInterceptor = actionCheckInterceptor;
    this.enabled = enabled;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    if (!this.enabled) {
      log.warn("API 권한 검사(@RequireAction, @RequireSuperAdmin)가 꺼져 있습니다. "
          + "JWT 적용 후 app.access-check.enabled=true로 켜주세요.");
      return;
    }
    registry.addInterceptor(this.actionCheckInterceptor);
  }

}
