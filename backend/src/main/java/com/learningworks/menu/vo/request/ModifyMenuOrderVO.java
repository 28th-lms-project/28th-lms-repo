package com.learningworks.menu.vo.request;

import java.util.List;
import lombok.Data;

/**
 * 메뉴 순서 변경 요청. 같은 상위 메뉴 안의 "현재 하위 메뉴 전체"를 순서대로 담는다.
 * 예> { "parentId": "MN-20261110-000001", "menuIds": ["MN-20261110-000003", "MN-20261110-000002"] }
 * 빈 목록 · 중복은 서비스에서 MENU_ORDER_INVALID로 거부한다.
 */
@Data
public class ModifyMenuOrderVO {

  /** 상위 메뉴 ID. 대메뉴의 순서를 바꿀 때는 null */
  private String parentId;

  private List<String> menuIds;

}
