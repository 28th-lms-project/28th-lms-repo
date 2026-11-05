package com.learningworks.role.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.role.service.RoleService;
import com.learningworks.role.vo.request.ModifyRoleVO;
import com.learningworks.role.vo.request.RegistRoleVO;
import com.learningworks.role.vo.response.RoleListVO;
import com.learningworks.role.vo.response.RoleVO;
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

  @PostMapping
  public ApiResponse<RoleVO> createRole(@Valid @RequestBody RegistRoleVO registRoleVO) {
    RoleVO result = this.roleService.createRole(registRoleVO);

    return ApiResponse.CREATED(result);
  }

  @PutMapping("/{roleId}")
  public ApiResponse<RoleVO> modifyRoleDisplayName(
      @Pattern(regexp = "^$|^ROLE_[A-Z0-9]+(_[A-Z0-9]+)*$",
          message = "잘못된 요청입니다.") @PathVariable String roleId,
      @Valid @RequestBody ModifyRoleVO modifyRoleVO) {
    RoleVO result = this.roleService.updateRole(roleId, modifyRoleVO);

    return ApiResponse.OK(result);
  }



}
