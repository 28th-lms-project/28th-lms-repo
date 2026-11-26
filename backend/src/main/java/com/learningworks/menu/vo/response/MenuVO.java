package com.learningworks.menu.vo.response;

import java.util.List;
import lombok.Data;

/**
 * 메뉴 1건 (메뉴 관리 화면용). MENU 테이블 조회 결과로도 사용한다 (roleIds는 서비스가 채움).
 */
@Data
public class MenuVO {

  private String id;
  private String title;
  /** 상위 메뉴 ID. 대메뉴는 null */
  private String parentId;
  private int menuOrder;
  private String useYn;
  /** 중메뉴만 의미가 있음. 대 · 소메뉴는 항상 N */
  private String spread;
  /** 소메뉴만 값이 있음 */
  private String menuUrl;
  /** 메뉴에 허용된 역할. SUPER_ADMIN은 포함하지 않는다 */
  private List<String> roleIds;
  /** YYYY-MM-DD HH24:MI:SS */
  private String crtDt;
  /** YYYY-MM-DD HH24:MI:SS. 생성 후 수정된 적 없으면 null. 동시 수정 검사에 쓰므로 초까지 보낸다 */
  private String mdfyDt;

}
