package com.learningworks.role.vo.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegistRoleVO {

  @NotBlank(message = "역할ID를 입력해주세요.")
  private String roleId;
  @NotBlank(message = "역할 이름을 입력해주세요.")
  private String roleDisplayName;
  private String parentRoleId;

}
