import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import Badge from "../../common/ui/Badge.jsx";
import Panel from "../../common/ui/Panel.jsx";
import StatCard from "../../common/ui/StatCard.jsx";
import StatusBox from "../../common/ui/StatusBox.jsx";
import Table from "../../common/ui/Table.jsx";
import { getTimetable } from "../../../api/my/course/timetableApi.js";
import styles from "./CourseCurriculum.module.css";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const STATUS = {
  done: { label: "완료", tone: "success" },
  current: { label: "진행 중", tone: "primary" },
  upcoming: { label: "예정", tone: "neutral" },
};

/** "YYYY-MM-DD" → 현지 자정 Date */
const toDate = (text) => {
  const [year, month, day] = text.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/** 그 주 월요일 */
const mondayOf = (date) => {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return monday;
};

const toKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const shortDate = (text) => {
  const date = toDate(text);
  return `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAYS[date.getDay()]})`;
};

/**
 * 하루 수업을 과목별로 묶음 → [{ subject, hours, contents[] }]
 * 시간표 응답의 subject 는 과목(AGENDA), content 는 교육 내용(SUBJECT)이다.
 */
const groupLessons = (lessons, breakSlots) => {
  const groups = [];
  lessons
    .filter((lesson) => !breakSlots.has(Number(lesson.slotIndex)))
    .filter((lesson) => lesson.subject || lesson.content)
    .sort((a, b) => Number(a.slotIndex) - Number(b.slotIndex))
    .forEach((lesson) => {
      const subject = lesson.subject || "(과목 미정)";
      let group = groups.find((item) => item.subject === subject);
      if (!group) {
        group = { subject, hours: 0, contents: [] };
        groups.push(group);
      }
      group.hours += 1;
      if (lesson.content && !group.contents.includes(lesson.content)) {
        group.contents.push(lesson.content);
      }
    });
  return groups;
};

/** 시간표(날짜별 수업) → 주차별 커리큘럼 (첫 수업일이 있는 주가 1주차) */
const buildCurriculum = (timetable, todayKey) => {
  const schedules = [...(timetable?.schedules ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  if (schedules.length === 0) {
    return [];
  }
  const breakSlots = new Set(
    (timetable.timeSlots ?? [])
      .filter((slot) => slot.breakTime)
      .map((slot) => Number(slot.slotIndex)),
  );
  const firstMonday = mondayOf(toDate(schedules[0].date));

  const weeks = new Map();
  schedules.forEach((schedule) => {
    const days = groupLessons(schedule.lessons ?? [], breakSlots);
    if (days.length === 0) {
      return;
    }
    const weekNo =
      Math.round((mondayOf(toDate(schedule.date)) - firstMonday) / (7 * DAY_MS)) + 1;
    if (!weeks.has(weekNo)) {
      weeks.set(weekNo, { weekNo, days: [] });
    }
    weeks.get(weekNo).days.push({ date: schedule.date, groups: days });
  });

  return [...weeks.values()].map((week) => {
    const first = week.days[0].date;
    const last = week.days.at(-1).date;
    let status = "current";
    if (last < todayKey) {
      status = "done";
    } else if (first > todayKey) {
      status = "upcoming";
    }
    const subjects = [];
    week.days.forEach((day) =>
      day.groups.forEach((group) => {
        if (!subjects.includes(group.subject)) {
          subjects.push(group.subject);
        }
      }),
    );
    const hours = week.days.reduce(
      (sum, day) => sum + day.groups.reduce((acc, group) => acc + group.hours, 0),
      0,
    );
    return { ...week, first, last, status, subjects, hours };
  });
};

const DAY_COLUMNS = [
  {
    key: "date",
    title: "날짜",
    width: "110px",
    render: (row) => shortDate(row.date),
  },
  {
    key: "subject",
    title: "과목",
    width: "30%",
    render: (row) => (
      <div className={styles.cellStack}>
        {row.groups.map((group) => (
          <span key={group.subject}>
            {group.subject}{" "}
            <span className={styles.muted}>{group.hours}시간</span>
          </span>
        ))}
      </div>
    ),
  },
  {
    key: "content",
    title: "교육 내용",
    render: (row) => (
      <div className={styles.cellStack}>
        {row.groups.map((group) => (
          <span key={group.subject}>
            {group.contents.length > 0 ? group.contents.join(", ") : "-"}
          </span>
        ))}
      </div>
    ),
  },
];

/**
 * 과정 커리큘럼 (과정 상세 탭).
 * 별도 커리큘럼 데이터가 없어 등록된 시간표(날짜 · 교시 · 과목 · 내용)를 주차별로 묶어 보여준다.
 */
export default function CourseCurriculum() {
  const { id: courseId } = useParams();
  const [timetable, setTimetable] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const [loadingCourseId, setLoadingCourseId] = useState(courseId);
  if (loadingCourseId !== courseId) {
    setLoadingCourseId(courseId);
    setStatus("loading");
  }

  useEffect(() => {
    const controller = new AbortController();
    getTimetable(courseId, { signal: controller.signal })
      .then((data) => {
        setTimetable(data);
        setStatus("loaded");
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        setErrorMessage(error.message || "커리큘럼을 불러오지 못했습니다.");
        setStatus("failed");
      });
    return () => controller.abort();
  }, [courseId]);

  const todayKey = toKey(new Date());
  const weeks = useMemo(
    () => buildCurriculum(timetable, todayKey),
    [timetable, todayKey],
  );

  if (status === "loading") {
    return <StatusBox type="loading" />;
  }
  if (status === "failed") {
    return <StatusBox type="error" detail={errorMessage} />;
  }
  if (weeks.length === 0) {
    return (
      <StatusBox
        type="empty"
        title="등록된 커리큘럼이 없습니다."
        detail="시간표가 등록되면 주차별 커리큘럼이 표시됩니다."
      />
    );
  }

  const totalDays = weeks.reduce((sum, week) => sum + week.days.length, 0);
  const totalHours = weeks.reduce((sum, week) => sum + week.hours, 0);
  const doneWeeks = weeks.filter((week) => week.status === "done").length;

  return (
    <div className="form-stack">
      <div className={styles.stats}>
        <StatCard label="전체 기간" value={weeks.length} unit="주" hint={`${shortDate(weeks[0].first)} ~ ${shortDate(weeks.at(-1).last)}`} />
        <StatCard label="수업일" value={totalDays} unit="일" />
        <StatCard label="전체 교육 시간" value={totalHours} unit="시간" />
        <StatCard label="완료한 주차" value={doneWeeks} unit={`/ ${weeks.length}주`} />
      </div>

      {weeks.map((week) => (
        <Panel
          key={week.weekNo}
          title={`${week.weekNo}주차 - ${week.subjects.join(" · ")}`}
          subtitle={`${shortDate(week.first)} ~ ${shortDate(week.last)} · ${week.days.length}일 · ${week.hours}시간`}
          badge={
            <Badge tone={STATUS[week.status].tone}>
              {STATUS[week.status].label}
            </Badge>
          }
          flush
        >
          <Table
            columns={DAY_COLUMNS}
            rows={week.days}
            rowKey="date"
            size="sm"
            ariaLabel={`${week.weekNo}주차 커리큘럼`}
            isRowMuted={(row) => row.date < todayKey}
          />
        </Panel>
      ))}
    </div>
  );
}
