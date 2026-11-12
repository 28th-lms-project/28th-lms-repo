package com.learningworks.courseData.vo.request;

import lombok.Data;

/**
 * 교육 자료 목록 검색 조건
 * - courseId: URL PathVariable 값을 서비스에서 채움
 * - page: 1부터 시작하는 페이지 번호 (기본 1)
 * - size: 페이지 크기 (기본 20)
 */
@Data
public class CourseDataSearchRequestVO {

	private String courseId;

	/** 자료명 검색어 (부분 일치) */
	private String dataName;

	private int page = 1;

	private int size = 20;

	/** LIKE 검색용으로 %, _, \ 를 이스케이프한 검색어 (서비스에서 채움) */
	private String dataNameKeyword;

	/** 조회 시작 위치 (서비스에서 채움) */
	private long offset;

	private String delYn;
}
