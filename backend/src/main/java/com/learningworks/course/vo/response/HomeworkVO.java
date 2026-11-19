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

	/**
	 * 로그인 사용자가 이 과제에 삭제되지 않은 댓글(제출)을 남겼으면 Y, 아니면 N.
	 * 과제 목록(readHomeworkList)에서만 채운다. 수강생에게는 "제출함"의 뜻
	 */
	private String submittedYn;

	/** 이 과제에 삭제되지 않은 댓글(제출)을 남긴 수강생 수 (강사 · 조교 댓글은 세지 않음). 과제 목록에서만 채운다 */
	private Integer submittedCount;

	/** 과정 수강생 수 (제출률 분모). 과제 목록에서만 채운다 */
	private Integer studentCount;
	
	private List<HomeworkReplyVO> homeworkReplies ;  
	private List<CourseMemberVO> courseMembers ; 
}
