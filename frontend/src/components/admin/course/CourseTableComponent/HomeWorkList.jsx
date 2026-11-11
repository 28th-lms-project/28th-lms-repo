import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Grid } from "../../../sample/Grid";
import { IconButton } from "../../../sample/input/IconButton";
import { icons } from "../../../sample/input/icons";
import HomeworkForm from "./HomeworkForm";
import { getHomeworks } from "../../../../api/admin/course/courseApi";
import { courseActions } from "../../../../store/slices/courseSliceStore";

export default function HomeWorkList() {
  const { homeworks } = useSelector((store) => store.courses);
  const { id: courseId } = useParams();
  const dispatch = useDispatch();
  const [addHomework, setAddHomework] = useState(false);

  // [추가] 버튼: 등록 폼 열기 / 닫기
  const onClickAddHomework = () => {
    setAddHomework((prev) => !prev);
  };

  // 등록 성공: 폼을 닫고 과제 목록을 다시 불러온다.
  const onSuccessAddHomework = async () => {
    setAddHomework(false);
    try {
      const result = await getHomeworks(courseId);
      dispatch(courseActions.loadhomeworks(result));
    } catch (error) {
      alert(error.message);
    }
  };
  const HOMEWORK_HEADER = [
    { id: "id", title: "ID" },
    { id: "subject", title: "Name" },
    { id: "endDate", title: "제출마감일" },
    { id: "crtDt", title: "등록일 " },
    { id: "mdfyDt", title: "수정일" },
  ];
  // ID 칸에는 실제 과제 ID(CH-...) 대신 화면 순번(1, 2, 3...)을 보여준다.
  // 행 클릭 시에는 homeworks[rowIndex] 로 실제 과제 ID를 찾으므로 영향 없음.
  const content = homeworks.map((homework, index) => {
    const rowNum = index + 1;
    return HOMEWORK_HEADER.map((col) => ({
      id: `${homework.id}-${col.id}`, // 셀마다 고유한 값
      value: col.id === "id" ? rowNum : homework[col.id],
    }));
  });
  const openHomework = (courseid, homeworkId) => {
    window.open(
      `/popup/homework/${courseid}/${homeworkId}`,
      "homeworkDetail",
      "width=1620,height=1080",
    );
  };
  const onRowClick = (event) => {
    const cell = event.target.closest("li[data-row-index]");
    if (!cell) {
      return;
    }
    const homework = homeworks[Number(cell.dataset.rowIndex)];
    openHomework(homework.courseId, homework.id);
  };
  console.log(homeworks);
  return (
    <>
      <div onClick={onRowClick}>
        <IconButton color="#666" icon={icons.add} onClick={onClickAddHomework}>
          추가
        </IconButton>
        {addHomework && (
          <HomeworkForm
            onCancel={onClickAddHomework}
            onSuccess={onSuccessAddHomework}
          />
        )}
        <Grid
          header={HOMEWORK_HEADER}
          content={content}
          columnStyle="80px 2fr 130px 130px 130px "
        />
      </div>
    </>
  );
}
