package com.learningworks.courseData.web;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.learningworks.common.action.RequireAction;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.courseData.service.CourseDataService;
import com.learningworks.courseData.service.LinkPreviewService;
import com.learningworks.courseData.vo.request.CourseDataRequestVO;
import com.learningworks.courseData.vo.request.CourseDataSearchRequestVO;
import com.learningworks.courseData.vo.response.CourseDataFileResponseVO;
import com.learningworks.courseData.vo.response.CourseDataListResponseVO;
import com.learningworks.courseData.vo.response.CourseDataResponseVO;
import com.learningworks.courseData.vo.response.LinkPreviewResponseVO;

import jakarta.validation.Valid;

/**
 * 교육 자료 API
 * 프론트: frontend/src/api/my/course/courseDataApi.js
 */
@RestController
@RequestMapping("/course-data")
public class CourseDataController {

	private final CourseDataService courseDataService;
	private final LinkPreviewService linkPreviewService;

	public CourseDataController(CourseDataService courseDataService,
	                            LinkPreviewService linkPreviewService) {
		this.courseDataService = courseDataService;
		this.linkPreviewService = linkPreviewService;
	}

	/**
	 * 과정의 교육 자료 목록 조회 (자료명 검색 + 페이징)
	 * GET /course-data/{courseId}?dataName=&page=1&size=20
	 */
	@RequireAction(domain = "COURSE_DATA", action = "READ", description = "교육 자료 조회")
	@GetMapping("/{courseId}")
	public ApiResponse<CourseDataListResponseVO> getCourseDataList(@PathVariable String courseId,
	                                                               @ModelAttribute CourseDataSearchRequestVO searchRequestVO) {
		return ApiResponse.OK(this.courseDataService.getCourseDataList(courseId, searchRequestVO));
	}

	/**
	 * 교육 자료 상세 조회
	 */
	@RequireAction(domain = "COURSE_DATA", action = "READ", description = "교육 자료 조회")
	@GetMapping("/{courseId}/{id}")
	public ApiResponse<CourseDataResponseVO> getCourseData(@PathVariable String courseId,
	                                                       @PathVariable String id) {
		return ApiResponse.OK(this.courseDataService.getCourseData(courseId, id));
	}

	/**
	 * 교육 자료 등록
	 * @return 생성된 교육 자료 ID
	 */
	@RequireAction(domain = "COURSE_DATA", action = "CREATE", description = "교육 자료 등록")
	@PostMapping("/{courseId}")
	public ApiResponse<String> createCourseData(@PathVariable String courseId,
	                                            @Valid @RequestBody CourseDataRequestVO courseDataRequestVO) {
		return ApiResponse.CREATED(this.courseDataService.createCourseData(courseId, courseDataRequestVO));
	}

	/**
	 * 교육 자료 수정
	 * PUT /course-data/{courseId}/{id}  body: { dataName, content }
	 * 현재 과정(courseId)의 자료만 수정 가능 (다른 과정의 자료는 COURSE_DATA_NOT_EXISTS)
	 */
	@RequireAction(domain = "COURSE_DATA", action = "UPDATE", description = "교육 자료 수정")
	@PutMapping("/{courseId}/{id}")
	public ApiResponse<Void> updateCourseData(@PathVariable String courseId,
	                                          @PathVariable String id,
	                                          @Valid @RequestBody CourseDataRequestVO courseDataRequestVO) {
		this.courseDataService.updateCourseData(courseId, id, courseDataRequestVO);
		return ApiResponse.OK(null);
	}

	/**
	 * 교육 자료 삭제
	 * DELETE /course-data/{courseId}/{id}
	 * 현재 과정(courseId)의 자료만 삭제 가능. 다른 자료에서 쓰지 않는 첨부 파일은 함께 정리
	 */
	@RequireAction(domain = "COURSE_DATA", action = "DELETE", description = "교육 자료 삭제")
	@DeleteMapping("/{courseId}/{id}")
	public ApiResponse<Void> deleteCourseData(@PathVariable String courseId,
	                                          @PathVariable String id) {
		this.courseDataService.deleteCourseData(courseId, id);
		return ApiResponse.OK(null);
	}

	/**
	 * 링크 미리보기 카드 정보 조회 (에디터 작성용)
	 * GET /course-data/{courseId}/link-preview?url=
	 * 내부망 주소 요청은 서버에서 차단 (SSRF 방지)
	 */
	@RequireAction(domain = "COURSE_DATA", action = "CREATE", description = "교육 자료 등록")
	@GetMapping("/{courseId}/link-preview")
	public ApiResponse<LinkPreviewResponseVO> getLinkPreview(@PathVariable String courseId,
	                                                         @RequestParam("url") String url) {
		this.courseDataService.checkCourse(courseId);
		return ApiResponse.OK(this.linkPreviewService.getLinkPreview(url));
	}

	/**
	 * 교육 자료 파일 업로드 (multipart/form-data, 필드명 file)
	 */
	@RequireAction(domain = "COURSE_DATA", action = "CREATE", description = "교육 자료 등록")
	@PostMapping(value = "/{courseId}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ApiResponse<CourseDataFileResponseVO> uploadFile(@PathVariable String courseId,
	                                                        @RequestParam(value = "file", required = false) MultipartFile file) {
		return ApiResponse.CREATED(this.courseDataService.uploadFile(courseId, file));
	}

	/**
	 * 등록 중 업로드한 임시 파일 삭제 (등록 취소 · 본문에서 제거한 파일 정리)
	 */
	@RequireAction(domain = "COURSE_DATA", action = "CREATE", description = "교육 자료 등록")
	@DeleteMapping("/{courseId}/files/{fileId}")
	public ApiResponse<Void> deleteTemporaryFile(@PathVariable String courseId,
	                                             @PathVariable String fileId) {
		this.courseDataService.deleteTemporaryFile(courseId, fileId);
		return ApiResponse.OK(null);
	}

	/**
	 * 교육 자료 파일 다운로드 (이미지 표시 포함)
	 * 인증 헤더가 필요하므로 프론트에서 api.download() 로 Blob 을 받아 사용한다.
	 * 실패 시에는 GlobalExceptionHandler 가 공통 ApiResponse 로 응답한다.
	 */
	@RequireAction(domain = "COURSE_DATA", action = "READ", description = "교육 자료 조회")
	@GetMapping("/{courseId}/files/{fileId}")
	public ResponseEntity<Resource> downloadFile(@PathVariable String courseId,
	                                             @PathVariable String fileId) {
		Resource resource = this.courseDataService.loadFile(courseId, fileId);
		MediaType mediaType = MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM);

		return ResponseEntity.ok()
				.contentType(mediaType)
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(fileId).build().toString())
				.header("X-Content-Type-Options", "nosniff")
				.body(resource);
	}
}
