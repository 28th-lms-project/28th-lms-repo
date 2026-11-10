package com.learningworks.common.action;

import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.method.HandlerMethod;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;

class ActionCheckInterceptorTest {

  static class SampleController {

    @RequireAction(domain = "ASSIGNMENT", action = "CREATE", description = "과제 등록")
    public void createAssignment() {}

    @RequireSuperAdmin
    public void saveRolePermission() {}

    public void open() {}
  }

  private ActionCheckInterceptor interceptor;

  @BeforeEach
  void setUp() {
    FakeActionCodeDao dao = new FakeActionCodeDao();
    dao.baseRoles.put("super", "ROLE_SUPER_ADMIN");
    dao.baseRoles.put("tutor", "ROLE_TUTOR");
    dao.baseRoles.put("student", "ROLE_STUDENT");
    dao.allowedActionCodes.put("ROLE_TUTOR", List.of("ASSIGNMENT_CREATE"));
    this.interceptor = new ActionCheckInterceptor(new AccessChecker(dao));
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  private static void login(String userId) {
    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(userId, null, List.of()));
  }

  private boolean call(String methodName) throws Exception {
    HandlerMethod handlerMethod =
        new HandlerMethod(new SampleController(), SampleController.class.getMethod(methodName));
    return this.interceptor.preHandle(new MockHttpServletRequest(), new MockHttpServletResponse(),
        handlerMethod);
  }

  private ErrorCode errorCodeOf(String methodName) throws Exception {
    try {
      this.call(methodName);
    } catch (LearningworksException lwe) {
      return lwe.getErrorCode();
    }
    return null;
  }

  @Test
  @DisplayName("@RequireAction: 권한 코드가 허용된 역할만 통과")
  void requireAction() throws Exception {
    ActionCheckInterceptorTest.login("tutor");
    Assertions.assertThat(this.call("createAssignment")).isTrue();

    ActionCheckInterceptorTest.login("student");
    Assertions.assertThat(this.errorCodeOf("createAssignment")).isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);

    ActionCheckInterceptorTest.login("super");
    Assertions.assertThat(this.call("createAssignment")).isTrue();
  }

  @Test
  @DisplayName("@RequireSuperAdmin: 권한 코드가 있어도 SUPER_ADMIN만 통과")
  void requireSuperAdmin() throws Exception {
    ActionCheckInterceptorTest.login("tutor");
    Assertions.assertThat(this.errorCodeOf("saveRolePermission"))
        .isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);

    ActionCheckInterceptorTest.login("super");
    Assertions.assertThat(this.call("saveRolePermission")).isTrue();
  }

  @Test
  @DisplayName("비로그인 · 익명 인증이면 401")
  void unauthenticated() throws Exception {
    Assertions.assertThat(this.errorCodeOf("createAssignment"))
        .isEqualTo(ErrorCode.GLOBAL_UNAUTHORIZED);

    SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken("key",
        "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));
    Assertions.assertThat(this.errorCodeOf("saveRolePermission"))
        .isEqualTo(ErrorCode.GLOBAL_UNAUTHORIZED);
  }

  @Test
  @DisplayName("어노테이션이 없는 API와 컨트롤러 메서드가 아닌 요청은 검사하지 않는다")
  void skipsUnannotated() throws Exception {
    Assertions.assertThat(this.call("open")).isTrue();
    Assertions.assertThat(this.interceptor.preHandle(new MockHttpServletRequest(),
        new MockHttpServletResponse(), new Object())).isTrue();
  }

}
