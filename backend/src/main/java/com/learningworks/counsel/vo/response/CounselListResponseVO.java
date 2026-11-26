package com.learningworks.counsel.vo.response;

import lombok.Data;

/**
 * 수강생-종합의견 목록 조회 응답
 */
@Data
public class CounselListResponseVO {
	private String courseStudentId;
	private String studentName;

	/** 동명이인 구분 문자 (화면 표시용 A · B ..., 동명이인이 없으면 null). 이름 데이터는 바꾸지 않음 */
	private String nameSuffix;
	private String opinion;
}
