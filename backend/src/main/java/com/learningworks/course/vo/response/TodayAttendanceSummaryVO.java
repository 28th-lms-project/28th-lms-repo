package com.learningworks.course.vo.response;

import lombok.Data;

/**
 * 과정의 오늘 출석 현황 (GET /{courseId}/attendance/today, 강사 · 관리자용).
 * 출석 요약(AttendanceSummaryVO)은 어제까지 기준이라 오늘 출석은 여기서 따로 센다.
 */
@Data
public class TodayAttendanceSummaryVO {

	/** 오늘이 수업일인지 (과정 기간 안에서 오늘 시간표가 있음. 출석 체크와 같은 기준) */
	private boolean classDay;

	/** 과정 수강생 수 */
	private int studentCount;

	/** 오늘 Y(출석) 기록 수 */
	private int presentCount;

	/** 오늘 L(지각) 기록 수 */
	private int lateCount;

	/** 오늘 N(결석 시각 뒤에 누름) 기록 수 */
	private int absentCount;

	/** 아직 출석 버튼을 누르지 않은 수강생 수 = studentCount - (Y + L + N) */
	private int notCheckedCount;
}
