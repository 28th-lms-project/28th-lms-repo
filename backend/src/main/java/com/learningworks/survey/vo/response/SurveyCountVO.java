package com.learningworks.survey.vo.response;

import lombok.Data;

@Data
public class SurveyCountVO {

	private String surveyId;
	private String dataId;
	private int count;
}
