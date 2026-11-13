package com.learningworks.menu;

/**
 * 메뉴(MENU) 관련 공통 상수.
 */
public final class MenuConstants {

  /**
   * 메뉴 관리 화면의 프론트 라우트 경로. 자기 잠금 방지(MENU_SELF_LOCK)의 보호 대상 메뉴를 찾는 데 쓴다.
   * 프론트 라우트 경로를 바꾸면 함께 바꿀 것.
   */
  public static final String MENU_MANAGEMENT_URL = "/admin/system/menu";

  /** 메뉴 단계: 대메뉴(PARENT_ID null) → 중메뉴 → 소메뉴 */
  public static final int TOP_LEVEL = 1;
  public static final int MID_LEVEL = 2;
  public static final int BOTTOM_LEVEL = 3;

  public static final String YES = "Y";
  public static final String NO = "N";

  /** MENU.MENU_URL 최대 길이 */
  public static final int MENU_URL_MAX_LENGTH = 100;

  private MenuConstants() {}

}
