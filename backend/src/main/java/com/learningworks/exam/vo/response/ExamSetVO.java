package com.learningworks.exam.vo.response;

import java.util.List;

import lombok.Data;

@Data
public class ExamSetVO {
	
	private String id;
	private String courseId;
	private String testType;
	private String setName;
	private String showYn;
	/** 로그인 사용자가 이 시험에 답안을 제출했는지 ("Y" / "N") */
	private String submittedYn;

	private ExamQuestionListVO questionList;

}
