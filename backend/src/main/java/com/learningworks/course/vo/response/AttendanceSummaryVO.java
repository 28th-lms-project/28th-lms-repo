package com.learningworks.course.vo.response;

import java.util.List;

import lombok.Data;

/**
 * 과정 진행률 · 출석률 요약 (GET /{courseId}/attendance/summary).
 * 모든 값은 "어제까지" 기준이며 오늘은 제외한다.
 */
@Data
public class AttendanceSummaryVO {

	/** 전체 수업일 수 (COURSE 시작일 ~ 종료일 중 평일 수) */
	private int totalClassDays;

	/** 어제까지 진행된 수업일 수 */
	private int passedClassDays;

	/** 진행률 % = passedClassDays / totalClassDays * 100 (소수 1자리) */
	private double progressRate;

	/** 수강생 attendanceRate 평균 (소수 1자리) */
	private double averageAttendanceRate;

	/** 평균 출석 인정일 / passedClassDays 가 80% 미만이면 true */
	private boolean averageWarning;

	/** 수강생별 출석률. 수강생 본인이 조회하면 본인 한 명만 */
	private List<StudentAttendanceVO> students;

}
