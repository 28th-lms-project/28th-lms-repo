package com.learningworks.course.vo.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ModifyCourseVO {

	/** COURSE.ID - 요청 본문이 아니라 URL 경로의 courseId 로 서비스에서 채운다 */
	private String id;

	/** COURSE.COURSE_NAME */
	@NotBlank(message = "과정 명을 입력해주세요.")
	private String courseName;

	/** COURSE.NO */
	@NotBlank(message = "과정 기수를 입력해주세요.")
	@Pattern(regexp = "^$|^\\d+$", message = "과정 기수는 숫자로 입력해주세요.") // COURSE.NO 는 NUMBER
	private String no;

	/** COURSE.START_DATE - <input type="date"> 값 (yyyy-MM-dd) */
	@NotBlank(message = "과정 시작일을 입력해주세요.")
	@Pattern(regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$", message = "과정 시작일은 yyyy-MM-dd 형식으로 입력해주세요.")
	private String startDate;

	/** COURSE.END_DATED - <input type="date"> 값 (yyyy-MM-dd) */
	@NotBlank(message = "과정 종료일을 입력해주세요.")
	@Pattern(regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$", message = "과정 종료일은 yyyy-MM-dd 형식으로 입력해주세요.")
	private String endDated;
	
	
	private String delYn;

}
