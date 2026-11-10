package com.learningworks.course.web;


import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.common.utils.ApiResponse;
import com.learningworks.course.service.CourseService;
import com.learningworks.course.vo.request.RegistCourseVO;
import com.learningworks.course.vo.response.CourseMemberVO;
import com.learningworks.course.vo.response.CourseVO;
import com.learningworks.course.vo.response.HomeworkVO;

import jakarta.validation.Valid;

@RestController
public class CourseController {
	
	
	private CourseService courseService;
	public CourseController (CourseService courseService) {
		this.courseService = courseService;
		
	}
	
	/**
	 * 강의 목록 전체 조회 
	 * @return List<CourseVO>
	 */
	@GetMapping("/course/view")
	public ApiResponse<List<CourseVO>> viewCourse() {
		List<CourseVO> course = this.courseService.viewCourse();
		return ApiResponse.OK(course) ;
	}
	
	/**
	 * 강의 id로 강의 하나 상세 조회
	 * @param courseId
	 * @return CourseVO
	 */
	@GetMapping("/course/list/{courseId}")
	public ApiResponse<CourseVO> readOneCourse(@PathVariable String courseId) {
		CourseVO course = this.courseService.readOneCourse(courseId);
		return ApiResponse.OK(course);
	}
	
	/**
	 * 해당 강의에 대한 학생 리스트 조회 
	 * @param courseId
	 * @return List<CourseMemberVO>
	 */
	@GetMapping("/{courseId}/list/student")
	public ApiResponse<List<CourseMemberVO>> readCourseMembers(@PathVariable String courseId) {
		List<CourseMemberVO> courseMemberList = this.courseService.readCourseMembers(courseId);
		return ApiResponse.OK(courseMemberList);
		
	}
	/**
	 * (미사용)
	 * 수강생 로그인 아이디에 대한 강의 조회 
	 * @param courseId
	 * @return CourseVO
	 */
	
	@GetMapping("/my/course/list/{courseId}")
	public ApiResponse<CourseVO> readMyCourse(@PathVariable String courseId) {
		CourseVO course = this.courseService.readMyCourse(courseId);
		return ApiResponse.OK(course);
	}
	
	/**
	 * 강의에 대한 과제 목록 전체 조회
	 * @param courseId
	 * @return List<HomeworkVO>
	 */
	@GetMapping("/{courseId}/homeworklist")
	public ApiResponse<List<HomeworkVO>> readHomework(@PathVariable String courseId){
		List<HomeworkVO> homeworkList = this.courseService.courseHomeworkList(courseId);
		return ApiResponse.OK(homeworkList);
	}
	/**
	 * 과제 상세 조회 
	 * @param courseId, homeworkId
	 * @return HomeworkVO
	 */
	@GetMapping("/{courseId}/homeworklist/{homeworkId}")
	public ApiResponse<HomeworkVO> getOneHomework(@PathVariable String courseId, @PathVariable String homeworkId){
		HomeworkVO homework = this.courseService.getOneHomework(courseId,homeworkId);
		return ApiResponse.OK(homework);
	}
	
	/**
	 * 나중에 분리할 endpoint
	 * 전체 학생 목록 조회 query문에서 WHERE BASE_ROLE = 'ROLE_STUDENT'
	 * @return List<CourseMemberVO>
	 */
	@GetMapping("/student/list")
	public ApiResponse<List<CourseMemberVO>> courseMemberList() {
		List<CourseMemberVO> courseMemberVO = this.courseService.courseMemberList();
		return ApiResponse.OK(courseMemberVO);
	}
	/**
	 * 나중에 분리할 endpoint
	 * 전체 강사 목록 조회 QUERY문에서 WHERE BASE_ROLE = 'ROLE_TUTOR'
	 * @return List<CourseMemberVO>
	 */
	
	@GetMapping("/tutor/list")
	public ApiResponse<List<CourseMemberVO>> courseTutorList(){
		List<CourseMemberVO> courseMemberVO = this.courseService.courseTutorList();
		return ApiResponse.OK(courseMemberVO);
	}
	
	/**
	 * 강의 등록 API
	 * @param registCourseVO
	 * @return ApiResponse.CREATED
	 */
	@PostMapping("/admin/course/add")
	public ApiResponse<CourseVO> addCourse(@Valid @ModelAttribute RegistCourseVO registCourseVO) {
		return ApiResponse.CREATED(this.courseService.addCourse(registCourseVO));
	}
}
