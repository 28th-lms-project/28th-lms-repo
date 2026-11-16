package com.learningworks.survey.vo.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegistCourseSurveyVO {
	
	private String id;
	private String courseId;
	
	@NotBlank(message = "설문 제목을 입력하세요")
	private String title;
	@NotBlank(message = "설문 그룹을 선택하세요")
	private String surveyGroup;
	@NotBlank(message = "설문 과목을 입력하세요")
	private String surveySubject;
	@NotBlank(message = "설문 유형을 입력하세요")
	private String surveyType;

}
