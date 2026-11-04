package com.learningworks.role.service;

import com.learningworks.role.vo.request.RegistRoleVO;
import com.learningworks.role.vo.response.RoleListVO;
import com.learningworks.role.vo.response.RoleVO;

public interface RoleService {

  RoleListVO readRoleList();

  RoleVO createRole(RegistRoleVO registRoleVO);

}
