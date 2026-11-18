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
 * 교시 → 시각. 일별 시간표 응답의 timeSlots 한 칸
 * { slotIndex, label, time: "09:00 ~ 10:00", breakTime }을 { slotIndex, label, start, end }로 바꾼다.
 */
export const parseSlot = (slot) => {
  const [start = "", end = ""] = String(slot?.time ?? "")
    .split("~")
    .map((part) => part.trim());
  return { slotIndex: slot?.slotIndex, label: slot?.label ?? "", start, end };
};

/** 일별 응답(daily)에서 교시 번호로 시각 찾기. 없으면 undefined */
export const slotOf = (daily, slotIndex) => {
  const slot = (daily?.timeSlots ?? []).find(
    (item) => Number(item.slotIndex) === Number(slotIndex),
  );
  return slot ? parseSlot(slot) : undefined;
};

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
  let noTimetable = false;
  const flags = scan(activeCourses, "summary", (summary) => {
    // 수업일 = 과정 기간 안에서 시간표가 있는 날. 0이면 시간표 미등록
    if (summary?.totalClassDays === 0) noTimetable = true;
    const me = summary?.students?.[0];
    if (me && summary.passedClassDays > 0) rows.push(me);
  });
  const sum = (key) => rows.reduce((total, row) => total + (row[key] ?? 0), 0);
  if (rows.length === 0) {
    return { rate: null, late: 0, lateAbsent: 0, absent: 0, warning: false, noTimetable, ...flags };
  }
  const rate = rows.reduce((total, row) => total + row.attendanceRate, 0) / rows.length;
  return {
    rate: Math.round(rate * 10) / 10,
    late: sum("lateCount"),
    // 지각 3번 = 결석 1번으로 바꾼 수 (서버 계산)
    lateAbsent: sum("lateAbsentCount"),
    // 최종 결석 = N 기록 + 출석 안 누른 수업일 + 지각 환산 (서버 계산)
    absent: sum("totalAbsentCount"),
    warning: rows.some((row) => row.warning),
    noTimetable,
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
 * 남은 과제: 마감일이 오늘 이후이고 아직 내지 않은(submittedYn !== "Y") 과제를 마감 순으로.
 * submitted: 마감 전인데 이미 낸 과제 수 (목록에서는 빼고 수만 보여 줌)
 */
export const collectOpenHomeworks = (activeCourses, today) => {
  const items = [];
  let submitted = 0;
  const flags = scan(activeCourses, "homeworks", (homeworks, course) => {
    for (const homework of homeworks ?? []) {
      if (!homework.endDate || homework.endDate < today) continue;
      if (homework.submittedYn === "Y") {
        submitted += 1;
        continue;
      }
      items.push({ key: `${course.id}-${homework.id}`, course, homework });
    }
  });
  items.sort((a, b) => a.homework.endDate.localeCompare(b.homework.endDate));
  return { items, submitted, ...flags };
};

/** 오늘 출결 상태 → 배지 */
export const ATTEND_STATUS = {
  Y: { tone: "success", label: "출석" },
  L: { tone: "warning", label: "지각" },
  N: { tone: "danger", label: "결석" },
};

/**
 * 오늘 출결: 진행 중 과정 중 오늘 수업일이거나 이미 기록이 있는 과정만.
 * 각 항목 { key, course, attendance(응답) }
 */
export const collectTodayAttendance = (activeCourses) => {
  const items = [];
  const flags = scan(activeCourses, "attendance", (attendance, course) => {
    if (attendance?.classDay || attendance?.attendStatus) {
      items.push({ key: course.id, course, attendance });
    }
  });
  return { items, ...flags };
};

/**
 * 지금 누르면 어떻게 처리되는지 (lateTime · absentTime은 서버 설정 HH:mm)
 * @returns {{ status: "Y"|"L"|"N", hint: string }}
 */
export const attendNowRule = (attendance, nowTime) => {
  const { lateTime, absentTime } = attendance ?? {};
  if (!lateTime || nowTime <= lateTime) {
    return { status: "Y", hint: lateTime ? `${lateTime}까지 출석` : "" };
  }
  if (!absentTime || nowTime <= absentTime) {
    return { status: "L", hint: `지금 누르면 지각 (${absentTime}까지)` };
  }
  return { status: "N", hint: "지금 누르면 결석으로 기록됩니다" };
};

/**
 * 오늘 시간표: 진행 중 과정의 오늘 수업을 교시 순으로 (교시 → 시각은 응답의 timeSlots).
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
        slot: slotOf(daily, lesson.slotIndex),
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

/* ───── 강사 대시보드 ───── */

/**
 * 지금까지 출석률 % = 출석 인정일(attendedDays) / 진행된 수업일 (소수 1자리). 진행된 수업일이 0이면 null.
 * 서버의 attendanceRate는 "과정 전체 수업일" 기준이라 과정 중간에는 빠진 날이 없어도 낮게 나온다.
 * 주의 표시(warning)는 진행된 수업일 기준(80%)이라, 강사 화면은 이 값과 기준을 맞춰 보여 준다.
 */
export const rateSoFar = (student, passedClassDays) =>
  passedClassDays > 0 && typeof student?.attendedDays === "number"
    ? Math.round((student.attendedDays / passedClassDays) * 1000) / 10
    : null;

/**
 * 강사: 담당 과정의 출석 요약.
 * rate: 담당 과정 수강생 전원의 "지금까지 출석률" 평균 (수업일이 지난 과정만), warningCount: 출석 주의 학생 수 합계
 */
export const summarizeTutorAttendance = (activeCourses) => {
  const rates = [];
  let warningCount = 0;
  let studentCount = 0;
  let noTimetable = false;
  const flags = scan(activeCourses, "summary", (summary) => {
    if (summary?.totalClassDays === 0) noTimetable = true;
    const students = summary?.students ?? [];
    studentCount += students.length;
    warningCount += students.filter((student) => student.warning).length;
    for (const student of students) {
      const rate = rateSoFar(student, summary.passedClassDays);
      if (rate !== null) rates.push(rate);
    }
  });
  const rate = rates.length > 0
    ? Math.round((rates.reduce((sum, value) => sum + value, 0) / rates.length) * 10) / 10
    : null;
  return { rate, warningCount, studentCount, noTimetable, ...flags };
};

/** 강사: 출석 주의 학생 (서버의 warning), 지금까지 출석률 낮은 순. 항목에 rate(지금까지 출석률) 포함 */
export const collectAttendanceWarnings = (activeCourses) => {
  const items = [];
  const flags = scan(activeCourses, "summary", (summary, course) => {
    for (const student of summary?.students ?? []) {
      if (student.warning) {
        const rate = rateSoFar(student, summary.passedClassDays);
        items.push({ key: `${course.id}-${student.userId}`, course, student, rate });
      }
    }
  });
  items.sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0));
  return { items, ...flags };
};

/**
 * 강사: 채점 대기. 과정 전체 성적(학생별 scoreList)을 시험별로 묶는다.
 * 항목: { key, course, testSetId, setName, pendingAnswers(채점 안 된 답안 수), pendingStudents, submitted(응시 학생), studentCount }
 * pendingAnswers가 있는 시험만, 많은 순. total: 전체 채점 대기 답안 수
 */
export const collectGradingQueue = (activeCourses) => {
  const items = [];
  let total = 0;
  const flags = scan(activeCourses, "courseScores", (students, course) => {
    const bySet = new Map();
    for (const student of students ?? []) {
      for (const row of student.scoreList ?? []) {
        const entry = bySet.get(row.testSetId) ?? {
          key: `${course.id}-${row.testSetId}`,
          course,
          testSetId: row.testSetId,
          setName: row.setName,
          pendingAnswers: 0,
          pendingStudents: 0,
          submitted: 0,
          studentCount: 0,
        };
        entry.studentCount += 1;
        if (row.score !== null && row.score !== undefined) entry.submitted += 1;
        if (row.pendingCount > 0) {
          entry.pendingAnswers += row.pendingCount;
          entry.pendingStudents += 1;
        }
        bySet.set(row.testSetId, entry);
      }
    }
    for (const entry of bySet.values()) {
      if (entry.pendingAnswers > 0) {
        items.push(entry);
        total += entry.pendingAnswers;
      }
    }
  });
  items.sort((a, b) => b.pendingAnswers - a.pendingAnswers);
  return { items, total, ...flags };
};
