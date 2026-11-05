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

  int updateRole(@Param("roleId") String roleId,
      @Param("modifyRoleVO") ModifyRoleVO modifyRoleVO);

  /** 해당 역할을 BASE_ROLE로 가진 활성(DEL_YN = 'N') 회원 수 */
  long selectActiveUserCountByRoleId(String roleId);

  /** 탈퇴(DEL_YN = 'Y') 회원 중 해당 역할을 가진 회원의 BASE_ROLE을 대체 역할로 변경 */
  int updateDeletedUserBaseRole(@Param("roleId") String roleId,
      @Param("replaceRoleId") String replaceRoleId);

  int deleteRoleActionByRoleId(String roleId);

  int deleteMenuRoleByRoleId(String roleId);

  int deleteRole(String roleId);

}
