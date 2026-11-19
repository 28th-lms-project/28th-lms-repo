package com.learningworks.course.service;

import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.service.CourseAccessChecker.Relation;

/** 과정 단위 권한 확인 (CourseAccessChecker) */
class CourseAccessCheckerTest {

  private static final String COURSE_ID = "C1";

  private CourseDao courseDao;
  private CourseAccessChecker checker;

  @BeforeEach
  void setUp() {
    this.courseDao = Mockito.mock(CourseDao.class);
    this.checker = new CourseAccessChecker(this.courseDao);
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  private void login(String userId, boolean tutor, boolean student, String baseRole) {
    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(userId, null, List.of()));
    Mockito.when(this.courseDao.countCourseTutor(COURSE_ID, userId)).thenReturn(tutor ? 1 : 0);
    Mockito.when(this.courseDao.countCourseStudentOrTutor(COURSE_ID, userId))
        .thenReturn((tutor ? 1 : 0) + (student ? 1 : 0));
    Mockito.when(this.courseDao.readUserBaseRole(userId)).thenReturn(baseRole);
  }

  private static void assertForbidden(Runnable call) {
    Assertions.assertThatThrownBy(call::run)
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.COURSE_NOT_AUTHORIZED);
  }

  @Test
  @DisplayName("관계: 강사 → 관리자 → 수강생 순, 아무것도 아니면 403")
  void relation() {
    login("T1", true, false, "ROLE_TUTOR");
    Assertions.assertThat(this.checker.relationOf(COURSE_ID)).isEqualTo(Relation.TUTOR);

    login("A1", false, false, "ROLE_ADMIN");
    Assertions.assertThat(this.checker.relationOf(COURSE_ID)).isEqualTo(Relation.ADMIN);

    login("S1", false, true, "ROLE_STUDENT");
    Assertions.assertThat(this.checker.relationOf(COURSE_ID)).isEqualTo(Relation.STUDENT);

    login("X1", false, false, "ROLE_TUTOR");
    assertForbidden(() -> this.checker.relationOf(COURSE_ID));
  }

  @Test
  @DisplayName("강사 역할이어도 이 과정의 수강생이면 강사 기능은 403 (역할이 아니라 과정 관계로 판단)")
  void tutorRoleStudentOfCourse() {
    login("T2", false, true, "ROLE_TUTOR");

    assertForbidden(() -> this.checker.requireTutorOrAdmin(COURSE_ID));
    this.checker.requireStudent(COURSE_ID); // 수강생 기능은 된다
  }

  @Test
  @DisplayName("수강생 기능: 관리자 · 이 과정 강사라도 수강생으로 등록돼 있지 않으면 403")
  void studentOnly() {
    login("A1", false, false, "ROLE_ADMIN");
    assertForbidden(() -> this.checker.requireStudent(COURSE_ID));

    login("T1", true, false, "ROLE_TUTOR");
    assertForbidden(() -> this.checker.requireStudent(COURSE_ID));
  }

  @Test
  @DisplayName("강사이면서 수강생이면 강사로 본다")
  void tutorAndStudent() {
    login("B1", true, true, "ROLE_TUTOR");

    Assertions.assertThat(this.checker.relationOf(COURSE_ID)).isEqualTo(Relation.TUTOR);
    Assertions.assertThat(this.checker.isStudent(COURSE_ID, "B1")).isTrue();
  }
}
