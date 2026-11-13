package com.learningworks.course.web;


import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.common.action.RequireAction;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.course.service.CourseService;
import com.learningworks.course.vo.request.ModifyHomeworkReplyVO;
import com.learningworks.course.vo.request.ModifyHomeworkVO;
import com.learningworks.course.vo.request.RegistCourseVO;
import com.learningworks.course.vo.request.RegistHomeworkReplyVO;
import com.learningworks.course.vo.request.RegistHomeworkVO;
import com.learningworks.course.vo.response.CourseMemberVO;
import com.learningworks.course.vo.response.CourseVO;
import com.learningworks.course.vo.response.HomeworkReplyVO;
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
	@RequireAction(domain = "COURSE", action = "READ", description = "강의 조회")
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
	@RequireAction(domain = "COURSE", action = "READ", description = "강의 조회")
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
	@RequireAction(domain = "COURSE", action = "STUDENT_READ", description = "강의 수강생 목록 조회")
	@GetMapping("/{courseId}/list/student")
	public ApiResponse<List<CourseMemberVO>> readCourseMembers(@PathVariable String courseId) {
		List<CourseMemberVO> courseMemberList = this.courseService.readCourseMembers(courseId);
		return ApiResponse.OK(courseMemberList);

	}
	/**
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
	@RequireAction(domain = "COURSE_HOMEWORK", action = "READ", description = "과제 조회")
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
	@RequireAction(domain = "COURSE_HOMEWORK", action = "READ", description = "과제 조회")
	@GetMapping("/{courseId}/homeworklist/{homeworkId}")
	public ApiResponse<HomeworkVO> getOneHomework(@PathVariable String courseId, @PathVariable String homeworkId){
		HomeworkVO homework = this.courseService.getOneHomework(courseId,homeworkId);
		return ApiResponse.OK(homework);
	}

	/**
	 * 과제 상세 + 댓글 목록 조회
	 * @param courseId, homeworkId
	 * @return HomeworkVO (homeworkReplies 포함)
	 */
	@RequireAction(domain = "COURSE_HOMEWORK", action = "REPLY_READ", description = "과제 댓글 조회")
	@GetMapping("/{courseId}/homeworklist/{homeworkId}/replies")
	public ApiResponse<HomeworkVO> getHomeworkReplies(@PathVariable String courseId, @PathVariable String homeworkId){
		HomeworkVO homework = this.courseService.getHomeworkReplies(courseId, homeworkId);
		return ApiResponse.OK(homework);
	}

	/**
	 * 과제 댓글 등록 (해당 강의의 수강생 · 강사만)
	 * @param courseId, homeworkId, registHomeworkReplyVO(content)
	 * @return ApiResponse.CREATED(등록된 댓글)
	 */
	@RequireAction(domain = "COURSE_HOMEWORK", action = "REPLY_CREATE", description = "과제 댓글 등록")
	@PostMapping("/{courseId}/homeworklist/{homeworkId}/replies")
	public ApiResponse<HomeworkReplyVO> addHomeworkReply(@PathVariable String courseId,
			@PathVariable String homeworkId,
			@Valid @RequestBody RegistHomeworkReplyVO registHomeworkReplyVO) {
		return ApiResponse.CREATED(
				this.courseService.addHomeworkReply(courseId, homeworkId, registHomeworkReplyVO));
	}

	/**
	 * 과제 댓글 수정 (작성자 본인만)
	 * @param courseId, homeworkId, replyId, modifyHomeworkReplyVO(content)
	 * @return ApiResponse.OK(수정된 댓글)
	 */
	@RequireAction(domain = "COURSE_HOMEWORK", action = "REPLY_UPDATE", description = "과제 댓글 수정")
	@PutMapping("/{courseId}/homeworklist/{homeworkId}/replies/{replyId}")
	public ApiResponse<HomeworkReplyVO> updateHomeworkReply(@PathVariable String courseId,
			@PathVariable String homeworkId,
			@PathVariable String replyId,
			@Valid @RequestBody ModifyHomeworkReplyVO modifyHomeworkReplyVO) {
		return ApiResponse.OK(
				this.courseService.updateHomeworkReply(courseId, homeworkId, replyId, modifyHomeworkReplyVO));
	}

	/**
	 * 과제 댓글 삭제 (DEL_YN = 'Y') - 작성자 본인, 관리자, 해당 강의 강사
	 * @param courseId, homeworkId, replyId
	 * @return ApiResponse.OK(삭제된 댓글 ID)
	 */
	@RequireAction(domain = "COURSE_HOMEWORK", action = "REPLY_DELETE", description = "과제 댓글 삭제")
	@DeleteMapping("/{courseId}/homeworklist/{homeworkId}/replies/{replyId}")
	public ApiResponse<String> deleteHomeworkReply(@PathVariable String courseId,
			@PathVariable String homeworkId,
			@PathVariable String replyId) {
		return ApiResponse.OK(this.courseService.deleteHomeworkReply(courseId, homeworkId, replyId));
	}

	/**
	 * 과제 삭제 (DEL_YN = 'Y') - 학생 제외: 관리자는 모든 강의, 강사는 자기 강의만
	 * @param courseId, homeworkId
	 * @return ApiResponse.OK(삭제된 과제 ID)
	 */
	@RequireAction(domain = "COURSE_HOMEWORK", action = "DELETE", description = "과제 삭제")
	@DeleteMapping("/{courseId}/homeworklist/{homeworkId}")
	public ApiResponse<String> deleteHomework(@PathVariable String courseId,
			@PathVariable String homeworkId) {
		return ApiResponse.OK(this.courseService.deleteHomework(courseId, homeworkId));
	}

	/**
	 * 과제 등록 (학생 제외: 관리자는 모든 강의, 강사는 자기 강의만)
	 *
	 */
	@RequireAction(domain = "COURSE_HOMEWORK", action = "CREATE", description = "과제 등록")
	@PostMapping("/{courseId}/addhomework")
	public ApiResponse<HomeworkVO> addHomework(@PathVariable String courseId,
													@RequestBody RegistHomeworkVO registHomeworkVO ){
		return ApiResponse.CREATED(this.courseService.addHomework(courseId, registHomeworkVO));
	}
	/**
	 * 과제 내용 수정 (content, endDate) - 학생 제외: 관리자는 모든 강의, 강사는 자기 강의만
	 * @param courseId, homeworkId, modifyHomeworkVO(content, endDate)
	 * @return ApiResponse.OK(수정된 과제)
	 */
	@RequireAction(domain = "COURSE_HOMEWORK", action = "UPDATE", description = "과제 수정")
	@PutMapping("/{courseId}/{homeworkId}/update")
	public ApiResponse<HomeworkVO> updateHomework(@PathVariable String courseId,
			@PathVariable String homeworkId, @Valid @RequestBody ModifyHomeworkVO modifyHomeworkVO){
		return ApiResponse.OK(this.courseService.updateHomework(courseId, homeworkId, modifyHomeworkVO));
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
