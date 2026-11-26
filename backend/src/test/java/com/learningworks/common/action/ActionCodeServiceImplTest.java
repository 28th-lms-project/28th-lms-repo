package com.learningworks.common.action;

import java.util.Arrays;
import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.method.HandlerMethod;
import com.learningworks.common.action.service.ActionCodeServiceImpl;
import com.learningworks.common.action.vo.response.ActionCodeListVO;
import com.learningworks.common.action.vo.response.ActionCodeVO;
import com.learningworks.common.action.vo.response.ActionDomainVO;
import com.learningworks.common.action.vo.response.MyActionCodeVO;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;

class ActionCodeServiceImplTest {

  static class SampleController {

    @RequireAction(domain = "ROLE", action = "USER_MOVE", description = "역할 사용 회원 이동")
    public void moveRoleUsers() {}

    @RequireAction(domain = "ROLE", action = "DELETE", description = "역할 삭제")
    public void deleteRole() {}

    @RequireAction(domain = "COURSE_NOTICE", action = "CREATE", description = "강의 공지 등록")
    public void createCourseNotice() {}

    @RequireSuperAdmin
    public void createRole() {}
  }

  private static ActionCodeRegistry registry() {
    SampleController controller = new SampleController();
    ActionCodeRegistry registry = new ActionCodeRegistry(null);
    registry.register(Arrays.stream(SampleController.class.getDeclaredMethods())
        .map(method -> new HandlerMethod(controller, method))
        .toList());
    return registry;
  }

  private static ActionCodeServiceImpl service(FakeActionCodeDao dao) {
    return new ActionCodeServiceImpl(ActionCodeServiceImplTest.registry(), dao,
        new AccessChecker(dao));
  }

  private static ErrorCode errorCodeOf(Runnable runnable) {
    try {
      runnable.run();
    } catch (LearningworksException lwe) {
      return lwe.getErrorCode();
    }
    return null;
  }

  @Test
  @DisplayName("도메인별로 묶고, 이름순으로 정렬하고, ACTION 등록 여부를 표시한다")
  void readActionCodeList() {
    FakeActionCodeDao dao = new FakeActionCodeDao();
    dao.registeredActionCodes.add("ROLE_DELETE");
    dao.registeredActionCodes.add("OLD_REMOVED_CODE"); // 코드에서 삭제된 권한: 목록에 나오지 않음

    ActionCodeListVO result = ActionCodeServiceImplTest.service(dao).readActionCodeList();

    Assertions.assertThat(result.getActionCodeCount()).isEqualTo(3);
    Assertions.assertThat(result.getDomainList()).extracting(ActionDomainVO::getDomain)
        .containsExactly("COURSE_NOTICE", "ROLE");

    ActionDomainVO role = result.getDomainList().get(1);
    Assertions.assertThat(role.getActionList())
        .extracting(ActionCodeVO::getActionCode, ActionCodeVO::getAction,
            ActionCodeVO::getDescription, ActionCodeVO::isRegistered)
        .containsExactly(
            Assertions.tuple("ROLE_DELETE", "DELETE", "역할 삭제", true),
            Assertions.tuple("ROLE_USER_MOVE", "USER_MOVE", "역할 사용 회원 이동", false));
  }

  @Test
  @DisplayName("내 권한: 현재 역할과 허용된 권한 코드를 이름순으로 반환한다")
  void readMyActionCodes() {
    FakeActionCodeDao dao = new FakeActionCodeDao();
    dao.baseRoles.put("tutor", "ROLE_TUTOR");
    dao.allowedActionCodes.put("ROLE_TUTOR", List.of("ASSIGNMENT_READ", "ASSIGNMENT_CREATE"));

    MyActionCodeVO result = ActionCodeServiceImplTest.service(dao).readMyActionCodes("tutor");

    Assertions.assertThat(result.getRoleId()).isEqualTo("ROLE_TUTOR");
    Assertions.assertThat(result.getRoleDisplayName()).isEqualTo("ROLE_TUTOR_NAME");
    Assertions.assertThat(result.isSuperAdmin()).isFalse();
    Assertions.assertThat(result.getActionCodes())
        .containsExactly("ASSIGNMENT_CREATE", "ASSIGNMENT_READ");
  }

  @Test
  @DisplayName("내 권한: 권한이 하나도 없으면 빈 목록")
  void readMyActionCodesEmpty() {
    FakeActionCodeDao dao = new FakeActionCodeDao();
    dao.baseRoles.put("newbie", "ROLE_NEW");

    MyActionCodeVO result = ActionCodeServiceImplTest.service(dao).readMyActionCodes("newbie");

    Assertions.assertThat(result.isSuperAdmin()).isFalse();
    Assertions.assertThat(result.getActionCodes()).isEmpty();
  }

  @Test
  @DisplayName("내 권한: SUPER_ADMIN은 superAdmin=true, 권한 코드 목록은 비우고 ROLE_ACTION을 조회하지 않는다")
  void readMyActionCodesSuperAdmin() {
    FakeActionCodeDao dao = new FakeActionCodeDao();
    dao.baseRoles.put("super", "ROLE_SUPER_ADMIN");

    MyActionCodeVO result = ActionCodeServiceImplTest.service(dao).readMyActionCodes("super");

    Assertions.assertThat(result.getRoleId()).isEqualTo("ROLE_SUPER_ADMIN");
    Assertions.assertThat(result.isSuperAdmin()).isTrue();
    Assertions.assertThat(result.getActionCodes()).isEmpty();
    Assertions.assertThat(dao.allowedQueryCount).isZero();
  }

  @Test
  @DisplayName("내 권한: 비로그인은 401, 회원이 없거나 탈퇴했으면 403")
  void readMyActionCodesUnauthenticated() {
    ActionCodeServiceImpl service = ActionCodeServiceImplTest.service(new FakeActionCodeDao());

    Assertions.assertThat(ActionCodeServiceImplTest.errorCodeOf(() -> service.readMyActionCodes(null)))
        .isEqualTo(ErrorCode.GLOBAL_UNAUTHORIZED);
    Assertions
        .assertThat(ActionCodeServiceImplTest.errorCodeOf(() -> service.readMyActionCodes("ghost")))
        .isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);
  }

}
