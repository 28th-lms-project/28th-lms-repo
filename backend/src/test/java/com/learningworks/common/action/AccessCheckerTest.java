package com.learningworks.common.action;

import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;

class AccessCheckerTest {

  private FakeActionCodeDao dao;
  private AccessChecker accessChecker;

  @BeforeEach
  void setUp() {
    this.dao = new FakeActionCodeDao();
    this.dao.baseRoles.put("super", "ROLE_SUPER_ADMIN");
    this.dao.baseRoles.put("tutor", "ROLE_TUTOR");
    this.dao.baseRoles.put("student", "ROLE_STUDENT");
    this.dao.allowedActionCodes.put("ROLE_TUTOR", List.of("ASSIGNMENT_CREATE", "ASSIGNMENT_READ"));
    this.dao.allowedActionCodes.put("ROLE_STUDENT", List.of("ASSIGNMENT_READ"));
    this.accessChecker = new AccessChecker(this.dao);
  }

  private static ErrorCode errorCodeOf(Runnable runnable) {
    try {
      runnable.run();
    } catch (LearningworksException lwe) {
      return lwe.getErrorCode();
    }
    return null;
  }

  @Test
  @DisplayName("ROLE_ACTION에 허용된 권한 코드만 통과한다")
  void checksAllowedActionCode() {
    this.accessChecker.checkAction("tutor", "ASSIGNMENT_CREATE");
    this.accessChecker.checkAction("student", "ASSIGNMENT_READ");

    Assertions
        .assertThat(AccessCheckerTest
            .errorCodeOf(() -> this.accessChecker.checkAction("student", "ASSIGNMENT_CREATE")))
        .isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);
  }

  @Test
  @DisplayName("SUPER_ADMIN은 ROLE_ACTION과 관계없이 모든 권한 코드를 통과한다")
  void superAdminAlwaysAllowed() {
    this.accessChecker.checkAction("super", "ANYTHING_DELETE");
    this.accessChecker.checkSuperAdmin("super");

    Assertions.assertThat(this.dao.allowedQueryCount).isZero();
  }

  @Test
  @DisplayName("비로그인은 401, 회원이 없거나 탈퇴했으면 403")
  void unauthenticatedOrUnknownUser() {
    Assertions
        .assertThat(
            AccessCheckerTest.errorCodeOf(() -> this.accessChecker.checkAction(null, "ROLE_READ")))
        .isEqualTo(ErrorCode.GLOBAL_UNAUTHORIZED);
    Assertions
        .assertThat(AccessCheckerTest.errorCodeOf(() -> this.accessChecker.checkSuperAdmin(null)))
        .isEqualTo(ErrorCode.GLOBAL_UNAUTHORIZED);
    Assertions
        .assertThat(
            AccessCheckerTest.errorCodeOf(() -> this.accessChecker.checkAction("ghost", "ROLE_READ")))
        .isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);
  }

  @Test
  @DisplayName("SUPER_ADMIN 전용은 다른 역할이면 권한 코드가 있어도 403")
  void superAdminOnly() {
    Assertions
        .assertThat(AccessCheckerTest.errorCodeOf(() -> this.accessChecker.checkSuperAdmin("tutor")))
        .isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);
  }

  @Test
  @DisplayName("역할별 허용 권한 코드는 캐시하고, evictRole 후 다시 조회한다")
  void cachesAndEvictsRole() {
    this.accessChecker.checkAction("tutor", "ASSIGNMENT_READ");
    this.accessChecker.checkAction("tutor", "ASSIGNMENT_CREATE");
    Assertions.assertThat(this.dao.allowedQueryCount).isEqualTo(1);

    // 권한 해제 → evict 전에는 캐시된 값 사용
    this.dao.allowedActionCodes.put("ROLE_TUTOR", List.of("ASSIGNMENT_READ"));
    this.accessChecker.checkAction("tutor", "ASSIGNMENT_CREATE");

    this.accessChecker.evictRole("ROLE_TUTOR");
    Assertions
        .assertThat(AccessCheckerTest
            .errorCodeOf(() -> this.accessChecker.checkAction("tutor", "ASSIGNMENT_CREATE")))
        .isEqualTo(ErrorCode.GLOBAL_FORBIDDEN);
    Assertions.assertThat(this.dao.allowedQueryCount).isEqualTo(2);
  }

  @Test
  @DisplayName("evictAll은 모든 역할의 캐시를 비운다")
  void evictsAll() {
    this.accessChecker.checkAction("tutor", "ASSIGNMENT_READ");
    this.accessChecker.checkAction("student", "ASSIGNMENT_READ");
    Assertions.assertThat(this.dao.allowedQueryCount).isEqualTo(2);

    this.accessChecker.evictAll();
    this.accessChecker.checkAction("tutor", "ASSIGNMENT_READ");
    this.accessChecker.checkAction("student", "ASSIGNMENT_READ");
    Assertions.assertThat(this.dao.allowedQueryCount).isEqualTo(4);
  }

  @Test
  @DisplayName("트랜잭션 안에서 evict하면 커밋 후에 비운다")
  void evictsAfterCommit() {
    this.accessChecker.checkAction("tutor", "ASSIGNMENT_READ");

    TransactionSynchronizationManager.initSynchronization();
    try {
      this.accessChecker.evictRole("ROLE_TUTOR");

      // 아직 커밋 전: 캐시 유지
      this.accessChecker.checkAction("tutor", "ASSIGNMENT_READ");
      Assertions.assertThat(this.dao.allowedQueryCount).isEqualTo(1);

      // 커밋
      TransactionSynchronizationManager.getSynchronizations()
          .forEach(TransactionSynchronization::afterCommit);
    } finally {
      TransactionSynchronizationManager.clearSynchronization();
    }

    this.accessChecker.checkAction("tutor", "ASSIGNMENT_READ");
    Assertions.assertThat(this.dao.allowedQueryCount).isEqualTo(2);
  }

}
