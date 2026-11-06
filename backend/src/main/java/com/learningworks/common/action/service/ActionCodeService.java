package com.learningworks.common.action.service;

import com.learningworks.common.action.vo.response.ActionCodeListVO;

public interface ActionCodeService {

  /** 코드에 정의된 권한 코드 목록 (도메인별, ACTION 등록 여부 포함) */
  ActionCodeListVO readActionCodeList();

}
