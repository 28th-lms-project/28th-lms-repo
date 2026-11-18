/**
 * 대시보드 공용 상수 · 주소 · 훅 (컴포넌트 파일과 분리: React Fast Refresh는 컴포넌트만 내보내는 파일에서 동작).
 */
import { useEffect, useState } from "react";
import { toTimeKey } from "./dashboardSummary";

/** 과정 화면(/my/course/list/:id, CourseItem)의 탭 번호 (CourseItem의 TABS 순서) */
export const COURSE_TAB = { attendance: 1, timetable: 2, homework: 3, test: 4, interview: 5, survey: 7, score: 9 };
export const courseUrl = (courseId, tab = 0) =>
  `/my/course/list/${encodeURIComponent(courseId)}?tab=${tab}`;

/** 지금 시각 "HH:MM" (1분마다 갱신, 지금 수업 · 출석 기준 표시용) */
export function useNowTime() {
  const [now, setNow] = useState(() => toTimeKey(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setNow(toTimeKey(new Date())), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
