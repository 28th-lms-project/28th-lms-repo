package com.learningworks.course.vo.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ModifyHomeworkVO {

	@NotBlank(message = "과제 내용을 입력해주세요.")
	private String content     ;

	/** "YYYY-MM-DD" */
	@NotBlank(message = "제출마감일을 선택해주세요.")
	private String endDate     ;

}
