package com.learningworks.common.action.vo.response;

import java.util.List;
import lombok.Data;

/**
 * GET /action-codes/me 응답. 로그인 사용자의 현재 역할과 허용된 권한 코드.
 *
 * 프론트는 버튼 · 기능 표시 여부를 이 값으로 판단한다 (D-02: 화면 안의 행동은 ROLE_ACTION 기준).
 * 실제 차단은 서버의 권한 검사가 하므로, 이 값은 화면 표시용이다.
 */
@Data
public class MyActionCodeVO {

  /** 현재 역할 ID (DB의 BASE_ROLE 기준, 예: ROLE_TUTOR) */
  private String roleId;

  /** 역할 표시명 (예: "강사") */
  private String roleDisplayName;

  /** ROLE_SUPER_ADMIN이면 true. 모든 권한 코드가 허용되므로 actionCodes는 빈 목록으로 내려간다. */
  private boolean superAdmin;

  /** 허용된 권한 코드 목록 (이름순) */
  private List<String> actionCodes;

}
