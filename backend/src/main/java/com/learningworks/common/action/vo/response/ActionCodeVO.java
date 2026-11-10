package com.learningworks.common.action.vo.response;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 권한 코드 목록의 행위 하나 (2번 드롭다운 선택지) */
@Data
@AllArgsConstructor
public class ActionCodeVO {

  /** 권한 코드. 드롭다운의 value이자 ACTION 등록 요청의 actionCode (예: ROLE_DELETE) */
  private String actionCode;

  /** 행위 (예: DELETE) */
  private String action;

  /** 설명. 드롭다운 표시 · ACTION_NAME 기본값 (예: "역할 삭제") */
  private String description;

  /** ACTION에 이미 등록된 권한 코드인지. true이면 선택지를 비활성화 */
  private boolean registered;

}
