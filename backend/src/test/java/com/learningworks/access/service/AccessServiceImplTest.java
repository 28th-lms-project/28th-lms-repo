package com.learningworks.access.service;

import java.util.ArrayList;
import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.mockito.Mockito;
import com.learningworks.access.dao.AccessDao;
import com.learningworks.access.vo.request.AccessSaveRequestVO;
import com.learningworks.access.vo.response.AccessVO;
import com.learningworks.common.action.ActionCodeRegistry;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.menu.service.MenuService;

/** 접근 권한(ACTION) 저장 (AccessServiceImpl.saveAccess)의 메뉴 검증 */
class AccessServiceImplTest {

  private AccessDao accessDao;
  private ActionCodeRegistry actionCodeRegistry;
  private MenuService menuService;
  private AccessServiceImpl service;

  @BeforeEach
  void setUp() {
    this.accessDao = Mockito.mock(AccessDao.class);
    this.actionCodeRegistry = Mockito.mock(ActionCodeRegistry.class);
    this.menuService = Mockito.mock(MenuService.class);

    Mockito.when(this.actionCodeRegistry.contains(Mockito.anyString())).thenReturn(true);
    Mockito.when(this.accessDao.insertAccess(Mockito.any())).thenReturn(1);
    Mockito.when(this.accessDao.updateAccess(Mockito.any())).thenReturn(1);
    // 올바른 메뉴 경로: T1 > M1 > B1, T1 > M1 > B2
    Mockito.when(this.menuService.checkAndLockMenuPath("T1", "M1", "B1")).thenReturn(true);
    Mockito.when(this.menuService.checkAndLockMenuPath("T1", "M1", "B2")).thenReturn(true);

    this.service = new AccessServiceImpl(this.accessDao, this.actionCodeRegistry, this.menuService);
  }

  private static AccessVO access(String actionId, String top, String mid, String btm) {
    AccessVO vo = new AccessVO();
    vo.setActionId(actionId);
    vo.setActionCode("MENU_READ");
    vo.setActionName("메뉴 목록 조회");
    vo.setTopMenuId(top);
    vo.setMidMenuId(mid);
    vo.setBtmMenuId(btm);
    return vo;
  }

  private static AccessSaveRequestVO request(List<AccessVO> added, List<AccessVO> modified) {
    AccessSaveRequestVO vo = new AccessSaveRequestVO();
    vo.setAddedList(added == null ? null : new ArrayList<>(added));
    vo.setModifiedList(modified == null ? null : new ArrayList<>(modified));
    return vo;
  }

  @Test
  @DisplayName("저장 전에 모든 ACTION의 메뉴 경로를 소메뉴 ID 순서로 확인 · 잠근 뒤 등록 · 수정한다")
  void checksMenuPathsBeforeSaving() {
    AccessVO added = access(null, "T1", "M1", "B2");
    AccessVO modified = access("AC-1", "T1", "M1", "B1");

    this.service.saveAccess(request(List.of(added), List.of(modified)));

    InOrder inOrder = Mockito.inOrder(this.menuService, this.accessDao);
    // 교착 상태를 피하려고 요청 순서가 아니라 소메뉴 ID 순서로 잠근다 (B1 → B2)
    inOrder.verify(this.menuService).checkAndLockMenuPath("T1", "M1", "B1");
    inOrder.verify(this.menuService).checkAndLockMenuPath("T1", "M1", "B2");
    inOrder.verify(this.accessDao).insertAccess(added);
    inOrder.verify(this.accessDao).updateAccess(modified);
  }

  @Test
  @DisplayName("같은 메뉴 경로는 한 번만 확인한다")
  void checksSamePathOnce() {
    this.service.saveAccess(request(
        List.of(access(null, "T1", "M1", "B1"), access(null, "T1", "M1", "B1")), null));

    Mockito.verify(this.menuService, Mockito.times(1)).checkAndLockMenuPath("T1", "M1", "B1");
  }

  @Test
  @DisplayName("메뉴 경로가 하나라도 틀리면 ACTION_MENU_INVALID, 아무것도 저장하지 않는다")
  void rejectsInvalidMenuPath() {
    AccessVO valid = access(null, "T1", "M1", "B1");
    AccessVO invalid = access("AC-1", "T1", "M9", "B2");

    Assertions
        .assertThatThrownBy(
            () -> this.service.saveAccess(request(List.of(valid), List.of(invalid))))
        .isInstanceOfSatisfying(LearningworksException.class,
            e -> Assertions.assertThat(e.getErrorCode()).isEqualTo(ErrorCode.ACTION_MENU_INVALID));
    Mockito.verify(this.accessDao, Mockito.never()).insertAccess(Mockito.any());
    Mockito.verify(this.accessDao, Mockito.never()).updateAccess(Mockito.any());
  }

}
