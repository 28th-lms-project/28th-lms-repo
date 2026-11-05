package com.learningworks.course.web;


import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.course.service.CourseService;
import com.learningworks.course.vo.request.ViewCourseVO;
import com.learningworks.course.vo.response.CourseVO;

@RestController
@ResponseBody
public class CourseController {
	
	private CourseService courseService;
	public CourseController (CourseService courseService) {
		this.courseService = courseService;
	}
	
	
	@GetMapping("/course/view")
	public List<CourseVO> viewCourse() {
		List<CourseVO> course = this.courseService.viewCourse();
		System.out.println(course);
		return course ;
	}
	
	@GetMapping("/course/list/{courseId}")
	public CourseVO readOneCourse(@PathVariable String courseId) {
		CourseVO course = this.courseService.readOneCourse(courseId);
		return course;
	}
}
