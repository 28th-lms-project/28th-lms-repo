package com.learningworks.role.vo.request;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

/**
 * 역할 순서 변경 요청.
 * 드래그&드롭 결과의 "전체 역할 ID"를 상위 역할부터 순서대로 담는다.
 * 예> { "roleIds": ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_TUTOR", "ROLE_STUDENT"] }
 */
@Data
public class ModifyRoleOrderVO {

  @NotEmpty(message = "역할 순서를 입력해주세요.")
  private List<@NotBlank(message = "역할ID를 입력해주세요.") String> roleIds;

}
