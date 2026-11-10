package com.learningworks.role.service;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.role.dao.RoleDao;
import com.learningworks.role.vo.response.RoleRankVO;

/** 역할 일괄 이동 규칙 (RoleAssignPolicy.checkMovable) */
class RoleAssignPolicyTest {

  private RoleDao roleDao;
  private RoleAssignPolicy policy;

  private static RoleRankVO rank(String roleId, int roleRank) {
    RoleRankVO vo = new RoleRankVO();
    vo.setRoleId(roleId);
    vo.setRoleRank(roleRank);
    return vo;
  }

  @BeforeEach
  void setUp() {
    this.roleDao = Mockito.mock(RoleDao.class);
    // 역할 순위: SUPER_ADMIN=1, ADMIN=2, TUTOR=3, STUDENT=4
    Mockito.when(this.roleDao.selectRankByRoleId("ROLE_SUPER_ADMIN")).thenReturn(1);
    Mockito.when(this.roleDao.selectRankByRoleId("ROLE_ADMIN")).thenReturn(2);
    Mockito.when(this.roleDao.selectRankByRoleId("ROLE_TUTOR")).thenReturn(3);
    Mockito.when(this.roleDao.selectRankByRoleId("ROLE_STUDENT")).thenReturn(4);
    // 없는 역할 (Mockito는 Integer 반환을 기본 0으로 주므로 null을 명시)
    Mockito.when(this.roleDao.selectRankByRoleId("ROLE_NOPE")).thenReturn(null);
    // 요청자
    Mockito.when(this.roleDao.selectRoleRankByUserId("super"))
        .thenReturn(RoleAssignPolicyTest.rank("ROLE_SUPER_ADMIN", 1));
    Mockito.when(this.roleDao.selectRoleRankByUserId("admin"))
        .thenReturn(RoleAssignPolicyTest.rank("ROLE_ADMIN", 2));

    this.policy = new RoleAssignPolicy(this.roleDao);
  }

  private ErrorCode errorCodeOf(String actorId, String fromRoleId, String toRoleId) {
    try {
      this.policy.checkMovable(actorId, fromRoleId, toRoleId);
    } catch (LearningworksException lwe) {
      return lwe.getErrorCode();
    }
    return null;
  }

  @Test
  @DisplayName("SUPER_ADMIN은 순위 제한 없이 이동할 수 있다")
  void superAdminCanMove() {
    Assertions.assertThat(this.errorCodeOf("super", "ROLE_TUTOR", "ROLE_STUDENT")).isNull();
    Assertions.assertThat(this.errorCodeOf("super", "ROLE_ADMIN", "ROLE_TUTOR")).isNull();
  }

  @Test
  @DisplayName("ROLE_SUPER_ADMIN으로는 SUPER_ADMIN도 일괄 이동할 수 없다")
  void cannotMoveToSuperAdmin() {
    Assertions.assertThat(this.errorCodeOf("super", "ROLE_TUTOR", "ROLE_SUPER_ADMIN"))
        .isEqualTo(ErrorCode.ROLE_MOVE_TO_SUPER_ADMIN);
    Assertions.assertThat(this.errorCodeOf("admin", "ROLE_TUTOR", "ROLE_SUPER_ADMIN"))
        .isEqualTo(ErrorCode.ROLE_MOVE_TO_SUPER_ADMIN);
  }

  @Test
  @DisplayName("같은 역할로는 이동할 수 없다")
  void cannotMoveToSameRole() {
    Assertions.assertThat(this.errorCodeOf("super", "ROLE_TUTOR", "ROLE_TUTOR"))
        .isEqualTo(ErrorCode.ROLE_MOVE_SAME);
  }

  @Test
  @DisplayName("SUPER_ADMIN이 아니면 자기보다 아래 순위 역할 사이에서만 이동할 수 있다")
  void adminRankRule() {
    Assertions.assertThat(this.errorCodeOf("admin", "ROLE_TUTOR", "ROLE_STUDENT")).isNull();
    Assertions.assertThat(this.errorCodeOf("admin", "ROLE_ADMIN", "ROLE_STUDENT"))
        .isEqualTo(ErrorCode.ROLE_TARGET_FORBIDDEN);
    Assertions.assertThat(this.errorCodeOf("admin", "ROLE_TUTOR", "ROLE_ADMIN"))
        .isEqualTo(ErrorCode.ROLE_ASSIGN_FORBIDDEN);
  }

  @Test
  @DisplayName("비로그인은 401, 요청자 회원 정보가 없으면 403, 없는 역할은 404")
  void actorAndRoleExistence() {
    Assertions.assertThat(this.errorCodeOf(null, "ROLE_TUTOR", "ROLE_STUDENT"))
        .isEqualTo(ErrorCode.GLOBAL_UNAUTHORIZED);
    Assertions.assertThat(this.errorCodeOf("ghost", "ROLE_TUTOR", "ROLE_STUDENT"))
        .isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);
    Assertions.assertThat(this.errorCodeOf("super", "ROLE_NOPE", "ROLE_STUDENT"))
        .isEqualTo(ErrorCode.ROLE_NOT_EXISTS);
  }

}
