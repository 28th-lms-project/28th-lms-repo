package com.learningworks.counsel.vo.response;

import lombok.Data;

/**
 * 과목별 성적 조회 응답
 */
@Data
public class ScoreResponseVO {
	private String testSetId;
	private String setName;
	private Double score;
}
