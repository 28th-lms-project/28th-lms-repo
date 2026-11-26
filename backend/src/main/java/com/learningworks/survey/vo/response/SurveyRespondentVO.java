package com.learningworks.survey.vo.response;

import lombok.Data;

/**
 * 과정 설문에 응답한 학생
 */
@Data
public class SurveyRespondentVO {

	/** 과정 수강생 ID. 강사 · 관리자(익명 조회)에게는 null */
	private String courseStudentId;

	/** 이름. 강사 · 관리자(익명 조회)에게는 "응답자 N" */
	private String name;

	/** 응답자 ID (첫 응답 행 ID). 답변 조회 키로 사용 */
	private String respondentId;

}
