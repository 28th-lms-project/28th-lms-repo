package com.learningworks.counsel.vo.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 역량 수준 진단 수정 요청
 * - 진단 수준: 0(상), 1(중), 2(하), 진단 전이면 null
 * - courseStudentId: URL PathVariable 값을 서비스에서 채움
 */
@Data
public class CapabilityRequestVO {

	private String courseStudentId;

	@Min(value = 0, message = "진단 수준을 올바르게 선택해주세요.")
	@Max(value = 2, message = "진단 수준을 올바르게 선택해주세요.")
	private Integer capabilityStartLevel;

	@Size(max = 4000, message = "진단 내용은 4000자 이내로 입력해주세요.")
	private String capabilityStartDesc;

	@Min(value = 0, message = "진단 수준을 올바르게 선택해주세요.")
	@Max(value = 2, message = "진단 수준을 올바르게 선택해주세요.")
	private Integer capabilityMidLevel;

	@Size(max = 4000, message = "진단 내용은 4000자 이내로 입력해주세요.")
	private String capabilityMidDesc;

	@Min(value = 0, message = "진단 수준을 올바르게 선택해주세요.")
	@Max(value = 2, message = "진단 수준을 올바르게 선택해주세요.")
	private Integer capabilityEndLevel;

	@Size(max = 4000, message = "진단 내용은 4000자 이내로 입력해주세요.")
	private String capabilityEndDesc;
}
