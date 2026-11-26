package com.learningworks.counsel.vo.response;

import lombok.Data;

/**
 * 상담내용 목록 조회 응답
 */
@Data
public class ConsultDataResponseVO {
	private String id;
	/** yyyy-MM-dd HH:mm */
	private String consultDate;
	private String consultType;
	private String consultDesc;
}
