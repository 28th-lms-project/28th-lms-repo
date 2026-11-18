import { useSelector } from "react-redux";
import usePermission from "../../../../hooks/usePermission";

import Badge from "../../../common/ui/Badge";
import Progress from "../../../common/ui/Progress";
import StatusBox from "../../../common/ui/StatusBox";
import Table from "../../../common/ui/Table";

/** 0 ~ 100 으로 자르고, 숫자가 아니면 0 */
const clampRate = (rate) => Math.min(100, Math.max(0, Number(rate) || 0));

const ATTENDANCE_COLUMNS = [
  { key: "userId", title: "아이디", width: 140, mono: true },
  { key: "name", title: "이름", width: 140 },
  {
    key: "attendanceRate",
    title: "출석률",
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
 * 출석률 탭. 수강생별 전체 기간 기준 출석률.
 * 데이터는 CourseItem 이 불러와 둔 courseSlice.attendanceSummary 를 쓴다.
 * (수강생은 서버가 본인 한 줄만 내려주므로 같은 화면을 그대로 쓸 수 있다)
 */
export default function StudentConnected() {
  const { attendanceSummary } = useSelector((store) => store.courses);
  // 출석률 요약 조회 권한 (CourseItem 이 이 권한이 있을 때만 불러온다)
  const { can } = usePermission();

  if (!can("COURSE_ATTENDANCE_READ")) {
    return <StatusBox type="denied" />;
  }
  if (!attendanceSummary) {
    return <StatusBox type="empty" title="출석 정보가 없습니다." />;
  }
  // 수업일 = 과정 기간 안에서 시간표가 있는 날. 시간표가 없으면 출석률을 계산할 수 없다
  if (attendanceSummary.totalClassDays === 0) {
    return (
      <StatusBox
        type="empty"
        title="시간표가 등록되지 않았습니다."
        detail="출석률은 시간표가 있는 날을 수업일로 계산합니다. 시간표 탭에서 먼저 시간표를 올려 주세요."
      />
    );
  }

  const { progressRate, students = [] } = attendanceSummary;

  return (
    <div className="form-stack">
      <div className="toolbar">
        <span className="field-hint">
          수강생 {students.length}명 · 과정 진행률{" "}
          {clampRate(progressRate).toFixed(1)}% (어제 기준)
        </span>
      </div>
      <Table
        ariaLabel="수강생 출석률"
        columns={ATTENDANCE_COLUMNS}
        rows={students}
        rowKey="userId"
        size="sm"
        emptyText="수강생이 없습니다."
      />
    </div>
  );
}
