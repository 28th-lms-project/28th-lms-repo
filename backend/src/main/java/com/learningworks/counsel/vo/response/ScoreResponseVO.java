package com.learningworks.counsel.vo.response;

import lombok.Data;

/**
 * 과목별 성적 조회 응답 (성적 탭과 같은 규칙으로 계산)
 */
@Data
public class ScoreResponseVO {
	private String testSetId;
	private String setName;
	private String testType;
	/** 시험 총점 */
	private Integer totalPoint;
	/** 획득 점수 (미응시면 null) */
	private Double score;
	/** 채점 중 문항 수 */
	private Integer pendingCount;
}
