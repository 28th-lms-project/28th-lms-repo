package com.learningworks.common.action.service;

import com.learningworks.common.action.vo.response.ActionCodeListVO;
import com.learningworks.common.action.vo.response.MyActionCodeVO;

public interface ActionCodeService {

  /** 코드에 정의된 권한 코드 목록 (도메인별, ACTION 등록 여부 포함) */
  ActionCodeListVO readActionCodeList();

  /**
   * 로그인 사용자의 현재 역할(DB 기준)과 허용된 권한 코드.
   *
   * @param userId 로그인 사용자 ID. 비로그인이면 null
   * @throws com.learningworks.common.exceptions.LearningworksException 비로그인 GLOBAL_UNAUTHORIZED(401), 회원이
   *         없거나 탈퇴 GLOBAL_FORBIDDEN(403)
   */
  MyActionCodeVO readMyActionCodes(String userId);

}
