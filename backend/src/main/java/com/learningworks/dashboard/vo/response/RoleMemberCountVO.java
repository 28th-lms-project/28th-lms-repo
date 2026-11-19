package com.learningworks.dashboard.vo.response;

import lombok.Data;

/** 역할별 회원 수 (탈퇴 제외) */
@Data
public class RoleMemberCountVO {
	private String roleId;
	private String roleDisplayName;
	private int memberCount;
}
