package com.learningworks.attendance.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.learningworks.attendance.dao.AttendanceDao;
import java.time.LocalDate;
import com.learningworks.attendance.vo.response.AttendanceVO;
import com.learningworks.attendance.vo.response.TodayAttendanceVO;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;

@Service
public class AttendanceServiceImpl implements AttendanceService {

  private final AttendanceDao attendanceDao;
  private final String lateTime;
  private final String absentTime;

  public AttendanceServiceImpl(AttendanceDao attendanceDao,
      @Value("${app.attendance.late-time}") String lateTime,
      @Value("${app.attendance.absent-time}") String absentTime) {
    this.attendanceDao = attendanceDao;
    this.lateTime = lateTime;
    this.absentTime = absentTime;
  }

  @Transactional
  @Override
  public AttendanceVO createTodayAttendance(String loginId, String courseId) {
    if (this.attendanceDao.selectCourseStudentIdForUpdate(courseId, loginId) == null) {
      throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
    }
    if (this.attendanceDao.selectTodayClassDayCount(courseId) == 0) {
      throw new LearningworksException(ErrorCode.ATTENDANCE_NOT_CLASS_DAY);
    }
    if (this.attendanceDao.selectTodayAttendance(courseId, loginId) != null) {
      throw new LearningworksException(ErrorCode.ATTENDANCE_ALREADY_CHECKED);
    }
    this.attendanceDao.insertTodayAttendance(courseId, loginId, this.lateTime, this.absentTime);
    AttendanceVO result = this.attendanceDao.selectTodayAttendance(courseId, loginId);
    return result;
  }

  @Override
  public TodayAttendanceVO readTodayAttendance(String loginId, String courseId) {
    if (this.attendanceDao.selectCourseStudentId(courseId, loginId) == null) {
      throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
    }

    TodayAttendanceVO result = new TodayAttendanceVO();
    result.setAttendDate(LocalDate.now().toString());
    // 출석 체크(createTodayAttendance)와 같은 기준: 오늘 시간표가 있고 과정 기간 안
    result.setClassDay(this.attendanceDao.selectTodayClassDayCount(courseId) > 0);
    result.setLateTime(this.lateTime);
    result.setAbsentTime(this.absentTime);

    AttendanceVO today = this.attendanceDao.selectTodayAttendance(courseId, loginId);
    if (today != null) {
      result.setAttendDate(today.getAttendDate());
      result.setAttendStatus(today.getAttendStatus());
      result.setLgnDt(today.getLgnDt());
    }
    return result;
  }

}
