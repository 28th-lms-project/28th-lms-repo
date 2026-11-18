package com.learningworks.attendance.service;

import java.time.LocalDate;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import com.learningworks.attendance.dao.AttendanceDao;
import com.learningworks.attendance.vo.response.AttendanceVO;
import com.learningworks.attendance.vo.response.TodayAttendanceVO;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;

/** 오늘 내 출결 (AttendanceServiceImpl.readTodayAttendance) */
class AttendanceServiceImplTodayTest {

  private static final String COURSE_ID = "C1";
  private static final String STUDENT_ID = "S1";

  private AttendanceDao attendanceDao;
  private AttendanceServiceImpl service;

  @BeforeEach
  void setUp() {
    this.attendanceDao = Mockito.mock(AttendanceDao.class);
    this.service = new AttendanceServiceImpl(this.attendanceDao, "09:10", "13:00");
  }

  private void givenStudent() {
    Mockito.when(this.attendanceDao.selectCourseStudentId(COURSE_ID, STUDENT_ID)).thenReturn("CS1");
  }

  @Test
  @DisplayName("이 과정의 수강생이 아니면 403 COURSE_NOT_AUTHORIZED, 출결은 조회하지 않음")
  void notStudent() {
    Mockito.when(this.attendanceDao.selectCourseStudentId(COURSE_ID, STUDENT_ID)).thenReturn(null);

    Assertions.assertThatThrownBy(() -> this.service.readTodayAttendance(STUDENT_ID, COURSE_ID))
        .isInstanceOf(LearningworksException.class)
        .extracting("errorCode")
        .isEqualTo(ErrorCode.COURSE_NOT_AUTHORIZED);
    Mockito.verify(this.attendanceDao, Mockito.never())
        .selectTodayAttendance(Mockito.anyString(), Mockito.anyString());
  }

  @Test
  @DisplayName("수업일인데 아직 안 눌렀으면 classDay true, attendStatus null, 출석 · 지각 기준 시각 포함")
  void classDayNotChecked() {
    givenStudent();
    Mockito.when(this.attendanceDao.selectTodayClassDayCount(COURSE_ID)).thenReturn(1);
    Mockito.when(this.attendanceDao.selectTodayAttendance(COURSE_ID, STUDENT_ID)).thenReturn(null);

    TodayAttendanceVO result = this.service.readTodayAttendance(STUDENT_ID, COURSE_ID);

    Assertions.assertThat(result.isClassDay()).isTrue();
    Assertions.assertThat(result.getAttendStatus()).isNull();
    Assertions.assertThat(result.getLgnDt()).isNull();
    Assertions.assertThat(result.getAttendDate()).isEqualTo(LocalDate.now().toString());
    Assertions.assertThat(result.getLateTime()).isEqualTo("09:10");
    Assertions.assertThat(result.getAbsentTime()).isEqualTo("13:00");
  }

  @Test
  @DisplayName("이미 눌렀으면 기록의 상태 · 시각을 그대로 준다")
  void checked() {
    givenStudent();
    Mockito.when(this.attendanceDao.selectTodayClassDayCount(COURSE_ID)).thenReturn(1);
    AttendanceVO record = new AttendanceVO();
    record.setAttendDate("2026-11-18");
    record.setAttendStatus("L");
    record.setLgnDt("2026-11-18 09:30");
    Mockito.when(this.attendanceDao.selectTodayAttendance(COURSE_ID, STUDENT_ID)).thenReturn(record);

    TodayAttendanceVO result = this.service.readTodayAttendance(STUDENT_ID, COURSE_ID);

    Assertions.assertThat(result.isClassDay()).isTrue();
    Assertions.assertThat(result.getAttendStatus()).isEqualTo("L");
    Assertions.assertThat(result.getLgnDt()).isEqualTo("2026-11-18 09:30");
    Assertions.assertThat(result.getAttendDate()).isEqualTo("2026-11-18");
  }

  @Test
  @DisplayName("오늘 시간표가 없으면(주말 · 휴강) classDay false")
  void notClassDay() {
    givenStudent();
    Mockito.when(this.attendanceDao.selectTodayClassDayCount(COURSE_ID)).thenReturn(0);

    TodayAttendanceVO result = this.service.readTodayAttendance(STUDENT_ID, COURSE_ID);

    Assertions.assertThat(result.isClassDay()).isFalse();
    Assertions.assertThat(result.getAttendStatus()).isNull();
  }
}
