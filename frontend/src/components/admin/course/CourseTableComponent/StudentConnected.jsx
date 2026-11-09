import { useSelector } from "react-redux";
import { Grid } from "../../../sample/Grid";

export default function StudentConnected() {
  const WEEK = getThisWeek();
  const CONNECTED_HEADER = [
    { id: "id", title: "수강생 ID" },
    { id: "name", title: "수강생 이름" },
    ...WEEK.map((w) => ({ id: w.key, title: w.label })),
  ];
  const { showStudents } = useSelector((store) => store.courses);

  const content = showStudents.map((student) =>
    CONNECTED_HEADER.map((col) => ({
      id: `${student.rowNum}-${col.id}`, // 셀마다 고유한 값
      value: student[col.id],
    })),
  );
  function getThisWeek() {
    const today = new Date();
    const day = today.getDay(); // 0(일) ~ 6(토)
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

    return Array.from({ length: 7 }, (_, i) => {
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
  return (
    <>
      <Grid
        header={CONNECTED_HEADER}
        content={content}
        style={{
          margin: "10px 0px",
        }}
        columnStyle="120px 120px 1fr 1fr 1fr 1fr 1fr 1fr 1fr"
      />
    </>
  );
}
