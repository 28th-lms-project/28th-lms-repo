import { useEffect, useRef, useState } from "react";
import Students from "../../students/students/Students";
import { IconButton } from "../../../sample/input/IconButton";
import { icons } from "../../../sample/input/icons";
import { FileField } from "../../../sample/input/Input";

export default function CourseAdd() {
  const [group, setGroup] = useState(true);

  const titleRef = useRef();
  const countRef = useRef();
  const startDateRef = useRef();
  const endDateRef = useRef();
  const uploadFileRef = useRef();

  useEffect(() => {
    (async () => {
      const fetchresult = await fetch("http://localhost:8080/course/view");
      console(fetchresult);
    })();
  });
  const onClickAddGroupButtonHandler = () => {
    console.log(group);
    setGroup(!group);
    console.log("test");
  };
  const onClickAddGroupOkButtonHandler = () => {
    const title = titleRef.current.value;
    const count = countRef.current.value;
    const startDate = startDateRef.current.value;
    const endDate = endDateRef.current.value;
    const newGroup = { title, count, startDate, endDate };
  };
  const onClickAddGroupCancleButtonHandler = () => {
    setGroup(!group);
  };

  return (
    <div>
      <IconButton
        color="#666"
        icon={icons.add}
        onClick={onClickAddGroupButtonHandler}
      />
      {!group && (
        <>
          <div className="section">
            <div className="section-content">
              <h3>과정 명</h3>
              <input type="text" ref={titleRef} placeholder="과정 명" />
              <h3>과정 정보</h3>
              <input type="text" ref={countRef} placeholder="과정 기수" />
              <select name="강사" id="">
                <option value="1">test1</option>
                <option value="2">test2</option>
              </select>
              <h3>과정 일정</h3>
              <input type="date" ref={startDateRef} />
              ~
              <input type="date" ref={endDateRef} />
              <h3>과정 일정</h3>
              <Students />
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
        </>
      )}
    </div>
  );
}
