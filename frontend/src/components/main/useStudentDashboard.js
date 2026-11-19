import {
  getAttendanceSummary,
  getHomeworks,
} from "../../api/admin/course/courseApi.js";
import { getMyScoreList } from "../../api/my/course/scoreApi.js";
import { getDailyTimetable } from "../../api/my/course/timetableApi.js";
import { searchTestSets } from "../../api/admin/system/test/testApi.js";
import { getTodayAttendance } from "../../api/my/course/attendanceApi.js";
import useCourseDashboard, { settle, settleLessons } from "./useCourseDashboard.js";

/** 수강생: 진행 중 과정마다 부르는 API (모듈 상수라 렌더마다 바뀌지 않음) */
const STUDENT_REQUESTS = {
  summary: (id, options) => settle(getAttendanceSummary(id, options)),
  scores: (id, options) => settle(getMyScoreList(id, options)),
  tests: (id) => settle(searchTestSets(id)), // testApi는 signal을 받지 않음
  homeworks: (id, options) => settle(getHomeworks(id, options)),
  lessons: (id, options, today) => settleLessons(getDailyTimetable(id, today, options)),
  attendance: (id, options) => settle(getTodayAttendance(id, options)),
};

/**
 * 수강생 대시보드 데이터 (수강생으로 등록된 과정).
 * 출석 요약 · 내 성적 · 시험 · 과제 · 오늘 시간표 · 오늘 출결. 동작은 useCourseDashboard 참고.
 *
 * @param {object[]} baseCourses  myRelation === "STUDENT"인 과정 (useMemo로 고정)
 */
export default function useStudentDashboard(baseCourses) {
  return useCourseDashboard(baseCourses, STUDENT_REQUESTS);
}
