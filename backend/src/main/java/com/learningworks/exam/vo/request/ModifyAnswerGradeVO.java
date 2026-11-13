package com.learningworks.exam.vo.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 답안 채점 결과 수정 요청.
 * Y: 정답, N: 오답, H: 부분정답 (R: 채점 중 은 자동 채점 전용이라 받지 않음)
 */
@Data
public class ModifyAnswerGradeVO {

	@NotBlank(message = "채점 결과는 필수입니다.")
	@Pattern(regexp = "^[YNH]$", message = "채점 결과는 Y, N, H 중 하나여야 합니다.")
	private String isCorrect;

}
