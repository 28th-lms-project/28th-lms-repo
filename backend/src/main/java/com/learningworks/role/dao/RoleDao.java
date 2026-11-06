package com.learningworks.role.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.learningworks.role.vo.request.ModifyRoleVO;
import com.learningworks.role.vo.request.RegistRoleVO;
import com.learningworks.role.vo.response.RoleRankVO;
import com.learningworks.role.vo.response.RoleUserVO;
import com.learningworks.role.vo.response.RoleVO;

@Mapper
public interface RoleDao {

  /** 전체 역할 목록 (상위 역할부터) */
  List<RoleVO> selectAllRoles();

  int insertNewRole(@Param("registRoleVO") RegistRoleVO registRoleVO,
      @Param("roleRank") int roleRank);

  RoleVO selectRoleByRoleId(String roleId);

  int updateRole(@Param("roleId") String roleId,
      @Param("modifyRoleVO") ModifyRoleVO modifyRoleVO);

  /** 역할의 순위. 역할이 없으면 null */
  Integer selectRankByRoleId(String roleId);

  int updateRankByRoleId(@Param("roleId") String roleId, @Param("roleRank") int roleRank);

  /** roleIds의 순서대로 ROLE_RANK를 1부터 다시 매긴다. */
  int updateRoleRanks(@Param("roleIds") List<String> roleIds);

  /** 활성 회원의 현재 역할과 순위. 회원이 없거나 탈퇴했으면 null */
  RoleRankVO selectRoleRankByUserId(String userId);

  /** 해당 역할을 BASE_ROLE로 가진 활성(DEL_YN = 'N') 회원 수 */
  long selectActiveUserCountByRoleId(String roleId);

  /** 해당 역할을 BASE_ROLE로 가진 활성(DEL_YN = 'N') 회원 목록 */
  List<RoleUserVO> selectActiveUsersByRoleId(String roleId);

  /** 활성 회원의 BASE_ROLE을 fromRoleId → toRoleId로 일괄 변경. excludeUserId(요청자 본인)는 제외 */
  int updateActiveUserBaseRole(@Param("fromRoleId") String fromRoleId,
      @Param("toRoleId") String toRoleId,
      @Param("excludeUserId") String excludeUserId);

  /** 탈퇴(DEL_YN = 'Y') 회원 중 해당 역할을 가진 회원의 BASE_ROLE을 대체 역할로 변경 */
  int updateDeletedUserBaseRole(@Param("roleId") String roleId,
      @Param("replaceRoleId") String replaceRoleId);

  int deleteRoleActionByRoleId(String roleId);

  int deleteMenuRoleByRoleId(String roleId);

  int deleteRole(String roleId);

}
