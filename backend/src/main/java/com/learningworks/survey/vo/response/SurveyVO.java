package com.learningworks.survey.vo.response;

import java.util.List;

import lombok.Data;

@Data
public class SurveyVO {
	private String id;
	private String subject;
	private String group;
	private String type;
	
	private List<SurveyDataVO> surveyDataList;

}
