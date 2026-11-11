package com.learningworks.interview.vo.response;

import lombok.Data;

/**
 * 면접 일정 등록 시 선택할 과정 수강생 목록 응답
 */
@Data
public class InterviewStudentResponseVO {
	private String courseStudentId;
	private String studentName;
}
