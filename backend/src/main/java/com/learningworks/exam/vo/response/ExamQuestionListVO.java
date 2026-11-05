package com.learningworks.exam.vo.response;

import java.util.List;

import lombok.Data;

@Data
public class ExamQuestionListVO {
	
	private long questionCount;
	
	private List<ExamQuestionVO> examList;

}
