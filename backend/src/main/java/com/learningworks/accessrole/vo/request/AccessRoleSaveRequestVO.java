package com.learningworks.accessrole.vo.request;

import com.learningworks.role.RoleConstants;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AccessRoleSaveRequestVO {

    @NotBlank(message = "역할ID를 입력해주세요.")
    @Pattern(regexp = RoleConstants.ROLE_ID_PATTERN_ALLOW_EMPTY,
            message = "역할ID 형식이 올바르지 않습니다.")
    private String roleId;

    // 빈 배열은 허용 (= 모든 권한 해제)
    @NotNull(message = "접근 권한 목록을 입력해주세요.")
    private List<@NotBlank(message = "접근 권한 ID를 입력해주세요.") String> actionIds;
}
