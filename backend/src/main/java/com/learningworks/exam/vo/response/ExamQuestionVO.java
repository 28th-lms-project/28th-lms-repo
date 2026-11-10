package com.learningworks.exam.vo.response;

import lombok.Data;

@Data
public class ExamQuestionVO {

	private String id;
	private String subjectId;
	private String question;
	private String answerType;
	private String answerSheet1;
	private String answerSheet2;
	private String answerSheet3;
	private String answerSheet4;
	private String answerSheet5;
	private String answerCount;
	private String pointAlloc;
	private String crtDt;
	private String mdfyDt;
	private String crtrId;
	private String mdfyrId;
	private String correctAnswer;
	private String subQuestion;
}
