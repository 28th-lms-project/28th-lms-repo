package com.learningworks.counsel.vo.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 상담내용 등록 요청
 * - id: Mapper selectKey 로 생성
 * - courseStudentId: URL PathVariable 값을 서비스에서 채움
 * - consultUser: 로그인 사용자 ID 를 서비스에서 채움
 */
@Data
public class ConsultDataRequestVO {

	private String id;

	private String courseStudentId;

	private String consultUser;

	@NotBlank(message = "상담 유형을 선택해주세요.")
	@Pattern(regexp = "학습|진로|취업|기타", message = "상담 유형을 올바르게 선택해주세요.")
	private String consultType;

	@NotBlank(message = "상담내용을 입력해주세요.")
	@Size(max = 4000, message = "상담내용은 4000자 이내로 입력해주세요.")
	private String consultDesc;
}
