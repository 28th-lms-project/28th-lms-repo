package com.learningworks.member.vo.response;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberVO {

  private String id;

  @JsonIgnore
  private String password;
  private String name;
  private String githubUrl;
  private String createDate;
  private String modifyDate;
  private String pwdChangeDate;
  private int loginFailCount;
  private String baseRole;
  private String delYn;
  private LocalDateTime loginBlockDate;

}
