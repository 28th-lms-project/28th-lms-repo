package com.learningworks.course.vo.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegistCourseVO {
	
	@NotBlank
	private String id           ;
	@NotBlank
	private String courseName   ;
	@NotBlank
	private String no           ;
	@NotBlank
	private String startDate    ;
	@NotBlank
	private String endDated     ;
	
	private List<String> studentId;
	private String tutorId;

}
