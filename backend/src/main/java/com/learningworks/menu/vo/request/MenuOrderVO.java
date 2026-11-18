package com.learningworks.menu.vo.request;

import java.util.List;
import lombok.Data;

/**
 * 상위 메뉴 하나의 순서. 그 상위 메뉴의 "현재 하위 메뉴 전체"를 순서대로 담는다.
 * 예> { "parentId": "MN-20261110-000001", "menuIds": ["MN-20261110-000003", "MN-20261110-000002"] }
 */
@Data
public class MenuOrderVO {

  /** 상위 메뉴 ID. 대메뉴의 순서를 바꿀 때는 null */
  private String parentId;

  private List<String> menuIds;

}
