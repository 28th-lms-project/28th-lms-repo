package com.learningworks.survey.vo.response;

import java.util.List;

import lombok.Data;

@Data
public class SurveyQuestionStatVO {

	private String id;
	private String subject;
	private String type;
	private int answerCount;
	private List<SurveyOptionStatVO> options;
	private List<String> textAnswers;
}
