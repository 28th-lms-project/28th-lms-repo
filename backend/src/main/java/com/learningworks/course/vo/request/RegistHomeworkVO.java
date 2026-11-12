package com.learningworks.course.vo.request;

import lombok.Data;

@Data
public class RegistHomeworkVO {
	private String id            ;
	private String courseId      ;
	private String crtDt         ;
	private String subject       ;
	private String content       ;
	private String endDate       ;

}
