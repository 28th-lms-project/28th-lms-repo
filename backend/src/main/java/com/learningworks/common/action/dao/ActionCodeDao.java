package com.learningworks.common.action.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import com.learningworks.common.action.vo.response.MyActionCodeVO;

@Mapper
public interface ActionCodeDao {

  /** 활성(DEL_YN = 'N') 회원의 현재 역할(BASE_ROLE). 회원이 없거나 탈퇴했으면 null */
  String selectBaseRoleByUserId(String userId);

  /** 활성 회원의 현재 역할 ID와 표시명 (roleId, roleDisplayName만 채움). 회원이 없거나 탈퇴했으면 null */
  MyActionCodeVO selectMyRoleByUserId(String userId);

  /** 역할에 허용(ROLE_ACTION)된 권한 코드 목록. ACTION_CODE가 비어 있는 ACTION은 제외 */
  List<String> selectAllowedActionCodesByRoleId(String roleId);

  /** ACTION에 이미 등록된 권한 코드 목록 */
  List<String> selectRegisteredActionCodes();

}
