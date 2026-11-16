package com.learningworks.attendance.service;

import com.learningworks.attendance.vo.response.AttendanceVO;

public interface AttendanceService {
  AttendanceVO createTodayAttendance(String loginId, String courseId);
}
