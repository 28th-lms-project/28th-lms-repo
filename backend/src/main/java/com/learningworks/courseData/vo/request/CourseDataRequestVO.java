package com.learningworks.courseData.vo.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 교육 자료 등록 요청
 * - id: Mapper selectKey 로 생성
 * - courseId: URL PathVariable 값을 서비스에서 채움
 * - content: 에디터 본문 HTML (서비스에서 Sanitize 후 저장)
 */
@Data
public class CourseDataRequestVO {

	private String id;

	private String courseId;

	@NotBlank(message = "자료명을 입력해주세요.")
	@Size(max = 200, message = "자료명은 200자 이내로 입력해주세요.")
	private String dataName;

	@NotBlank(message = "교육 자료 내용을 입력해주세요.")
	@Size(max = 1000000, message = "교육 자료 내용이 너무 깁니다.")
	private String content;

	private String delYn;
}
