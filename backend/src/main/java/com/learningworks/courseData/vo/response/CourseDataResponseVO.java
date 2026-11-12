package com.learningworks.courseData.vo.response;

import lombok.Data;

/**
 * 교육 자료 조회 응답 (목록 · 상세 공용)
 * - 목록 조회 시 content 는 조회하지 않는다 (null → 응답에서 제외)
 */
@Data
public class CourseDataResponseVO {
	private String id;
	private String courseId;
	private String dataName;
	/** yyyy-MM-dd HH:mm */
	private String crtDt;
	/** yyyy-MM-dd HH:mm */
	private String mdfyDt;
	/** 에디터 본문 HTML (상세 조회에서만 채움) */
	private String content;
	private String delYn;
}
