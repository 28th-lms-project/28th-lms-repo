package com.learningworks.course.vo.response;

import lombok.Data;

@Data
public class CourseMemberVO {
	private String id              ;
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
