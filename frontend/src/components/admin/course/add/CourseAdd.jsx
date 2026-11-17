import { useRef, useState } from "react";
import { IconButton } from "../../../sample/input/IconButton";
import { icons } from "../../../sample/input/icons";

import CourseTutorSelect from "../selector/CourseTutorSelect";
import CourseStudentSelect from "../selector/CourseStudentSelect";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createCourse } from "../../../../api/admin/course/courseApi";
export default function CourseAdd() {
  const titleRef = useRef();
  const countRef = useRef();
  const startDateRef = useRef();
  const endDateRef = useRef();

  const [group, setGroup] = useState(true);
  const navigate = useNavigate();
  const { addSelectTutor, selectStudents } = useSelector(
    (store) => store.courses,
  );
  const onClickAddGroupOkButtonHandler = () => {
    const title = titleRef.current.value;
    const count = countRef.current.value;
    const startDate = startDateRef.current.value;
    const endDate = endDateRef.current.value;

    const formData = new FormData();
    formData.append("courseName", title);
    formData.append("no", count);
    formData.append("startDate", startDate);
    formData.append("endDated", endDate);
    formData.append("tutorId", addSelectTutor.value);
    for (const studentId of selectStudents) {
      formData.append("studentId", studentId.value);
    }

    (async () => {
      try {
        await createCourse(formData);
        alert("과정이 등록되었습니다.");
        navigate("/my/course/list");
      } catch (error) {
        alert(error.message);
      }
    })();
  };
  const onClickAddGroupCancleButtonHandler = () => {
    setGroup(!group);
  };

  return (
    <div>
      <div className="section">
        <div className="section-content">
          <h3>과정 명</h3>
          <input type="text" ref={titleRef} placeholder="과정 명" />
          <h3>과정 정보</h3>
          <input type="text" ref={countRef} placeholder="과정 기수" />
          <CourseTutorSelect />
          <h3>과정 일정</h3>
          <input type="date" ref={startDateRef} />
          ~
          <input type="date" ref={endDateRef} />
          <h3>수강생</h3>
          <CourseStudentSelect />
          <div>
            <IconButton
              color="#666"
              icon={icons.add}
              onClick={onClickAddGroupOkButtonHandler}
            >
              추가
            </IconButton>
            <IconButton
              color="#666"
              icon={icons.close}
              onClick={onClickAddGroupCancleButtonHandler}
            >
              닫기
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
}
