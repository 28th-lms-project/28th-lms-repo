package com.learningworks.role.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.learningworks.role.vo.request.ModifyRoleVO;
import com.learningworks.role.vo.request.RegistRoleVO;
import com.learningworks.role.vo.response.RoleVO;

@Mapper
public interface RoleDao {

  long selectRoleCount();

  List<RoleVO> selectAllRoles();

  int insertNewRole(RegistRoleVO registRoleVO);

  RoleVO selectRoleByRoleId(String roleId);

  int updateRoleDisplayName(@Param("roleId") String roleId,
      @Param("modifyRoleVO") ModifyRoleVO modifyRoleVO);

}
