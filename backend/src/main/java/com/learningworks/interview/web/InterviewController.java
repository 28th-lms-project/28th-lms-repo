package com.learningworks.interview.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.common.action.RequireAction;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.interview.service.InterviewService;
import com.learningworks.interview.vo.request.InterviewRequestVO;
import com.learningworks.interview.vo.response.InterviewResponseVO;
import com.learningworks.interview.vo.response.InterviewStudentResponseVO;

import jakarta.validation.Valid;

/**
 * 면접 일정 API
 * 프론트: frontend/src/api/admin/course/interviewApi.js
 */
@RestController
@RequestMapping("/interview")
public class InterviewController {

	private final InterviewService interviewService;

	public InterviewController(InterviewService interviewService) {
		this.interviewService = interviewService;
	}

	/**
	 * 과정의 면접 일정 목록 조회
	 * @param courseId
	 * @return List<InterviewResponseVO>
	 */
	@RequireAction(domain = "COURSE_INTERVIEW", action = "READ", description = "면접 일정 조회")
	@GetMapping("/{courseId}")
	public ApiResponse<List<InterviewResponseVO>> getInterviewList(@PathVariable String courseId) {
		return ApiResponse.OK(this.interviewService.getInterviewList(courseId));
	}

	/**
	 * 면접 일정 등록 시 선택할 과정 수강생 목록 조회
	 * @param courseId
	 * @return List<InterviewStudentResponseVO>
	 */
	@RequireAction(domain = "COURSE_INTERVIEW", action = "STUDENT_READ", description = "면접 일정 등록용 수강생 조회")
	@GetMapping("/{courseId}/students")
	public ApiResponse<List<InterviewStudentResponseVO>> getCourseStudentList(@PathVariable String courseId) {
		return ApiResponse.OK(this.interviewService.getCourseStudentList(courseId));
	}

	/**
	 * 면접 일정 등록
	 * @param courseId
	 * @param interviewRequestVO
	 * @return 생성된 면접 일정 ID
	 */
	@RequireAction(domain = "COURSE_INTERVIEW", action = "CREATE", description = "면접 일정 등록")
	@PostMapping("/{courseId}")
	public ApiResponse<String> createInterview(@PathVariable String courseId,
	                                           @Valid @RequestBody InterviewRequestVO interviewRequestVO) {
		return ApiResponse.CREATED(this.interviewService.createInterview(courseId, interviewRequestVO));
	}
}
