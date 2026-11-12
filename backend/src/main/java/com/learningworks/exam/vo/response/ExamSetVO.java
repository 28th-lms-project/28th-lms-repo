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
	
	private ExamQuestionListVO questionList;

}
