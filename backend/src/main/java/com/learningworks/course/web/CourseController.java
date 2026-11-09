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
import com.learningworks.common.vo.PaginationVO;
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
	public ApiResponse<List<CourseVO>> viewCourse() {
		PaginationVO paginationVO = new PaginationVO();
		List<CourseVO> course = this.courseService.viewCourse();
		return ApiResponse.OK(course) ;
	}
	
	@GetMapping("/course/list/{courseId}")
	public ApiResponse<CourseVO> readOneCourse(@PathVariable String courseId) {
		CourseVO course = this.courseService.readOneCourse(courseId);
		return ApiResponse.OK(course);
	}
	@GetMapping("/{courseId}/list/student")
	public ApiResponse<List<CourseMemberVO>> readCourseMembers(@PathVariable String courseId) {
		List<CourseMemberVO> courseMemberList = this.courseService.readCourseMembers(courseId);
		return ApiResponse.OK(courseMemberList);
		
	}
	
	@GetMapping("/my/course/list/{courseId}")
	public ApiResponse<CourseVO> readMyCourse(@PathVariable String courseId) {
		CourseVO course = this.courseService.readMyCourse(courseId);
		return ApiResponse.OK(course);
	}
	
	//나중에 분리할 endpoint
	@GetMapping("/student/list")
	public ApiResponse<List<CourseMemberVO>> courseMemberList() {
		List<CourseMemberVO> courseMemberVO = this.courseService.courseMemberList();
		return ApiResponse.OK(courseMemberVO);
	}
	@GetMapping("/tutor/list")
	public ApiResponse<List<CourseMemberVO>> courseTutorList(){
		List<CourseMemberVO> courseMemberVO = this.courseService.courseTutorList();
		return ApiResponse.OK(courseMemberVO);
	}
	@PostMapping("/admin/course/add")
	public ApiResponse<RegistCourseVO> addCourse(@Valid @ModelAttribute RegistCourseVO registCourseVO,
											BindingResult bindingResult){
		int result = this.courseService.addCourse(registCourseVO);
		
		
		return ApiResponse.CREATED(registCourseVO);
	}
}
