package com.learningworks.common.action;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import com.learningworks.common.action.dao.ActionCodeDao;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.role.RoleConstants;
import lombok.RequiredArgsConstructor;

/**
 * ROLE_ACTION 기반 권한 검사.
 *
 * - 요청자의 역할은 JWT가 아니라 항상 DB의 현재 BASE_ROLE 기준으로 판단한다 (RoleAssignPolicy와 같은 기준).
 * - ROLE_SUPER_ADMIN은 모든 권한 코드를 허용한다.
 * - 역할별 허용 권한 코드 목록은 캐시한다. 권한이 바뀌는 곳에서 반드시 evict를 호출할 것.
 *   - 역할 권한 저장(/access-role/save): evictRole(roleId) - AccessRoleServiceImpl.saveRolePermission
 *   - 역할 삭제(DELETE /roles/{roleId}): evictRole(roleId) - RoleServiceImpl.deleteRole
 *   - ACTION 수정(/access/save)은 ACTION_CODE를 바꾸지 않으므로 호출하지 않는다.
 *     ACTION 삭제나 ACTION_CODE 변경 기능이 생기면 그때 evictAll()을 호출할 것.
 *   트랜잭션 안에서 호출하면 커밋 후에 비운다.
 * - 캐시는 서버 메모리에 있으므로 서버가 여러 대이면 다른 서버의 캐시는 비워지지 않는다.
 */
@Component
@RequiredArgsConstructor
public class AccessChecker {

  private final ActionCodeDao actionCodeDao;

  /** key: 역할 ID, value: 허용된 권한 코드 */
  private final Map<String, Set<String>> allowedActionCodes = new ConcurrentHashMap<>();

  /** evict할 때마다 증가. 조회 중에 evict가 일어나면 조회 결과(이전 데이터)를 캐시에 넣지 않기 위해 사용 */
  private long cacheVersion = 0;

  /**
   * userId가 actionCode 권한을 가졌는지 검사한다.
   *
   * @param userId 요청자 ID. 비로그인이면 null
   * @param actionCode 권한 코드 (예: ROLE_DELETE)
   * @throws LearningworksException 비로그인 GLOBAL_UNAUTHORIZED(401), 권한 없음 GLOBAL_FORBIDDEN(403)
   */
  public void checkAction(String userId, String actionCode) {
    String roleId = this.findRoleId(userId);
    if (!this.can(roleId, actionCode)) {
      throw new LearningworksException(ErrorCode.GLOBAL_FORBIDDEN);
    }
  }

  /**
   * userId가 ROLE_SUPER_ADMIN인지 검사한다.
   *
   * @throws LearningworksException 비로그인 GLOBAL_UNAUTHORIZED(401), SUPER_ADMIN이 아님 GLOBAL_FORBIDDEN(403)
   */
  public void checkSuperAdmin(String userId) {
    String roleId = this.findRoleId(userId);
    if (!RoleConstants.SUPER_ADMIN_ROLE.equals(roleId)) {
      throw new LearningworksException(ErrorCode.GLOBAL_FORBIDDEN);
    }
  }

  /** roleId 역할에 actionCode 권한이 허용되어 있는지 */
  public boolean can(String roleId, String actionCode) {
    if (RoleConstants.SUPER_ADMIN_ROLE.equals(roleId)) {
      return true;
    }
    return this.findAllowedActionCodes(roleId).contains(actionCode);
  }

  /**
   * roleId 역할에 허용된 권한 코드 목록 (캐시 사용, 수정 불가).
   * SUPER_ADMIN은 ROLE_ACTION과 관계없이 모든 권한이 허용되므로, 호출하는 쪽에서 따로 처리할 것.
   */
  public Set<String> getAllowedActionCodes(String roleId) {
    return this.findAllowedActionCodes(roleId);
  }

  /** 해당 역할의 캐시를 비운다. 트랜잭션 안이면 커밋 후에 비운다. */
  public void evictRole(String roleId) {
    this.afterCommit(() -> this.evict(roleId));
  }

  /** 모든 역할의 캐시를 비운다. 트랜잭션 안이면 커밋 후에 비운다. */
  public void evictAll() {
    this.afterCommit(() -> this.evict(null));
  }

  /** 요청자의 현재 역할(DB 기준). 비로그인이면 401, 회원이 없거나 탈퇴했으면 403 */
  private String findRoleId(String userId) {
    if (userId == null) {
      throw new LearningworksException(ErrorCode.GLOBAL_UNAUTHORIZED);
    }
    String roleId = this.actionCodeDao.selectBaseRoleByUserId(userId);
    if (roleId == null) {
      throw new LearningworksException(ErrorCode.GLOBAL_FORBIDDEN);
    }
    return roleId;
  }

  private Set<String> findAllowedActionCodes(String roleId) {
    Set<String> cached = this.allowedActionCodes.get(roleId);
    if (cached != null) {
      return cached;
    }

    long version;
    synchronized (this) {
      version = this.cacheVersion;
    }

    Set<String> loaded = Set.copyOf(this.actionCodeDao.selectAllowedActionCodesByRoleId(roleId));

    synchronized (this) {
      if (version == this.cacheVersion) {
        this.allowedActionCodes.put(roleId, loaded);
      }
    }
    return loaded;
  }

  /** roleId가 null이면 전체 */
  private synchronized void evict(String roleId) {
    this.cacheVersion++;
    if (roleId == null) {
      this.allowedActionCodes.clear();
    } else {
      this.allowedActionCodes.remove(roleId);
    }
  }

  private void afterCommit(Runnable task) {
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override
        public void afterCommit() {
          task.run();
        }
      });
      return;
    }
    task.run();
  }

}
