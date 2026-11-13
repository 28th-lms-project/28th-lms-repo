package com.learningworks.menu.vo.response;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** GET /menus/me 응답 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MyMenuListVO {

  private boolean superAdmin;
  /** 메뉴 판정 규칙을 통과한 메뉴. 정렬: (단계, PARENT_ID, MENU_ORDER) */
  private List<MyMenuVO> menus;
  /** 모든 소메뉴의 MENU_URL (미사용 · 미허용 포함). 프론트 가드가 URL의 소속 메뉴를 찾을 때 쓴다 */
  private List<String> guardUrls;

}
