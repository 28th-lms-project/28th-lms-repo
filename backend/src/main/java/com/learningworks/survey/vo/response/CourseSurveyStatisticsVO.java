package com.learningworks.survey.vo.response;

import java.util.List;

import lombok.Data;

@Data
public class CourseSurveyStatisticsVO {

	private CourseSurveyVO courseSurvey;
	private int responseCount;
	private int studentCount;
	private List<SurveyQuestionStatVO> questions;
}
