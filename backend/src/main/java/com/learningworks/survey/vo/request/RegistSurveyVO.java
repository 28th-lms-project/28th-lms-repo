package com.learningworks.survey.vo.request;

import java.util.List;

import lombok.Data;

@Data
public class RegistSurveyVO {
	private String id; 
	private String subject;
	private String group;
	private String type;
	
	private List<RegistSurveyDataVO> surveyData;
}
