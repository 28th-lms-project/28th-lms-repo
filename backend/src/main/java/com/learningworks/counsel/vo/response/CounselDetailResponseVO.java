package com.learningworks.counsel.vo.response;

import lombok.Data;
import lombok.ToString;

/**
 * 교육생 기본 정보 조회 응답
 * - gender, contact 가 null 이면 상담 기본 정보(COURSE_CONSULT)가 아직 없는 수강생
 */
@Data
public class CounselDetailResponseVO {
	private String courseStudentId;
	private Integer courseNo;
	private String courseName;
	/** yyyy-MM-dd */
	private String startDate;
	/** yyyy-MM-dd */
	private String endDate;
	private String studentName;

	/** 동명이인 구분 문자 (화면 표시용 A · B ..., 동명이인이 없으면 null). 이름 데이터는 바꾸지 않음 */
	private String nameSuffix;
	/** 1: 남자, 2: 여자 */
	private Integer gender;
	/** 복호화한 연락처 (로그(toString)에 남기지 않음) */
	@ToString.Exclude
	private String contact;
}
