package com.learningworks.course.vo.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 과제 댓글 수정 요청 (JSON body) - 작성자 본인만
 */
@Data
public class ModifyHomeworkReplyVO {

	/** COURSE_HOMEWORK_REPLY.ID - 경로 값(@PathVariable)으로 서버에서 채운다. */
	private String id;

	/** COURSE_HOMEWORK_REPLY.HOMEWORK_ID - 경로 값(@PathVariable)으로 서버에서 채운다. */
	private String homeworkId;

	/** COURSE_HOMEWORK_REPLY.CONTENT - VARCHAR2(500 CHAR), NOT NULL */
	@NotBlank(message = "댓글 내용을 입력해주세요.")
	@Size(max = 500, message = "댓글 내용은 500자 이하로 입력해주세요.")
	private String content;

	/** COURSE_HOMEWORK_REPLY.COURSE_STUDENT_ID - 로그인 사용자 ID로 서버에서 채운다. (작성자 본인 조건) */
	private String courseStudentId;

}
