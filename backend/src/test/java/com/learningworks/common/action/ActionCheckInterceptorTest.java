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

    @LoginRequired
    public void getMyInfo() {}

    @PublicApi
    public void getPublicNotices() {}

    public void unannotated() {}
  }

  private FakeActionCodeDao dao;

  /** 권한 어노테이션이 없는 API를 SUPER_ADMIN 전용으로 보는 기본 설정 */
  private ActionCheckInterceptor interceptor;

  @BeforeEach
  void setUp() {
    this.dao = new FakeActionCodeDao();
    this.dao.baseRoles.put("super", "ROLE_SUPER_ADMIN");
    this.dao.baseRoles.put("tutor", "ROLE_TUTOR");
    this.dao.baseRoles.put("student", "ROLE_STUDENT");
    this.dao.allowedActionCodes.put("ROLE_TUTOR", List.of("ASSIGNMENT_CREATE"));
    this.interceptor = new ActionCheckInterceptor(new AccessChecker(this.dao), true);
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  private static void login(String userId) {
    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(userId, null, List.of()));
  }

  private static void loginAnonymous() {
    SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken("key",
        "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));
  }

  private static boolean call(ActionCheckInterceptor interceptor, String methodName)
      throws Exception {
    HandlerMethod handlerMethod =
        new HandlerMethod(new SampleController(), SampleController.class.getMethod(methodName));
    return interceptor.preHandle(new MockHttpServletRequest(), new MockHttpServletResponse(),
        handlerMethod);
  }

  private boolean call(String methodName) throws Exception {
    return ActionCheckInterceptorTest.call(this.interceptor, methodName);
  }

  private static ErrorCode errorCodeOf(ActionCheckInterceptor interceptor, String methodName)
      throws Exception {
    try {
      ActionCheckInterceptorTest.call(interceptor, methodName);
    } catch (LearningworksException lwe) {
      return lwe.getErrorCode();
    }
    return null;
  }

  private ErrorCode errorCodeOf(String methodName) throws Exception {
    return ActionCheckInterceptorTest.errorCodeOf(this.interceptor, methodName);
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
  @DisplayName("@LoginRequired: 로그인한 사용자는 역할과 관계없이 통과, 비로그인 · 익명은 401")
  void loginRequired() throws Exception {
    ActionCheckInterceptorTest.login("student");
    Assertions.assertThat(this.call("getMyInfo")).isTrue();

    // 회원 정보가 없는 ID여도 로그인만 확인한다 (본인 데이터 조회는 서비스에서 처리)
    ActionCheckInterceptorTest.login("unknown");
    Assertions.assertThat(this.call("getMyInfo")).isTrue();

    SecurityContextHolder.clearContext();
    Assertions.assertThat(this.errorCodeOf("getMyInfo")).isEqualTo(ErrorCode.GLOBAL_UNAUTHORIZED);

    ActionCheckInterceptorTest.loginAnonymous();
    Assertions.assertThat(this.errorCodeOf("getMyInfo")).isEqualTo(ErrorCode.GLOBAL_UNAUTHORIZED);
  }

  @Test
  @DisplayName("@PublicApi: 비로그인도 통과")
  void publicApi() throws Exception {
    Assertions.assertThat(this.call("getPublicNotices")).isTrue();

    ActionCheckInterceptorTest.loginAnonymous();
    Assertions.assertThat(this.call("getPublicNotices")).isTrue();

    ActionCheckInterceptorTest.login("student");
    Assertions.assertThat(this.call("getPublicNotices")).isTrue();
  }

  @Test
  @DisplayName("어노테이션 없음 (기본 설정): SUPER_ADMIN만 통과, 비로그인은 401")
  void unannotatedIsSuperAdminOnly() throws Exception {
    ActionCheckInterceptorTest.login("tutor");
    Assertions.assertThat(this.errorCodeOf("unannotated")).isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);

    ActionCheckInterceptorTest.login("super");
    Assertions.assertThat(this.call("unannotated")).isTrue();

    SecurityContextHolder.clearContext();
    Assertions.assertThat(this.errorCodeOf("unannotated")).isEqualTo(ErrorCode.GLOBAL_UNAUTHORIZED);
  }

  @Test
  @DisplayName("어노테이션 없음 (default-super-admin: false): 누구나 통과")
  void unannotatedIsOpenWhenDisabled() throws Exception {
    ActionCheckInterceptor openInterceptor =
        new ActionCheckInterceptor(new AccessChecker(this.dao), false);

    Assertions.assertThat(ActionCheckInterceptorTest.call(openInterceptor, "unannotated")).isTrue();

    ActionCheckInterceptorTest.login("student");
    Assertions.assertThat(ActionCheckInterceptorTest.call(openInterceptor, "unannotated")).isTrue();

    // 어노테이션이 있는 API는 설정과 관계없이 검사한다
    Assertions.assertThat(ActionCheckInterceptorTest.errorCodeOf(openInterceptor, "saveRolePermission"))
        .isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);
  }

  @Test
  @DisplayName("비로그인 · 익명 인증이면 401")
  void unauthenticated() throws Exception {
    Assertions.assertThat(this.errorCodeOf("createAssignment"))
        .isEqualTo(ErrorCode.GLOBAL_UNAUTHORIZED);

    ActionCheckInterceptorTest.loginAnonymous();
    Assertions.assertThat(this.errorCodeOf("saveRolePermission"))
        .isEqualTo(ErrorCode.GLOBAL_UNAUTHORIZED);
  }

  @Test
  @DisplayName("컨트롤러 메서드가 아닌 요청(정적 리소스, CORS preflight 등)은 검사하지 않는다")
  void skipsNonHandlerMethod() throws Exception {
    Assertions.assertThat(this.interceptor.preHandle(new MockHttpServletRequest(),
        new MockHttpServletResponse(), new Object())).isTrue();
  }

}
