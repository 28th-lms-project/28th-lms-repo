package com.learningworks.menu.vo.request;

import java.util.List;
import lombok.Data;

/**
 * 메뉴 순서 변경 요청. 화면의 [순서 저장]으로 여러 상위 메뉴의 순서를 한 번에 보낸다 (한 트랜잭션).
 * 예> { "orders": [ { "parentId": null, "menuIds": ["T2", "T1"] }, { "parentId": "T1", "menuIds": ["M2", "M1"] } ] }
 * 빈 목록 · null 항목 · 중복 ID · 같은 상위 메뉴가 두 번이면 서비스에서 MENU_ORDER_INVALID로 거부한다.
 */
@Data
public class ModifyMenuOrderVO {

  private List<MenuOrderVO> orders;

}
