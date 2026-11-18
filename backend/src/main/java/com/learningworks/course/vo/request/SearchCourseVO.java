package com.learningworks.course.vo.request;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 과정 목록 검색 조건 (GET /admin/course/list 의 쿼리스트링)
 * 비어 있는 조건은 조회 조건에서 제외한다.
 */
@Data
public class SearchCourseVO {

	/** COURSE.NO (NUMBER) - 숫자만 */
	@Pattern(regexp = "^$|^\\d{1,10}$", message = "과정 기수는 숫자로 입력해주세요.")
	private String no;

	/** COURSE.COURSE_NAME - 포함 검색 */
	private String courseName;

	/** COURSE.START_DATE - <input type="date"> 값 (yyyy-MM-dd) */
	@Pattern(regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$", message = "과정 시작일은 yyyy-MM-dd 형식으로 입력해주세요.")
	private String startDate;

	/** COURSE.END_DATED - <input type="date"> 값 (yyyy-MM-dd) */
	@Pattern(regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$", message = "과정 종료일은 yyyy-MM-dd 형식으로 입력해주세요.")
	private String endDated;

}
