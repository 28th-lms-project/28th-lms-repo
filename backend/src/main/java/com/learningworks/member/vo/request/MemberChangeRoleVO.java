package com.learningworks.member.vo.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberChangeRoleVO {
  @NotBlank(message = "변경할 역할을 선택해주세요.")
  private String roleId;
}
