package com.learningworks.attendance.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.learningworks.attendance.vo.response.AttendanceVO;

@Mapper
public interface AttendanceDao {
  String selectCourseStudentIdForUpdate(@Param("courseId") String courseId,
      @Param("userId") String userId);

  /** 이 과정의 수강생이면 COURSE_STUDENT.ID, 아니면 null (조회용, 잠금 없음) */
  String selectCourseStudentId(@Param("courseId") String courseId,
      @Param("userId") String userId);

  int selectTodayClassDayCount(String courseId);

  int insertTodayAttendance(@Param("courseId") String courseId, @Param("userId") String userId,
      @Param("lateTime") String lateTime, @Param("absentTime") String absentTime);

  AttendanceVO selectTodayAttendance(@Param("courseId") String courseId,
      @Param("userId") String userId);

}
