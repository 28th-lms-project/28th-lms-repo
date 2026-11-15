package com.learningworks.survey.vo.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegistCourseSurveyAnswerVO {

	@NotBlank
	private String questionId;

	private List<@NotBlank String> optionIds;

	private String textAnswer;

}
