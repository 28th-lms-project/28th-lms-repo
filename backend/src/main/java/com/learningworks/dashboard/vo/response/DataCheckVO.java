package com.learningworks.dashboard.vo.response;

import lombok.Data;

/**
 * 손볼 데이터 한 건.
 * checkType
 * - NO_TIMETABLE: 끝나지 않은 과정인데 기간 안 시간표가 없음 (수업일 0 → 출석 · 진행률 계산 안 됨)
 * - NO_TUTOR: 끝나지 않은 과정인데 강사가 없음
 * - INVALID_TUTOR: 강사 ID가 회원에 없음 (detail = 그 ID)
 * - TIMETABLE_OUT_OF_PERIOD: 과정 기간 밖 시간표가 있음 (detail = 날짜 수)
 */
@Data
public class DataCheckVO {
	private String checkType;
	private String courseId;
	private String courseName;
	private String detail;
}
