package com.learningworks.accessrole.service;

import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.mockito.Mockito;
import com.learningworks.accessrole.dao.AccessRoleDao;
import com.learningworks.accessrole.vo.request.AccessRoleSaveRequestVO;
import com.learningworks.common.action.AccessChecker;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;

/** 역할별 권한 저장 (AccessRoleServiceImpl.saveRolePermission) */
class AccessRoleServiceImplTest {

  private AccessRoleDao accessRoleDao;
  private AccessChecker accessChecker;
  private AccessRoleServiceImpl service;

  @BeforeEach
  void setUp() {
    this.accessRoleDao = Mockito.mock(AccessRoleDao.class);
    this.accessChecker = Mockito.mock(AccessChecker.class);
    Mockito.when(this.accessRoleDao.selectRoleCount("ROLE_TUTOR")).thenReturn(1);
    this.service = new AccessRoleServiceImpl(this.accessRoleDao, this.accessChecker);
  }

  private static AccessRoleSaveRequestVO request(String roleId, String... actionIds) {
    AccessRoleSaveRequestVO vo = new AccessRoleSaveRequestVO();
    vo.setRoleId(roleId);
    vo.setActionIds(List.of(actionIds));
    return vo;
  }

  @Test
  @DisplayName("기존 권한을 지운 뒤, 중복을 뺀 권한을 한 행씩 등록하고 그 역할의 권한 캐시를 비운다")
  void savesOneRowPerAction() {
    // 중복 제거 후 2건이 모두 존재
    Mockito.when(this.accessRoleDao.selectActionCount(List.of("AC-1", "AC-2"))).thenReturn(2);

    this.service.saveRolePermission(request("ROLE_TUTOR", "AC-1", "AC-2", "AC-1"));

    InOrder inOrder = Mockito.inOrder(this.accessRoleDao, this.accessChecker);
    inOrder.verify(this.accessRoleDao).deleteRolePermission("ROLE_TUTOR");
    inOrder.verify(this.accessRoleDao).insertRolePermission("ROLE_TUTOR", "AC-1");
    inOrder.verify(this.accessRoleDao).insertRolePermission("ROLE_TUTOR", "AC-2");
    inOrder.verify(this.accessChecker).evictRole("ROLE_TUTOR");
    Mockito.verify(this.accessRoleDao, Mockito.times(2))
        .insertRolePermission(Mockito.anyString(), Mockito.anyString());
  }

  @Test
  @DisplayName("빈 목록이면 기존 권한만 지운다 (모든 권한 해제)")
  void emptyListRemovesAll() {
    this.service.saveRolePermission(request("ROLE_TUTOR"));

    Mockito.verify(this.accessRoleDao).deleteRolePermission("ROLE_TUTOR");
    Mockito.verify(this.accessRoleDao, Mockito.never())
        .insertRolePermission(Mockito.anyString(), Mockito.anyString());
    Mockito.verify(this.accessChecker).evictRole("ROLE_TUTOR");
  }

  @Test
  @DisplayName("없는 권한이 섞여 있으면 ACTION_NOT_EXISTS, 아무것도 지우거나 등록하지 않는다")
  void rejectsUnknownAction() {
    Mockito.when(this.accessRoleDao.selectActionCount(List.of("AC-1", "AC-X"))).thenReturn(1);

    Assertions
        .assertThatThrownBy(
            () -> this.service.saveRolePermission(request("ROLE_TUTOR", "AC-1", "AC-X")))
        .isInstanceOfSatisfying(LearningworksException.class,
            e -> Assertions.assertThat(e.getErrorCode()).isEqualTo(ErrorCode.ACTION_NOT_EXISTS));
    Mockito.verify(this.accessRoleDao, Mockito.never()).deleteRolePermission(Mockito.anyString());
  }

  @Test
  @DisplayName("ROLE_SUPER_ADMIN의 권한은 저장할 수 없다 (ACTION_ROLE_PROTECTED)")
  void rejectsSuperAdmin() {
    Assertions
        .assertThatThrownBy(
            () -> this.service.saveRolePermission(request("ROLE_SUPER_ADMIN", "AC-1")))
        .isInstanceOfSatisfying(LearningworksException.class,
            e -> Assertions.assertThat(e.getErrorCode()).isEqualTo(ErrorCode.ACTION_ROLE_PROTECTED));
  }

}
