package com.learningworks.dashboard.service;

import java.util.ArrayList;
import java.util.List;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import com.learningworks.common.action.ActionCodeRegistry;
import com.learningworks.common.action.ActionDefinition;
import com.learningworks.common.action.UnusedActionCodeReporter;
import com.learningworks.common.action.dao.ActionCodeDao;
import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.vo.response.AttendanceSummaryVO;
import com.learningworks.course.vo.response.StudentAttendanceVO;
import com.learningworks.dashboard.dao.DashboardDao;
import com.learningworks.dashboard.vo.response.AdminCourseVO;
import com.learningworks.dashboard.vo.response.AdminDashboardVO;
import com.learningworks.dashboard.vo.response.SystemCheckVO;

/** 관리자 대시보드 계산 (DashboardServiceImpl) */
class DashboardServiceImplTest {

  private DashboardDao dashboardDao;
  private CourseDao courseDao;
  private ActionCodeRegistry registry;
  private ActionCodeDao actionCodeDao;
  private UnusedActionCodeReporter reporter;
  private DashboardServiceImpl service;

  @BeforeEach
  void setUp() {
    this.dashboardDao = Mockito.mock(DashboardDao.class);
    this.courseDao = Mockito.mock(CourseDao.class);
    this.registry = Mockito.mock(ActionCodeRegistry.class);
    this.actionCodeDao = Mockito.mock(ActionCodeDao.class);
    this.reporter = Mockito.mock(UnusedActionCodeReporter.class);
    this.service = new DashboardServiceImpl(this.dashboardDao, this.courseDao, this.registry,
        this.actionCodeDao, this.reporter);
    Mockito.when(this.dashboardDao.selectCourseCounts()).thenReturn(new AdminDashboardVO());
  }

  private static AdminCourseVO course(String id, int pendingAnswers) {
    AdminCourseVO course = new AdminCourseVO();
    course.setId(id);
    course.setPendingAnswers(pendingAnswers);
    return course;
  }

  /** 진행 10일, 수강생별 (출석 기록 Y, 지각 L) → 출석 인정일 = Y + L - floor(L / 3) (기록 없는 날 = 결석) */
  private void givenAttendance(String courseId, int total, int passed, int[]... presentAndLate) {
    AttendanceSummaryVO days = new AttendanceSummaryVO();
    days.setTotalClassDays(total);
    days.setPassedClassDays(passed);
    Mockito.when(this.courseDao.readCourseClassDays(courseId)).thenReturn(days);
    List<StudentAttendanceVO> students = new ArrayList<>();
    for (int[] counts : presentAndLate) {
      StudentAttendanceVO student = new StudentAttendanceVO();
      student.setPresentCount(counts[0]);
      student.setLateCount(counts[1]);
      students.add(student);
    }
    Mockito.when(this.courseDao.readStudentAttendanceCounts(courseId, null)).thenReturn(students);
  }

  @Test
  @DisplayName("진행 중 과정별 지금까지 출석률 · 주의 학생 · 채점 대기를 계산하고 전체 합계를 낸다")
  void adminDashboard() {
    Mockito.when(this.dashboardDao.selectActiveCourses())
        .thenReturn(List.of(course("C1", 3), course("C2", 2)));
    // C1: 진행 10일. 학생 A 10일 출석(100%), 학생 B 7일 출석(70% → 주의)
    givenAttendance("C1", 20, 10, new int[] {10, 0}, new int[] {7, 0});
    // C2: 진행 0일 (시간표가 아직 시작 전) → 출석률 계산 대상 아님
    givenAttendance("C2", 5, 0, new int[] {0, 0});

    AdminDashboardVO result = this.service.readAdminDashboard();

    AdminCourseVO c1 = result.getCourses().get(0);
    Assertions.assertThat(c1.getAverageRateSoFar()).isEqualTo(85.0);
    Assertions.assertThat(c1.getWarningCount()).isEqualTo(1);
    Assertions.assertThat(c1.getProgressRate()).isEqualTo(50.0);
    Assertions.assertThat(result.getCourses().get(1).getAverageRateSoFar()).isNull();

    Assertions.assertThat(result.getAverageRateSoFar()).isEqualTo(85.0);
    Assertions.assertThat(result.getWarningStudentCount()).isEqualTo(1);
    Assertions.assertThat(result.getPendingAnswerCount()).isEqualTo(5);
  }

  @Test
  @DisplayName("시스템 점검: 코드에 있지만 ACTION 에 없는 권한 코드를 미등록으로 보여 준다")
  void systemCheck() {
    Mockito.when(this.registry.getDefinitions()).thenReturn(List.of(
        new ActionDefinition("COURSE", "READ", "COURSE_READ", "강의 조회", "CourseController#view"),
        new ActionDefinition("COURSE", "DELETE", "COURSE_DELETE", "강의 삭제", "CourseController#delete")));
    Mockito.when(this.actionCodeDao.selectRegisteredActionCodes()).thenReturn(List.of("COURSE_READ", "OLD_CODE"));
    Mockito.when(this.reporter.findUnusedActionCodes()).thenReturn(List.of("OLD_CODE"));
    Mockito.when(this.dashboardDao.selectUngrantedActionCodes()).thenReturn(List.of("OLD_CODE"));

    SystemCheckVO result = this.service.readSystemCheck();

    Assertions.assertThat(result.getUnregisteredCodes())
        .extracting(SystemCheckVO.UnregisteredActionCodeVO::getActionCode)
        .containsExactly("COURSE_DELETE");
    Assertions.assertThat(result.getUnusedCodes()).containsExactly("OLD_CODE");
    Assertions.assertThat(result.getUngrantedCodes()).containsExactly("OLD_CODE");
  }
}
