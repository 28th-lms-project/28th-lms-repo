package com.learningworks.course.vo.response;

import java.util.List;

import lombok.Data;

@Data
public class HomeworkVO {
	private String id         ;
	private String courseId   ;
	private String crtDt      ;
	private String mdfyDt     ;
	private String subject    ;
	private String content    ;
	private String endDate    ;
	
	private List<HomeworkReplyVO> homeworkReplies ;  
	private List<CourseMemberVO> courseMembers ; 
}
