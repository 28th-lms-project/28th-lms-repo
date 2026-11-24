package com.learningworks.score.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.learningworks.score.vo.response.CourseRankVO;
import com.learningworks.score.vo.response.ScoreDetailItemVO;
import com.learningworks.score.vo.response.ScoreDetailVO;
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

  // 과정 전체 석차 (수강생별 100점 환산 평균 · 석차)
  List<CourseRankVO> selectCourseRankList(@Param("courseId") String courseId);

  // 과정 수강생 ID(CT-) → 로그인 ID (이 과정 수강생이 아니면 null)
  String selectCourseStudentUserId(@Param("courseId") String courseId,
      @Param("courseStudentId") String courseStudentId);

  // 상세 성적 머리글 (시험이 이 과정 것이 아니면 null)
  ScoreDetailVO selectScoreDetail(@Param("courseId") String courseId, @Param("testSetId") String testSetId,
      @Param("userId") String userId);

  // 상세 성적 문항별 결과
  List<ScoreDetailItemVO> selectScoreDetailItems(@Param("testSetId") String testSetId,
      @Param("userId") String userId);

  int selectCourseTutorCount(@Param("courseId") String courseId, @Param("userId") String userId);
}
