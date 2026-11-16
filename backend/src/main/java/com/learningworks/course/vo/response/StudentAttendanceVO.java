package com.learningworks.course.vo.response;

import lombok.Data;

/** 수강생 한 명의 출석 집계 · 출석률 (AttendanceSummaryVO.students) */
@Data
public class StudentAttendanceVO {

	/** USER.ID */
	private String userId;

	/** USER.NAME */
	private String name;

	/** Y(정상 출석) 횟수 — 어제까지 */
	private int presentCount;

	/** L(지각) 횟수 — 어제까지 */
	private int lateCount;

	/** N(결석) 횟수 — 어제까지 */
	private int absentCount;

	/**
	 * 출석률 % (전체 기간 기준) = 출석 인정일 / 전체 수업일 * 100 (소수 1자리)
	 * 출석 인정일 = 진행된 수업일 - 결석 수
	 * 결석 수 = N + 기록 없는 수업일 + floor(L / 3)  (지각 3번 = 결석 1번)
	 */
	private double attendanceRate;

	/** 출석 인정일 / 진행된 수업일 이 80% 미만이면 true (진행된 수업일이 0이면 false) */
	private boolean warning;

}
