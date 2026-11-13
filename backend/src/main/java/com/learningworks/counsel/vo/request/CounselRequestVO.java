package com.learningworks.counsel.vo.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 상담 기본 정보(성별 · 연락처) 등록 요청
 * - courseStudentId: URL PathVariable 값을 서비스에서 채움
 */
@Data
public class CounselRequestVO {

	private String courseStudentId;

	/** 1: 남자, 2: 여자 */
	@NotNull(message = "성별을 선택해주세요.")
	@Min(value = 1, message = "성별을 올바르게 선택해주세요.")
	@Max(value = 2, message = "성별을 올바르게 선택해주세요.")
	private Integer gender;

	@NotBlank(message = "연락처를 입력해주세요.")
	@Size(max = 100, message = "연락처는 100자 이내로 입력해주세요.")
	private String contact;
}
