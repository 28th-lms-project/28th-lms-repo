package com.learningworks.interview.vo.response;

import lombok.Data;

/**
 * 면접 일정 목록 조회 응답
 */
@Data
public class InterviewResponseVO {
	private String id;
	private String courseStudentId;
	private String studentName;
	private String interviewCompany;
	/** yyyy-MM-dd HH:mm */
	private String interviewDateTime;
}
