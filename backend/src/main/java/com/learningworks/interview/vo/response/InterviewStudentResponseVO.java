package com.learningworks.interview.vo.response;

import lombok.Data;

/**
 * 면접 일정 등록 시 선택할 과정 수강생 목록 응답
 */
@Data
public class InterviewStudentResponseVO {
	private String courseStudentId;
	private String studentName;

	/** 동명이인 구분 문자 (화면 표시용 A · B ..., 동명이인이 없으면 null). 이름 데이터는 바꾸지 않음 */
	private String nameSuffix;
}
