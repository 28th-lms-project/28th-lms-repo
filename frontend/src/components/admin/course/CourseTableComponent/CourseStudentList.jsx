import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Grid } from "../../../sample/Grid";
import { IconButton } from "../../../sample/input/IconButton";
import { icons } from "../../../sample/input/icons";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import CourseStudentSelect from "../selector/CourseStudentSelect";
import { useParams } from "react-router-dom";
import {
  addCourseStudent,
  getCourseStudents,
} from "../../../../api/admin/course/courseApi";

export default function CourseStudentList() {
  const { showStudents, selectStudents } = useSelector(
    (store) => store.courses,
  );
  const dispatch = useDispatch();
  // 수강생 추가 폼 열림 여부
  const [showAddStudent, setShowAddStudent] = useState(false);
  const { id } = useParams();

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

  // 이미 이 과정을 듣는 학생 ID (선택 목록에서 제외)
  const enrolledIds = showStudents.map((student) => student.id);

  // selectStudents 는 과정 등록 화면(CourseAdd)과 같이 쓰는 slice 라서
  // 폼을 열고 닫을 때 비워 둔다 (이전 선택값이 남지 않도록)
  const onOpenAddStudent = () => {
    dispatch(courseActions.selectStudents([]));
    setShowAddStudent(true);
  };

  const onCancelAddStudent = () => {
    dispatch(courseActions.selectStudents([]));
    setShowAddStudent(false);
  };

  const onClickAddStudent = () => {
    if (selectStudents.length === 0) {
      alert("추가할 수강생을 선택하세요.");
      return;
    }
    const studentIds = selectStudents.map((student) => student.value);
    console.log("추가할 수강생 ID", studentIds);
    console.log(id);
    (async () => {
      try {
        const result = await addCourseStudent(id, studentIds);
        console.log(result);
        // 추가 성공 → 수강생 목록을 다시 불러와 slice 갱신 (표가 바로 새로 그려짐)
        const students = await getCourseStudents(id);
        dispatch(courseActions.showStudents(students));
        onCancelAddStudent();
      } catch (e) {
        console.log(e);
        alert("수강생 추가에 실패했습니다.");
      }
    })();
  };

  return (
    <>
      {!showAddStudent && (
        <IconButton
          color="#666"
          icon={icons.add}
          onClick={onOpenAddStudent}
          // hover 시 글씨가 굵어져도 크기가 변하지 않도록 고정
          style={{ width: "130px", flexShrink: 0 }}
        >
          수강생 추가
        </IconButton>
      )}
      {showAddStudent && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: "8px 0",
          }}
        >
          <CourseStudentSelect excludeIds={enrolledIds} />
          <IconButton color="#666" icon={icons.add} onClick={onClickAddStudent}>
            추가
          </IconButton>
          <IconButton
            color="#666"
            icon={icons.close}
            onClick={onCancelAddStudent}
          >
            취소
          </IconButton>
        </div>
      )}
      <Grid
        header={STUDENT_HEADER}
        content={content}
        style={{
          margin: "10px 0px",
        }}
      />
    </>
  );
}
