package com.learningworks.counsel.vo.response;

import lombok.Data;

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
	/** 1: 남자, 2: 여자 */
	private Integer gender;
	private String contact;
}
