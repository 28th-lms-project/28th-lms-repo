/**
 * 대시보드 계산 함수 (화면 없이 데이터만 다룸).
 * useStudentDashboard가 불러온 과정별 결과를 카드 · 목록에 쓸 값으로 바꾼다.
 *
 * 과정별 결과(course)의 모양:
 *   { id, courseName, startDate, endDated, name(강사), phase,
 *     summary · scores · tests · homeworks · lessons: { ok: true, value } | { ok: false, error } | null(불러오지 않음) }
 */
import { toPercent } from "../../utils/scoreFormat.js";

/** 마감 임박으로 보는 남은 일수 (과정 종료일 기준) */
export const COURSE_ENDING_DAYS = 14;

/** 로컬 날짜 → "YYYY-MM-DD" */
export const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** "YYYY-MM-DD" 두 날짜 사이의 일수 (to - from) */
export const daysBetween = (from, to) => {
  const parse = (key) => {
    const [y, m, d] = key.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
};

/** 과정 단계: 시작 전(upcoming) · 진행 중(active) · 종료(ended) */
export const coursePhase = (course, today) => {
  if (course.startDate && today < course.startDate) return "upcoming";
  if (course.endDated && today > course.endDated) return "ended";
  return "active";
};

/** 진행 중 과정의 상태 배지 */
export const courseBadge = (course, today) => {
  if (course.phase === "upcoming") return { tone: "neutral", label: "시작 전" };
  if (course.phase === "ended") return { tone: "neutral", label: "종료" };
  if (course.endDated && daysBetween(today, course.endDated) <= COURSE_ENDING_DAYS) {
    return { tone: "warning", label: "마감 임박" };
  }
  return { tone: "info", label: "진행 중" };
};

/** 날짜 기준 진행률 (출석 요약을 못 불러왔을 때 대신 씀) */
export const dateProgress = (course, today) => {
  if (!course.startDate || !course.endDated) return 0;
  const total = daysBetween(course.startDate, course.endDated) + 1;
  const passed = daysBetween(course.startDate, today) + 1;
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((passed / total) * 1000) / 10));
};

const okValue = (result) => (result?.ok ? result.value : null);
const failed = (result) => result !== null && result !== undefined && !result.ok;

/** 화면에 보일 순서: 진행 중 → 시작 전 → 종료, 같은 단계는 시작일 순 */
const PHASE_ORDER = { active: 0, upcoming: 1, ended: 2 };
export const sortCourses = (courses) =>
  [...courses].sort(
    (a, b) =>
      PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase] ||
      String(a.startDate).localeCompare(String(b.startDate)),
  );

/**
 * 출석률: 진행 중 과정에서 본인 줄(수강생은 본인만 내려옴)을 모아 평균.
 * 수업일이 아직 지나지 않은 과정(passedClassDays 0)은 뺀다.
 */
export const summarizeAttendance = (activeCourses) => {
  const rows = [];
  let anyFailed = false;
  for (const course of activeCourses) {
    if (failed(course.summary)) anyFailed = true;
    const summary = okValue(course.summary);
    const me = summary?.students?.[0];
    if (me && summary.passedClassDays > 0) rows.push(me);
  }
  if (rows.length === 0) return { rate: null, late: 0, absent: 0, warning: false, anyFailed };
  const rate = rows.reduce((sum, row) => sum + row.attendanceRate, 0) / rows.length;
  return {
    rate: Math.round(rate * 10) / 10,
    late: rows.reduce((sum, row) => sum + (row.lateCount ?? 0), 0),
    absent: rows.reduce((sum, row) => sum + (row.absentCount ?? 0), 0),
    warning: rows.some((row) => row.warning),
    anyFailed,
  };
};

/**
 * 평균 점수: 채점이 끝난 시험만 100점 환산해서 평균.
 * 채점 중(pendingCount > 0)인 시험은 점수가 바뀔 수 있어 빼고 따로 센다.
 */
export const summarizeScores = (activeCourses) => {
  const percents = [];
  let pending = 0;
  let anyFailed = false;
  for (const course of activeCourses) {
    if (failed(course.scores)) anyFailed = true;
    for (const row of okValue(course.scores) ?? []) {
      if (row.score === null || row.score === undefined) continue;
      if (row.pendingCount > 0) {
        pending += 1;
        continue;
      }
      const percent = toPercent(row.score, row.totalPoint);
      if (percent !== null) percents.push(percent);
    }
  }
  if (percents.length === 0) return { average: null, count: 0, pending, anyFailed };
  const average = percents.reduce((sum, value) => sum + value, 0) / percents.length;
  return { average: Math.round(average * 10) / 10, count: percents.length, pending, anyFailed };
};

/** 응시할 시험: 공개(showYn Y)됐고 아직 내지 않은 시험 */
export const collectPendingTests = (activeCourses) => {
  const items = [];
  let anyFailed = false;
  for (const course of activeCourses) {
    if (failed(course.tests)) anyFailed = true;
    for (const set of okValue(course.tests) ?? []) {
      if (set.showYn === "Y" && set.submittedYn !== "Y") {
        items.push({ key: `${course.id}-${set.id}`, course, set });
      }
    }
  }
  return { items, anyFailed };
};

/**
 * 마감 전 과제: 마감일이 오늘 이후인 과제를 마감 순으로.
 * 내가 냈는지는 백엔드가 아직 알려 주지 않아 표시하지 않는다 (대시보드 2단계).
 */
export const collectOpenHomeworks = (activeCourses, today) => {
  const items = [];
  let anyFailed = false;
  for (const course of activeCourses) {
    if (failed(course.homeworks)) anyFailed = true;
    for (const homework of okValue(course.homeworks) ?? []) {
      if (homework.endDate && homework.endDate >= today) {
        items.push({ key: `${course.id}-${homework.id}`, course, homework });
      }
    }
  }
  items.sort((a, b) => a.homework.endDate.localeCompare(b.homework.endDate));
  return { items, anyFailed };
};

/** 오늘 시간표: 진행 중 과정의 오늘 수업을 시간 순으로 */
export const collectTodayLessons = (activeCourses) => {
  const items = [];
  let anyFailed = false;
  for (const course of activeCourses) {
    if (failed(course.lessons)) anyFailed = true;
    (okValue(course.lessons)?.lessons ?? []).forEach((lesson, index) => {
      items.push({ key: `${course.id}-${index}`, course, lesson });
    });
  }
  items.sort((a, b) => String(a.lesson.time).localeCompare(String(b.lesson.time)));
  return { items, anyFailed };
};

/** "D-3" · "오늘 마감" */
export const dDayLabel = (today, endDate) => {
  const days = daysBetween(today, endDate);
  return days === 0 ? "오늘 마감" : `D-${days}`;
};
