import { useMemo } from "react";
import { getAttendanceSummary } from "../../api/admin/course/courseApi.js";
import { getCourseScoreList } from "../../api/my/course/scoreApi.js";
import { getDailyTimetable } from "../../api/my/course/timetableApi.js";
import usePermission from "../../hooks/usePermission";
import useCourseDashboard, { settle, settleLessons } from "./useCourseDashboard.js";

/**
 * 강사 대시보드 데이터 (강사로 등록된 과정).
 * 권한이 있는 것만 부른다 (없으면 그 결과는 null이고 화면은 해당 카드 · 패널을 숨김).
 * - summary: 과정 수강생 전원의 출석 요약 (COURSE_ATTENDANCE_READ)
 * - courseScores: 과정 전체 성적, 학생별 · 시험별 점수와 채점 대기(pendingCount) (SCORE_READ_COURSE)
 * - lessons: 오늘 시간표 (COURSE_SCHEDULE_READ_ONE)
 *
 * @param {object[]} baseCourses  myRelation === "TUTOR"인 과정 (useMemo로 고정)
 */
export default function useTutorDashboard(baseCourses) {
  const { can } = usePermission();
  const canAttendance = can("COURSE_ATTENDANCE_READ");
  const canScores = can("SCORE_READ_COURSE");
  const canLessons = can("COURSE_SCHEDULE_READ_ONE");

  const requests = useMemo(
    () => ({
      summary: canAttendance ? (id, options) => settle(getAttendanceSummary(id, options)) : null,
      courseScores: canScores ? (id, options) => settle(getCourseScoreList(id, options)) : null,
      lessons: canLessons
        ? (id, options, today) => settleLessons(getDailyTimetable(id, today, options))
        : null,
    }),
    [canAttendance, canScores, canLessons],
  );

  const dashboard = useCourseDashboard(baseCourses, requests);
  return { ...dashboard, can: { attendance: canAttendance, scores: canScores, lessons: canLessons } };
}
