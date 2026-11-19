package com.learningworks.dashboard.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.learningworks.common.action.ActionCodeRegistry;
import com.learningworks.common.action.UnusedActionCodeReporter;
import com.learningworks.common.action.dao.ActionCodeDao;
import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.service.AttendanceSummaries;
import com.learningworks.course.vo.response.AttendanceSummaryVO;
import com.learningworks.course.vo.response.StudentAttendanceVO;
import com.learningworks.dashboard.dao.DashboardDao;
import com.learningworks.dashboard.vo.response.AdminCourseVO;
import com.learningworks.dashboard.vo.response.AdminDashboardVO;
import com.learningworks.dashboard.vo.response.SystemCheckVO;
import lombok.RequiredArgsConstructor;

/**
 * 관리자 · 슈퍼관리자 대시보드 (frontend/docs/design/dashboard-design.md 7장).
 * 권한은 컨트롤러에서 확인한다 (관리자: DASHBOARD_ADMIN_READ, 시스템 점검: SUPER_ADMIN).
 */
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

	private final DashboardDao dashboardDao;
	private final CourseDao courseDao;
	private final ActionCodeRegistry actionCodeRegistry;
	private final ActionCodeDao actionCodeDao;
	private final UnusedActionCodeReporter unusedActionCodeReporter;

	@Override
	@Transactional(readOnly = true)
	public AdminDashboardVO readAdminDashboard() {
		AdminDashboardVO dashboard = this.dashboardDao.selectCourseCounts();
		if (dashboard == null) {
			dashboard = new AdminDashboardVO();
		}

		// 진행 중 과정별 출석 현황: 과정 출석 요약과 같은 계산(AttendanceSummaries)을 쓴다
		List<AdminCourseVO> courses = this.dashboardDao.selectActiveCourses();
		double rateSum = 0;
		int rateCount = 0;
		int warningTotal = 0;
		int pendingTotal = 0;
		for (AdminCourseVO course : courses) {
			AttendanceSummaryVO summary = AttendanceSummaries.summarize(this.courseDao, course.getId(), null);
			int passed = summary.getPassedClassDays();
			course.setTotalClassDays(summary.getTotalClassDays());
			course.setPassedClassDays(passed);
			course.setProgressRate(summary.getProgressRate());

			double courseRateSum = 0;
			int courseRateCount = 0;
			int warnings = 0;
			for (StudentAttendanceVO student : summary.getStudents()) {
				if (student.isWarning()) {
					warnings++;
				}
				if (passed > 0) {
					// 지금까지 출석률 (출석 인정일 / 진행된 수업일): 주의 기준(진행된 수업일 80%)과 같은 숫자
					courseRateSum += AttendanceSummaries.toPercent(student.getAttendedDays(), passed);
					courseRateCount++;
				}
			}
			course.setWarningCount(warnings);
			course.setAverageRateSoFar(courseRateCount > 0 ? round1(courseRateSum / courseRateCount) : null);

			rateSum += courseRateSum;
			rateCount += courseRateCount;
			warningTotal += warnings;
			pendingTotal += course.getPendingAnswers();
		}
		dashboard.setCourses(courses);
		dashboard.setAverageRateSoFar(rateCount > 0 ? round1(rateSum / rateCount) : null);
		dashboard.setWarningStudentCount(warningTotal);
		dashboard.setPendingAnswerCount(pendingTotal);

		dashboard.setDataChecks(this.dashboardDao.selectDataChecks());
		dashboard.setRoleMembers(this.dashboardDao.selectRoleMemberCounts());
		dashboard.setLockedMemberCount(this.dashboardDao.selectLockedMemberCount());
		return dashboard;
	}

	@Override
	@Transactional(readOnly = true)
	public SystemCheckVO readSystemCheck() {
		Set<String> registered = new HashSet<>(this.actionCodeDao.selectRegisteredActionCodes());

		SystemCheckVO check = new SystemCheckVO();
		check.setUnregisteredCodes(this.actionCodeRegistry.getDefinitions().stream()
				.filter(definition -> !registered.contains(definition.actionCode()))
				.map(definition -> {
					SystemCheckVO.UnregisteredActionCodeVO item = new SystemCheckVO.UnregisteredActionCodeVO();
					item.setActionCode(definition.actionCode());
					item.setDescription(definition.description());
					item.setSource(definition.source());
					return item;
				})
				.toList());
		check.setUnusedCodes(this.unusedActionCodeReporter.findUnusedActionCodes());
		check.setUngrantedCodes(this.dashboardDao.selectUngrantedActionCodes());
		return check;
	}

	private static double round1(double value) {
		return Math.round(value * 10) / 10.0;
	}
}
