package com.learningworks.course.vo.request;

import lombok.Data;

@Data
public class CourseMemberVO {
	private String id              ;
	private String pwd             ;
	private String name            ;
	private String githubUrl       ;
	private String crtDt           ;
	private String mdfyDt          ;
	private String pwdChangeD      ;
	private String pwdFailCnt      ;
	private String baseRole        ;
	private String delYn           ;
	private String loginBlockDate  ;
}
