import { useCallback, useEffect, useState } from "react";
import {
  getAttendanceSummary,
  getCourses,
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

/** 강사가 여럿인 과정은 /course/view가 여러 줄로 준다 → id로 하나만 남긴다 */
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
 * 내 과정 목록을 먼저 받아 화면을 그리고, 진행 중 과정의 출석 요약 · 성적 · 시험 · 과제 · 오늘 시간표는
 * 각각 도착하는 대로 채운다 (느린 API 하나가 화면 전체를 붙잡지 않게).
 * 각 결과는 undefined(불러오는 중) → { ok, value | error }. 부르지 않는 결과는 null.
 *
 * @param {boolean} enabled  false면 부르지 않음 (수강생이 아닐 때)
 * @returns {{ status: "loading"|"loaded"|"failed", courses: object[], today: string, reload: () => void,
 *            patchResult: (courseId: string, key: string, result: object) => void }}
 *   patchResult: 한 과정의 결과 하나를 바꾼다 (출석 버튼을 누른 뒤 오늘 출결을 갱신할 때)
 */
export default function useStudentDashboard(enabled) {
  const [state, setState] = useState({ status: "loading", courses: [], today: "" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;
    const options = { signal };
    const today = toDateKey(new Date());

    const putResult = (courseId, key, result) => {
      if (signal.aborted) return;
      setState((prev) => ({
        ...prev,
        courses: prev.courses.map((course) =>
          course.id === courseId ? { ...course, [key]: result } : course,
        ),
      }));
    };

    getCourses(options)
      .then((list) => {
        if (signal.aborted) return;
        const courses = sortCourses(
          uniqueById(list ?? []).map((course) => {
            const phase = coursePhase(course, today);
            const notRequested = phase === "active" ? undefined : null;
            const results = Object.fromEntries(
              Object.keys(ACTIVE_REQUESTS).map((key) => [key, notRequested]),
            );
            return { ...course, phase, ...results };
          }),
        );
        setState({ status: "loaded", courses, today });

        for (const course of courses) {
          if (course.phase !== "active") continue;
          for (const [key, request] of Object.entries(ACTIVE_REQUESTS)) {
            request(course.id, options, today).then((result) => putResult(course.id, key, result));
          }
        }
      })
      .catch((error) => {
        if (signal.aborted || error?.name === "AbortError") return;
        setState({ status: "failed", courses: [], today });
      });

    return () => controller.abort();
  }, [enabled, reloadKey]);

  const patchResult = useCallback((courseId, key, result) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((course) =>
        course.id === courseId ? { ...course, [key]: result } : course,
      ),
    }));
  }, []);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, status: "loading" }));
    setReloadKey((key) => key + 1);
  }, []);

  return { ...state, reload, patchResult };
}
