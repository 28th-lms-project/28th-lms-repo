package com.learningworks.common.action;

import java.lang.annotation.Annotation;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Pattern;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import lombok.extern.slf4j.Slf4j;

/**
 * 권한 코드 등록부.
 *
 * 서버 시작 시 모든 컨트롤러 메서드의 @RequireAction을 수집한다. 권한 코드의 기준은 이 등록부(= 코드)이며,
 * ACTION.ACTION_CODE는 여기 있는 코드 중에서만 등록할 수 있다.
 *
 * 아래 경우 서버 시작을 실패시킨다.
 * - domain, action 형식 오류 (ActionCodeRules.NAME_PATTERN)
 * - 권한 코드가 40자 초과
 * - description이 비어 있음
 * - 같은 권한 코드인데 description이 다름
 * - 한 메서드에 권한 어노테이션(@RequireAction, @RequireSuperAdmin, @LoginRequired, @PublicApi)을 두 개 이상 붙임
 *
 * 권한 어노테이션이 없는 API(기본값: SUPER_ADMIN 전용)는 시작 로그에 목록으로 남긴다.
 *
 * 주의: 이 클래스는 RequestMappingHandlerMapping을 주입받으므로, 인터셉터 등 MVC 설정 쪽에서 주입받으면 순환 의존이 생긴다.
 * 인터셉터는 HandlerMethod에서 @RequireAction을 직접 읽는다(ActionCheckInterceptor).
 */
@Slf4j
@Component
public class ActionCodeRegistry implements SmartInitializingSingleton {

  private static final Pattern NAME_PATTERN = Pattern.compile(ActionCodeRules.NAME_PATTERN);

  private final RequestMappingHandlerMapping handlerMapping;

  /** 한 메서드에 하나만 붙일 수 있는 권한 어노테이션 */
  private static final List<Class<? extends Annotation>> PERMISSION_ANNOTATIONS =
      List.of(RequireAction.class, RequireSuperAdmin.class, LoginRequired.class, PublicApi.class);

  /** key: 권한 코드. 코드 이름순 정렬 */
  private Map<String, ActionDefinition> definitions = Map.of();

  /** 권한 어노테이션이 없는 API (로그 · 확인용) */
  private List<String> unannotatedSources = List.of();

  public ActionCodeRegistry(
      @Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping handlerMapping) {
    this.handlerMapping = handlerMapping;
  }

  /** 모든 싱글톤 빈 생성이 끝난 뒤(= 컨트롤러 매핑 등록 완료 후) 한 번 실행된다. */
  @Override
  public void afterSingletonsInstantiated() {
    this.register(this.handlerMapping.getHandlerMethods().values());
    log.info("권한 코드 {}개 등록: {}", this.definitions.size(), this.definitions.keySet());
    if (!this.unannotatedSources.isEmpty()) {
      log.info("권한 어노테이션이 없는 API {}개 (app.access-check.default-super-admin: true이면 SUPER_ADMIN만 호출 가능): {}",
          this.unannotatedSources.size(), this.unannotatedSources);
    }
  }

  /** handlerMethods의 @RequireAction을 수집해 등록부를 교체한다. 규칙 위반이면 IllegalStateException */
  void register(Collection<HandlerMethod> handlerMethods) {
    Map<String, ActionDefinition> collected = new TreeMap<>();
    List<String> unannotated = new ArrayList<>();

    for (HandlerMethod handlerMethod : handlerMethods) {
      String source = handlerMethod.getShortLogMessage();

      List<String> present = PERMISSION_ANNOTATIONS.stream()
          .filter(handlerMethod::hasMethodAnnotation)
          .map(annotation -> "@" + annotation.getSimpleName())
          .toList();
      if (present.isEmpty()) {
        unannotated.add(source);
        continue;
      }
      if (present.size() > 1) {
        throw new IllegalStateException("권한 어노테이션 " + String.join(", ", present)
            + "은 함께 사용할 수 없습니다. 하나만 붙이세요 (" + source + ")");
      }

      RequireAction requireAction = handlerMethod.getMethodAnnotation(RequireAction.class);
      if (requireAction == null) {
        continue;
      }

      ActionDefinition definition = ActionCodeRegistry.toDefinition(requireAction, source);
      ActionDefinition registered = collected.putIfAbsent(definition.actionCode(), definition);
      if (registered != null && !registered.description().equals(definition.description())) {
        throw new IllegalStateException(String.format(
            "권한 코드 %s의 description이 서로 다릅니다: \"%s\"(%s), \"%s\"(%s)",
            definition.actionCode(), registered.description(), registered.source(),
            definition.description(), definition.source()));
      }
    }

    this.definitions = Collections.unmodifiableMap(collected);
    this.unannotatedSources = unannotated.stream().sorted().toList();
  }

  /** 권한 어노테이션이 없는 API 목록 (컨트롤러#메서드) */
  public List<String> getUnannotatedSources() {
    return this.unannotatedSources;
  }

  private static ActionDefinition toDefinition(RequireAction requireAction, String source) {
    String domain = requireAction.domain();
    String action = requireAction.action();
    String actionCode = ActionCodeRules.toActionCode(requireAction);

    if (!NAME_PATTERN.matcher(domain).matches() || !NAME_PATTERN.matcher(action).matches()) {
      throw new IllegalStateException(String.format(
          "@RequireAction 형식 오류 (대문자 · 숫자 · 언더스코어만 가능): domain=%s, action=%s (%s)",
          domain, action, source));
    }
    if (actionCode.length() > ActionCodeRules.ACTION_CODE_MAX_LENGTH) {
      throw new IllegalStateException(String.format("권한 코드 %s가 %d자를 넘습니다 (%s)",
          actionCode, ActionCodeRules.ACTION_CODE_MAX_LENGTH, source));
    }
    if (requireAction.description().isBlank()) {
      throw new IllegalStateException("@RequireAction의 description이 비어 있습니다 (" + source + ")");
    }

    return new ActionDefinition(domain, action, actionCode, requireAction.description(), source);
  }

  /** 등록부에 있는 권한 코드인지. ACTION 등록 시 검증에 사용한다. */
  public boolean contains(String actionCode) {
    return actionCode != null && this.definitions.containsKey(actionCode);
  }

  /** 등록된 모든 권한 코드 정의 (권한 코드 이름순) */
  public Collection<ActionDefinition> getDefinitions() {
    return this.definitions.values();
  }

}
