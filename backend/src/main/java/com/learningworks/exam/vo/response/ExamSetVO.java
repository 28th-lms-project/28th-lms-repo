package com.learningworks.exam.vo.response;

import java.util.List;

import lombok.Data;

@Data
public class ExamSetVO {
	
	public String id;
	public String courseId;
	public String testType;
	public String setName;
	
	ExamQuestionListVO questionList;

}
