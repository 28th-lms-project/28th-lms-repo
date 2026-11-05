package com.learningworks.role.service;

import com.learningworks.role.vo.request.ModifyRoleVO;
import com.learningworks.role.vo.request.RegistRoleVO;
import com.learningworks.role.vo.response.RoleListVO;
import com.learningworks.role.vo.response.RoleVO;

public interface RoleService {

  RoleListVO readRoleList();

  RoleVO createRole(RegistRoleVO registRoleVO);

  RoleVO updateRole(String roleId, ModifyRoleVO modifyRoleVO);

  RoleVO deleteRole(String roleId);

}
