package com.learningworks.menu.vo.request;

import lombok.Data;

/**
 * 상위 메뉴 변경(메뉴 옮기기) 요청. 이름 · 역할 등 다른 값은 바꾸지 않는다 (수정 API와 따로 저장).
 * 예> { "parentId": "MN-20261110-000005", "mdfyDt": "2026-11-11 10:00:00" }
 * parentId가 비었거나 단계가 맞지 않으면 서비스에서 MENU_MOVE_INVALID로 거부한다.
 */
@Data
public class ModifyMenuParentVO {

  /** 새 상위 메뉴 ID. 소메뉴는 중메뉴, 중메뉴는 대메뉴 */
  private String parentId;

  /** 화면이 받은 수정 시각 그대로. 생성 후 수정된 적 없으면 null */
  private String mdfyDt;

}
