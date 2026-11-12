package com.learningworks.exam.vo.request;



import java.util.List;

import lombok.Data;

@Data
public class RegistTestSetVO {
	private String id;
	private String courseId;
	private String testType;
	private String setName;
	private String showYn;
	
	private List<RegistExamQuestionVO> questeions;
}
