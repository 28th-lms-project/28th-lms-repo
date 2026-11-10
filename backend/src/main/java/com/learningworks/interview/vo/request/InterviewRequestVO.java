package com.learningworks.interview.vo.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 면접 일정 등록 요청
 * - id: Mapper selectKey 로 생성
 * - courseId: URL PathVariable 값을 서비스에서 채움
 */
@Data
public class InterviewRequestVO {

	private String id;

	private String courseId;

	@NotBlank(message = "수강생을 선택해주세요.")
	private String courseStudentId;

	/** 프론트에서 "yyyy-MM-ddTHH:mm" 형식으로 전달 */
	@NotNull(message = "면접일시를 선택해주세요.")
	private LocalDateTime interviewDateTime;

	@NotBlank(message = "회사명을 입력해주세요.")
	@Size(max = 200, message = "회사명은 200자 이내로 입력해주세요.")
	private String interviewCompany;
}
