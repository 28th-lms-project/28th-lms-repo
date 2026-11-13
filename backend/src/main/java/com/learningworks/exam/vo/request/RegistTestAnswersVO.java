package com.learningworks.exam.vo.request;

import lombok.Data;

@Data
public class RegistTestAnswersVO {
	private String id              ;
	private String testSetId       ;
	private String answer          ;
	private String crtDt           ;
	private String isCorrect       ;
	private String etc             ;
	private String testId          ;
	private String courseStudentId ;

}
