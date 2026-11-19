package com.learningworks.dashboard.vo.response;

import lombok.Data;

/** 관리자 대시보드의 진행 중 과정 한 줄 */
@Data
public class AdminCourseVO {

	private String id;
	private String courseName;
	private String startDate;
	private String endDated;
	/** 강사 이름 (여럿이면 ", "로 연결, 없으면 null) */
	private String tutorNames;
	private int studentCount;
	/** 채점 대기 답안 수 (IS_CORRECT = 'R') */
	private int pendingAnswers;

	// 아래는 출석 요약(AttendanceSummaries)으로 채운다
	private int totalClassDays;
	private int passedClassDays;
	/** 진행률 % (진행된 수업일 / 전체 수업일). 시간표가 없으면 0 */
	private double progressRate;
	/** 수강생 지금까지 출석률 평균. 진행된 수업일이나 수강생이 없으면 null */
	private Double averageRateSoFar;
	/** 출석 주의 학생 수 */
	private int warningCount;
}
