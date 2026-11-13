package com.learningworks.menu.service;

import com.learningworks.menu.vo.request.ModifyMenuOrderVO;
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

  /** actorId: 자기 잠금 검사(MENU_SELF_LOCK)용 요청자 ID */
  MenuVO deleteMenu(String actorId, String menuId);

}
