package com.learningworks.common.action;

import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.method.HandlerMethod;

class UnusedActionCodeReporterTest {

  static class SampleController {

    @RequireAction(domain = "MENU", action = "READ", description = "메뉴 목록 조회")
    public void getMenus() {}

    @RequireAction(domain = "ROLE", action = "READ", description = "역할 목록 조회")
    public void getRoles() {}
  }

  private FakeActionCodeDao dao;
  private ActionCodeRegistry registry;

  @BeforeEach
  void setUp() throws Exception {
    this.dao = new FakeActionCodeDao();
    this.registry = new ActionCodeRegistry(null);
    SampleController controller = new SampleController();
    this.registry.register(List.of(
        new HandlerMethod(controller, SampleController.class.getMethod("getMenus")),
        new HandlerMethod(controller, SampleController.class.getMethod("getRoles"))));
  }

  @Test
  @DisplayName("ACTION에 등록됐지만 코드의 @RequireAction에 없는 권한 코드를 이름순으로 찾는다")
  void findsUnusedActionCodes() {
    this.dao.registeredActionCodes.addAll(
        List.of("ROLE_READ", "MENU_READ_PERMISSION", "MENU_READ", "MENU_READ_DETAIL"));

    UnusedActionCodeReporter reporter = new UnusedActionCodeReporter(this.registry, this.dao);

    Assertions.assertThat(reporter.findUnusedActionCodes())
        .containsExactly("MENU_READ_DETAIL", "MENU_READ_PERMISSION");
  }

  @Test
  @DisplayName("모두 쓰이고 있으면 빈 목록")
  void noUnusedActionCodes() {
    this.dao.registeredActionCodes.addAll(List.of("ROLE_READ", "MENU_READ"));

    Assertions.assertThat(new UnusedActionCodeReporter(this.registry, this.dao).findUnusedActionCodes())
        .isEmpty();
  }

  @Test
  @DisplayName("DB 조회가 실패해도 서버 시작을 막지 않는다 (경고만 남김)")
  void reportDoesNotThrow() {
    FakeActionCodeDao failingDao = new FakeActionCodeDao() {
      @Override
      public List<String> selectRegisteredActionCodes() {
        throw new IllegalStateException("DB 연결 실패");
      }
    };

    Assertions.assertThatCode(() -> new UnusedActionCodeReporter(this.registry, failingDao).report())
        .doesNotThrowAnyException();
  }

}
