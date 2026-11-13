package com.learningworks.role.service;

import org.springframework.stereotype.Component;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.role.RoleConstants;
import com.learningworks.role.dao.RoleDao;
import com.learningworks.role.vo.response.RoleRankVO;
import lombok.RequiredArgsConstructor;

/**
 * "관리자는 자기보다 아래 역할만 회원에게 지정할 수 있다" 규칙.
 *
 * - 순위는 ROLE.ROLE_RANK (작을수록 상위)
 * - 요청자의 순위는 JWT가 아니라 항상 DB의 현재 BASE_ROLE 기준으로 판단한다.
 * - ROLE_SUPER_ADMIN은 순위 제한이 없다. 단, 자기 자신의 역할은 누구도 변경할 수 없다.
 *
 * 회원 역할을 변경하는 모든 기능(개별 변경, 일괄 이동, 관리자 회원 등록)에서 이 클래스를 호출할 것.
 */
@Component
@RequiredArgsConstructor
public class RoleAssignPolicy {

  private final RoleDao roleDao;

  /**
   * actorId가 newRoleId 역할로 신규 회원을 등록할 수 있는지 검사한다. 불가하면 예외.
   *
   * - ROLE_SUPER_ADMIN 역할로는 누구도 등록할 수 없다.
   * - SUPER_ADMIN은 그 외 모든 역할로 등록할 수 있다.
   * - 그 외 요청자는 자기보다 낮은 역할로만 등록할 수 있다.
   *
   * @param actorId 요청자(로그인 사용자) ID. 비로그인이면 null
   * @param newRoleId 등록할 회원의 역할 ID
   */
  public void checkCreatable(String actorId, String newRoleId) {
    RoleRankVO actor = this.findActor(actorId);
    int newRoleRank = this.findRoleRank(newRoleId);

    if (RoleConstants.SUPER_ADMIN_ROLE.equals(newRoleId)) {
      throw new LearningworksException(ErrorCode.ROLE_ASSIGN_FORBIDDEN);
    }
    if (this.isSuperAdmin(actor)) {
      return;
    }
    if (newRoleRank <= actor.getRoleRank()) {
      throw new LearningworksException(ErrorCode.ROLE_ASSIGN_FORBIDDEN);
    }
  }

  /**
   * actorId가 targetUserId의 역할을 newRoleId로 변경할 수 있는지 검사한다. 불가하면 예외.
   *
   * @param actorId 요청자(로그인 사용자) ID. 비로그인이면 null
   * @param targetUserId 역할을 변경할 회원 ID
   * @param newRoleId 지정할 역할 ID
   */
  public void checkAssignable(String actorId, String targetUserId, String newRoleId) {
    RoleRankVO actor = this.findActor(actorId);
    if (actorId.equals(targetUserId)) {
      throw new LearningworksException(ErrorCode.ROLE_SELF_CHANGE);
    }

    int newRoleRank = this.findRoleRank(newRoleId);

    RoleRankVO target = this.roleDao.selectRoleRankByUserId(targetUserId);
    if (target == null) {
      throw new LearningworksException(ErrorCode.USER_NOT_EXISTS);
    }

    if (this.isSuperAdmin(actor)) {
      return;
    }
    if (target.getRoleRank() <= actor.getRoleRank()) {
      throw new LearningworksException(ErrorCode.ROLE_TARGET_FORBIDDEN);
    }
    if (newRoleRank <= actor.getRoleRank()) {
      throw new LearningworksException(ErrorCode.ROLE_ASSIGN_FORBIDDEN);
    }
  }

  /**
   * actorId가 targetUserId 회원을 관리(수정, 삭제, 비밀번호 초기화 등)할 수 있는지 검사한다. 불가하면 예외.
   *
   * - 자기 자신은 이 경로로 관리할 수 없다. (내 정보 수정은 /members/me 사용)
   * - SUPER_ADMIN은 자신을 제외한 모든 회원을 관리할 수 있다.
   * - 그 외 요청자는 자기보다 낮은 역할의 회원만 관리할 수 있다.
   *
   * @param actorId 요청자(로그인 사용자) ID. 비로그인이면 null
   * @param targetUserId 관리할 회원 ID
   */
  public void checkManageable(String actorId, String targetUserId) {
    RoleRankVO actor = this.findActor(actorId);
    if (actorId.equals(targetUserId)) {
      throw new LearningworksException(ErrorCode.ROLE_SELF_CHANGE);
    }

    RoleRankVO target = this.findTarget(targetUserId);

    if (this.isSuperAdmin(actor)) {
      return;
    }
    if (target.getRoleRank() <= actor.getRoleRank()) {
      throw new LearningworksException(ErrorCode.ROLE_TARGET_FORBIDDEN);
    }
  }

  /**
   * actorId가 fromRoleId 역할의 회원들을 toRoleId로 일괄 이동할 수 있는지 검사한다. 불가하면 예외. 요청자 본인은 이동 대상에서 제외해야
   * 한다(updateActiveUserBaseRole의 excludeUserId).
   *
   * ROLE_SUPER_ADMIN으로는 누구도(SUPER_ADMIN 포함) 일괄 이동할 수 없다. 일괄 이동은 역할 삭제 전 정리용이며, 최고 권한이 실수로 여러 명에게
   * 부여되는 것을 막기 위함.
   *
   * @param actorId 요청자(로그인 사용자) ID. 비로그인이면 null
   * @param fromRoleId 현재 역할 ID
   * @param toRoleId 이동할 역할 ID
   */
  public void checkMovable(String actorId, String fromRoleId, String toRoleId) {
    RoleRankVO actor = this.findActor(actorId);

    if (fromRoleId.equals(toRoleId)) {
      throw new LearningworksException(ErrorCode.ROLE_MOVE_SAME);
    }
    if (RoleConstants.SUPER_ADMIN_ROLE.equals(toRoleId)) {
      throw new LearningworksException(ErrorCode.ROLE_MOVE_TO_SUPER_ADMIN);
    }

    int fromRoleRank = this.findRoleRank(fromRoleId);
    int toRoleRank = this.findRoleRank(toRoleId);

    if (this.isSuperAdmin(actor)) {
      return;
    }
    if (fromRoleRank <= actor.getRoleRank()) {
      throw new LearningworksException(ErrorCode.ROLE_TARGET_FORBIDDEN);
    }
    if (toRoleRank <= actor.getRoleRank()) {
      throw new LearningworksException(ErrorCode.ROLE_ASSIGN_FORBIDDEN);
    }
  }

  /** 요청자의 현재 역할(DB 기준). 비로그인이면 401, 회원/역할이 없으면 403 */
  private RoleRankVO findActor(String actorId) {
    if (actorId == null) {
      throw new LearningworksException(ErrorCode.GLOBAL_UNAUTHORIZED);
    }
    RoleRankVO actor = this.roleDao.selectRoleRankByUserId(actorId);
    if (actor == null) {
      throw new LearningworksException(ErrorCode.GLOBAL_FORBIDDEN);
    }
    return actor;
  }

  private int findRoleRank(String roleId) {
    Integer roleRank = this.roleDao.selectRankByRoleId(roleId);
    if (roleRank == null) {
      throw new LearningworksException(ErrorCode.ROLE_NOT_EXISTS);
    }
    return roleRank;
  }

  private boolean isSuperAdmin(RoleRankVO actor) {
    return RoleConstants.SUPER_ADMIN_ROLE.equals(actor.getRoleId());
  }

  /** 대상 회원의 현재 역할. 없거나 삭제된 회원이면 404 */
  private RoleRankVO findTarget(String targetUserId) {
    RoleRankVO target = this.roleDao.selectRoleRankByUserId(targetUserId);
    if (target == null) {
      throw new LearningworksException(ErrorCode.USER_NOT_EXISTS);
    }
    return target;
  }

}
