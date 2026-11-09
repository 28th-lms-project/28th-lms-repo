import { useSelector } from "react-redux";
import { Grid } from "../../../sample/Grid";

export default function CourseStudentList() {
  const { showStudents } = useSelector((store) => store.courses);
  const STUDENT_HEADER = [
    { id: "rowNum", title: "No." },
    { id: "id", title: "ID" },
    { id: "name", title: "Name" },
    { id: "pc id", title: "pc ip" },
  ];
  const content = showStudents.map((student) =>
    STUDENT_HEADER.map((col) => ({
      id: `${student.rowNum}-${col.id}`, // 셀마다 고유한 값
      value: student[col.id],
    })),
  );
  return (
    <>
      <Grid
        title="수강생"
        header={STUDENT_HEADER}
        content={content}
        style={{
          margin: "10px 0px",
        }}
      />
    </>
  );
}
