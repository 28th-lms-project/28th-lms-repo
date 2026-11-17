package com.learningworks.survey.vo.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegistCourseSurveyAnswerListVO {
	
	private List<@NotNull @Valid RegistCourseSurveyAnswerVO> answers; 

}
