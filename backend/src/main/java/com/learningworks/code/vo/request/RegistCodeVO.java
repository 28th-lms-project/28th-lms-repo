package com.learningworks.code.vo.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegistCodeVO {

	@NotBlank(message = "ID를 입력해주세요.")
	@Size(max = 20, message = "ID는 20자 이하로 입력해주세요.")
	private String id;

	@NotBlank(message = "이름을 입력해주세요.")
	@Size(max = 20, message = "이름은 20자 이하로 입력해주세요.")
	private String name;

	/** 대분류는 null */
	@Size(max = 20, message = "상위 변수 ID는 20자 이하로 입력해주세요.")
	private String parentId;

	@NotNull(message = "정렬 순서를 입력해주세요.")
	@Min(value = 0, message = "정렬 순서는 0 이상으로 입력해주세요.")
	private Integer order;

	/** 비어 있으면 DB 기본값 'Y' */
	@Pattern(regexp = "[YN]", message = "사용여부는 Y 또는 N만 가능합니다.")
	private String useYn;
}
