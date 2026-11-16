package com.learningworks.attendance.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.learningworks.attendance.vo.response.AttendanceVO;

@Mapper
public interface AttendanceDao {
  String selectCourseStudentIdForUpdate(@Param("courseId") String courseId,
      @Param("userId") String userId);

  int selectTodayClassDayCount(String courseId);

  int insertTodayAttendance(@Param("courseId") String courseId, @Param("userId") String userId,
      @Param("lateTime") String lateTime, @Param("absentTime") String absentTime);

  AttendanceVO selectTodayAttendance(@Param("courseId") String courseId,
      @Param("userId") String userId);

}
