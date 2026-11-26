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
import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.vo.response.AttendanceSummaryVO;
import com.learningworks.course.vo.response.CourseVO;
import com.learningworks.course.vo.response.StudentAttendanceVO;

/** 출석 요약 (CourseServiceImpl.readAttendanceSummary)의 결석 환산 값 */
class CourseServiceImplAttendanceTest {

  private static final String COURSE_ID = "C1";
  private static final String STUDENT_ID = "S1";

  private CourseDao courseDao;
  private final AccessChecker accessChecker = Mockito.mock(AccessChecker.class);
  private CourseServiceImpl service;

  @BeforeEach
  void setUp() {
    this.courseDao = Mockito.mock(CourseDao.class);
    this.service = new CourseServiceImpl(this.courseDao, new CourseAccessChecker(this.courseDao, this.accessChecker));

    // 수강생 S1으로 로그인, C1의 수강생 (관리자 · 강사 아님)
    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(STUDENT_ID, null, List.of()));
    Mockito.when(this.courseDao.readOneCourse(COURSE_ID)).thenReturn(new CourseVO());
    Mockito.when(this.courseDao.readUserBaseRole(STUDENT_ID)).thenReturn("ROLE_STUDENT");
    CourseAccessTestSupport.stubAllCourse(this.accessChecker, STUDENT_ID, "ROLE_STUDENT");
    Mockito.when(this.courseDao.countCourseStudentOrTutor(COURSE_ID, STUDENT_ID)).thenReturn(1);
    Mockito.when(this.courseDao.countCourseTutor(COURSE_ID, STUDENT_ID)).thenReturn(0);
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  private void givenClassDays(int total, int passed) {
    AttendanceSummaryVO days = new AttendanceSummaryVO();
    days.setTotalClassDays(total);
    days.setPassedClassDays(passed);
    Mockito.when(this.courseDao.readCourseClassDays(COURSE_ID)).thenReturn(days);
  }

  private void givenCounts(int present, int late, int absent) {
    StudentAttendanceVO student = new StudentAttendanceVO();
    student.setUserId(STUDENT_ID);
    student.setPresentCount(present);
    student.setLateCount(late);
    student.setAbsentCount(absent);
    Mockito.when(this.courseDao.readStudentAttendanceCounts(COURSE_ID, STUDENT_ID))
        .thenReturn(List.of(student));
  }

  private StudentAttendanceVO readMe() {
    List<StudentAttendanceVO> students = this.service.readAttendanceSummary(COURSE_ID).getStudents();
    Assertions.assertThat(students).hasSize(1);
    return students.get(0);
  }

  @Test
  @DisplayName("기록 없는 날 · 지각 3번을 결석으로 세서 최종 결석 · 출석 인정일을 채운다")
  void fillsAbsentCounts() {
    givenClassDays(20, 10);
    givenCounts(4, 4, 1); // 기록 9일, 기록 없는 날 1일

    StudentAttendanceVO me = readMe();

    Assertions.assertThat(me.getNoRecordCount()).isEqualTo(1);
    Assertions.assertThat(me.getLateAbsentCount()).isEqualTo(1); // floor(4 / 3)
    Assertions.assertThat(me.getTotalAbsentCount()).isEqualTo(3); // N 1 + 기록 없음 1 + 지각 환산 1
    Assertions.assertThat(me.getAttendedDays()).isEqualTo(7);
    Assertions.assertThat(me.getAttendanceRate()).isEqualTo(35.0); // 7 / 전체 20
    Assertions.assertThat(me.isWarning()).isTrue(); // 7 / 진행 10 = 70% < 80%
    // 원래 기록 수는 그대로
    Assertions.assertThat(me.getAbsentCount()).isEqualTo(1);
    Assertions.assertThat(me.getLateCount()).isEqualTo(4);
  }

  @Test
  @DisplayName("출석 버튼을 한 번도 누르지 않았으면 진행된 수업일이 모두 결석")
  void noRecordsAreAbsent() {
    givenClassDays(13, 10);
    givenCounts(0, 0, 0);

    StudentAttendanceVO me = readMe();

    Assertions.assertThat(me.getNoRecordCount()).isEqualTo(10);
    Assertions.assertThat(me.getTotalAbsentCount()).isEqualTo(10);
    Assertions.assertThat(me.getAttendedDays()).isZero();
    Assertions.assertThat(me.getAttendanceRate()).isZero();
    Assertions.assertThat(me.isWarning()).isTrue();
  }

  @Test
  @DisplayName("지각 2번은 결석으로 바꾸지 않는다")
  void twoLatesAreNotAbsent() {
    givenClassDays(10, 5);
    givenCounts(3, 2, 0);

    StudentAttendanceVO me = readMe();

    Assertions.assertThat(me.getLateAbsentCount()).isZero();
    Assertions.assertThat(me.getTotalAbsentCount()).isZero();
    Assertions.assertThat(me.getAttendedDays()).isEqualTo(5);
    Assertions.assertThat(me.isWarning()).isFalse();
  }

  @Test
  @DisplayName("기록이 진행된 수업일보다 많아도(주말 기록 등) 기록 없는 날은 0, 출석 인정일은 0 이상")
  void recordsMoreThanPassedDays() {
    givenClassDays(10, 3);
    givenCounts(5, 0, 0);

    StudentAttendanceVO me = readMe();

    Assertions.assertThat(me.getNoRecordCount()).isZero();
    Assertions.assertThat(me.getTotalAbsentCount()).isZero();
    Assertions.assertThat(me.getAttendedDays()).isEqualTo(3);
  }

  @Test
  @DisplayName("진행된 수업일이 0이면 결석 · 출석 인정일 모두 0, 경고 없음")
  void noPassedDays() {
    givenClassDays(10, 0);
    givenCounts(0, 0, 0);

    StudentAttendanceVO me = readMe();

    Assertions.assertThat(me.getNoRecordCount()).isZero();
    Assertions.assertThat(me.getTotalAbsentCount()).isZero();
    Assertions.assertThat(me.getAttendedDays()).isZero();
    Assertions.assertThat(me.isWarning()).isFalse();
  }
}
