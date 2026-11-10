package com.learningworks.course.vo.response;

import lombok.Data;

@Data
public class HomeworkReplyVO {
	private String id               ;
	private String homeworkId       ;
	private String content          ;
	private String crtDt            ;
	private String mdfyDt           ;
	private String delYn            ;
	private String courseStudentId  ;

}
