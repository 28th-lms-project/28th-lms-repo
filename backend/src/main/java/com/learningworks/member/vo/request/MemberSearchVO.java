package com.learningworks.member.vo.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.learningworks.common.vo.PaginationVO;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberSearchVO extends PaginationVO {

  private String roleId;
  private String keyword;

  /** 요청자 ID (본인 제외용). 서비스에서 채우며, 요청 파라미터로 보낸 값은 덮어쓴다. */
  @JsonIgnore
  private String actorId;
  /** 이 값보다 ROLE_RANK가 큰 역할만 조회 (RoleAssignPolicy.findManageableRankBoundary). 서비스에서 채운다. */
  @JsonIgnore
  private Integer actorRankBoundary;
}
