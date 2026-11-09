package com.learningworks.role.vo.response;

import lombok.AllArgsConstructor;
import lombok.Data;

/** 역할 사용 회원 일괄 이동 결과 */
@Data
@AllArgsConstructor
public class RoleUserMoveResultVO {

  private String fromRoleId;
  private String toRoleId;
  /** 실제로 이동된 회원 수 (요청한 본인은 제외됨) */
  private int movedCount;

}
