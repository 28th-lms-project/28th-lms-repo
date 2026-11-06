package com.learningworks.role.vo.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ModifyRoleVO {

  /** ROLE.ROLE_DISPLAY_NAME - VARCHAR2(100 CHAR) */
  @NotBlank(message = "역할 이름을 입력해주세요.")
  @Size(max = 100, message = "역할 이름은 100자 이하로 입력해주세요.")
  private String roleDisplayName;

}
