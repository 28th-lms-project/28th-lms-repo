package com.learningworks.common.action;

import java.util.Arrays;
import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.method.HandlerMethod;

class ActionCodeRegistryTest {

  static class ValidController {

    @RequireAction(domain = "ROLE", action = "DELETE", description = "역할 삭제")
    public void deleteRole() {}

    @RequireAction(domain = "ASSIGNMENT", action = "READ", description = "과제 조회")
    public void getAssignments() {}

    @RequireAction(domain = "ASSIGNMENT", action = "READ", description = "과제 조회")
    public void getAssignment() {}

    @RequireAction(domain = "COURSE_NOTICE", action = "CREATE", description = "강의 공지 등록")
    public void createCourseNotice() {}

    @RequireSuperAdmin
    public void createRole() {}

    @LoginRequired
    public void getMyInfo() {}

    @PublicApi
    public void getPublicNotices() {}

    public void noAnnotation() {}
  }

  static class LowerCaseController {
    @RequireAction(domain = "Role", action = "DELETE", description = "역할 삭제")
    public void deleteRole() {}
  }

  static class TrailingUnderscoreController {
    @RequireAction(domain = "ROLE_", action = "DELETE", description = "역할 삭제")
    public void deleteRole() {}
  }

  static class TooLongController {
    // 20 + 1 + 20 = 41자
    @RequireAction(domain = "ABCDEFGHIJKLMNOPQRST", action = "ABCDEFGHIJKLMNOPQRST",
        description = "너무 긴 코드")
    public void tooLong() {}
  }

  static class MaxLengthController {
    // 20 + 1 + 19 = 40자
    @RequireAction(domain = "ABCDEFGHIJKLMNOPQRST", action = "ABCDEFGHIJKLMNOPQRS",
        description = "최대 길이 코드")
    public void maxLength() {}
  }

  static class BlankDescriptionController {
    @RequireAction(domain = "ROLE", action = "DELETE", description = " ")
    public void deleteRole() {}
  }

  static class DescriptionMismatchController {
    @RequireAction(domain = "ASSIGNMENT", action = "READ", description = "과제 조회")
    public void getAssignments() {}

    @RequireAction(domain = "ASSIGNMENT", action = "READ", description = "과제 상세 조회")
    public void getAssignment() {}
  }

  static class BothAnnotationsController {
    @RequireSuperAdmin
    @RequireAction(domain = "ROLE", action = "CREATE", description = "역할 생성")
    public void createRole() {}
  }

  static class LoginAndPublicController {
    @LoginRequired
    @PublicApi
    public void getNotices() {}
  }

  private static List<HandlerMethod> handlerMethods(Object controller) {
    return Arrays.stream(controller.getClass().getDeclaredMethods())
        .map(method -> new HandlerMethod(controller, method))
        .toList();
  }

  private static ActionCodeRegistry registry(Object controller) {
    ActionCodeRegistry registry = new ActionCodeRegistry(null);
    registry.register(ActionCodeRegistryTest.handlerMethods(controller));
    return registry;
  }

  @Test
  @DisplayName("@RequireAction만 수집하고, 같은 권한 코드는 하나로 합치며, 권한 코드 이름순으로 정렬한다")
  void collectsActionCodes() {
    ActionCodeRegistry registry = ActionCodeRegistryTest.registry(new ValidController());

    Assertions.assertThat(registry.getDefinitions())
        .extracting(ActionDefinition::actionCode)
        .containsExactly("ASSIGNMENT_READ", "COURSE_NOTICE_CREATE", "ROLE_DELETE");
    Assertions.assertThat(registry.contains("ROLE_DELETE")).isTrue();
    Assertions.assertThat(registry.contains("ROLE_CREATE")).isFalse();
    Assertions.assertThat(registry.contains(null)).isFalse();
  }

  @Test
  @DisplayName("domain과 action을 나눠서 보관한다 (도메인에 언더스코어가 있어도 경계가 정확하다)")
  void keepsDomainAndAction() {
    ActionCodeRegistry registry = ActionCodeRegistryTest.registry(new ValidController());

    ActionDefinition courseNotice = registry.getDefinitions().stream()
        .filter(definition -> definition.actionCode().equals("COURSE_NOTICE_CREATE"))
        .findFirst()
        .orElseThrow();
    Assertions.assertThat(courseNotice.domain()).isEqualTo("COURSE_NOTICE");
    Assertions.assertThat(courseNotice.action()).isEqualTo("CREATE");
    Assertions.assertThat(courseNotice.description()).isEqualTo("강의 공지 등록");
  }

  @Test
  @DisplayName("소문자가 들어간 domain은 서버 시작 실패")
  void rejectsLowerCase() {
    Assertions.assertThatThrownBy(() -> ActionCodeRegistryTest.registry(new LowerCaseController()))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("형식 오류")
        .hasMessageContaining("domain=Role");
  }

  @Test
  @DisplayName("언더스코어로 끝나는 domain은 서버 시작 실패")
  void rejectsTrailingUnderscore() {
    Assertions
        .assertThatThrownBy(
            () -> ActionCodeRegistryTest.registry(new TrailingUnderscoreController()))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("형식 오류");
  }

  @Test
  @DisplayName("40자를 넘는 권한 코드는 서버 시작 실패, 40자는 허용")
  void checksMaxLength() {
    Assertions.assertThatThrownBy(() -> ActionCodeRegistryTest.registry(new TooLongController()))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("40자를 넘습니다");

    ActionCodeRegistry registry = ActionCodeRegistryTest.registry(new MaxLengthController());
    Assertions.assertThat(registry.getDefinitions()).hasSize(1);
  }

  @Test
  @DisplayName("description이 비어 있으면 서버 시작 실패")
  void rejectsBlankDescription() {
    Assertions
        .assertThatThrownBy(
            () -> ActionCodeRegistryTest.registry(new BlankDescriptionController()))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("description이 비어 있습니다");
  }

  @Test
  @DisplayName("같은 권한 코드인데 description이 다르면 서버 시작 실패")
  void rejectsDescriptionMismatch() {
    Assertions
        .assertThatThrownBy(
            () -> ActionCodeRegistryTest.registry(new DescriptionMismatchController()))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("ASSIGNMENT_READ")
        .hasMessageContaining("description이 서로 다릅니다");
  }

  @Test
  @DisplayName("@RequireAction과 @RequireSuperAdmin을 함께 붙이면 서버 시작 실패")
  void rejectsBothAnnotations() {
    Assertions
        .assertThatThrownBy(() -> ActionCodeRegistryTest.registry(new BothAnnotationsController()))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("함께 사용할 수 없습니다");
  }

  @Test
  @DisplayName("@LoginRequired와 @PublicApi처럼 권한 어노테이션을 두 개 이상 붙이면 서버 시작 실패")
  void rejectsMultiplePermissionAnnotations() {
    Assertions
        .assertThatThrownBy(() -> ActionCodeRegistryTest.registry(new LoginAndPublicController()))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("@LoginRequired")
        .hasMessageContaining("@PublicApi")
        .hasMessageContaining("함께 사용할 수 없습니다");
  }

  @Test
  @DisplayName("권한 어노테이션이 없는 API만 목록으로 모은다")
  void collectsUnannotatedSources() {
    ActionCodeRegistry registry = ActionCodeRegistryTest.registry(new ValidController());

    List<String> unannotated = registry.getUnannotatedSources();
    Assertions.assertThat(unannotated).hasSize(1);
    Assertions.assertThat(unannotated.get(0)).contains("noAnnotation");
  }


  /** API에 붙지 않는 권한 코드를 선언하는 빈 (테스트용) */
  private static ActionCodeDeclarer declarer(DeclaredActionCode... codes) {
    return () -> java.util.List.of(codes);
  }

  @Test
  @DisplayName("선언한 권한 코드도 @RequireAction 코드와 함께 등록되고 이름순으로 정렬된다")
  void registersDeclaredActionCodes() {
    ActionCodeRegistry registry = new ActionCodeRegistry(null);
    registry.register(ActionCodeRegistryTest.handlerMethods(new ValidController()),
        java.util.List.of(declarer(new DeclaredActionCode("COURSE", "ALL_MANAGE", "모든 과정 관리"))));

    Assertions.assertThat(registry.getDefinitions())
        .extracting(ActionDefinition::actionCode)
        .containsExactly("ASSIGNMENT_READ", "COURSE_ALL_MANAGE", "COURSE_NOTICE_CREATE", "ROLE_DELETE");
    ActionDefinition declared = registry.getDefinitions().stream()
        .filter(definition -> definition.actionCode().equals("COURSE_ALL_MANAGE"))
        .findFirst()
        .orElseThrow();
    Assertions.assertThat(declared.domain()).isEqualTo("COURSE");
    Assertions.assertThat(declared.action()).isEqualTo("ALL_MANAGE");
    Assertions.assertThat(declared.source()).contains("(선언)");
  }

  @Test
  @DisplayName("선언한 권한 코드도 이름 형식 · description 규칙을 지켜야 한다")
  void validatesDeclaredActionCodes() {
    ActionCodeRegistry registry = new ActionCodeRegistry(null);

    Assertions.assertThatThrownBy(() -> registry.register(java.util.List.of(),
            java.util.List.of(declarer(new DeclaredActionCode("course", "ALL_READ", "전체 과정 조회")))))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("형식 오류");
    Assertions.assertThatThrownBy(() -> registry.register(java.util.List.of(),
            java.util.List.of(declarer(new DeclaredActionCode("COURSE", "ALL_READ", " ")))))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("description이 비어 있습니다");
  }

  @Test
  @DisplayName("선언한 코드가 @RequireAction 코드와 같으면 description이 같아야 한다")
  void declaredCodeMustMatchAnnotation() {
    ActionCodeRegistry registry = new ActionCodeRegistry(null);

    Assertions.assertThatThrownBy(() -> registry.register(
            ActionCodeRegistryTest.handlerMethods(new ValidController()),
            java.util.List.of(declarer(new DeclaredActionCode("ROLE", "DELETE", "다른 설명")))))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("description이 서로 다릅니다");
  }

}
