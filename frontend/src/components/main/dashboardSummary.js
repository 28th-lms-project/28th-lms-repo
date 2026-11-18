/**
 * 대시보드 계산 함수 (화면 없이 데이터만 다룸).
 * useStudentDashboard가 불러온 과정별 결과를 카드 · 목록에 쓸 값으로 바꾼다.
 *
 * 과정(course)의 모양:
 *   { id, courseName, startDate, endDated, name(강사), phase,
 *     summary · scores · tests · homeworks · lessons: 아래 결과 중 하나 }
 * 결과: undefined(불러오는 중) | null(부르지 않음) | { ok: true, value } | { ok: false, error }
 */
import { toPercent } from "../../utils/scoreFormat.js";

/** 마감 임박으로 보는 남은 일수 (과정 종료일 기준) */
export const COURSE_ENDING_DAYS = 14;
/** 과제 마감을 주의 색으로 보여 줄 남은 일수 (D-2까지) */
export const HOMEWORK_WARNING_DAYS = 2;

/**
 * 교시 → 시각. 백엔드 TimetableServiceImpl.TIME_SLOTS와 같게 둔다.
 * 일별 시간표 API(/timetable/{courseId}/{date})는 교시 번호(lessons[].slotIndex)만 주고 시각표를 주지 않아서 여기 둔다.
 * TODO(대시보드 2단계): 일별 응답에 timeSlots를 넣으면 이 표를 지우고 응답 값을 쓴다.
 */
export const TIME_SLOTS = [
  { slotIndex: 1, label: "1교시", start: "09:00", end: "10:00" },
  { slotIndex: 2, label: "2교시", start: "10:00", end: "11:00" },
  { slotIndex: 3, label: "3교시", start: "11:00", end: "12:00" },
  { slotIndex: 4, label: "점심시간", start: "12:00", end: "13:00" },
  { slotIndex: 5, label: "4교시", start: "13:00", end: "14:00" },
  { slotIndex: 6, label: "5교시", start: "14:00", end: "15:00" },
  { slotIndex: 7, label: "6교시", start: "15:00", end: "16:00" },
  { slotIndex: 8, label: "7교시", start: "16:00", end: "17:00" },
  { slotIndex: 9, label: "8교시", start: "17:00", end: "18:00" },
];

export const slotOf = (slotIndex) =>
  TIME_SLOTS.find((slot) => slot.slotIndex === Number(slotIndex));

/** 로컬 날짜 → "YYYY-MM-DD" */
export const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** 로컬 시각 → "HH:MM" */
export const toTimeKey = (date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

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

/** 과정 상태 배지 */
export const courseBadge = (course, today) => {
  if (course.phase === "upcoming") {
    return { tone: "neutral", label: `D-${daysBetween(today, course.startDate)} 시작` };
  }
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

const isFailed = (result) => result !== null && result !== undefined && !result.ok;
const isLoading = (result) => result === undefined;

/** 화면에 보일 순서: 진행 중 → 시작 전 → 종료, 진행 중은 끝나는 날 순 · 나머지는 시작일 순 */
const PHASE_ORDER = { active: 0, upcoming: 1, ended: 2 };
export const sortCourses = (courses) =>
  [...courses].sort((a, b) => {
    if (a.phase !== b.phase) return PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase];
    if (a.phase === "active") return String(a.endDated).localeCompare(String(b.endDated));
    if (a.phase === "ended") return String(b.endDated).localeCompare(String(a.endDated));
    return String(a.startDate).localeCompare(String(b.startDate));
  });

/** 여러 과정의 같은 결과(key)를 훑어 불러오는 중 · 실패 여부를 센다 */
const scan = (courses, key, visit) => {
  let loading = false;
  let anyFailed = false;
  for (const course of courses) {
    const result = course[key];
    if (isLoading(result)) loading = true;
    else if (isFailed(result)) anyFailed = true;
    else if (result?.ok) visit(result.value, course);
  }
  return { loading, anyFailed };
};

/**
 * 출석률: 진행 중 과정에서 본인 줄(수강생은 본인만 내려옴)을 모아 평균.
 * 수업일이 아직 지나지 않은 과정(passedClassDays 0)은 뺀다.
 */
export const summarizeAttendance = (activeCourses) => {
  const rows = [];
  const flags = scan(activeCourses, "summary", (summary) => {
    const me = summary?.students?.[0];
    if (me && summary.passedClassDays > 0) rows.push(me);
  });
  if (rows.length === 0) return { rate: null, late: 0, absent: 0, warning: false, ...flags };
  const rate = rows.reduce((sum, row) => sum + row.attendanceRate, 0) / rows.length;
  return {
    rate: Math.round(rate * 10) / 10,
    late: rows.reduce((sum, row) => sum + (row.lateCount ?? 0), 0),
    absent: rows.reduce((sum, row) => sum + (row.absentCount ?? 0), 0),
    warning: rows.some((row) => row.warning),
    ...flags,
  };
};

/**
 * 평균 점수: 채점이 끝난 시험만 100점 환산해서 평균.
 * 채점 중(pendingCount > 0)인 시험은 점수가 바뀔 수 있어 빼고 따로 센다.
 */
export const summarizeScores = (activeCourses) => {
  const percents = [];
  let pending = 0;
  const flags = scan(activeCourses, "scores", (rows) => {
    for (const row of rows ?? []) {
      if (row.score === null || row.score === undefined) continue;
      if (row.pendingCount > 0) {
        pending += 1;
        continue;
      }
      const percent = toPercent(row.score, row.totalPoint);
      if (percent !== null) percents.push(percent);
    }
  });
  if (percents.length === 0) return { average: null, count: 0, pending, ...flags };
  const average = percents.reduce((sum, value) => sum + value, 0) / percents.length;
  return { average: Math.round(average * 10) / 10, count: percents.length, pending, ...flags };
};

/** 응시할 시험: 공개(showYn Y)됐고 아직 내지 않은 시험 */
export const collectPendingTests = (activeCourses) => {
  const items = [];
  const flags = scan(activeCourses, "tests", (sets, course) => {
    for (const set of sets ?? []) {
      if (set.showYn === "Y" && set.submittedYn !== "Y") {
        items.push({ key: `${course.id}-${set.id}`, course, set });
      }
    }
  });
  return { items, ...flags };
};

/**
 * 마감 전 과제: 마감일이 오늘 이후인 과제를 마감 순으로.
 * 내가 냈는지는 백엔드가 아직 알려 주지 않아 표시하지 않는다 (대시보드 2단계).
 */
export const collectOpenHomeworks = (activeCourses, today) => {
  const items = [];
  const flags = scan(activeCourses, "homeworks", (homeworks, course) => {
    for (const homework of homeworks ?? []) {
      if (homework.endDate && homework.endDate >= today) {
        items.push({ key: `${course.id}-${homework.id}`, course, homework });
      }
    }
  });
  items.sort((a, b) => a.homework.endDate.localeCompare(b.homework.endDate));
  return { items, ...flags };
};

/**
 * 오늘 시간표: 진행 중 과정의 오늘 수업을 교시 순으로 (교시 → 시각은 TIME_SLOTS).
 * 수업 항목은 백엔드 LessonResponseVO { slotIndex, subject, content }.
 */
export const collectTodayLessons = (activeCourses) => {
  const items = [];
  const flags = scan(activeCourses, "lessons", (daily, course) => {
    for (const lesson of daily?.lessons ?? []) {
      items.push({
        key: `${course.id}-${lesson.slotIndex}`,
        course,
        lesson,
        slot: slotOf(lesson.slotIndex),
      });
    }
  });
  items.sort((a, b) => Number(a.lesson.slotIndex) - Number(b.lesson.slotIndex));
  return { items, ...flags };
};

/** 지금 시각(HH:MM)이 그 교시 안인지 */
export const isNowInSlot = (slot, nowTime) =>
  Boolean(slot) && slot.start <= nowTime && nowTime < slot.end;

/** 과제 마감 배지: "오늘 마감" · "D-3", D-2까지 주의 색 */
export const homeworkDue = (today, endDate) => {
  const days = daysBetween(today, endDate);
  return {
    label: days === 0 ? "오늘 마감" : `D-${days}`,
    tone: days <= HOMEWORK_WARNING_DAYS ? "warning" : "neutral",
  };
};
