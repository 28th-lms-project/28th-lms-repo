import { useCallback, useEffect, useState } from "react";
import {
  getAttendanceSummary,
  getCourses,
  getHomeworks,
} from "../../api/admin/course/courseApi.js";
import { getMyScoreList } from "../../api/my/course/scoreApi.js";
import { getDailyTimetable } from "../../api/my/course/timetableApi.js";
import { searchTestSets } from "../../api/admin/system/test/testApi.js";
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

/**
 * 수강생 대시보드 데이터.
 * 내 과정 목록을 받은 뒤, 과정마다 출석 요약을 부르고
 * 진행 중 과정은 성적 · 시험 · 과제 · 오늘 시간표까지 함께 부른다 (모두 병렬).
 *
 * @param {boolean} enabled  false면 부르지 않음 (수강생이 아닐 때)
 * @returns {{ status: "loading"|"loaded"|"failed", courses: object[], today: string, error?: Error, reload: () => void }}
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

    const loadCourse = async (course) => {
      const phase = coursePhase(course, today);
      const active = phase === "active";
      const [summary, scores, tests, homeworks, lessons] = await Promise.all([
        settle(getAttendanceSummary(course.id, options)),
        active ? settle(getMyScoreList(course.id, options)) : null,
        active ? settle(searchTestSets(course.id)) : null,
        active ? settle(getHomeworks(course.id, options)) : null,
        active ? settleLessons(getDailyTimetable(course.id, today, options)) : null,
      ]);
      return { ...course, phase, summary, scores, tests, homeworks, lessons };
    };

    getCourses(options)
      .then((list) => Promise.all(uniqueById(list ?? []).map(loadCourse)))
      .then((courses) => {
        if (signal.aborted) return;
        setState({ status: "loaded", courses: sortCourses(courses), today });
      })
      .catch((error) => {
        if (signal.aborted || error?.name === "AbortError") return;
        setState({ status: "failed", courses: [], today, error });
      });

    return () => controller.abort();
  }, [enabled, reloadKey]);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, status: "loading" }));
    setReloadKey((key) => key + 1);
  }, []);

  return { ...state, reload };
}
