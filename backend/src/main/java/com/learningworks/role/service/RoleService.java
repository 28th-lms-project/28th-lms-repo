package com.learningworks.role.service;

import java.util.List;
import com.learningworks.role.vo.request.ModifyRoleOrderVO;
import com.learningworks.role.vo.request.ModifyRoleVO;
import com.learningworks.role.vo.request.MoveRoleUserVO;
import com.learningworks.role.vo.request.RegistRoleVO;
import com.learningworks.role.vo.response.RoleListVO;
import com.learningworks.role.vo.response.RoleUserMoveResultVO;
import com.learningworks.role.vo.response.RoleUserVO;
import com.learningworks.role.vo.response.RoleVO;

public interface RoleService {

  RoleListVO readRoleList();

  RoleVO createRole(RegistRoleVO registRoleVO);

  RoleVO updateRole(String roleId, ModifyRoleVO modifyRoleVO);

  RoleListVO updateRoleOrder(ModifyRoleOrderVO modifyRoleOrderVO);

  RoleVO deleteRole(String roleId);

  List<RoleUserVO> readRoleUsers(String roleId);

  RoleUserMoveResultVO moveRoleUsers(String actorId, String roleId, MoveRoleUserVO moveRoleUserVO);

}
