package com.learningworks.course.web;


import java.util.List;

import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.common.utils.ApiResponse;
import com.learningworks.course.service.CourseService;
import com.learningworks.course.vo.request.RegistCourseVO;
import com.learningworks.course.vo.response.CourseMemberVO;
import com.learningworks.course.vo.response.CourseVO;

import jakarta.validation.Valid;

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
		return course ;
	}
	
	@GetMapping("/course/list/{courseId}")
	public CourseVO readOneCourse(@PathVariable String courseId) {
		CourseVO course = this.courseService.readOneCourse(courseId);
		return course;
	}
	@GetMapping("/{courseId}/list/student")
	public List<CourseMemberVO> readCourseMembers(@PathVariable String courseId) {
		List<CourseMemberVO> courseMemberList = this.courseService.readCourseMembers(courseId);
		return courseMemberList;
	}
	
	@GetMapping("/my/course/list/{courseId}")
	public CourseVO readMyCourse(@PathVariable String courseId) {
		CourseVO course = this.courseService.readMyCourse(courseId);
		return course;
	}
	
	//나중에 분리할 endpoint
	@GetMapping("/student/list")
	public List<CourseMemberVO> courseMemberList() {
		List<CourseMemberVO> courseMemberVO = this.courseService.courseMemberList();
		return courseMemberVO;
	}
	@GetMapping("/tutor/list")
	public List<CourseMemberVO> courseTutorList(){
		List<CourseMemberVO> courseMemberVO = this.courseService.courseTutorList();
		return courseMemberVO;
	}
	@PostMapping("/admin/course/add")
	public ApiResponse<String> addCourse(@Valid @ModelAttribute RegistCourseVO registCourseVO,
											BindingResult bindingResult){
		int result = this.courseService.addCourse(registCourseVO);
		System.out.println(registCourseVO);
		String a = "등록완료";
		return ApiResponse.OK("등록완료");
	}
}
