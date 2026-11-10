package com.learningworks.role.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.learningworks.common.action.AccessChecker;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.role.RoleConstants;
import com.learningworks.role.dao.RoleDao;
import com.learningworks.role.vo.request.ModifyRoleOrderVO;
import com.learningworks.role.vo.request.ModifyRoleVO;
import com.learningworks.role.vo.request.MoveRoleUserVO;
import com.learningworks.role.vo.request.RegistRoleVO;
import com.learningworks.role.vo.response.RoleListVO;
import com.learningworks.role.vo.response.RoleUserMoveResultVO;
import com.learningworks.role.vo.response.RoleUserVO;
import com.learningworks.role.vo.response.RoleVO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@AllArgsConstructor
@Service
public class RoleServiceImpl implements RoleService {

  RoleDao roleDao;

  RoleAssignPolicy roleAssignPolicy;

  AccessChecker accessChecker;

  @Override
  public RoleListVO readRoleList() {
    List<RoleVO> roleList = this.roleDao.selectAllRoles();

    RoleListVO result = new RoleListVO();
    result.setRoleList(roleList);
    result.setRoleCount(roleList.size());

    return result;
  }

  /**
   * 역할 생성. 새 역할은 기본 권한(ROLE_STUDENT) 바로 위 순위에 추가된다.
   */
  @Transactional(rollbackFor = Exception.class)
  @Override
  public RoleVO createRole(RegistRoleVO registRoleVO) {
    Integer defaultRoleRank = this.roleDao.selectRankByRoleId(RoleConstants.DEFAULT_ROLE);
    if (defaultRoleRank == null) {
      log.error("기본 권한({})이 ROLE 테이블에 없습니다.", RoleConstants.DEFAULT_ROLE);
      throw new LearningworksException(ErrorCode.ROLE_FAILURE_CREATE);
    }

    // 새 역할이 기본 권한의 현재 순위를 차지하고, 기본 권한은 한 칸 아래로 이동
    int insertedRow;
    try {
      insertedRow = this.roleDao.insertNewRole(registRoleVO, defaultRoleRank);
    } catch (DuplicateKeyException dke) {
      // ROLE_ID(PK) 중복 - Oracle ORA-00001을 Spring이 DuplicateKeyException으로 변환해준다.
      throw new LearningworksException(ErrorCode.ROLE_ID_USED, dke);
    }
    if (insertedRow == 0) {
      throw new LearningworksException(ErrorCode.ROLE_FAILURE_CREATE);
    }
    this.roleDao.updateRankByRoleId(RoleConstants.DEFAULT_ROLE, defaultRoleRank + 1);

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
   * 역할 순서 변경 (드래그&드롭). 전달받은 순서대로 ROLE_RANK를 1부터 다시 매긴다.
   * - 전체 역할이 빠짐없이, 중복 없이 들어와야 한다. (그 사이 다른 관리자가 추가/삭제했으면 409)
   * - 최고 권한은 맨 위, 기본 권한은 맨 아래 고정
   */
  @Transactional(rollbackFor = Exception.class)
  @Override
  public RoleListVO updateRoleOrder(ModifyRoleOrderVO modifyRoleOrderVO) {
    List<String> roleIds = modifyRoleOrderVO.getRoleIds();

    Set<String> requestRoleIds = new HashSet<>(roleIds);
    if (requestRoleIds.size() != roleIds.size()) {
      throw new LearningworksException(ErrorCode.GLOBAL_BAD_REQUEST); // 중복된 역할 ID
    }

    Set<String> currentRoleIds = this.roleDao.selectAllRoles().stream()
        .map(RoleVO::getRoleId)
        .collect(Collectors.toSet());
    if (!currentRoleIds.equals(requestRoleIds)) {
      throw new LearningworksException(ErrorCode.ROLE_ORDER_OUTDATED);
    }

    if (!RoleConstants.SUPER_ADMIN_ROLE.equals(roleIds.getFirst())
        || !RoleConstants.DEFAULT_ROLE.equals(roleIds.getLast())) {
      throw new LearningworksException(ErrorCode.ROLE_ORDER_INVALID);
    }

    this.roleDao.updateRoleRanks(roleIds);

    return this.readRoleList();
  }

  /**
   * 역할 물리 삭제.
   * - 보호 역할(최고 권한, 기본 권한)은 삭제 불가
   * - 활성 회원이 사용 중이면 삭제 불가 (RESTRICT) → 관리자가 회원 역할을 먼저 변경해야 한다.
   * - ROLE_ACTION, MENU_ROLE의 해당 역할 행은 함께 삭제 (CASCADE)
   * - 탈퇴 회원의 BASE_ROLE은 기본 권한으로 변경 (삭제된 역할 ID가 남지 않도록)
   * - 삭제 후 순위 번호가 비어도(1, 2, 4) 정렬에는 영향 없음. 다음 순서 변경 시 다시 1부터 매겨진다.
   *
   * FK가 없으므로 참조 데이터 정리를 빠뜨리면, 같은 ID로 역할을 재생성했을 때
   * 이전 권한/메뉴/회원이 그대로 연결되는 문제가 생긴다. 반드시 한 트랜잭션에서 처리할 것.
   */
  @Transactional(rollbackFor = Exception.class)
  @Override
  public RoleVO deleteRole(String roleId) {
    if (RoleConstants.PROTECTED_ROLES.contains(roleId)) {
      throw new LearningworksException(ErrorCode.ROLE_PROTECTED);
    }

    RoleVO role = this.roleDao.selectRoleByRoleId(roleId);
    if (role == null) {
      throw new LearningworksException(ErrorCode.ROLE_NOT_EXISTS);
    }

    if (this.roleDao.selectActiveUserCountByRoleId(roleId) > 0) {
      throw new LearningworksException(ErrorCode.ROLE_IN_USE);
    }

    this.roleDao.updateDeletedUserBaseRole(roleId, RoleConstants.DEFAULT_ROLE);
    this.roleDao.deleteRoleActionByRoleId(roleId);
    this.roleDao.deleteMenuRoleByRoleId(roleId);

    // 조회와 삭제 사이에 다른 요청이 먼저 삭제한 경우
    if (this.roleDao.deleteRole(roleId) == 0) {
      throw new LearningworksException(ErrorCode.ROLE_NOT_EXISTS);
    }

    // 삭제된 역할의 권한 캐시 정리 (커밋 후 실행)
    this.accessChecker.evictRole(roleId);

    return role;
  }

  @Override
  public List<RoleUserVO> readRoleUsers(String roleId) {
    if (this.roleDao.selectRankByRoleId(roleId) == null) {
      throw new LearningworksException(ErrorCode.ROLE_NOT_EXISTS);
    }
    return this.roleDao.selectActiveUsersByRoleId(roleId);
  }

  /**
   * 역할 사용 회원 일괄 이동. 역할 삭제 전, 사용 중인 회원을 다른 역할로 옮길 때 사용한다.
   * 요청자 본인은 이동 대상에서 제외된다.
   */
  @Transactional(rollbackFor = Exception.class)
  @Override
  public RoleUserMoveResultVO moveRoleUsers(String actorId, String roleId,
      MoveRoleUserVO moveRoleUserVO) {
    String replaceRoleId = moveRoleUserVO.getReplaceRoleId();

    this.roleAssignPolicy.checkMovable(actorId, roleId, replaceRoleId);

    int movedCount = this.roleDao.updateActiveUserBaseRole(roleId, replaceRoleId, actorId);

    return new RoleUserMoveResultVO(roleId, replaceRoleId, movedCount);
  }

}
