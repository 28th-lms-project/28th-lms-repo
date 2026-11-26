package com.learningworks.menu.vo.response;

import lombok.Data;

/** 내 메뉴 1건 (사이드바용). 역할 · 날짜는 내보내지 않는다 */
@Data
public class MyMenuVO {

  private String id;
  private String title;
  private String parentId;
  private int menuOrder;
  /** SUPER_ADMIN만 N을 받을 수 있다 (사이드바에서 흐리게 표시) */
  private String useYn;
  private String spread;
  private String menuUrl;

}
