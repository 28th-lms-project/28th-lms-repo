import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../common/ui/PageHeader";
import Panel from "../common/ui/Panel";
import StatCard from "../common/ui/StatCard";
import Badge from "../common/ui/Badge";
import Button from "../common/ui/Button";
import StatusBox from "../common/ui/StatusBox";
import { useConfirm, useToast } from "../common/ui/feedbackContext";
import {
  checkTodayAttendance,
  getTodayAttendance,
} from "../../api/my/course/attendanceApi";
import useBreadcrumbs from "../../hooks/useBreadcrumbs";
import usePermission from "../../hooks/usePermission";
import useMyCourses from "./useMyCourses";
import useStudentDashboard from "./useStudentDashboard";
import TutorDashboard from "./TutorDashboard";
import {
  CourseCard,
  EndedCourses,
  ListPanel,
  LOADING_HINT,
  TodayLessons,
} from "./dashboardParts";
import { COURSE_TAB, courseUrl, useNowTime } from "./dashboardShared";
import styles from "./Main.module.css";
import {
  ATTEND_STATUS,
  attendNowRule,
  collectOpenHomeworks,
  collectTodayAttendance,
  collectPendingTests,
  homeworkDue,
  summarizeAttendance,
  summarizeScores,
} from "./dashboardSummary";

/**
 * 대시보드. 역할 ID가 아니라 "이 사람이 과정에서 무엇인지 + 권한"으로 영역을 고른다
 * (역할 ID를 비교하면 관리자가 화면에서 권한을 바꾸거나 새 역할을 만들어도 반영되지 않음. access-control-guide 9장).
 * - 수강생 영역: 수강생으로 등록된 과정(myRelation === "STUDENT")이 있을 때
 * - 강사 영역: 강사로 등록된 과정(myRelation === "TUTOR")이 있을 때 (TutorDashboard)
 * - 둘 다면 두 영역을 위아래로, 영역 제목을 붙여 구분
 * - 과정 조회 권한(COURSE_READ)이 없거나 어느 쪽도 아니면 안내만
 */
export default function Main() {
  const crumbs = useBreadcrumbs();
  const { can, status: permissionStatus } = usePermission();
  const canReadCourses = can("COURSE_READ");
  const myCourses = useMyCourses(
    permissionStatus === "loaded" && canReadCourses,
  );

  // 영역별 과정 (배열을 고정해 둬야 아래 대시보드가 렌더마다 다시 요청하지 않음)
  const studentCourses = useMemo(
    () => myCourses.courses.filter((course) => course.myRelation === "STUDENT"),
    [myCourses.courses],
  );
  const tutorCourses = useMemo(
    () => myCourses.courses.filter((course) => course.myRelation === "TUTOR"),
    [myCourses.courses],
  );

  let body;
  if (permissionStatus === "idle" || permissionStatus === "loading") {
    body = <StatusBox type="loading" />;
  } else if (permissionStatus === "failed") {
    body = <StatusBox type="error" title="내 권한을 불러오지 못했습니다." />;
  } else if (canReadCourses && myCourses.status === "loading") {
    body = <StatusBox type="loading" />;
  } else if (canReadCourses && myCourses.status === "failed") {
    body = (
      <StatusBox type="error" title="내 과정을 불러오지 못했습니다." onRetry={myCourses.reload} />
    );
  } else if (studentCourses.length === 0 && tutorCourses.length === 0) {
    body = (
      <StatusBox
        type="empty"
        title="대시보드에 보여 줄 정보가 없습니다."
        detail="과정에 수강생이나 강사로 등록되면 이곳에 진행 상황이 보입니다. 다른 화면은 왼쪽 메뉴에서 골라 주세요."
      />
    );
  } else {
    const both = studentCourses.length > 0 && tutorCourses.length > 0;
    body = (
      <div className={styles.sections}>
        {tutorCourses.length > 0 && (
          <section aria-label="강사 대시보드">
            {both && <h2 className={styles.sectionTitle}>담당 과정 (강사)</h2>}
            <TutorDashboard courses={tutorCourses} />
          </section>
        )}
        {studentCourses.length > 0 && (
          <section aria-label="수강생 대시보드">
            {both && <h2 className={styles.sectionTitle}>수강 중인 과정</h2>}
            <StudentDashboard courses={studentCourses} />
          </section>
        )}
      </div>
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
 * 수강생 대시보드: 수치 → 내 과정 → 오늘 출결 → 오늘 할 일(시간표 · 시험 · 남은 과제) → 종료된 과정(접힘).
 * 내 과정 카드(기간 · 진행률)를 먼저 보여 줘서 아래 오늘 할 일이 어느 과정 얘기인지 맥락을 준다.
 * 과정 목록이 오면 바로 그리고, 각 카드 · 패널은 자기 데이터가 오는 대로 채운다.
 */
function StudentDashboard({ courses: baseCourses }) {
  const { courses, today, patchResult } = useStudentDashboard(baseCourses);

  const active = courses.filter((course) => course.phase === "active");
  const current = courses.filter((course) => course.phase !== "ended");
  const ended = courses.filter((course) => course.phase === "ended");

  return (
    <div className="form-stack">
      <SummaryCards active={active} total={courses.length} today={today} />
      {current.length > 0 && (
        <Panel title="내 과정" subtitle={`${current.length}개`}>
          <div className="card-grid">
            {current.map((course) => (
              <CourseCard key={course.id} course={course} today={today} />
            ))}
          </div>
        </Panel>
      )}
      {active.length > 0 && <TodayAttendance active={active} patchResult={patchResult} />}
      {active.length > 0 && (
        <div className="layout-3col">
          <TodayLessons active={active} today={today} />
          <PendingTests active={active} />
          <OpenHomeworks active={active} today={today} />
        </div>
      )}
      {ended.length > 0 && <EndedCourses courses={ended} today={today} />}
    </div>
  );
}

function SummaryCards({ active, total, today }) {
  const attendance = summarizeAttendance(active);
  const scores = summarizeScores(active);
  const tests = collectPendingTests(active);
  const homeworks = collectOpenHomeworks(active, today);

  const lateNote = attendance.lateAbsent > 0 ? ` (결석 ${attendance.lateAbsent}회로 환산)` : "";
  let attendanceHint = `지각 ${attendance.late}회${lateNote} · 결석 ${attendance.absent}회`;
  if (attendance.rate === null) {
    if (attendance.loading) attendanceHint = LOADING_HINT;
    else if (attendance.anyFailed) attendanceHint = "불러오지 못했습니다";
    else if (attendance.noTimetable) attendanceHint = "과정 기간에 수업일(평일)이 없습니다";
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

  const nearest = homeworks.items[0];
  let homeworkHint = "마감 전 과제를 모두 냈습니다";
  if (homeworks.loading) homeworkHint = LOADING_HINT;
  else if (homeworks.anyFailed) homeworkHint = "일부 과정을 불러오지 못했습니다";
  else if (nearest) homeworkHint = `가장 빠른 마감: ${homeworkDue(today, nearest.homework.endDate).label}`;

  return (
    <div className="card-grid">
      <StatCard
        label="수강 중 과정"
        value={active.length}
        unit="개"
        hint={`전체 ${total}개`}
      />
      <StatCard
        label="출석률 (지금까지)"
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
      <StatCard
        label="남은 과제"
        value={homeworks.loading && homeworks.items.length === 0 ? "-" : homeworks.items.length}
        unit="건"
        hint={homeworkHint}
      />
    </div>
  );
}

<<<<<<< HEAD
/** 과정 카드. 진행 중이면 진행률(출석 요약, 못 불러오면 날짜 기준), 시작 전 · 종료는 기간 · 배지만 */
function CourseCard({ course, today }) {
  const navigate = useNavigate();
  const badge = courseBadge(course, today);
  const isActive = course.phase === "active";
  const loaded = course.summary?.ok ? course.summary.value : null;
  // 수업일(과정 기간의 평일)이 0이면 수업일 기준 진행률을 낼 수 없어 날짜 기준으로 보여 준다
  const summary = loaded?.totalClassDays > 0 ? loaded : null;
  const summaryLoading = course.summary === undefined;

  let progressNote = "날짜 기준 진행률";
  if (summary) progressNote = `${summary.passedClassDays} / ${summary.totalClassDays} 수업일 (평일 기준, 어제까지)`;
  else if (summaryLoading) progressNote = LOADING_HINT;
  else if (loaded) progressNote = "기간에 평일이 없음 · 날짜 기준 진행률";

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

=======
>>>>>>> dev
/**
 * 오늘 출결: 오늘 수업이 있는 과정마다 상태 배지, 아직 안 눌렀으면 [출석] 버튼.
 * 지각 · 결석으로 기록될 시각이면 누르기 전에 한 번 확인한다.
 */
function TodayAttendance({ active, patchResult }) {
  const toast = useToast();
  const confirm = useConfirm();
  const nowTime = useNowTime();
  const [pendingId, setPendingId] = useState(null);
  const result = collectTodayAttendance(active);

  // 오늘 수업이 있는 과정이 하나도 없으면 패널을 그리지 않는다 (오늘 시간표 패널이 "수업 없음"을 보여 줌)
  if (!result.loading && !result.anyFailed && result.items.length === 0) {
    return null;
  }

  const handleCheck = async (course, attendance) => {
    const rule = attendNowRule(attendance, nowTime);
    if (rule.status !== "Y") {
      const ok = await confirm({
        title: "출석",
        message: `지금 누르면 ${ATTEND_STATUS[rule.status].label}으로 기록됩니다. 출석할까요?`,
        confirmText: "출석",
        danger: rule.status === "N",
      });
      if (!ok) return;
    }
    setPendingId(course.id);
    try {
      const record = await checkTodayAttendance(course.id);
      patchResult(course.id, "attendance", { ok: true, value: { ...attendance, ...record } });
      toast.success(`${ATTEND_STATUS[record?.attendStatus]?.label ?? "출석"}으로 기록했습니다.`);
    } catch (error) {
      toast.error(error.message || "출석하지 못했습니다.");
      // 이미 출석함 등 서버 상태가 화면과 다를 수 있으니 다시 읽는다
      getTodayAttendance(course.id).then(
        (value) => patchResult(course.id, "attendance", { ok: true, value }),
        () => {},
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <ListPanel
      title="오늘 출결"
      result={result}
      emptyTitle="오늘 출석할 수업이 없습니다."
      renderItem={({ key, course, attendance }) => {
        const badge = ATTEND_STATUS[attendance.attendStatus];
        const rule = attendNowRule(attendance, nowTime);
        return (
          <li key={key}>
            <div className="list-item">
              <span>{course.courseName}</span>
              <span className="list-item-end">
                {badge ? (
                  <>
                    <span className="card-meta">{attendance.lgnDt?.slice(11)}</span>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </>
                ) : (
                  <>
                    <span className="card-meta">{rule.hint}</span>
                    <Button
                      size="sm"
                      variant="primary"
                      loading={pendingId === course.id}
                      disabled={pendingId !== null && pendingId !== course.id}
                      onClick={() => handleCheck(course, attendance)}
                    >
                      출석
                    </Button>
                  </>
                )}
              </span>
            </div>
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
      title="남은 과제"
      subtitle={[
        result.items.length > 0 ? `${result.items.length}건` : null,
        result.submitted > 0 ? `제출 ${result.submitted}건` : null,
      ]
        .filter(Boolean)
        .join(" · ") || undefined}
      result={result}
      emptyTitle={result.submitted > 0 ? "마감 전 과제를 모두 냈습니다." : "마감 전 과제가 없습니다."}
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
