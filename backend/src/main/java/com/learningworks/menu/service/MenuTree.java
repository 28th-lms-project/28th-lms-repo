package com.learningworks.menu.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.learningworks.menu.vo.response.MenuVO;

/**
 * 전체 메뉴 목록으로 단계 · 상위 메뉴를 계산한다. 메뉴는 3단계 고정이므로 메뉴 수가 적다는 전제로 메모리에서 처리한다.
 */
class MenuTree {

  /** 정렬: (단계, PARENT_ID, MENU_ORDER). 같은 값이면 ID 순 */
  private final Comparator<MenuVO> displayOrder = Comparator
      .comparingInt((MenuVO menu) -> this.levelOf(menu.getId()))
      .thenComparing(MenuVO::getParentId, Comparator.nullsFirst(Comparator.naturalOrder()))
      .thenComparingInt(MenuVO::getMenuOrder)
      .thenComparing(MenuVO::getId);

  private final Map<String, MenuVO> menus = new LinkedHashMap<>();

  MenuTree(List<MenuVO> menus) {
    menus.forEach(menu -> this.menus.put(menu.getId(), menu));
  }

  MenuVO get(String menuId) {
    return this.menus.get(menuId);
  }

  /** MENU_URL이 같은 메뉴. 없으면 null (MENU_URL은 UNIQUE) */
  MenuVO findByMenuUrl(String menuUrl) {
    return this.menus.values().stream()
        .filter(menu -> menuUrl.equals(menu.getMenuUrl()))
        .findFirst()
        .orElse(null);
  }

  /** 대메뉴 1, 중메뉴 2, 소메뉴 3. 상위 메뉴가 없어진 메뉴(고아)도 끝까지 따라간 깊이 */
  int levelOf(String menuId) {
    return this.selfAndAncestors(menuId).size();
  }

  /** 자기 자신과 모든 상위 메뉴 (자기 자신부터). 순환 데이터가 있어도 멈춘다 */
  List<MenuVO> selfAndAncestors(String menuId) {
    List<MenuVO> result = new ArrayList<>();
    MenuVO current = this.menus.get(menuId);
    while (current != null && !result.contains(current)) {
      result.add(current);
      current = current.getParentId() == null ? null : this.menus.get(current.getParentId());
    }
    return result;
  }

  /** 전체 메뉴를 (단계, PARENT_ID, MENU_ORDER)로 정렬 */
  List<MenuVO> sorted() {
    return this.menus.values().stream().sorted(this.displayOrder).toList();
  }

}
