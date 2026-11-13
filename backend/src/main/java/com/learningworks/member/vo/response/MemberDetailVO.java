package com.learningworks.member.vo.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberDetailVO {
  private String id;
  private String name;
  private String baseRole;
  private String roleName;
  private String githubUrl;
  private String createDate;
  private String modifyDate;
  private String pwdChangeDate;
  private int loginFailCount;
  private String loginBlockDate;
}
