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
import com.learningworks.course.vo.request.RegistCourseVO;
import com.learningworks.course.vo.request.RegistHomeworkVO;
import com.learningworks.course.vo.response.CourseVO;

/** 과정 (CourseServiceImpl): 과제 관리 · 학생 추가는 이 과정의 강사 또는 관리자, 강사 · 수강생 동시 등록 금지 */
class CourseServiceImplCourseAccessTest {

  private static final String COURSE_ID = "C1";

  private CourseDao courseDao;
  private CourseServiceImpl service;

  @BeforeEach
  void setUp() {
    this.courseDao = Mockito.mock(CourseDao.class);
    this.service = new CourseServiceImpl(this.courseDao);
    Mockito.when(this.courseDao.readOneCourse(Mockito.anyString())).thenReturn(new CourseVO());
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

  private static void assertError(Runnable call, ErrorCode errorCode) {
    Assertions.assertThatThrownBy(call::run)
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(errorCode);
  }

  @Test
  @DisplayName("이 과정의 수강생은 (강사 역할이어도) 과제 등록 · 수정 · 삭제 403")
  void studentCannotManageHomework() {
    login("T9", false, true, "ROLE_TUTOR");

    assertError(() -> this.service.addHomework(COURSE_ID, new RegistHomeworkVO()),
        ErrorCode.COURSE_NOT_AUTHORIZED);
    assertError(() -> this.service.deleteHomework(COURSE_ID, "H1"), ErrorCode.COURSE_NOT_AUTHORIZED);
    Mockito.verify(this.courseDao, Mockito.never()).addHomework(Mockito.any());
    Mockito.verify(this.courseDao, Mockito.never()).deleteHomework(Mockito.any(), Mockito.any());
  }

  @Test
  @DisplayName("다른 과정의 강사는 학생 추가 403")
  void otherTutorCannotAddStudents() {
    login("T2", false, false, "ROLE_TUTOR");

    assertError(() -> this.service.addCourseMember(COURSE_ID, List.of("S1")),
        ErrorCode.COURSE_NOT_AUTHORIZED);
    Mockito.verify(this.courseDao, Mockito.never()).addStudent(Mockito.any());
  }

  @Test
  @DisplayName("이 과정의 강사를 수강생으로 추가하면 거부 (COURSE_TUTOR_STUDENT_CONFLICT)")
  void tutorCannotBeStudentOfSameCourse() {
    login("T1", true, false, "ROLE_TUTOR");
    Mockito.when(this.courseDao.countCourseTutor(COURSE_ID, "T5")).thenReturn(1);

    assertError(() -> this.service.addCourseMember(COURSE_ID, List.of("T5")),
        ErrorCode.COURSE_TUTOR_STUDENT_CONFLICT);
    Mockito.verify(this.courseDao, Mockito.never()).addStudent(Mockito.any());
  }

  @Test
  @DisplayName("과정 등록 때 강사를 수강생 목록에도 넣으면 거부")
  void addCourseConflict() {
    login("A1", false, false, "ROLE_ADMIN");
    Mockito.when(this.courseDao.addCourse(Mockito.any())).thenReturn(1);
    Mockito.when(this.courseDao.addtutor(Mockito.any())).thenReturn(1);
    RegistCourseVO course = new RegistCourseVO();
    course.setId(COURSE_ID);
    course.setTutorId("T1");
    course.setStudentId(List.of("S1", "T1"));

    assertError(() -> this.service.addCourse(course), ErrorCode.COURSE_TUTOR_STUDENT_CONFLICT);
    Mockito.verify(this.courseDao, Mockito.never()).addStudent(Mockito.any());
  }
}
