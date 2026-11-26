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
import com.learningworks.common.action.AccessChecker;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.vo.response.CourseVO;
import com.learningworks.course.vo.response.TodayAttendanceSummaryVO;

/** 과정의 오늘 출석 현황 (CourseServiceImpl.readTodayAttendance) */
class CourseServiceImplTodayAttendanceTest {

  private static final String COURSE_ID = "C1";

  private CourseDao courseDao;
  private final AccessChecker accessChecker = Mockito.mock(AccessChecker.class);
  private CourseServiceImpl service;

  @BeforeEach
  void setUp() {
    this.courseDao = Mockito.mock(CourseDao.class);
    this.service = new CourseServiceImpl(this.courseDao, new CourseAccessChecker(this.courseDao, this.accessChecker));
    Mockito.when(this.courseDao.readOneCourse(COURSE_ID)).thenReturn(new CourseVO());
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  private void loginAsTutor() {
    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated("T1", null, List.of()));
    Mockito.when(this.courseDao.readUserBaseRole("T1")).thenReturn("ROLE_TUTOR");
    CourseAccessTestSupport.stubAllCourse(this.accessChecker, "T1", "ROLE_TUTOR");
    Mockito.when(this.courseDao.countCourseStudentOrTutor(COURSE_ID, "T1")).thenReturn(1);
    Mockito.when(this.courseDao.countCourseTutor(COURSE_ID, "T1")).thenReturn(1);
  }

  private static TodayAttendanceSummaryVO counts(int students, int y, int l, int n) {
    TodayAttendanceSummaryVO vo = new TodayAttendanceSummaryVO();
    vo.setStudentCount(students);
    vo.setPresentCount(y);
    vo.setLateCount(l);
    vo.setAbsentCount(n);
    return vo;
  }

  @Test
  @DisplayName("강사: 수업일 여부와 아직 안 누른 수강생 수를 채운다")
  void tutor() {
    loginAsTutor();
    Mockito.when(this.courseDao.readTodayAttendanceCounts(COURSE_ID)).thenReturn(counts(20, 15, 2, 1));
    Mockito.when(this.courseDao.countTodayClassDay(COURSE_ID)).thenReturn(1);

    TodayAttendanceSummaryVO result = this.service.readTodayAttendance(COURSE_ID);

    Assertions.assertThat(result.isClassDay()).isTrue();
    Assertions.assertThat(result.getNotCheckedCount()).isEqualTo(2);
  }

  @Test
  @DisplayName("오늘 시간표가 없으면 classDay false")
  void notClassDay() {
    loginAsTutor();
    Mockito.when(this.courseDao.readTodayAttendanceCounts(COURSE_ID)).thenReturn(counts(20, 0, 0, 0));
    Mockito.when(this.courseDao.countTodayClassDay(COURSE_ID)).thenReturn(0);

    TodayAttendanceSummaryVO result = this.service.readTodayAttendance(COURSE_ID);

    Assertions.assertThat(result.isClassDay()).isFalse();
    Assertions.assertThat(result.getNotCheckedCount()).isEqualTo(20);
  }

  @Test
  @DisplayName("이 과정의 수강생이면 다른 수강생 현황을 주지 않고 403")
  void studentForbidden() {
    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated("S1", null, List.of()));
    Mockito.when(this.courseDao.readUserBaseRole("S1")).thenReturn("ROLE_STUDENT");
    CourseAccessTestSupport.stubAllCourse(this.accessChecker, "S1", "ROLE_STUDENT");
    Mockito.when(this.courseDao.countCourseStudentOrTutor(COURSE_ID, "S1")).thenReturn(1);
    Mockito.when(this.courseDao.countCourseTutor(COURSE_ID, "S1")).thenReturn(0);

    Assertions.assertThatThrownBy(() -> this.service.readTodayAttendance(COURSE_ID))
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.COURSE_NOT_AUTHORIZED);
    Mockito.verify(this.courseDao, Mockito.never()).readTodayAttendanceCounts(Mockito.anyString());
  }
}
