import { useSelector } from "react-redux";
import { Grid } from "../../../sample/Grid";

export default function HomeWorkList() {
  const { homeworks } = useSelector((store) => store.courses);
  const HOMEWORK_HEADER = [
    { id: "id", title: "ID" },
    { id: "subject", title: "Name" },
    { id: "endDate", title: "제출마감일" },
    { id: "crtDt", title: "등록일 " },
    { id: "mdfyDt", title: "수정일" },
  ];
  const content = homeworks.map((homework) =>
    HOMEWORK_HEADER.map((col) => ({
      id: `${homework.rowNum}-${col.id}`, // 셀마다 고유한 값
      value: homework[col.id],
    })),
  );
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
        <Grid
          header={HOMEWORK_HEADER}
          content={content}
          columnStyle="80px 2fr 130px 130px 130px "
        />
      </div>
    </>
  );
}
