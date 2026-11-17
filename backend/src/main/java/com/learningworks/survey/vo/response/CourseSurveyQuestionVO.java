package com.learningworks.survey.vo.response;

import java.util.List;

import lombok.Data;

/**
 * 설문 답변 팝업용 응답 (과정 설문 정보 + 문항/보기 목록)
 */
@Data
public class CourseSurveyQuestionVO {

	private CourseSurveyVO courseSurvey;

	private List<SurveyVO> surveyList;

}
