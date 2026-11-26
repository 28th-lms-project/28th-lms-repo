package com.learningworks.score.vo.response;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StudentScoreVO {

  private String courseStudentId;

  private String userId;

  private String userName;

	/** 동명이인 구분 문자 (화면 표시용 A · B ..., 동명이인이 없으면 null). 이름 데이터는 바꾸지 않음 */
	private String nameSuffix;

  private List<ScoreVO> scoreList;

  /** 과정 전체 석차 (채점 끝난 시험이 없으면 null) */
  private CourseRankVO courseRank;

}
