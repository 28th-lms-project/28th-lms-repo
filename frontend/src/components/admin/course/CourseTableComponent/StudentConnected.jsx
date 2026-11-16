import { useSelector } from "react-redux";
import { Grid } from "../../../sample/Grid";
import PeriodBar from "./PeriodBar";

const ATTENDANCE_HEADER = [
  { id: "userId", title: "수강생 ID" },
  { id: "name", title: "수강생 이름" },
  { id: "attendanceRate", title: "출석률 / 진행률" },
];

/**
 * 출석률 탭. 수강생별 전체 기간 기준 출석률 막대.
 * 데이터는 CourseItem 이 불러와 둔 courseSlice.attendanceSummary 를 쓴다.
 * (수강생은 서버가 본인 한 줄만 내려주므로 같은 화면을 그대로 쓸 수 있다)
 */
export default function StudentConnected() {
  const { attendanceSummary } = useSelector((store) => store.courses);

  if (!attendanceSummary) {
    return <div style={{ margin: "10px 0" }}>출석 정보가 없습니다.</div>;
  }

  const { progressRate, students = [] } = attendanceSummary;

  const content = students.map((student) =>
    ATTENDANCE_HEADER.map((col) => ({
      id: `${student.userId}-${col.id}`, // 셀마다 고유한 값
      value:
        col.id === "attendanceRate" ? (
          <PeriodBar
            progressRate={progressRate}
            attendanceRate={student.attendanceRate}
            warning={student.warning}
          />
        ) : (
          student[col.id]
        ),
    })),
  );

  return (
    <Grid
      header={ATTENDANCE_HEADER}
      content={content}
      style={{
        margin: "10px 0px",
      }}
      columnStyle="120px 120px 1fr"
    />
  );
}
