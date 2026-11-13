package com.learningworks.member.vo.request;

import com.learningworks.common.vo.PaginationVO;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberSearchVO extends PaginationVO {

  private String roleId;
  private String keyword;
}
