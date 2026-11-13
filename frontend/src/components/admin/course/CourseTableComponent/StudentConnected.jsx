import { useSelector } from "react-redux";
import { Grid } from "../../../sample/Grid";

// 표에 보여줄 요일 수 (월 ~ 금)
const WEEKDAY_COUNT = 5;

/** 이번 주 월요일 ~ 금요일 날짜. key: "YYYY-MM-DD", label: "MM-DD" */
function getThisWeekdays() {
  const today = new Date();
  const day = today.getDay(); // 0(일) ~ 6(토)
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

  return Array.from({ length: WEEKDAY_COUNT }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return {
      key: `${yyyy}-${mm}-${dd}`,
      label: `${mm}-${dd}`,
    };
  });
}

export default function StudentConnected() {
  const WEEK = getThisWeekdays();
  const CONNECTED_HEADER = [
    { id: "id", title: "수강생 ID" },
    { id: "name", title: "수강생 이름" },
    ...WEEK.map((w) => ({ id: w.key, title: w.label })),
  ];
  const { showStudents } = useSelector((store) => store.courses);

  // TODO(API): 날짜별 첫 요청 시각 조회
  //   GET /{courseId}/connected?startDate=WEEK[0].key&endDate=WEEK[WEEK.length - 1].key
  //   응답 예) [{ id, name, logins: { "2026-11-10": "09:02:11", ... } }]
  //   응답을 받으면 아래 connectedTimes 를 { [수강생 ID]: logins } 형태로 채운다.
  //   (수강생은 서버가 본인 한 줄만 내려주므로, 그때는 행도 showStudents 대신 응답으로 만든다)
  const connectedTimes = {};

  const content = showStudents.map((student) =>
    CONNECTED_HEADER.map((col) => ({
      id: `${student.id}-${col.id}`, // 셀마다 고유한 값
      value:
        col.id === "id" || col.id === "name"
          ? student[col.id]
          : // 접속하지 않은 날은 "-"
            (connectedTimes[student.id]?.[col.id] ?? "-"),
    })),
  );

  return (
    <>
      <Grid
        header={CONNECTED_HEADER}
        content={content}
        style={{
          margin: "10px 0px",
        }}
        columnStyle={`120px 120px repeat(${WEEKDAY_COUNT}, 1fr)`}
      />
    </>
  );
}
