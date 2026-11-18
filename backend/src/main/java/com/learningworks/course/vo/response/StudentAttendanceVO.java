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

	/** N(결석) 기록 횟수 — 어제까지. 출석 버튼을 결석 기준 시각 뒤에 누른 날만 생긴다 (버튼을 안 누른 날은 noRecordCount) */
	private int absentCount;

	/** 기록 없는 수업일 = 진행된 수업일 - (Y + L + N). 결석으로 센다 */
	private int noRecordCount;

	/** 지각을 결석으로 바꾼 수 = floor(L / 3) (지각 3번 = 결석 1번) */
	private int lateAbsentCount;

	/** 최종 결석 수 = N + 기록 없는 수업일 + floor(L / 3). 출석률 · 경고 계산에 쓰는 값 */
	private int totalAbsentCount;

	/** 출석 인정일 = 진행된 수업일 - 최종 결석 수 (0 미만이면 0) */
	private int attendedDays;

	/**
	 * 출석률 % (전체 기간 기준) = 출석 인정일 / 전체 수업일 * 100 (소수 1자리)
	 * 출석 인정일 = 진행된 수업일 - 결석 수
	 * 결석 수 = N + 기록 없는 수업일 + floor(L / 3)  (지각 3번 = 결석 1번)
	 */
	private double attendanceRate;

	/** 출석 인정일 / 진행된 수업일 이 80% 미만이면 true (진행된 수업일이 0이면 false) */
	private boolean warning;

}
