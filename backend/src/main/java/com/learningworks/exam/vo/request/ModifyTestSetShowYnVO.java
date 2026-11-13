package com.learningworks.exam.vo.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/** 시험 세트 공개 여부 수정 요청 */
@Data
public class ModifyTestSetShowYnVO {

	@NotBlank(message = "공개 여부는 필수입니다.")
	@Pattern(regexp = "^[YN]$", message = "공개 여부는 Y 또는 N이어야 합니다.")
	private String showYn;

}
