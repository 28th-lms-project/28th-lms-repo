package com.learningworks.role.vo.request;

import com.learningworks.role.RoleConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegistRoleVO {

  /**
   * ROLE.ROLE_ID - VARCHAR2(20 CHAR), PK
   * 규칙: 'ROLE_' 접두어 필수, 대문자(A-Z)·숫자(0-9)만 사용, 단어 구분은 언더스코어(_)
   * 예> ROLE_ADMIN, ROLE_SUPER_ADMIN
   *
   * 정규식의 "^$|" 는 빈 문자열일 때 @NotBlank 메시지만 내려가도록(중복 메시지 방지) 하기 위함.
   */
  @NotBlank(message = "역할ID를 입력해주세요.")
  @Size(max = 20, message = "역할ID는 20자 이하로 입력해주세요.")
  @Pattern(regexp = RoleConstants.ROLE_ID_PATTERN_ALLOW_EMPTY,
      message = "역할ID는 'ROLE_'로 시작하고, 대문자·숫자와 단어 구분용 언더스코어(_)만 사용할 수 있습니다. (예: ROLE_SUPER_ADMIN)")
  private String roleId;

  /** ROLE.ROLE_DISPLAY_NAME - VARCHAR2(100 CHAR) */
  @NotBlank(message = "역할 이름을 입력해주세요.")
  @Size(max = 100, message = "역할 이름은 100자 이하로 입력해주세요.")
  private String roleDisplayName;

}
