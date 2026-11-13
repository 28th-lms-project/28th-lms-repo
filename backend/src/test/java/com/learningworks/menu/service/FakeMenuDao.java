package com.learningworks.menu.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.learningworks.menu.dao.MenuDao;
import com.learningworks.menu.vo.response.MenuRoleVO;
import com.learningworks.menu.vo.response.MenuVO;

/**
 * 테스트용 MenuDao. MENU, MENU_ROLE, ACTION 참조를 메모리에 둔다.
 * 반환하는 MenuVO는 저장된 값의 복사본이다 (실제 DB 조회처럼 서비스가 바꿔도 저장 값은 그대로).
 */
class FakeMenuDao implements MenuDao {

  /** 수정 시각으로 쓰는 값. 테스트에서 바꿀 수 있다 */
  String now = "2026-11-11 10:00:00";

  final Map<String, MenuVO> menus = new LinkedHashMap<>();
  final List<MenuRoleVO> menuRoles = new ArrayList<>();
  /** key: 메뉴 ID, value: 그 메뉴를 참조하는 ACTION 행 수 */
  final Map<String, Long> actionRefs = new HashMap<>();

  private int menuSeq = 0;

  /** 테스트 데이터 준비용. 메뉴를 그대로 넣는다 */
  MenuVO put(String id, String parentId, int menuOrder, String title, String menuUrl,
      String... roleIds) {
    MenuVO menu = new MenuVO();
    menu.setId(id);
    menu.setParentId(parentId);
    menu.setMenuOrder(menuOrder);
    menu.setTitle(title);
    menu.setUseYn("Y");
    menu.setSpread("N");
    menu.setMenuUrl(menuUrl);
    menu.setCrtDt("2026-11-10 09:00:00");
    this.menus.put(id, menu);
    for (String roleId : roleIds) {
      this.menuRoles.add(new MenuRoleVO(id, roleId));
    }
    return menu;
  }

  List<String> roleIdsOf(String menuId) {
    return this.selectRoleIdsByMenuId(menuId);
  }

  private static MenuVO copy(MenuVO source) {
    if (source == null) {
      return null;
    }
    MenuVO menu = new MenuVO();
    menu.setId(source.getId());
    menu.setTitle(source.getTitle());
    menu.setParentId(source.getParentId());
    menu.setMenuOrder(source.getMenuOrder());
    menu.setUseYn(source.getUseYn());
    menu.setSpread(source.getSpread());
    menu.setMenuUrl(source.getMenuUrl());
    menu.setCrtDt(source.getCrtDt());
    menu.setMdfyDt(source.getMdfyDt());
    return menu;
  }

  private List<MenuVO> children(String parentId) {
    return this.menus.values().stream()
        .filter(menu -> Objects.equals(menu.getParentId(), parentId))
        .sorted(Comparator.comparingInt(MenuVO::getMenuOrder))
        .toList();
  }

  @Override
  public List<MenuVO> selectAllMenus() {
    return this.menus.values().stream().map(FakeMenuDao::copy).toList();
  }

  @Override
  public MenuVO selectMenuById(String menuId) {
    return FakeMenuDao.copy(this.menus.get(menuId));
  }

  /** selectMenuByIdForUpdate로 잠근 메뉴 ID */
  final List<String> lockedMenuIds = new ArrayList<>();

  @Override
  public MenuVO selectMenuByIdForUpdate(String menuId) {
    this.lockedMenuIds.add(menuId);
    return FakeMenuDao.copy(this.menus.get(menuId));
  }

  @Override
  public List<String> selectChildMenuIds(String parentId) {
    return this.children(parentId).stream().map(MenuVO::getId).toList();
  }

  @Override
  public int selectMaxMenuOrder(String parentId) {
    return this.children(parentId).stream().mapToInt(MenuVO::getMenuOrder).max().orElse(0);
  }

  @Override
  public long selectTitleCount(String parentId, String title, String excludeMenuId) {
    return this.children(parentId).stream()
        .filter(menu -> menu.getTitle().equals(title))
        .filter(menu -> !menu.getId().equals(excludeMenuId))
        .count();
  }

  @Override
  public long selectMenuUrlCount(String menuUrl, String excludeMenuId) {
    return this.menus.values().stream()
        .filter(menu -> Objects.equals(menu.getMenuUrl(), menuUrl))
        .filter(menu -> !menu.getId().equals(excludeMenuId))
        .count();
  }

  @Override
  public long selectActionCountByMenuId(String menuId) {
    return this.actionRefs.getOrDefault(menuId, 0L);
  }

  @Override
  public int insertMenu(MenuVO menu) {
    this.menuSeq++;
    String id = String.format("MN-20261111-%06d", this.menuSeq);
    menu.setId(id);
    MenuVO stored = FakeMenuDao.copy(menu);
    stored.setCrtDt(this.now);
    stored.setMdfyDt(null);
    this.menus.put(id, stored);
    return 1;
  }

  @Override
  public int updateMenu(MenuVO menu) {
    MenuVO stored = this.menus.get(menu.getId());
    if (stored == null) {
      return 0;
    }
    stored.setTitle(menu.getTitle());
    stored.setUseYn(menu.getUseYn());
    stored.setSpread(menu.getSpread());
    stored.setMenuUrl(menu.getMenuUrl());
    stored.setMdfyDt(this.now);
    return 1;
  }

  @Override
  public int updateMenuOrders(List<String> menuIds) {
    int updated = 0;
    for (int i = 0; i < menuIds.size(); i++) {
      MenuVO stored = this.menus.get(menuIds.get(i));
      if (stored != null) {
        stored.setMenuOrder(i + 1);
        updated++;
      }
    }
    return updated;
  }

  @Override
  public int updateMenuParent(String menuId, String parentId, int menuOrder) {
    MenuVO stored = this.menus.get(menuId);
    if (stored == null) {
      return 0;
    }
    stored.setParentId(parentId);
    stored.setMenuOrder(menuOrder);
    stored.setMdfyDt(this.now);
    return 1;
  }

  @Override
  public int deleteMenu(String menuId) {
    return this.menus.remove(menuId) == null ? 0 : 1;
  }

  @Override
  public List<MenuRoleVO> selectAllMenuRoles() {
    return List.copyOf(this.menuRoles);
  }

  @Override
  public List<String> selectRoleIdsByMenuId(String menuId) {
    return this.menuRoles.stream()
        .filter(menuRole -> menuRole.getMenuId().equals(menuId))
        .map(MenuRoleVO::getRoleId)
        .toList();
  }

  @Override
  public int insertMenuRole(String menuId, String roleId) {
    boolean duplicated = this.menuRoles.stream()
        .anyMatch(mr -> mr.getMenuId().equals(menuId) && mr.getRoleId().equals(roleId));
    if (duplicated) {
      // UK_MENU_ROLE 위반
      throw new org.springframework.dao.DuplicateKeyException("UK_MENU_ROLE");
    }
    this.menuRoles.add(new MenuRoleVO(menuId, roleId));
    return 1;
  }

  @Override
  public int deleteMenuRolesByMenuId(String menuId) {
    int before = this.menuRoles.size();
    this.menuRoles.removeIf(menuRole -> menuRole.getMenuId().equals(menuId));
    return before - this.menuRoles.size();
  }

}
