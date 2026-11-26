package com.learningworks.exam.vo.response;

import lombok.Data;

@Data
public class ExamQuestionAnswerVO {
	private String id              ;
	private String testSetId       ;
	private String answer          ;
	private String crtDt           ;
	private String isCorrect       ;
	private String etc             ;
	private String testId          ;
	private String courseStudentId ;

}
