/**
 * 출결(ATTENDANCE) API
 * 백엔드: AttendanceController (/attendances). 둘 다 로그인만 필요 (@LoginRequired), 이 과정의 수강생만
 */
import { api } from "../../common/apiClient.js";

const encode = (value) => encodeURIComponent(value);

/**
 * 오늘 내 출결
 * 반환: { attendDate, classDay, attendStatus, lgnDt, lateTime, absentTime }
 *       classDay: 오늘 출석할 수 있는 수업일인지 (과정 기간 안의 평일). false면 출석 버튼을 숨김
 *       attendStatus: Y 출석 · L 지각 · N 결석, 아직 안 눌렀으면 null
 *       lateTime · absentTime: 이 시각(HH:mm)까지 누르면 출석 · 지각
 * errorCode: COURSE_NOT_AUTHORIZED (이 과정 수강생이 아님)
 */
export const getTodayAttendance = (courseId, options) =>
  api.get(`/attendances/${encode(courseId)}/today`, undefined, options);

/**
 * 출석 체크 (오늘 한 번). 누른 시각으로 Y · L · N이 정해진다
 * 반환: { attendDate, attendStatus, lgnDt }
 * errorCode: COURSE_NOT_AUTHORIZED, ATTENDANCE_NOT_CLASS_DAY(수업일 아님),
 *            ATTENDANCE_ALREADY_CHECKED(이미 출석함)
 */
export const checkTodayAttendance = (courseId) =>
  api.post(`/attendances/${encode(courseId)}`);
