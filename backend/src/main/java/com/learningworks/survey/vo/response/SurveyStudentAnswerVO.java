package com.learningworks.survey.vo.response;

import lombok.Data;

/**
 * 한 학생의 설문 답변 (문항별 선택한 보기 또는 직접 입력 답변)
 */
@Data
public class SurveyStudentAnswerVO {

	private String surveyId;

	private String dataId;

	private String textAnswer;

}
