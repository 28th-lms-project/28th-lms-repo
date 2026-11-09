package com.learningworks.course.vo.request;

import java.util.List;

import lombok.Data;

@Data
public class RegistCourseVO {
	
	private String id           ;
	private String courseName   ;
	private String no           ;
	private String startDate    ;
	private String endDated     ;
	
	private List<String> studentId;
	private String tutorId;

}
