package com.learningworks.attendance.service;

import com.learningworks.attendance.vo.response.AttendanceVO;
import com.learningworks.attendance.vo.response.TodayAttendanceVO;

public interface AttendanceService {
  AttendanceVO createTodayAttendance(String loginId, String courseId);

  /** 오늘 내 출결. 이 과정의 수강생이 아니면 COURSE_NOT_AUTHORIZED */
  TodayAttendanceVO readTodayAttendance(String loginId, String courseId);
}
