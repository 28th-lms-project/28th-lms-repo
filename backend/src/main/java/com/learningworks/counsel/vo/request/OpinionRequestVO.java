package com.learningworks.counsel.vo.request;

import lombok.Data;

/**
 * 종합의견 수정 요청 (OPINION 컬럼은 CLOB)
 * - courseStudentId: URL PathVariable 값을 서비스에서 채움
 */
@Data
public class OpinionRequestVO {

	private String courseStudentId;

	private String opinion;
}
