package com.learningworks.course.vo.response;

import java.util.List;

import lombok.Data;

@Data
public class CourseVO {
	private String id;
	private String courseName;
	private String no;
	private String startDate;
	private String endDated;
	private String delYn;
	
	private String name;

	/**
	 * 로그인 사용자와 이 과정의 관계 (과정 목록 /course/view에서만 채움).
	 * "TUTOR"(강사로 등록) · "STUDENT"(수강생으로 등록) · null(등록 안 됨, 예: 관리자가 보는 다른 과정).
	 * 둘 다면 TUTOR. 대시보드는 역할 ID가 아니라 이 값과 권한으로 보여 줄 영역을 고른다
	 */
	private String myRelation;
	
	
	private List<CourseMemberVO> members ; 
}
