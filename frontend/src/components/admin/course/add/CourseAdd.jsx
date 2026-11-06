import { useRef, useState } from "react";
import { IconButton } from "../../../sample/input/IconButton";
import { icons } from "../../../sample/input/icons";
import { FileField } from "../../../sample/input/Input";

import CourseTutorSelect from "../selector/CourseTutorSelect";
import CourseStudentSelect from "../selector/CourseStudentSelect";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
export default function CourseAdd() {
  const titleRef = useRef();
  const countRef = useRef();
  const startDateRef = useRef();
  const endDateRef = useRef();
  const uploadFileRef = useRef();

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
    const file = uploadFileRef.current.files;

    const formData = new FormData();
    formData.append("courseName", title);
    formData.append("no", count);
    formData.append("startDate", startDate);
    formData.append("endDated", endDate);
    formData.append("tutorId", addSelectTutor.value);
    formData.append("file", file);
    for (const studentId of selectStudents) {
      formData.append("studentId", studentId.value);
    }

    (async () => {
      await fetch("http://localhost:8080/admin/course/add", {
        method: "post",
        body: formData,
      });
    })();

    navigate("/admin/course/list");
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
          <h3>시간표</h3>
          <div>
            <FileField
              preview={true}
              ref={uploadFileRef}
              id="fileField"
              multiple={true}
              name="file"
              labelText="시간표 파일을 업로드 하세요"
            />
          </div>
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
