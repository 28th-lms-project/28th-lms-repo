package com.learningworks.role.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import com.learningworks.role.vo.request.RegistRoleVO;
import com.learningworks.role.vo.response.RoleVO;

@Mapper
public interface RoleDao {

  long selectRoleCount();

  List<RoleVO> selectAllRoles();

  int insertNewRole(RegistRoleVO registRoleVO);

  RoleVO selectRoleByRoleId(String roleId);

}
