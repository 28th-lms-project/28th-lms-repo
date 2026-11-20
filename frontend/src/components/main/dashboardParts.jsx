/**
 * 대시보드 공용 부품 (수강생 · 강사 대시보드가 함께 씀).
 * 과정 카드 · 종료된 과정(접힘) · 목록 패널 · 오늘 시간표. 상수 · 주소 · 훅은 dashboardShared.js
 */
import { useEffect, useId, useRef, useState } from "react";
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
  isNowInBlock,
  isPastBlock,
  lessonBlockLabel,
  lessonBlockTime,
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

/**
 * 목록 패널 공통: 불러오는 중 · 실패 · 빈 목록 · 항목
 * listClassName · listRef: 목록(ul)에 붙일 클래스 · ref (오늘 시간표의 내부 스크롤용)
 */
export function ListPanel({ title, subtitle, result, emptyTitle, renderItem, listClassName, listRef }) {
  let content;
  if (result.items.length > 0) {
    content = (
      <ul ref={listRef} className={`list-group ${listClassName ?? ""}`.trim()}>
        {result.items.map(renderItem)}
      </ul>
    );
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

/**
 * 오늘 시간표. 이어지는 같은 수업은 한 줄로 묶고(collectTodayLessons), 목록이 길면 패널 안에서만 스크롤한다.
 * 끝난 수업은 남은 수업이 있는 동안 "지난 수업 N개" 한 줄로 접어 두고, 모두 끝나면 흐리게 전부 보여 준다.
 * 지금 수업(없으면 다음 수업)이 보이도록 목록 안에서 스크롤을 맞춘다.
 */
export function TodayLessons({ active, today }) {
  const navigate = useNavigate();
  const nowTime = useNowTime();
  const [showPast, setShowPast] = useState(false);
  const listRef = useRef(null);
  const showCourse = active.length > 1;

  const result = collectTodayLessons(active);
  const past = result.items.filter((block) => isPastBlock(block, nowTime));
  const rest = result.items.filter((block) => !isPastBlock(block, nowTime));
  const foldPast = past.length > 0 && rest.length > 0;

  let items = result.items;
  if (foldPast) {
    items = [{ key: "past-toggle", toggle: true }, ...(showPast ? past : []), ...rest];
  }
  // 스크롤 기준: 지금 수업, 없으면 다음 수업
  const anchorKey = (rest.find((block) => isNowInBlock(block, nowTime)) ?? rest[0])?.key;

  useEffect(() => {
    const list = listRef.current;
    const anchor = list?.querySelector("[data-scroll-anchor]");
    if (!list || !anchor) return;
    // 페이지는 그대로 두고 목록 안에서만 맞춘다 (scrollIntoView는 페이지까지 움직임)
    const top = anchor.offsetTop;
    const bottom = top + anchor.offsetHeight;
    if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = top;
    }
  }, [anchorKey, showPast, items.length]);

  return (
    <ListPanel
      title="오늘 시간표"
      subtitle={today}
      result={{ ...result, items }}
      emptyTitle="오늘은 수업이 없습니다."
      listClassName="list-group-scroll"
      listRef={listRef}
      renderItem={(block) => {
        if (block.toggle) {
          return (
            <li key={block.key}>
              <button
                type="button"
                className="list-item is-muted"
                aria-expanded={showPast}
                onClick={() => setShowPast((value) => !value)}
              >
                <span>{showPast ? "지난 수업 접기" : `지난 수업 ${past.length}개`}</span>
                <span className="list-item-end">{showPast ? "접기" : "보기"}</span>
              </button>
            </li>
          );
        }
        const isNow = isNowInBlock(block, nowTime);
        const isPast = isPastBlock(block, nowTime);
        const label = lessonBlockLabel(block);
        let stateClass = "";
        if (isNow) stateClass = "is-selected";
        else if (isPast) stateClass = "is-muted";
        return (
          <li key={block.key}>
            <button
              type="button"
              className={`list-item ${stateClass}`.trim()}
              aria-current={isNow ? "true" : undefined}
              data-scroll-anchor={block.key === anchorKey ? "" : undefined}
              onClick={() => navigate(courseUrl(block.course.id, COURSE_TAB.timetable))}
            >
              <span>
                {block.title}
                {showCourse && <span className="card-meta"> · {block.course.courseName}</span>}
              </span>
              <span className="list-item-end">
                {isNow && <Badge tone="info">진행 중</Badge>}
                {label ? `${label} ${lessonBlockTime(block)}` : `${block.firstIndex}교시`}
              </span>
            </button>
          </li>
        );
      }}
    />
  );
}
