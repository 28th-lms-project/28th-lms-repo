package com.learningworks.course.web;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.course.service.CourseService;

@RestController
public class CourseController {
	
	private CourseService courseService;
	public CourseController (CourseService courseService) {
		this.courseService = courseService;
	}
	
	
	@GetMapping("/course/add")
	public CourseVO addCourse() {
		return null ;
	}
}
