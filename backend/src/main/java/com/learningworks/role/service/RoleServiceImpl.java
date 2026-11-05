package com.learningworks.role.service;

import java.util.Set;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.role.dao.RoleDao;
import com.learningworks.role.vo.request.ModifyRoleVO;
import com.learningworks.role.vo.request.RegistRoleVO;
import com.learningworks.role.vo.response.RoleListVO;
import com.learningworks.role.vo.response.RoleVO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@AllArgsConstructor
@Service
public class RoleServiceImpl implements RoleService {

  /** 최고 권한 */
  private static final String SUPER_ADMIN_ROLE = "ROLE_SUPER_ADMIN";
  /** 가장 낮은 기본 권한 */
  private static final String DEFAULT_ROLE = "ROLE_STUDENT";
  /** 삭제할 수 없는 시스템 역할 */
  private static final Set<String> PROTECTED_ROLES = Set.of(SUPER_ADMIN_ROLE, DEFAULT_ROLE);

  RoleDao roleDao;

  @Override
  public RoleListVO readRoleList() {

    RoleListVO result = new RoleListVO();
    result.setRoleCount(this.roleDao.selectRoleCount());
    result.setRoleList(this.roleDao.selectAllRoles());

    return result;
  }

  @Override
  public RoleVO createRole(RegistRoleVO registRoleVO) {
    int insertedRow;
    try {
      insertedRow = this.roleDao.insertNewRole(registRoleVO);
    } catch (DuplicateKeyException dke) {
      // ROLE_ID(PK) 중복 - Oracle ORA-00001을 Spring이 DuplicateKeyException으로 변환해준다.
      throw new LearningworksException(ErrorCode.ROLE_ID_USED, dke);
    }
    if (insertedRow == 0) {
      throw new LearningworksException(ErrorCode.ROLE_FAILURE_CREATE);
    }
    RoleVO result = this.roleDao.selectRoleByRoleId(registRoleVO.getRoleId());

    return result;
  }

  @Override
  public RoleVO updateRole(String roleId, ModifyRoleVO modifyRoleVO) {
    int updatedRow = this.roleDao.updateRole(roleId, modifyRoleVO);

    // PK 조건 UPDATE가 0건 = 해당 roleId가 존재하지 않음 (DB 에러가 아니라 정상 실행 결과)
    if (updatedRow == 0) {
      throw new LearningworksException(ErrorCode.ROLE_NOT_EXISTS);
    }

    RoleVO result = this.roleDao.selectRoleByRoleId(roleId);

    return result;
  }

  /**
   * 역할 물리 삭제.
   * - 보호 역할(최고 권한, 기본 권한)은 삭제 불가
   * - 활성 회원이 사용 중이면 삭제 불가 (RESTRICT) → 관리자가 회원 역할을 먼저 변경해야 한다.
   * - ROLE_ACTION, MENU_ROLE의 해당 역할 행은 함께 삭제 (CASCADE)
   * - 탈퇴 회원의 BASE_ROLE은 기본 권한으로 변경 (삭제된 역할 ID가 남지 않도록)
   *
   * FK가 없으므로 참조 데이터 정리를 빠뜨리면, 같은 ID로 역할을 재생성했을 때
   * 이전 권한/메뉴/회원이 그대로 연결되는 문제가 생긴다. 반드시 한 트랜잭션에서 처리할 것.
   */
  @Transactional(rollbackFor = Exception.class)
  @Override
  public RoleVO deleteRole(String roleId) {
    if (PROTECTED_ROLES.contains(roleId)) {
      throw new LearningworksException(ErrorCode.ROLE_PROTECTED);
    }

    RoleVO role = this.roleDao.selectRoleByRoleId(roleId);
    if (role == null) {
      throw new LearningworksException(ErrorCode.ROLE_NOT_EXISTS);
    }

    if (this.roleDao.selectActiveUserCountByRoleId(roleId) > 0) {
      throw new LearningworksException(ErrorCode.ROLE_IN_USE);
    }

    this.roleDao.updateDeletedUserBaseRole(roleId, DEFAULT_ROLE);
    this.roleDao.deleteRoleActionByRoleId(roleId);
    this.roleDao.deleteMenuRoleByRoleId(roleId);

    // 조회와 삭제 사이에 다른 요청이 먼저 삭제한 경우
    if (this.roleDao.deleteRole(roleId) == 0) {
      throw new LearningworksException(ErrorCode.ROLE_NOT_EXISTS);
    }

    return role;
  }

}
