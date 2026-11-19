package com.learningworks.dashboard.vo.response;

import java.util.List;
import lombok.Data;

/**
 * 관리자 대시보드 (GET /dashboard/admin). 과정 등록 여부와 상관없이 전체 현황을 본다.
 * 과정 수 · 수강생 수는 삭제되지 않은 과정 기준, "진행 중" = 오늘이 과정 기간 안.
 */
@Data
public class AdminDashboardVO {

	/** 진행 중 과정 수 */
	private int activeCount;
	/** 시작 전 과정 수 */
	private int upcomingCount;
	/** 종료된 과정 수 */
	private int endedCount;
	/** 진행 중 과정의 수강생 수 (여러 과정을 들어도 한 명) */
	private int activeStudentCount;
	/** 진행 중 과정의 강사 수 (회원으로 있는 강사만) */
	private int activeTutorCount;

	/** 진행 중 과정 수강생 전원의 지금까지 출석률 평균 (출석 인정일 / 진행된 수업일). 진행된 수업일이 없으면 null */
	private Double averageRateSoFar;
	/** 진행 중 과정의 출석 주의 학생 수 합계 */
	private int warningStudentCount;
	/** 진행 중 과정의 채점 대기 답안 수 합계 */
	private int pendingAnswerCount;

	/** 진행 중 과정별 현황 (끝나는 날 순) */
	private List<AdminCourseVO> courses;
	/** 손볼 데이터 (시간표 미등록 · 강사 미배정 · 강사 ID 오류 · 기간 밖 시간표) */
	private List<DataCheckVO> dataChecks;
	/** 역할별 회원 수 (역할 순위 순) */
	private List<RoleMemberCountVO> roleMembers;
	/** 로그인이 잠긴 회원 수 (LOGIN_BLOCK_DATE 가 지금 이후) */
	private int lockedMemberCount;
}
