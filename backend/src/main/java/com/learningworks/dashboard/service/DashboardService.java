package com.learningworks.dashboard.service;

import com.learningworks.dashboard.vo.response.AdminDashboardVO;
import com.learningworks.dashboard.vo.response.SystemCheckVO;

public interface DashboardService {

	/** 관리자 대시보드 (전체 과정 현황 · 데이터 점검 · 회원 현황) */
	AdminDashboardVO readAdminDashboard();

	/** 슈퍼관리자 시스템 점검 (권한 코드 등록 상태) */
	SystemCheckVO readSystemCheck();
}
