package com.learningworks.role.web;

import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.common.action.RequireAction;
import com.learningworks.common.action.RequireSuperAdmin;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.role.RoleConstants;
import com.learningworks.role.service.RoleService;
import com.learningworks.role.vo.request.ModifyRoleOrderVO;
import com.learningworks.role.vo.request.ModifyRoleVO;
import com.learningworks.role.vo.request.MoveRoleUserVO;
import com.learningworks.role.vo.request.RegistRoleVO;
import com.learningworks.role.vo.response.RoleListVO;
import com.learningworks.role.vo.response.RoleUserMoveResultVO;
import com.learningworks.role.vo.response.RoleUserVO;
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

  @RequireAction(domain = "ROLE", action = "READ", description = "역할 목록 조회")
  @GetMapping
  public ApiResponse<RoleListVO> getRoles() {
    RoleListVO roleListVO = this.roleService.readRoleList();

    return ApiResponse.OK(roleListVO);
  }

  @RequireSuperAdmin
  @PostMapping
  public ApiResponse<RoleVO> createRole(@Valid @RequestBody RegistRoleVO registRoleVO) {
    RoleVO result = this.roleService.createRole(registRoleVO);

    return ApiResponse.CREATED(result);
  }

  // 순위가 권한 판단 기준이므로 반드시 SUPER_ADMIN으로 제한할 것
  @RequireSuperAdmin
  @PutMapping("/order")
  public ApiResponse<RoleListVO> modifyRoleOrder(
      @Valid @RequestBody ModifyRoleOrderVO modifyRoleOrderVO) {
    RoleListVO result = this.roleService.updateRoleOrder(modifyRoleOrderVO);

    return ApiResponse.OK(result);
  }

  @RequireSuperAdmin
  @PutMapping("/{roleId}")
  public ApiResponse<RoleVO> modifyRole(
      @Pattern(regexp = RoleConstants.ROLE_ID_PATTERN,
          message = "잘못된 요청입니다.") @PathVariable String roleId,
      @Valid @RequestBody ModifyRoleVO modifyRoleVO) {
    RoleVO result = this.roleService.updateRole(roleId, modifyRoleVO);

    return ApiResponse.OK(result);
  }

  @RequireSuperAdmin
  @DeleteMapping("/{roleId}")
  public ApiResponse<RoleVO> deleteRole(
      @Pattern(regexp = RoleConstants.ROLE_ID_PATTERN,
          message = "잘못된 요청입니다.") @PathVariable String roleId) {
    RoleVO result = this.roleService.deleteRole(roleId);

    return ApiResponse.OK(result);
  }

  @RequireAction(domain = "ROLE", action = "USER_READ", description = "역할 사용 회원 조회")
  @GetMapping("/{roleId}/users")
  public ApiResponse<List<RoleUserVO>> getRoleUsers(
      @Pattern(regexp = RoleConstants.ROLE_ID_PATTERN,
          message = "잘못된 요청입니다.") @PathVariable String roleId) {
    List<RoleUserVO> result = this.roleService.readRoleUsers(roleId);

    return ApiResponse.OK(result);
  }

  /**
   * 권한 코드 ROLE_USER_MOVE가 있어도, 자기보다 아래 순위 역할 사이의 이동만 가능하다 (RoleAssignPolicy).
   * 권한 검사가 꺼져 있을 때도 비로그인이면 RoleAssignPolicy에서 401.
   */
  @RequireAction(domain = "ROLE", action = "USER_MOVE", description = "역할 사용 회원 이동")
  @PutMapping("/{roleId}/users")
  public ApiResponse<RoleUserMoveResultVO> moveRoleUsers(
      // JWT 인증 필터가 principal에 회원 ID(String)를 넣으므로 LoginUser가 아닌 Authentication으로 받는다.
      // 비로그인(익명)이면 null
      Authentication authentication,
      @Pattern(regexp = RoleConstants.ROLE_ID_PATTERN,
          message = "잘못된 요청입니다.") @PathVariable String roleId,
      @Valid @RequestBody MoveRoleUserVO moveRoleUserVO) {
    String actorId = authentication == null ? null : authentication.getName();
    RoleUserMoveResultVO result =
        this.roleService.moveRoleUsers(actorId, roleId, moveRoleUserVO);

    return ApiResponse.OK(result);
  }

}
