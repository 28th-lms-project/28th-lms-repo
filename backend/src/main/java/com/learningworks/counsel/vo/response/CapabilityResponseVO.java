package com.learningworks.counsel.vo.response;

import lombok.Data;

/**
 * 역량 수준 진단 조회 응답 (진단 수준 0: 상, 1: 중, 2: 하)
 */
@Data
public class CapabilityResponseVO {
	private Integer capabilityStartLevel;
	private String capabilityStartDesc;
	private Integer capabilityMidLevel;
	private String capabilityMidDesc;
	private Integer capabilityEndLevel;
	private String capabilityEndDesc;
}
