package com.learningworks.course.service;

import java.util.List;
import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.vo.response.AttendanceSummaryVO;
import com.learningworks.course.vo.response.StudentAttendanceVO;

/**
 * 출석 요약 계산 (권한 확인 없음). 과정 출석 요약(CourseServiceImpl)과 관리자 대시보드가 같은 계산을 쓰기 위해 분리했다.
 * 권한 확인은 부르는 쪽에서 한다.
 *
 * 규칙
 * - 수업일 = 과정 기간 안에서 시간표가 있는 날 (CourseDaoMapper courseClassDays), 진행된 수업일 = 어제까지
 * - 최종 결석 = N 기록 + 출석 안 누른 수업일 + floor(지각 / 3)
 * - 출석 인정일 = 진행된 수업일 - 최종 결석
 * - 출석률(attendanceRate) = 출석 인정일 / 전체 수업일 (전체 기간 기준, 수료 판단용)
 * - 경고(warning) = 출석 인정일 / 진행된 수업일 이 80% 미만
 */
public final class AttendanceSummaries {

	/** 이 비율(진행된 수업일 대비 출석 인정일 %) 미만이면 출석 경고 */
	public static final double ATTENDANCE_WARNING_RATE = 80.0;

	/** 지각 이 횟수마다 결석 1번 */
	public static final int LATE_COUNT_PER_ABSENT = 3;

	private AttendanceSummaries() {}

	/**
	 * 과정의 출석 요약.
	 * @param userId 이 사람 것만 (수강생이 볼 때). null 이면 과정 수강생 전원
	 */
	public static AttendanceSummaryVO summarize(CourseDao courseDao, String courseId, String userId) {
		AttendanceSummaryVO summary = courseDao.readCourseClassDays(courseId);
		if (summary == null) {
			summary = new AttendanceSummaryVO();
		}
		int total = summary.getTotalClassDays();
		int passed = summary.getPassedClassDays();
		summary.setProgressRate(toPercent(passed, total));

		List<StudentAttendanceVO> students = courseDao.readStudentAttendanceCounts(courseId, userId);
		int attendedSum = 0;
		for (StudentAttendanceVO student : students) {
			int attended = fillAbsentCounts(student, passed);
			attendedSum += attended;
			student.setAttendanceRate(toPercent(attended, total));
			student.setWarning(isAttendanceWarning(attended, passed));
		}
		summary.setStudents(students);

		if (!students.isEmpty()) {
			double averageAttended = (double) attendedSum / students.size();
			double averageRate = students.stream().mapToDouble(StudentAttendanceVO::getAttendanceRate).average().orElse(0);
			summary.setAverageAttendanceRate(Math.round(averageRate * 10) / 10.0);
			summary.setAverageWarning(isAttendanceWarning(averageAttended, passed));
		}
		return summary;
	}

	/**
	 * 결석 환산 값을 student에 채우고 출석 인정일을 돌려준다.
	 * 기록 없는 수업일 = 진행된 수업일 - (Y + L + N)
	 * 최종 결석 수 = N + 기록 없는 수업일 + floor(L / 3)
	 * 출석 인정일 = 진행된 수업일 - 최종 결석 수
	 */
	static int fillAbsentCounts(StudentAttendanceVO student, int passedClassDays) {
		int recorded = student.getPresentCount() + student.getLateCount() + student.getAbsentCount();
		int noRecordDays = Math.max(0, passedClassDays - recorded);
		int lateAbsent = student.getLateCount() / LATE_COUNT_PER_ABSENT;
		int totalAbsent = student.getAbsentCount() + noRecordDays + lateAbsent;
		int attended = Math.max(0, passedClassDays - totalAbsent);

		student.setNoRecordCount(noRecordDays);
		student.setLateAbsentCount(lateAbsent);
		student.setTotalAbsentCount(totalAbsent);
		student.setAttendedDays(attended);
		return attended;
	}

	/** 진행된 수업일 대비 출석 인정일이 80% 미만이면 true. 진행된 수업일이 0이면 false */
	static boolean isAttendanceWarning(double attendedDays, int passedClassDays) {
		return passedClassDays > 0 && attendedDays * 100.0 / passedClassDays < ATTENDANCE_WARNING_RATE;
	}

	/** part / total * 100 (소수 1자리). total 이 0이면 0 */
	public static double toPercent(int part, int total) {
		if (total <= 0) {
			return 0;
		}
		return Math.round(part * 1000.0 / total) / 10.0;
	}
}
