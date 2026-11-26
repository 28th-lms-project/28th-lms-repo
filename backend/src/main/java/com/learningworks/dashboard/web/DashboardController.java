package com.learningworks.dashboard.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.common.action.RequireAction;
import com.learningworks.common.action.RequireSuperAdmin;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.dashboard.service.DashboardService;
import com.learningworks.dashboard.vo.response.AdminDashboardVO;
import com.learningworks.dashboard.vo.response.SystemCheckVO;
import lombok.RequiredArgsConstructor;

/** 관리자 · 슈퍼관리자 대시보드 (frontend/docs/design/dashboard-design.md 7장) */
@RestController
@RequiredArgsConstructor
@RequestMapping("/dashboard")
public class DashboardController {

	private final DashboardService dashboardService;

	/**
	 * 관리자 대시보드: 과정 현황 · 진행 중 과정별 출석 · 채점 대기 · 데이터 점검 · 회원 현황.
	 * 과정 등록 여부와 상관없이 전체를 보므로 전용 권한 코드로 연다 (기존 회원 조회 권한은 강사에게도 있어 쓰지 않음).
	 */
	@RequireAction(domain = "DASHBOARD", action = "ADMIN_READ", description = "관리자 대시보드 조회")
	@GetMapping("/admin")
	public ApiResponse<AdminDashboardVO> readAdminDashboard() {
		return ApiResponse.OK(this.dashboardService.readAdminDashboard());
	}

	/** 슈퍼관리자 시스템 점검: 권한 코드 등록 상태 (미등록 · 미사용 · 아무 역할에도 없음). 권한 체계를 다루므로 SUPER_ADMIN 전용 */
	@RequireSuperAdmin
	@GetMapping("/system")
	public ApiResponse<SystemCheckVO> readSystemCheck() {
		return ApiResponse.OK(this.dashboardService.readSystemCheck());
	}
}
