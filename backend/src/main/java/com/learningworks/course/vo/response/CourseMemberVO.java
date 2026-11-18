package com.learningworks.course.vo.response;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Data;

@Data
public class CourseMemberVO {
	private String id              ;
	
	@JsonIgnore
	private String pwd             ;
	
	private String name            ;
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
