package com.learningworks.score.service;

import java.util.List;
import com.learningworks.score.vo.response.CourseRankVO;
import com.learningworks.score.vo.response.ScoreDetailVO;
import com.learningworks.score.vo.response.ScoreVO;
import com.learningworks.score.vo.response.StudentScoreVO;

public interface ScoreService {
  List<ScoreVO> readMyScoreList(String loginId, String courseId);

  List<StudentScoreVO> readCourseScoreList(String loginId, String courseId);

  /** 학생: 내 과정 전체 석차 (석차가 없으면 null) */
  CourseRankVO readMyCourseRank(String loginId, String courseId);

  /** 학생: 내 시험 1건 상세 결과 (본인 채점 완료 + 시험 마감(SHOW_YN=N) 뒤에만) */
  ScoreDetailVO readMyScoreDetail(String loginId, String courseId, String testSetId);

  /** 강사 · 관리자: 수강생 1명이 보는 내 성적 목록 (학생 화면과 같은 데이터) */
  List<ScoreVO> readStudentScoreList(String loginId, String courseId, String courseStudentId);

  /** 강사 · 관리자: 수강생 1명의 과정 전체 석차 (석차가 없으면 null) */
  CourseRankVO readStudentCourseRank(String loginId, String courseId, String courseStudentId);

  /** 강사 · 관리자: 수강생 1명의 시험 1건 상세 성적 */
  ScoreDetailVO readStudentScoreDetail(String loginId, String courseId, String courseStudentId, String testSetId);
}
