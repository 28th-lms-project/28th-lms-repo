import { useCallback, useEffect, useMemo, useState } from "react";
import { coursePhase, sortCourses, toDateKey } from "./dashboardSummary.js";

/** 실패해도 다른 카드는 그리도록 결과를 { ok, value | error }로 감싼다 */
export const settle = (promise) =>
  promise.then(
    (value) => ({ ok: true, value }),
    (error) => ({ ok: false, error }),
  );

/** 시간표 API는 그 날 시간표가 없으면 400을 준다 → "오늘 수업 없음"으로 본다 */
export const settleLessons = (promise) =>
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

/**
 * 과정별 대시보드 데이터 (수강생 · 강사 공용).
 * 과정 목록은 Main이 불러와 넘긴다. 진행 중 과정마다 requests의 API를 부르고, 결과는 도착하는 대로 채운다
 * (느린 API 하나가 화면 전체를 붙잡지 않게). Main이 과정 목록을 다시 불러오면 컴포넌트가 새로 그려져 처음부터 다시 받는다.
 *
 * 과정마다 requests의 키별 결과: undefined(불러오는 중) → { ok, value | error }.
 * 부르지 않는 결과(시작 전 · 종료 과정, 권한이 없어 requests에서 null인 키)는 null.
 *
 * @param {object[]} baseCourses  이 대시보드가 다룰 과정 (/course/view 응답 중 일부). 렌더마다 새 배열이면 매번 다시 부르므로 useMemo로 고정해서 넘긴다
 * @param {Record<string, ((courseId: string, options: object, today: string) => Promise<object>) | null>} requests
 *   키 → 요청 함수. null이면 부르지 않음. 이것도 고정된 객체(모듈 상수나 useMemo)여야 한다
 * @returns {{ courses: object[], today: string,
 *            patchResult: (courseId: string, key: string, result: object) => void }}
 */
export default function useCourseDashboard(baseCourses, requests) {
  const [today] = useState(() => toDateKey(new Date()));
  // courseId → { 키: 결과 } (도착한 결과만)
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
      for (const [key, request] of Object.entries(requests)) {
        if (!request) continue;
        request(course.id, options, today).then((result) => {
          if (!controller.signal.aborted) patchResult(course.id, key, result);
        });
      }
    }
    return () => controller.abort();
  }, [listed, requests, today, patchResult]);

  const courses = useMemo(
    () =>
      listed.map((course) => {
        const active = course.phase === "active";
        const defaults = Object.fromEntries(
          Object.entries(requests).map(([key, request]) => [
            key,
            active && request ? undefined : null,
          ]),
        );
        return { ...course, ...defaults, ...results[course.id] };
      }),
    [listed, requests, results],
  );

  return { courses, today, patchResult };
}
