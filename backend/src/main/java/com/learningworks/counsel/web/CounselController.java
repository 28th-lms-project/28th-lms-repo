package com.learningworks.counsel.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.common.action.RequireAction;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.counsel.service.CounselService;
import com.learningworks.counsel.vo.request.CapabilityRequestVO;
import com.learningworks.counsel.vo.request.ConsultDataRequestVO;
import com.learningworks.counsel.vo.request.CounselRequestVO;
import com.learningworks.counsel.vo.request.OpinionRequestVO;
import com.learningworks.counsel.vo.response.CapabilityResponseVO;
import com.learningworks.counsel.vo.response.ConsultDataResponseVO;
import com.learningworks.counsel.vo.response.CounselDetailResponseVO;
import com.learningworks.counsel.vo.response.CounselListResponseVO;
import com.learningworks.counsel.vo.response.ScoreResponseVO;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 상담 API
 * 프론트: frontend/src/api/my/course/counselApi.js
 */
@Tag(name = "상담", description = "상담 신청 · 목록 · 답변")
@RestController
@RequestMapping("/counsel")
public class CounselController {

	private final CounselService counselService;

	public CounselController(CounselService counselService) {
		this.counselService = counselService;
	}

	/**
	 * 과정의 수강생-종합의견 목록 조회
	 */
	@RequireAction(domain = "COURSE_COUNSEL", action = "READ", description = "상담 조회")
	@GetMapping("/{courseId}")
	public ApiResponse<List<CounselListResponseVO>> getCounselList(@PathVariable String courseId) {
		return ApiResponse.OK(this.counselService.getCounselList(courseId));
	}

	/**
	 * 교육생 기본 정보 조회
	 */
	@RequireAction(domain = "COURSE_COUNSEL", action = "READ", description = "상담 조회")
	@GetMapping("/{courseId}/students/{courseStudentId}")
	public ApiResponse<CounselDetailResponseVO> getCounselDetail(@PathVariable String courseId,
	                                                             @PathVariable String courseStudentId) {
		return ApiResponse.OK(this.counselService.getCounselDetail(courseId, courseStudentId));
	}

	/**
	 * 상담 기본 정보(성별, 연락처) 등록
	 */
	@RequireAction(domain = "COURSE_COUNSEL", action = "CREATE", description = "상담 등록")
	@PostMapping("/{courseId}/students/{courseStudentId}")
	public ApiResponse<Void> createCounsel(@PathVariable String courseId,
	                                       @PathVariable String courseStudentId,
	                                       @Valid @RequestBody CounselRequestVO counselRequestVO) {
		this.counselService.createCounsel(courseId, courseStudentId, counselRequestVO);
		return ApiResponse.CREATED(null);
	}

	/**
	 * 역량 수준 진단 조회
	 */
	@RequireAction(domain = "COURSE_COUNSEL", action = "READ", description = "상담 조회")
	@GetMapping("/{courseId}/students/{courseStudentId}/capability")
	public ApiResponse<CapabilityResponseVO> getCapability(@PathVariable String courseId,
	                                                       @PathVariable String courseStudentId) {
		return ApiResponse.OK(this.counselService.getCapability(courseId, courseStudentId));
	}

	/**
	 * 역량 수준 진단 수정
	 */
	@RequireAction(domain = "COURSE_COUNSEL", action = "UPDATE", description = "상담 수정")
	@PutMapping("/{courseId}/students/{courseStudentId}/capability")
	public ApiResponse<Void> updateCapability(@PathVariable String courseId,
	                                          @PathVariable String courseStudentId,
	                                          @Valid @RequestBody CapabilityRequestVO capabilityRequestVO) {
		this.counselService.updateCapability(courseId, courseStudentId, capabilityRequestVO);
		return ApiResponse.OK(null);
	}

	/**
	 * 과목별 성적 조회
	 */
	@RequireAction(domain = "COURSE_COUNSEL", action = "READ", description = "상담 조회")
	@GetMapping("/{courseId}/students/{courseStudentId}/scores")
	public ApiResponse<List<ScoreResponseVO>> getScoreList(@PathVariable String courseId,
	                                                      @PathVariable String courseStudentId) {
		return ApiResponse.OK(this.counselService.getScoreList(courseId, courseStudentId));
	}

	/**
	 * 평균 점수 조회 (성적이 없으면 body 없음)
	 */
	@RequireAction(domain = "COURSE_COUNSEL", action = "READ", description = "상담 조회")
	@GetMapping("/{courseId}/students/{courseStudentId}/scores/average")
	public ApiResponse<Double> getAverageScore(@PathVariable String courseId,
	                                           @PathVariable String courseStudentId) {
		return ApiResponse.OK(this.counselService.getAverageScore(courseId, courseStudentId));
	}

	/**
	 * 상담내용 목록 조회
	 */
	@RequireAction(domain = "COURSE_COUNSEL", action = "READ", description = "상담 조회")
	@GetMapping("/{courseId}/students/{courseStudentId}/consults")
	public ApiResponse<List<ConsultDataResponseVO>> getConsultDataList(@PathVariable String courseId,
	                                                                  @PathVariable String courseStudentId) {
		return ApiResponse.OK(this.counselService.getConsultDataList(courseId, courseStudentId));
	}

	/**
	 * 상담내용 등록 (수정, 삭제는 제공하지 않음)
	 * @return 생성된 상담내용 ID
	 */
	@RequireAction(domain = "COURSE_COUNSEL", action = "CREATE", description = "상담 등록")
	@PostMapping("/{courseId}/students/{courseStudentId}/consults")
	public ApiResponse<String> createConsultData(@PathVariable String courseId,
	                                             @PathVariable String courseStudentId,
	                                             @Valid @RequestBody ConsultDataRequestVO consultDataRequestVO) {
		return ApiResponse.CREATED(
				this.counselService.createConsultData(courseId, courseStudentId, consultDataRequestVO));
	}

	/**
	 * 종합의견 조회
	 */
	@RequireAction(domain = "COURSE_COUNSEL", action = "READ", description = "상담 조회")
	@GetMapping("/{courseId}/students/{courseStudentId}/opinion")
	public ApiResponse<String> getOpinion(@PathVariable String courseId,
	                                      @PathVariable String courseStudentId) {
		return ApiResponse.OK(this.counselService.getOpinion(courseId, courseStudentId));
	}

	/**
	 * 종합의견 수정
	 */
	@RequireAction(domain = "COURSE_COUNSEL", action = "UPDATE", description = "상담 수정")
	@PutMapping("/{courseId}/students/{courseStudentId}/opinion")
	public ApiResponse<Void> updateOpinion(@PathVariable String courseId,
	                                       @PathVariable String courseStudentId,
	                                       @Valid @RequestBody OpinionRequestVO opinionRequestVO) {
		this.counselService.updateOpinion(courseId, courseStudentId, opinionRequestVO);
		return ApiResponse.OK(null);
	}
}
