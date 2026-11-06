package com.learningworks.role.vo.request;

import com.learningworks.role.RoleConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 역할 사용 회원 일괄 이동 요청.
 * 예> PUT /roles/ROLE_TUTOR/users  { "replaceRoleId": "ROLE_STUDENT" }
 */
@Data
public class MoveRoleUserVO {

  @NotBlank(message = "이동할 역할ID를 입력해주세요.")
  @Pattern(regexp = RoleConstants.ROLE_ID_PATTERN_ALLOW_EMPTY,
      message = "역할ID 형식이 올바르지 않습니다.")
  private String replaceRoleId;

}
