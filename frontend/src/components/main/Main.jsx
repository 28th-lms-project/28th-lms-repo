import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PageHeader from "../common/ui/PageHeader";
import Panel from "../common/ui/Panel";
import StatCard from "../common/ui/StatCard";
import Progress from "../common/ui/Progress";
import Badge from "../common/ui/Badge";
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
  dDayLabel,
  dateProgress,
  summarizeAttendance,
  summarizeScores,
} from "./dashboardSummary";

const STUDENT_ROLE = "ROLE_STUDENT";

/** 수강 과정 화면(MyCourse)의 탭 번호 */
const COURSE_TAB = { attendance: 1, timetable: 2, homework: 3, test: 4 };
const courseUrl = (courseId, tab = 0) =>
  `/my/course/list/${encodeURIComponent(courseId)}?tab=${tab}`;

export default function Main() {
  const crumbs = useBreadcrumbs();
  const permissionStatus = useSelector(selectPermissionStatus);
  const roleId = useSelector(selectRoleId);
  const isStudent = permissionStatus === "loaded" && roleId === STUDENT_ROLE;

  let body;
  if (permissionStatus === "idle" || permissionStatus === "loading") {
    body = <StatusBox type="loading" />;
  } else if (permissionStatus === "failed") {
    body = <StatusBox type="error" title="내 권한을 불러오지 못했습니다." />;
  } else if (isStudent) {
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

  return (
    <div className="form-stack">
      <SummaryCards courses={courses} active={active} />
      <div className="card-grid">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} today={today} />
        ))}
      </div>
      {active.length > 0 && (
        <div className="layout-3col">
          <TodayLessons active={active} today={today} />
          <PendingTests active={active} />
          <OpenHomeworks active={active} today={today} />
        </div>
      )}
    </div>
  );
}

function SummaryCards({ courses, active }) {
  const attendance = summarizeAttendance(active);
  const scores = summarizeScores(active);
  const tests = collectPendingTests(active);

  let attendanceHint = `지각 ${attendance.late}회 · 결석 ${attendance.absent}회`;
  if (attendance.rate === null) {
    attendanceHint = attendance.anyFailed ? "불러오지 못했습니다" : "아직 수업일이 없습니다";
  }

  let scoreHint = `채점 끝난 시험 ${scores.count}개 (100점 환산)`;
  if (scores.average === null) {
    scoreHint = scores.anyFailed ? "불러오지 못했습니다" : "채점 끝난 시험이 없습니다";
  }
  if (scores.pending > 0) {
    scoreHint += ` · 채점 중 ${scores.pending}개`;
  }

  return (
    <div className="card-grid">
      <StatCard
        label="수강 중 과정"
        value={active.length}
        unit="개"
        hint={`전체 ${courses.length}개`}
      />
      <StatCard
        label="출석률"
        value={attendance.rate ?? "-"}
        unit={attendance.rate === null ? undefined : "%"}
        hint={attendance.warning ? `${attendanceHint} · 출석률 주의` : attendanceHint}
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
        value={tests.items.length}
        unit="개"
        hint={tests.anyFailed ? "일부 과정을 불러오지 못했습니다" : "공개됐고 아직 응시하지 않은 시험"}
      />
    </div>
  );
}

function CourseCard({ course, today }) {
  const navigate = useNavigate();
  const badge = courseBadge(course, today);
  const summary = course.summary?.ok ? course.summary.value : null;
  const progress = summary ? summary.progressRate : dateProgress(course, today);

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
      <Progress
        label={`${course.courseName} 진행률`}
        value={progress}
        tone={badge.tone === "warning" ? "warning" : "primary"}
        showValue
      />
      <p className="card-meta">
        {summary
          ? `${summary.passedClassDays} / ${summary.totalClassDays} 수업일 (어제 기준)`
          : "날짜 기준 진행률"}
      </p>
    </button>
  );
}

/** 목록 패널 공통: 실패 · 빈 목록 · 항목 */
function ListPanel({ title, subtitle, result, emptyTitle, renderItem }) {
  let content;
  if (result.items.length > 0) {
    content = <ul className="list-group">{result.items.map(renderItem)}</ul>;
  } else if (result.anyFailed) {
    content = <StatusBox type="error" size="sm" title="불러오지 못했습니다." />;
  } else {
    content = <StatusBox type="empty" size="sm" title={emptyTitle} />;
  }

  return (
    <Panel
      title={title}
      subtitle={subtitle}
      badge={result.items.length > 0 && result.anyFailed ? <Badge tone="warning">일부 못 불러옴</Badge> : undefined}
      flush
    >
      {content}
    </Panel>
  );
}

function TodayLessons({ active, today }) {
  const navigate = useNavigate();
  const showCourse = active.length > 1;

  return (
    <ListPanel
      title="오늘 시간표"
      subtitle={today}
      result={collectTodayLessons(active)}
      emptyTitle="오늘은 수업이 없습니다."
      renderItem={({ key, course, lesson }) => (
        <li key={key}>
          <button
            type="button"
            className="list-item"
            onClick={() => navigate(courseUrl(course.id, COURSE_TAB.timetable))}
          >
            <span>
              {lesson.subject || lesson.agenda || "수업"}
              {showCourse && <span className="card-meta"> · {course.courseName}</span>}
            </span>
            <span className="list-item-end">{lesson.time}</span>
          </button>
        </li>
      )}
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
        const dDay = dDayLabel(today, homework.endDate);
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
                <Badge tone={dDay === "오늘 마감" ? "warning" : "neutral"}>{dDay}</Badge>
              </span>
            </button>
          </li>
        );
      }}
    />
  );
}
