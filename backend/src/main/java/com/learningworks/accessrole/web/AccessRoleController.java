package com.learningworks.accessrole.web;

import com.learningworks.accessrole.service.AccessRoleService;
import com.learningworks.accessrole.vo.request.AccessRoleSaveRequestVO;
import com.learningworks.accessrole.vo.response.AccessRolePermissionVO;
import com.learningworks.common.action.RequireAction;
import com.learningworks.common.action.RequireSuperAdmin;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.role.RoleConstants;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

// 역할 목록은 ROLE 모듈의 GET /roles 사용
@RestController
@RequiredArgsConstructor
@RequestMapping("/access-role")
public class AccessRoleController {

    private final AccessRoleService accessRoleService;

    @RequireAction(domain = "ACCESS_ROLE", action = "READ_ALLOWED", description = "권한별 허용된 접근 권한 조회")
    @GetMapping("/allowed")
    public ApiResponse<List<AccessRolePermissionVO>> getAllowedPermissionList(
            @Pattern(regexp = RoleConstants.ROLE_ID_PATTERN,
                    message = "역할ID 형식이 올바르지 않습니다.")
            @RequestParam String roleId
    ) {
        return ApiResponse.OK(
                accessRoleService.getAllowedPermissionList(roleId)
        );
    }

    @RequireAction(domain = "ACCESS_ROLE", action = "READ_DENIED", description = "권한별 미허용된 접근 권한 조회")
    @GetMapping("/denied")
    public ApiResponse<List<AccessRolePermissionVO>> getDeniedPermissionList(
            @Pattern(regexp = RoleConstants.ROLE_ID_PATTERN,
                    message = "역할ID 형식이 올바르지 않습니다.")
            @RequestParam String roleId
    ) {
        return ApiResponse.OK(
                accessRoleService.getDeniedPermissionList(roleId)
        );
    }

    @RequireSuperAdmin
    @PostMapping("/save")
    public ApiResponse<List<AccessRolePermissionVO>> saveRolePermission(
            @Valid @RequestBody AccessRoleSaveRequestVO request
    ) {
        accessRoleService.saveRolePermission(request);

        return ApiResponse.OK(
                accessRoleService.getAllowedPermissionList(request.getRoleId())
        );
    }
}
