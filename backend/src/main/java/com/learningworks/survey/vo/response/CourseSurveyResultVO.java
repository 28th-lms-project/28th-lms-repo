package com.learningworks.survey.vo.response;

import java.util.List;

import lombok.Data;

/**
 * 설문 결과 팝업용 응답 (과정 설문 정보 + 문항/보기 + 응답한 학생 목록)
 */
@Data
public class CourseSurveyResultVO {

	private CourseSurveyVO courseSurvey;

	private List<SurveyVO> surveyList;

	private List<SurveyRespondentVO> respondents;

	/** 익명 조회 여부 (강사 · 관리자: 학생 이름 · ID 없이 "응답자 N"으로만 표시) */
	private boolean anonymous;

}
