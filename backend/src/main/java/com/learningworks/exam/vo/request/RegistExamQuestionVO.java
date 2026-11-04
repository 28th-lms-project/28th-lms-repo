package com.learningworks.exam.vo.request;

import java.util.Date;

import lombok.Data;

@Data
public class RegistExamQuestionVO {
	
	private String id;
	private String subjectId;
	private String question;
	private String answerType;
	private String answerSheet1;
	private String answerSheet2;
	private String answerSheet3;
	private String answerSheet4;
	private String answerSheet5;
	private int answerCount;
	private float pointAlloc;
	private String correctAnswer;
	private String subQuestion;

}
