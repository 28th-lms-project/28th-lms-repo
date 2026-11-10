package com.learningworks.course.vo.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegistCourseVO {

	/** COURSE.ID - 등록 시 Mapper 의 selectKey 로 생성되므로 요청 값으로 검증하지 않는다. */
	private String id;

	/** COURSE.COURSE_NAME */
	@NotBlank(message = "과정 명을 입력해주세요.")
	private String courseName;

	/** COURSE.NO */
	@NotBlank(message = "과정 기수를 입력해주세요.")
	private String no;

	/** COURSE.START_DATE - <input type="date"> 값 (yyyy-MM-dd) */
	@NotBlank(message = "과정 시작일을 입력해주세요.")
	@Pattern(regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$", message = "과정 시작일은 yyyy-MM-dd 형식으로 입력해주세요.")
	private String startDate;

	/** COURSE.END_DATED - <input type="date"> 값 (yyyy-MM-dd) */
	@NotBlank(message = "과정 종료일을 입력해주세요.")
	@Pattern(regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$", message = "과정 종료일은 yyyy-MM-dd 형식으로 입력해주세요.")
	private String endDated;

	/** COURSE_STUDENT.USER_ID 목록 (선택하지 않으면 null) */
	private List<String> studentId;

	/** COURSE_TUTOR.TUTOR_ID */
	@NotBlank(message = "강사를 선택해주세요.")
	private String tutorId;

}
