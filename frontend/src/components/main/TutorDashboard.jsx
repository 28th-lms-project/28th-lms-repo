import { useNavigate } from "react-router-dom";
import Panel from "../common/ui/Panel";
import StatCard from "../common/ui/StatCard";
import Badge from "../common/ui/Badge";
import useTutorDashboard from "./useTutorDashboard";
import {
  CourseCard,
  EndedCourses,
  ListPanel,
  LOADING_HINT,
  TodayLessons,
} from "./dashboardParts";
import { COURSE_TAB, courseUrl } from "./dashboardShared";
import {
  collectAttendanceWarnings,
  collectGradingQueue,
  collectSurveyResponses,
  collectTutorHomeworks,
  homeworkDue,
  summarizeTodayAttendance,
  summarizeTutorAttendance,
} from "./dashboardSummary";

/**
 * 강사 대시보드 (강사로 등록된 과정).
 * 수치 → 담당 과정 → 오늘 시간표 · 채점 대기 · 출석 주의 학생 → 마감 전 과제 · 설문 응답 → 종료된 과정(접힘).
 * 카드 · 패널은 권한이 있을 때만 보인다 (출석: COURSE_ATTENDANCE_READ, 채점: SCORE_READ_COURSE,
 * 시간표: COURSE_SCHEDULE_READ_ONE, 과제: COURSE_HOMEWORK_READ, 설문: COURSE_SURVEY_READ).
 *
 * @param {{ courses: object[] }} props  myRelation === "TUTOR"인 과정 (useMemo로 고정)
 */
export default function TutorDashboard({ courses: baseCourses }) {
  const { courses, today, can } = useTutorDashboard(baseCourses);

  const active = courses.filter((course) => course.phase === "active");
  const current = courses.filter((course) => course.phase !== "ended");
  const ended = courses.filter((course) => course.phase === "ended");
  const showToday = active.length > 0 && (can.lessons || can.scores || can.attendance);
  const showFollowUp = active.length > 0 && (can.homeworks || can.surveys);

  return (
    <div className="form-stack">
      <TutorSummaryCards active={active} total={courses.length} can={can} />
      {current.length > 0 && (
        <Panel title="담당 과정" subtitle={`${current.length}개`}>
          <div className="card-grid">
            {current.map((course) => (
              <CourseCard key={course.id} course={course} today={today} showTutor={false} />
            ))}
          </div>
        </Panel>
      )}
      {showToday && (
        <div className="layout-3col">
          {can.lessons && <TodayLessons active={active} today={today} />}
          {can.scores && <GradingQueue active={active} />}
          {can.attendance && <AttendanceWarnings active={active} />}
        </div>
      )}
      {showFollowUp && (
        <div className="layout-3col">
          {can.homeworks && <TutorHomeworks active={active} today={today} />}
          {can.surveys && <SurveyResponses active={active} />}
        </div>
      )}
      {ended.length > 0 && <EndedCourses courses={ended} today={today} showTutor={false} />}
    </div>
  );
}

function TutorSummaryCards({ active, total, can }) {
  const attendance = summarizeTutorAttendance(active);
  const grading = collectGradingQueue(active);
  const todayAttendance = summarizeTodayAttendance(active);

  // 오늘 출석: 출석 + 지각 / 수강생 (오늘 수업 있는 과정만)
  const todayChecked = todayAttendance.present + todayAttendance.late;
  let todayValue = `${todayChecked}/${todayAttendance.studentCount}`;
  let todayHint = `지각 ${todayAttendance.late} · 미출석 ${todayAttendance.notChecked}`;
  if (todayAttendance.absent > 0) todayHint += ` · 결석 처리 ${todayAttendance.absent}`;
  if (todayAttendance.loading && todayAttendance.classCourses === 0) {
    todayValue = "-";
    todayHint = LOADING_HINT;
  } else if (todayAttendance.anyFailed && todayAttendance.classCourses === 0) {
    todayValue = "-";
    todayHint = "불러오지 못했습니다";
  } else if (todayAttendance.classCourses === 0) {
    todayValue = "-";
    todayHint = "오늘 수업이 없습니다";
  }

  let rateHint = `수강생 ${attendance.studentCount}명 · 지금까지(어제 기준)`;
  if (attendance.rate === null) {
    if (attendance.loading) rateHint = LOADING_HINT;
    else if (attendance.anyFailed) rateHint = "불러오지 못했습니다";
    else if (attendance.noTimetable) rateHint = "시간표가 등록되지 않은 과정이 있습니다";
    else rateHint = "아직 수업일이 없습니다";
  }

  let warningHint = "출석 인정일이 진행된 수업일의 80% 미만";
  if (attendance.loading) warningHint = LOADING_HINT;
  else if (attendance.anyFailed) warningHint = "일부 과정을 불러오지 못했습니다";

  let gradingHint = grading.items.length > 0 ? `시험 ${grading.items.length}개` : "채점할 답안이 없습니다";
  if (grading.loading) gradingHint = LOADING_HINT;
  else if (grading.anyFailed) gradingHint = "일부 과정을 불러오지 못했습니다";

  return (
    <div className="card-grid">
      <StatCard label="진행 중 담당 과정" value={active.length} unit="개" hint={`전체 ${total}개`} />
      {can.attendance && (
        <StatCard label="오늘 출석" value={todayValue} unit={todayValue === "-" ? undefined : "명"} hint={todayHint} />
      )}
      {can.attendance && (
        <StatCard
          label="평균 출석률 (지금까지)"
          value={attendance.rate ?? "-"}
          unit={attendance.rate === null ? undefined : "%"}
          hint={rateHint}
        />
      )}
      {can.attendance && (
        <StatCard
          label="출석 주의 학생"
          value={attendance.loading && attendance.warningCount === 0 ? "-" : attendance.warningCount}
          unit="명"
          hint={warningHint}
          trend={attendance.warningCount > 0 ? "down" : undefined}
        />
      )}
      {can.scores && (
        <StatCard
          label="채점 대기"
          value={grading.loading && grading.total === 0 ? "-" : grading.total}
          unit="건"
          hint={gradingHint}
        />
      )}
    </div>
  );
}

/** 채점 대기: 시험별 채점 안 된 답안 수 · 응시 현황. 누르면 그 과정의 시험 탭 */
function GradingQueue({ active }) {
  const navigate = useNavigate();
  const result = collectGradingQueue(active);

  return (
    <ListPanel
      title="채점 대기"
      subtitle={result.total > 0 ? `${result.total}건` : undefined}
      result={result}
      emptyTitle="채점할 답안이 없습니다."
      renderItem={({ key, course, setName, pendingAnswers, pendingStudents, submitted, studentCount }) => (
        <li key={key}>
          <button
            type="button"
            className="list-item"
            onClick={() => navigate(courseUrl(course.id, COURSE_TAB.test))}
          >
            <span>
              {setName}
              <span className="card-meta"> · {course.courseName}</span>
            </span>
            <span className="list-item-end">
              <span className="card-meta">
                응시 {submitted}/{studentCount} · 학생 {pendingStudents}명
              </span>
              <Badge tone="warning">{pendingAnswers}건</Badge>
            </span>
          </button>
        </li>
      )}
    />
  );
}

/** 출석 주의 학생: 출석률 낮은 순. 누르면 그 과정의 출석률 탭 */
function AttendanceWarnings({ active }) {
  const navigate = useNavigate();
  const result = collectAttendanceWarnings(active);
  const showCourse = active.length > 1;

  return (
    <ListPanel
      title="출석 주의 학생"
      subtitle={result.items.length > 0 ? `${result.items.length}명` : undefined}
      result={result}
      emptyTitle="출석 주의 학생이 없습니다."
      renderItem={({ key, course, student, rate }) => (
        <li key={key}>
          <button
            type="button"
            className="list-item"
            onClick={() => navigate(courseUrl(course.id, COURSE_TAB.attendance))}
          >
            <span>
              {student.name}
              {showCourse && <span className="card-meta"> · {course.courseName}</span>}
            </span>
            <span className="list-item-end">
              <span className="card-meta">결석 {student.totalAbsentCount ?? 0}회</span>
              <Badge tone="danger">{rate === null ? "-" : `${rate}%`}</Badge>
            </span>
          </button>
        </li>
      )}
    />
  );
}

/** 마감 전 과제: 마감 순, 수강생 제출 현황. 누르면 그 과정의 과제 탭 */
function TutorHomeworks({ active, today }) {
  const navigate = useNavigate();
  const result = collectTutorHomeworks(active, today);

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
                <span className="card-meta">
                  제출 {homework.submittedCount ?? 0}/{homework.studentCount ?? 0}
                </span>
                <Badge tone={due.tone}>{due.label}</Badge>
              </span>
            </button>
          </li>
        );
      }}
    />
  );
}

/** 설문 응답: 아직 모두 응답하지 않은 설문, 응답률 낮은 순. 누르면 그 과정의 설문 탭 */
function SurveyResponses({ active }) {
  const navigate = useNavigate();
  const result = collectSurveyResponses(active);

  return (
    <ListPanel
      title="설문 응답"
      subtitle={result.items.length > 0 ? `${result.items.length}개 진행 중` : undefined}
      result={result}
      emptyTitle="응답을 기다리는 설문이 없습니다."
      renderItem={({ key, course, survey, rate }) => (
        <li key={key}>
          <button
            type="button"
            className="list-item"
            onClick={() => navigate(courseUrl(course.id, COURSE_TAB.survey))}
          >
            <span>
              {survey.title}
              <span className="card-meta"> · {course.courseName}</span>
            </span>
            <span className="list-item-end">
              <span className="card-meta">
                {survey.answerCount}/{survey.studentCount}명
              </span>
              <Badge tone={rate < 50 ? "warning" : "info"}>{rate}%</Badge>
            </span>
          </button>
        </li>
      )}
    />
  );
}
