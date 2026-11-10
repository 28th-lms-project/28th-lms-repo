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

}
