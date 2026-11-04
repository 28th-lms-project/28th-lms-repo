package com.learningworks.exam.vo.response;

import java.util.List;

import lombok.Data;

@Data
public class ExamQuestionListVO {
	
//	public long questionCount;
	
	public List<ExamQuestionVO> examList;

}
