package com.learningworks.menu.vo.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** MENU_ROLE 1행 (내부 조회용, API 응답으로 내보내지 않음) */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuRoleVO {

  private String menuId;
  private String roleId;

}
