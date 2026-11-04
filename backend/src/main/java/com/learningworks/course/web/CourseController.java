package com.learningworks.course.web;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.course.service.CourseService;
import com.learningworks.course.vo.response.CourseVO;

@RestController
public class CourseController {
	
	private CourseService courseService;
	public CourseController (CourseService courseService) {
		this.courseService = courseService;
	}
	
	
	@GetMapping("/course/view")
	public CourseVO viewCourse() {
		CourseVO course = this.courseService.viewCourse();
		return course ;
	}
}
