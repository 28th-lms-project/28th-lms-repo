package com.learningworks.survey.vo.response;

import java.util.List;

import lombok.Data;

@Data
public class SurveyListVO {
	private long count;
	
	private List<SurveyVO> surveyList;

}
