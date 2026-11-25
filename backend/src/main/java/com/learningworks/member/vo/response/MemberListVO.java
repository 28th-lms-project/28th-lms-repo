package com.learningworks.member.vo.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberListVO {

  private String id;
  private String name;

	/** 동명이인 구분 문자 (화면 표시용 A · B ..., 동명이인이 없으면 null). 이름 데이터는 바꾸지 않음 */
	private String nameSuffix;
  private String baseRole;
  private String roleName; // ROLE 조인
  private String createDate;
  private String loginBlockDate;
}
