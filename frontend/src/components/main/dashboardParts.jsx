/**
 * 대시보드 공용 부품 (수강생 · 강사 대시보드가 함께 씀).
 * 과정 카드 · 종료된 과정(접힘) · 목록 패널 · 오늘 시간표. 상수 · 주소 · 훅은 dashboardShared.js
 */
import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import Panel from "../common/ui/Panel";
import Progress from "../common/ui/Progress";
import Badge from "../common/ui/Badge";
import Button from "../common/ui/Button";
import StatusBox from "../common/ui/StatusBox";
import {
  collectTodayLessons,
  courseBadge,
  dateProgress,
  isNowInSlot,
} from "./dashboardSummary";
import { COURSE_TAB, courseUrl, useNowTime } from "./dashboardShared";

export const LOADING_HINT = "불러오는 중...";

/**
 * 과정 카드. 진행 중이면 진행률(출석 요약, 못 불러오면 날짜 기준), 시작 전 · 종료는 기간 · 배지만.
 * showTutor: 강사 이름 표시 (강사 대시보드에서는 자기 이름이라 끔)
 */
export function CourseCard({ course, today, showTutor = true }) {
  const navigate = useNavigate();
  const badge = courseBadge(course, today);
  const isActive = course.phase === "active";
  const loaded = course.summary?.ok ? course.summary.value : null;
  // 시간표가 없으면(수업일 0) 수업일 기준 진행률을 낼 수 없어 날짜 기준으로 보여 준다
  const summary = loaded?.totalClassDays > 0 ? loaded : null;
  const summaryLoading = course.summary === undefined;

  let progressNote = "날짜 기준 진행률";
  if (summary) progressNote = `${summary.passedClassDays} / ${summary.totalClassDays} 수업일 (어제 기준)`;
  else if (summaryLoading) progressNote = LOADING_HINT;
  else if (loaded) progressNote = "시간표 미등록 · 날짜 기준 진행률";

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
        {showTutor && course.name ? ` · 강사 ${course.name}` : ""}
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
export function EndedCourses({ courses, today, showTutor = true }) {
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
              <CourseCard key={course.id} course={course} today={today} showTutor={showTutor} />
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

/** 목록 패널 공통: 불러오는 중 · 실패 · 빈 목록 · 항목 */
export function ListPanel({ title, subtitle, result, emptyTitle, renderItem }) {
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

export function TodayLessons({ active, today }) {
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
