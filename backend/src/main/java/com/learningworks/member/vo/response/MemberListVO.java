package com.learningworks.member.vo.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberListVO {

  private String id;
  private String name;
  private String baseRole;
  private String roleName; // ROLE 조인
  private String createDate;
  private String loginBlockDate;
}
