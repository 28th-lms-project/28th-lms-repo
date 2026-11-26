package com.learningworks.menu.vo.response;

import java.util.List;
import com.learningworks.role.vo.response.RoleVO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** GET /menus 응답 (메뉴 관리 화면용) */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuListVO {

  /** 역할 순위 순서의 전체 역할. 메뉴 관리 화면의 체크박스용 */
  private List<RoleVO> roles;
  /** 전체 메뉴. 정렬: (단계, PARENT_ID, MENU_ORDER) */
  private List<MenuVO> menus;

}
