package com.learningworks.survey.vo.response;

import lombok.Data;

@Data
public class CourseSurveyVO {
	private String id;
	private String courseId;
	private String title;
	private String surveyGroup;
	private String surveySubject;
	private String surveyType;
	private int count;          // 항목 수
	private int answerCount;    // 참여한 수강생 수
	private int studentCount;   // 전체 수강생 수
	private String answeredYn;  // 로그인 사용자의 참여 여부 Y/N (목록 조회에서만 채움)

}
