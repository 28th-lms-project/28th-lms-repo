import { useSelector } from "react-redux";
import usePermission from "../../../../hooks/usePermission";

import Badge from "../../../common/ui/Badge";
import Progress from "../../../common/ui/Progress";
import StatusBox from "../../../common/ui/StatusBox";
import Table from "../../../common/ui/Table";

/** 0 ~ 100 으로 자르고, 숫자가 아니면 0 */
const clampRate = (rate) => Math.min(100, Math.max(0, Number(rate) || 0));

/** 컬럼은 진행된 수업일(passedClassDays)이 필요해서 함수로 만든다 */
const getAttendanceColumns = (passedClassDays) => [
  { key: "userId", title: "아이디", width: 140, mono: true },
  { key: "name", title: "이름", width: 140 },
  {
    key: "attendanceRate",
    title: "출석률 (전체 기간 기준)",
    // 막대: 전체 수업일 기준 (출석 인정일 / 전체 수업일, 서버 계산)
    render: (student) => (
      <Progress
        label={`${student.name} 출석률`}
        value={clampRate(student.attendanceRate)}
        tone={student.warning ? "danger" : "success"}
        showValue
      />
    ),
  },
  {
    key: "attendedDays",
    title: "출석 / 진행",
    width: 220,
    // 문구: 진행된 수업일(어제까지) 기준. 결석 = N + 기록 없는 수업일 + floor(지각 / 3) (서버 계산)
    render: (student) => (
      <span className="field-hint">
        {student.attendedDays ?? 0} / {passedClassDays}일 · 지각{" "}
        {student.lateCount ?? 0} · 결석 {student.totalAbsentCount ?? 0}
      </span>
    ),
  },
  {
    key: "warning",
    title: "상태",
    width: 90,
    align: "center",
    // warning: 진행된 기간 대비 출석 80% 미만 (서버가 계산)
    render: (student) =>
      student.warning ? (
        <Badge tone="danger">주의</Badge>
      ) : (
        <Badge tone="success">정상</Badge>
      ),
  },
];

/**
 * 출석률 탭. 막대는 전체 수업일 기준 출석률, 옆 문구는 진행된 수업일(어제까지) 기준 출석 · 결석 일수.
 * 데이터는 CourseItem 이 불러와 둔 courseSlice.attendanceSummary 를 쓴다.
 * (수강생은 서버가 본인 한 줄만 내려주므로 같은 화면을 그대로 쓸 수 있다)
 */
export default function StudentConnected() {
  const { attendanceSummary, attendanceSummaryStatus } = useSelector(
    (store) => store.courses,
  );
  // 출석률 요약 조회 권한 (CourseItem 이 이 권한이 있을 때만 불러온다)
  const { can } = usePermission();

  if (!can("COURSE_ATTENDANCE_READ")) {
    return <StatusBox type="denied" />;
  }
  if (attendanceSummaryStatus === "error") {
    return <StatusBox type="error" title="출석 정보를 불러오지 못했습니다." />;
  }
  if (attendanceSummaryStatus !== "success" || !attendanceSummary) {
    return <StatusBox type="loading" />;
  }
  // 수업일 = 과정 시작일 ~ 종료일 중 평일. 기간에 평일이 없으면 출석률을 계산할 수 없다
  if (attendanceSummary.totalClassDays === 0) {
    return (
      <StatusBox
        type="empty"
        title="수업일이 없습니다."
        detail="출석률은 과정 시작일 ~ 종료일 중 평일(월 ~ 금)을 수업일로 계산합니다. 과정 기간을 확인해 주세요."
      />
    );
  }

  const {
    progressRate,
    passedClassDays = 0,
    students = [],
  } = attendanceSummary;

  return (
    <div className="form-stack">
      <div className="toolbar">
        <span className="field-hint">
          수강생 {students.length}명 · 과정 진행률{" "}
          {clampRate(progressRate).toFixed(1)}% · 수업일은 과정 기간의 평일(월 ~
          금) · 출석률은 전체 수업일 기준, 출석 일수는 진행된 수업일 기준
          (어제까지, 오늘 출석은 내일 반영)
        </span>
      </div>
      <Table
        ariaLabel="수강생 출석률"
        columns={getAttendanceColumns(passedClassDays)}
        rows={students}
        rowKey="userId"
        size="sm"
        emptyText="수강생이 없습니다."
      />
    </div>
  );
}
