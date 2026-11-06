package com.learningworks.common.action;

import java.util.Arrays;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.method.HandlerMethod;
import com.learningworks.common.action.service.ActionCodeServiceImpl;
import com.learningworks.common.action.vo.response.ActionCodeListVO;
import com.learningworks.common.action.vo.response.ActionCodeVO;
import com.learningworks.common.action.vo.response.ActionDomainVO;

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

  @Test
  @DisplayName("도메인별로 묶고, 이름순으로 정렬하고, ACTION 등록 여부를 표시한다")
  void readActionCodeList() {
    SampleController controller = new SampleController();
    ActionCodeRegistry registry = new ActionCodeRegistry(null);
    registry.register(Arrays.stream(SampleController.class.getDeclaredMethods())
        .map(method -> new HandlerMethod(controller, method))
        .toList());

    FakeActionCodeDao dao = new FakeActionCodeDao();
    dao.registeredActionCodes.add("ROLE_DELETE");
    dao.registeredActionCodes.add("OLD_REMOVED_CODE"); // 코드에서 삭제된 권한: 목록에 나오지 않음

    ActionCodeListVO result = new ActionCodeServiceImpl(registry, dao).readActionCodeList();

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

}
