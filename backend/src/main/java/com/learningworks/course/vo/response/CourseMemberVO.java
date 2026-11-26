package com.learningworks.course.vo.response;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Data;

@Data
public class CourseMemberVO {
	private String id              ;
	
	@JsonIgnore
	private String pwd             ;
	
	private String name            ;

	/** 동명이인 구분 문자 (화면 표시용 A · B ..., 동명이인이 없으면 null). 이름 데이터는 바꾸지 않음 */
	private String nameSuffix;
	private String githubUrl       ;
	private String crtDt           ;
	private String mdfyDt          ;
	private String pwdChangeDt     ;
	private String pwdFailCnt      ;
	private String baseRole        ;
	private String delYn           ;
	private String loginBlockDate  ;
	private String rowNum          ;
}
