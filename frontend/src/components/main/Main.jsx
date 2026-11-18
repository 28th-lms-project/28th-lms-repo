import { useEffect, useId, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PageHeader from "../common/ui/PageHeader";
import Panel from "../common/ui/Panel";
import StatCard from "../common/ui/StatCard";
import Progress from "../common/ui/Progress";
import Badge from "../common/ui/Badge";
import Button from "../common/ui/Button";
import StatusBox from "../common/ui/StatusBox";
import useBreadcrumbs from "../../hooks/useBreadcrumbs";
import {
  selectPermissionStatus,
  selectRoleId,
} from "../../store/slices/permissionSliceStore";
import useStudentDashboard from "./useStudentDashboard";
import {
  collectOpenHomeworks,
  collectPendingTests,
  collectTodayLessons,
  courseBadge,
  dateProgress,
  homeworkDue,
  isNowInSlot,
  summarizeAttendance,
  summarizeScores,
  toTimeKey,
} from "./dashboardSummary";

const STUDENT_ROLE = "ROLE_STUDENT";
const LOADING_HINT = "불러오는 중...";

/** 수강 과정 화면(MyCourse)의 탭 번호 */
const COURSE_TAB = { attendance: 1, timetable: 2, homework: 3, test: 4 };
const courseUrl = (courseId, tab = 0) =>
  `/my/course/list/${encodeURIComponent(courseId)}?tab=${tab}`;

export default function Main() {
  const crumbs = useBreadcrumbs();
  const permissionStatus = useSelector(selectPermissionStatus);
  const roleId = useSelector(selectRoleId);

  let body;
  if (permissionStatus === "idle" || permissionStatus === "loading") {
    body = <StatusBox type="loading" />;
  } else if (permissionStatus === "failed") {
    body = <StatusBox type="error" title="내 권한을 불러오지 못했습니다." />;
  } else if (roleId === STUDENT_ROLE) {
    body = <StudentDashboard />;
  } else {
    // 강사 · 조교 · 관리자용 대시보드는 대시보드 3단계에서 만든다
    body = (
      <StatusBox
        type="empty"
        title="이 역할의 대시보드는 준비 중입니다."
        detail="왼쪽 메뉴에서 화면을 골라 주세요."
      />
    );
  }

  return (
    <>
      <PageHeader crumbs={crumbs} title="대시보드" />
      {body}
    </>
  );
}

/**
 * 수강생 대시보드: 수치 → 오늘 할 일(시간표 · 시험 · 과제) → 내 과정 → 종료된 과정(접힘).
 * 과정 목록이 오면 바로 그리고, 각 카드 · 패널은 자기 데이터가 오는 대로 채운다.
 */
function StudentDashboard() {
  const { status, courses, today, reload } = useStudentDashboard(true);

  if (status === "loading") {
    return <StatusBox type="loading" />;
  }
  if (status === "failed") {
    return (
      <StatusBox
        type="error"
        title="내 과정을 불러오지 못했습니다."
        onRetry={reload}
      />
    );
  }
  if (courses.length === 0) {
    return (
      <StatusBox
        type="empty"
        title="수강 중인 과정이 없습니다."
        detail="과정에 등록되면 이곳에 진행 상황이 보입니다."
      />
    );
  }

  const active = courses.filter((course) => course.phase === "active");
  const current = courses.filter((course) => course.phase !== "ended");
  const ended = courses.filter((course) => course.phase === "ended");

  return (
    <div className="form-stack">
      <SummaryCards active={active} total={courses.length} />
      {active.length > 0 && (
        <div className="layout-3col">
          <TodayLessons active={active} today={today} />
          <PendingTests active={active} />
          <OpenHomeworks active={active} today={today} />
        </div>
      )}
      {current.length > 0 && (
        <Panel title="내 과정" subtitle={`${current.length}개`}>
          <div className="card-grid">
            {current.map((course) => (
              <CourseCard key={course.id} course={course} today={today} />
            ))}
          </div>
        </Panel>
      )}
      {ended.length > 0 && <EndedCourses courses={ended} today={today} />}
    </div>
  );
}

function SummaryCards({ active, total }) {
  const attendance = summarizeAttendance(active);
  const scores = summarizeScores(active);
  const tests = collectPendingTests(active);

  let attendanceHint = `지각 ${attendance.late}회 · 결석 ${attendance.absent}회`;
  if (attendance.rate === null) {
    if (attendance.loading) attendanceHint = LOADING_HINT;
    else if (attendance.anyFailed) attendanceHint = "불러오지 못했습니다";
    else attendanceHint = "아직 수업일이 없습니다";
  } else if (attendance.warning) {
    attendanceHint += " · 출석률 주의";
  }

  let scoreHint = `채점 끝난 시험 ${scores.count}개 (100점 환산)`;
  if (scores.average === null) {
    if (scores.loading) scoreHint = LOADING_HINT;
    else if (scores.anyFailed) scoreHint = "불러오지 못했습니다";
    else scoreHint = "채점 끝난 시험이 없습니다";
  }
  if (scores.pending > 0) {
    scoreHint += ` · 채점 중 ${scores.pending}개`;
  }

  let testHint = "공개됐고 아직 응시하지 않은 시험";
  if (tests.loading) testHint = LOADING_HINT;
  else if (tests.anyFailed) testHint = "일부 과정을 불러오지 못했습니다";

  return (
    <div className="card-grid">
      <StatCard
        label="수강 중 과정"
        value={active.length}
        unit="개"
        hint={`전체 ${total}개`}
      />
      <StatCard
        label="출석률"
        value={attendance.rate ?? "-"}
        unit={attendance.rate === null ? undefined : "%"}
        hint={attendanceHint}
        trend={attendance.warning ? "down" : undefined}
      />
      <StatCard
        label="평균 점수"
        value={scores.average ?? "-"}
        unit={scores.average === null ? undefined : "점"}
        hint={scoreHint}
      />
      <StatCard
        label="응시할 시험"
        value={tests.loading && tests.items.length === 0 ? "-" : tests.items.length}
        unit="개"
        hint={testHint}
      />
    </div>
  );
}

/** 과정 카드. 진행 중이면 진행률(출석 요약, 못 불러오면 날짜 기준), 시작 전 · 종료는 기간 · 배지만 */
function CourseCard({ course, today }) {
  const navigate = useNavigate();
  const badge = courseBadge(course, today);
  const isActive = course.phase === "active";
  const summary = course.summary?.ok ? course.summary.value : null;
  const summaryLoading = course.summary === undefined;

  let progressNote = "날짜 기준 진행률";
  if (summary) progressNote = `${summary.passedClassDays} / ${summary.totalClassDays} 수업일 (어제 기준)`;
  else if (summaryLoading) progressNote = LOADING_HINT;

  return (
    <button
      type="button"
      className="card card-clickable"
      onClick={() => navigate(courseUrl(course.id))}
    >
      <div className="card-header">
        <strong className="card-title">{course.courseName}</strong>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <p className="card-meta">
        {course.startDate} ~ {course.endDated}
        {course.name ? ` · 강사 ${course.name}` : ""}
      </p>
      {isActive && (
        <>
          <Progress
            label={`${course.courseName} 진행률`}
            value={summary ? summary.progressRate : dateProgress(course, today)}
            tone={badge.tone === "warning" ? "warning" : "primary"}
            showValue
          />
          <p className="card-meta">{progressNote}</p>
        </>
      )}
    </button>
  );
}

/** 종료된 과정: 처음에는 접어 두고, [펼치기]로 연다 */
function EndedCourses({ courses, today }) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <Panel
      title="종료된 과정"
      subtitle={`${courses.length}개`}
      flush={!open}
      actions={
        <Button
          size="sm"
          variant="text"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "접기" : "펼치기"}
        </Button>
      }
    >
      <div id={bodyId} hidden={!open}>
        {open && (
          <div className="card-grid">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} today={today} />
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

/** 목록 패널 공통: 불러오는 중 · 실패 · 빈 목록 · 항목 */
function ListPanel({ title, subtitle, result, emptyTitle, renderItem }) {
  let content;
  if (result.items.length > 0) {
    content = <ul className="list-group">{result.items.map(renderItem)}</ul>;
  } else if (result.loading) {
    content = <StatusBox type="loading" size="sm" />;
  } else if (result.anyFailed) {
    content = <StatusBox type="error" size="sm" title="불러오지 못했습니다." />;
  } else {
    content = <StatusBox type="empty" size="sm" title={emptyTitle} />;
  }

  return (
    <Panel
      title={title}
      subtitle={subtitle}
      badge={
        result.items.length > 0 && result.anyFailed ? (
          <Badge tone="warning">일부 못 불러옴</Badge>
        ) : undefined
      }
      flush
    >
      {content}
    </Panel>
  );
}

/** 지금 시각 "HH:MM" (1분마다 갱신, 지금 수업 표시용) */
function useNowTime() {
  const [now, setNow] = useState(() => toTimeKey(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setNow(toTimeKey(new Date())), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function TodayLessons({ active, today }) {
  const navigate = useNavigate();
  const nowTime = useNowTime();
  const showCourse = active.length > 1;

  return (
    <ListPanel
      title="오늘 시간표"
      subtitle={today}
      result={collectTodayLessons(active)}
      emptyTitle="오늘은 수업이 없습니다."
      renderItem={({ key, course, lesson, slot }) => {
        const isNow = isNowInSlot(slot, nowTime);
        return (
          <li key={key}>
            <button
              type="button"
              className={`list-item ${isNow ? "is-selected" : ""}`.trim()}
              aria-current={isNow ? "true" : undefined}
              onClick={() => navigate(courseUrl(course.id, COURSE_TAB.timetable))}
            >
              <span>
                {lesson.subject || lesson.content || "수업"}
                {showCourse && <span className="card-meta"> · {course.courseName}</span>}
              </span>
              <span className="list-item-end">
                {isNow && <Badge tone="info">진행 중</Badge>}
                {slot ? `${slot.label} ${slot.start}` : `${lesson.slotIndex}교시`}
              </span>
            </button>
          </li>
        );
      }}
    />
  );
}

function PendingTests({ active }) {
  const navigate = useNavigate();
  const result = collectPendingTests(active);

  return (
    <ListPanel
      title="응시할 시험"
      subtitle={result.items.length > 0 ? `${result.items.length}개` : undefined}
      result={result}
      emptyTitle="응시할 시험이 없습니다."
      renderItem={({ key, course, set }) => (
        <li key={key}>
          <button
            type="button"
            className="list-item"
            onClick={() => navigate(courseUrl(course.id, COURSE_TAB.test))}
          >
            <span>
              {set.setName}
              <span className="card-meta"> · {course.courseName}</span>
            </span>
            {set.testType && (
              <span className="list-item-end">
                <Badge tone="info">{set.testType}</Badge>
              </span>
            )}
          </button>
        </li>
      )}
    />
  );
}

function OpenHomeworks({ active, today }) {
  const navigate = useNavigate();
  const result = collectOpenHomeworks(active, today);

  return (
    <ListPanel
      title="마감 전 과제"
      subtitle={result.items.length > 0 ? `${result.items.length}건` : undefined}
      result={result}
      emptyTitle="마감 전 과제가 없습니다."
      renderItem={({ key, course, homework }) => {
        const due = homeworkDue(today, homework.endDate);
        return (
          <li key={key}>
            <button
              type="button"
              className="list-item"
              onClick={() => navigate(courseUrl(course.id, COURSE_TAB.homework))}
            >
              <span>
                {homework.subject}
                <span className="card-meta"> · {course.courseName}</span>
              </span>
              <span className="list-item-end">
                <Badge tone={due.tone}>{due.label}</Badge>
              </span>
            </button>
          </li>
        );
      }}
    />
  );
}
