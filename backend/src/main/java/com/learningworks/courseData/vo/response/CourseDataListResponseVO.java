package com.learningworks.courseData.vo.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 교육 자료 목록 조회 응답
 */
@Data
@AllArgsConstructor
public class CourseDataListResponseVO {
	private List<CourseDataResponseVO> list;
	/** 전체 데이터 건수 */
	private long totalCount;
	/** 현재 페이지 (1부터 시작) */
	private int page;
	/** 페이지 크기 */
	private int size;
	/** 전체 페이지 수 */
	private long totalPages;
}
