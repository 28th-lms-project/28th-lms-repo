package com.learningworks.role.vo.response;

import lombok.Data;

/** 회원의 현재 역할과 순위 (권한 판단용, API 응답으로 내보내지 않음) */
@Data
public class RoleRankVO {

  private String roleId;
  /** 작을수록 상위 역할 */
  private int roleRank;

}
