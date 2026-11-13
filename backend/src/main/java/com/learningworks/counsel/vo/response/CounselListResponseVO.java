package com.learningworks.counsel.vo.response;

import lombok.Data;

/**
 * 수강생-종합의견 목록 조회 응답
 */
@Data
public class CounselListResponseVO {
	private String courseStudentId;
	private String studentName;
	private String opinion;
}
