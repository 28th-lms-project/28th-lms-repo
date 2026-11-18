package com.learningworks.course.vo.response;

import java.util.List;

import lombok.Data;

@Data
public class CourseVO {
	private String id;
	private String courseName;
	private String no;
	private String startDate;
	private String endDated;
	private String delYn;
	
	private String name;
	
	
	private List<CourseMemberVO> members ; 
}
