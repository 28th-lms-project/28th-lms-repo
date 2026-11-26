/**
 * 대시보드 API (관리자 · 슈퍼관리자)
 * 백엔드: DashboardController (/dashboard)
 */
import { api } from "../common/apiClient.js";

/**
 * 관리자 대시보드: 과정 현황 · 진행 중 과정별 출석 · 채점 대기 · 데이터 점검 · 회원 현황
 * 권한: DASHBOARD_ADMIN_READ (SUPER_ADMIN은 항상)
 * @returns {Promise<{
 *   activeCount: number, upcomingCount: number, endedCount: number,
 *   activeStudentCount: number, activeTutorCount: number,
 *   averageRateSoFar: number | null, warningStudentCount: number, pendingAnswerCount: number,
 *   courses: { id: string, courseName: string, startDate: string, endDated: string, tutorNames: string | null,
 *              studentCount: number, pendingAnswers: number, totalClassDays: number, passedClassDays: number,
 *              progressRate: number, averageRateSoFar: number | null, warningCount: number }[],
 *   dataChecks: { checkType: "NO_TIMETABLE" | "NO_TUTOR" | "INVALID_TUTOR" | "TIMETABLE_OUT_OF_PERIOD",
 *                 courseId: string, courseName: string, detail: string | null }[],
 *   roleMembers: { roleId: string, roleDisplayName: string, memberCount: number }[],
 *   lockedMemberCount: number,
 * }>}
 */
export const getAdminDashboard = (options) =>
  api.get("/dashboard/admin", undefined, options);

/**
 * 슈퍼관리자 시스템 점검: 권한 코드 등록 상태
 * 권한: SUPER_ADMIN 전용
 * @returns {Promise<{
 *   unregisteredCodes: { actionCode: string, description: string, source: string }[],
 *   unusedCodes: string[],
 *   ungrantedCodes: string[],
 * }>}
 */
export const getSystemCheck = (options) =>
  api.get("/dashboard/system", undefined, options);
