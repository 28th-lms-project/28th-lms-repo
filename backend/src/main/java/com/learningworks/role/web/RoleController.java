package com.learningworks.role.web;

import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.role.RoleConstants;
import com.learningworks.role.service.RoleService;
import com.learningworks.role.vo.request.ModifyRoleOrderVO;
import com.learningworks.role.vo.request.ModifyRoleVO;
import com.learningworks.role.vo.request.MoveRoleUserVO;
import com.learningworks.role.vo.request.MoveRoleUserVO;
import com.learningworks.role.vo.request.RegistRoleVO;
import com.learningworks.role.vo.response.RoleListVO;
import com.learningworks.role.vo.response.RoleUserMoveResultVO;
import com.learningworks.role.vo.response.RoleUserVO;
import com.learningworks.role.vo.response.RoleVO;
import com.learningworks.security.auth.LoginUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@AllArgsConstructor
@RestController
@RequestMapping("/roles")
public class RoleController {

  private RoleService roleService;

  // @PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN')")
  @GetMapping
  public ApiResponse<RoleListVO> getRoles() {
    RoleListVO roleListVO = this.roleService.readRoleList();

    return ApiResponse.OK(roleListVO);
  }

  // TODO @PreAuthorize - ROLE_SUPER_ADMIN 전용
  @PostMapping
  public ApiResponse<RoleVO> createRole(@Valid @RequestBody RegistRoleVO registRoleVO) {
    RoleVO result = this.roleService.createRole(registRoleVO);

    return ApiResponse.CREATED(result);
  }

  // TODO @PreAuthorize - ROLE_SUPER_ADMIN 전용 (순위가 권한 판단 기준이므로 반드시 제한할 것)
  @PutMapping("/order")
  public ApiResponse<RoleListVO> modifyRoleOrder(
      @Valid @RequestBody ModifyRoleOrderVO modifyRoleOrderVO) {
    RoleListVO result = this.roleService.updateRoleOrder(modifyRoleOrderVO);

    return ApiResponse.OK(result);
  }

  // TODO @PreAuthorize - ROLE_SUPER_ADMIN 전용
  @PutMapping("/{roleId}")
  public ApiResponse<RoleVO> modifyRole(
      @Pattern(regexp = RoleConstants.ROLE_ID_PATTERN,
          message = "잘못된 요청입니다.") @PathVariable String roleId,
      @Valid @RequestBody ModifyRoleVO modifyRoleVO) {
    RoleVO result = this.roleService.updateRole(roleId, modifyRoleVO);

    return ApiResponse.OK(result);
  }

  // TODO @PreAuthorize - ROLE_SUPER_ADMIN 전용
  @DeleteMapping("/{roleId}")
  public ApiResponse<RoleVO> deleteRole(
      @Pattern(regexp = RoleConstants.ROLE_ID_PATTERN,
          message = "잘못된 요청입니다.") @PathVariable String roleId) {
    RoleVO result = this.roleService.deleteRole(roleId);

    return ApiResponse.OK(result);
  }

}
