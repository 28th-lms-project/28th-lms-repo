package com.learningworks.menu.service;

import com.learningworks.menu.vo.request.ModifyMenuOrderVO;
import com.learningworks.menu.vo.request.ModifyMenuParentVO;
import com.learningworks.menu.vo.request.ModifyMenuVO;
import com.learningworks.menu.vo.request.RegistMenuVO;
import com.learningworks.menu.vo.response.MenuListVO;
import com.learningworks.menu.vo.response.MenuVO;
import com.learningworks.menu.vo.response.MyMenuListVO;

public interface MenuService {

  /** 내 메뉴 (사이드바 · 프론트 가드용). userId가 null이면 401 */
  MyMenuListVO readMyMenus(String userId);

  /** 전체 역할과 전체 메뉴 (메뉴 관리 화면용) */
  MenuListVO readMenuList();

  MenuVO createMenu(RegistMenuVO registMenuVO);

  /** actorId: 자기 잠금 검사(MENU_SELF_LOCK)용 요청자 ID */
  MenuVO updateMenu(String actorId, String menuId, ModifyMenuVO modifyMenuVO);

  MenuListVO updateMenuOrder(ModifyMenuOrderVO modifyMenuOrderVO);

  /**
   * 상위 메뉴 변경 (메뉴 옮기기). 소메뉴는 다른 중메뉴로, 중메뉴는 다른 대메뉴로만 옮긴다.
   * 이 메뉴를 가리키는 ACTION의 메뉴 컬럼도 같은 트랜잭션에서 고친다 (menu-design.md 4-7).
   * actorId: 자기 잠금 검사(MENU_SELF_LOCK)용 요청자 ID
   */
  MenuListVO moveMenu(String actorId, String menuId, ModifyMenuParentVO modifyMenuParentVO);

  /** actorId: 자기 잠금 검사(MENU_SELF_LOCK)용 요청자 ID */
  MenuVO deleteMenu(String actorId, String menuId);

  /**
   * ACTION 저장용: 대메뉴 > 중메뉴 > 소메뉴로 이어지는 경로인지 확인하고, 소메뉴 행을 잠근다.
   * 잠금은 호출한 쪽의 트랜잭션이 끝날 때까지 유지되므로, 반드시 트랜잭션 안에서 호출할 것.
   * 메뉴 삭제(deleteMenu)도 같은 행을 잠그므로, ACTION 저장과 메뉴 삭제가 동시에 일어나도 차례대로 처리된다.
   *
   * @return 세 메뉴가 모두 있고 계층이 맞으면 true (값이 비어 있으면 false)
   */
  boolean checkAndLockMenuPath(String topMenuId, String midMenuId, String btmMenuId);

}
