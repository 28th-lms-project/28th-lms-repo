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

}
