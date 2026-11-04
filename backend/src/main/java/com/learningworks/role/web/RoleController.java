package com.learningworks.role.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.role.service.RoleService;
import com.learningworks.role.vo.response.RoleListVO;
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


}
