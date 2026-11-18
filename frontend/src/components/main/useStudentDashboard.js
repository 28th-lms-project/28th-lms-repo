import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAttendanceSummary,
  getHomeworks,
} from "../../api/admin/course/courseApi.js";
import { getMyScoreList } from "../../api/my/course/scoreApi.js";
import { getDailyTimetable } from "../../api/my/course/timetableApi.js";
import { searchTestSets } from "../../api/admin/system/test/testApi.js";
import { getTodayAttendance } from "../../api/my/course/attendanceApi.js";
import { coursePhase, sortCourses, toDateKey } from "./dashboardSummary.js";

/** 실패해도 다른 카드는 그리도록 결과를 { ok, value | error }로 감싼다 */
const settle = (promise) =>
  promise.then(
    (value) => ({ ok: true, value }),
    (error) => ({ ok: false, error }),
  );

/** 시간표 API는 그 날 시간표가 없으면 400을 준다 → "오늘 수업 없음"으로 본다 */
const settleLessons = (promise) =>
  promise.then(
    (value) => ({ ok: true, value }),
    (error) =>
      error?.httpStatusCode === 400
        ? { ok: true, value: { lessons: [] } }
        : { ok: false, error },
  );

/** 같은 과정이 두 번 오지 않도록 id로 하나만 남긴다 (/course/view는 과정마다 한 줄이지만 방어용) */
const uniqueById = (courses) => {
  const seen = new Map();
  for (const course of courses) {
    if (!seen.has(course.id)) seen.set(course.id, course);
  }
  return [...seen.values()];
};

/** 진행 중 과정마다 부르는 API (시작 전 · 종료 과정은 부르지 않음) */
const ACTIVE_REQUESTS = {
  summary: (id, options) => settle(getAttendanceSummary(id, options)),
  scores: (id, options) => settle(getMyScoreList(id, options)),
  tests: (id) => settle(searchTestSets(id)), // testApi는 signal을 받지 않음
  homeworks: (id, options) => settle(getHomeworks(id, options)),
  lessons: (id, options, today) => settleLessons(getDailyTimetable(id, today, options)),
  attendance: (id, options) => settle(getTodayAttendance(id, options)),
};

/**
 * 수강생 대시보드 데이터.
 * 과정 목록은 Main이 불러와 넘긴다 (수강생으로 등록된 과정만). 진행 중 과정의 출석 요약 · 성적 · 시험 · 과제 ·
 * 오늘 시간표 · 오늘 출결은 각각 도착하는 대로 채운다 (느린 API 하나가 화면 전체를 붙잡지 않게).
 * 각 결과는 undefined(불러오는 중) → { ok, value | error }. 부르지 않는 결과(시작 전 · 종료 과정)는 null.
 * Main이 과정 목록을 다시 불러오면 이 컴포넌트가 새로 그려져 결과도 처음부터 다시 받는다.
 *
 * @param {object[]} baseCourses  수강생으로 등록된 과정 (/course/view 응답 중 myRelation === "STUDENT")
 * @returns {{ courses: object[], today: string,
 *            patchResult: (courseId: string, key: string, result: object) => void }}
 *   patchResult: 한 과정의 결과 하나를 바꾼다 (출석 버튼을 누른 뒤 오늘 출결을 갱신할 때)
 */
export default function useStudentDashboard(baseCourses) {
  const [today] = useState(() => toDateKey(new Date()));
  // courseId → { summary, scores, ... } (도착한 결과만)
  const [results, setResults] = useState({});

  const listed = useMemo(
    () =>
      sortCourses(
        uniqueById(baseCourses ?? []).map((course) => ({
          ...course,
          phase: coursePhase(course, today),
        })),
      ),
    [baseCourses, today],
  );

  const patchResult = useCallback((courseId, key, result) => {
    setResults((prev) => ({ ...prev, [courseId]: { ...prev[courseId], [key]: result } }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    for (const course of listed) {
      if (course.phase !== "active") continue;
      for (const [key, request] of Object.entries(ACTIVE_REQUESTS)) {
        request(course.id, options, today).then((result) => {
          if (!controller.signal.aborted) patchResult(course.id, key, result);
        });
      }
    }
    return () => controller.abort();
  }, [listed, today, patchResult]);

  const courses = useMemo(
    () =>
      listed.map((course) => {
        const notRequested = course.phase === "active" ? undefined : null;
        const defaults = Object.fromEntries(
          Object.keys(ACTIVE_REQUESTS).map((key) => [key, notRequested]),
        );
        return { ...course, ...defaults, ...results[course.id] };
      }),
    [listed, results],
  );

  return { courses, today, patchResult };
}
