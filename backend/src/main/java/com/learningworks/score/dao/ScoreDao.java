package com.learningworks.score.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.learningworks.score.vo.response.ScoreVO;
import com.learningworks.score.vo.response.StudentScoreVO;

@Mapper
public interface ScoreDao {
  // 로그인 ID → 이 과정의 수강생 ID (없으면 null → Service 에서 "수강생 아님" 예외)
  String selectCourseStudentId(@Param("courseId") String courseId, @Param("userId") String userId);

  // 학생: 과정의 공개 시험별 내 점수 (TEST_ANSWERS.COURSE_STUDENT_ID 에 로그인 ID 가 저장되어 있어 로그인 ID 로 조회)
  List<ScoreVO> selectMyScoreList(@Param("courseId") String courseId, @Param("userId") String userId);

  // 강사: 과정 전체 수강생 × 시험 점수
  List<StudentScoreVO> selectCourseScoreList(@Param("courseId") String courseId);

  // 로그인 사용자의 현재 역할 (DB 기준)
  String selectUserBaseRole(String userId);

  int selectCourseTutorCount(@Param("courseId") String courseId, @Param("userId") String userId);
}
