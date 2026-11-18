import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import HomeworkForm from "./HomeworkForm";
import { getHomeworks } from "../../../../api/admin/course/courseApi";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import usePermission from "../../../../hooks/usePermission";

import Button from "../../../common/ui/Button";
import StatusBox from "../../../common/ui/StatusBox";
import Table from "../../../common/ui/Table";
import { useToast } from "../../../common/ui/feedbackContext";
import { icons } from "../../../common/input/icons";

/** "2026-11-16 00:00:00" 같은 값은 날짜(yyyy-MM-dd)까지만 보여준다 */
const toDateText = (value) => (value ? String(value).slice(0, 10) : "");

export default function HomeWorkList() {
  const { homeworks } = useSelector((store) => store.courses);
  const { id: courseId } = useParams();
  const dispatch = useDispatch();
  const toast = useToast();
  const [addHomework, setAddHomework] = useState(false);

  // 과제 등록 API(COURSE_HOMEWORK_CREATE) 권한이 있을 때만 [과제 등록] 버튼 · 등록 폼 표시 (수강생에게는 숨김)
  const { can } = usePermission();
  const canCreateHomework = can("COURSE_HOMEWORK_CREATE");

  // [과제 등록] 버튼 · 폼 [취소]: 등록 폼 열기 / 닫기
  const onClickAddHomework = () => {
    setAddHomework((prev) => !prev);
  };

  // 등록 성공: 폼을 닫고 과제 목록을 다시 불러온다.
  const onSuccessAddHomework = async () => {
    setAddHomework(false);
    toast.success("과제를 등록했습니다.");
    try {
      const result = await getHomeworks(courseId);
      dispatch(courseActions.loadhomeworks(result));
    } catch (error) {
      toast.error(
        `과제 목록을 불러오지 못했습니다. ${error.message ?? ""}`.trim(),
      );
    }
  };

  // 번호 칸에는 실제 과제 ID(CH-...) 대신 화면 순번(1, 2, 3...)을 보여준다.
  const rows = homeworks.map((homework, index) => ({
    ...homework,
    rowNum: index + 1,
  }));
  const columns = [
    { key: "rowNum", title: "번호", width: 80, align: "num" },
    { key: "subject", title: "과제명", ellipsis: true },
    {
      key: "endDate",
      title: "제출 마감일",
      width: 130,
      mono: true,
      render: (row) => toDateText(row.endDate),
    },
    {
      key: "crtDt",
      title: "등록일",
      width: 130,
      mono: true,
      render: (row) => toDateText(row.crtDt),
    },
    {
      key: "mdfyDt",
      title: "수정일",
      width: 130,
      mono: true,
      render: (row) => toDateText(row.mdfyDt),
    },
  ];

  const openHomework = (courseid, homeworkId) => {
    window.open(
      `/popup/homework/${courseid}/${homeworkId}`,
      "homeworkDetail",
      "width=1620,height=1080",
    );
  };

  // 과제 목록 조회 권한 (CourseItem 이 이 권한이 있을 때만 목록을 불러온다)
  if (!can("COURSE_HOMEWORK_READ")) {
    return <StatusBox type="denied" />;
  }

  return (
    <div className="form-stack">
      <div className="toolbar">
        <span className="field-hint">과제 {homeworks.length}건</span>
        {canCreateHomework && !addHomework && (
          <Button
            variant="primary"
            icon={icons.add}
            onClick={onClickAddHomework}
            className="toolbar-end"
          >
            과제 등록
          </Button>
        )}
      </div>
      {canCreateHomework && addHomework && (
        <HomeworkForm
          onCancel={onClickAddHomework}
          onSuccess={onSuccessAddHomework}
        />
      )}
      <Table
        ariaLabel="과제 목록"
        columns={columns}
        rows={rows}
        rowKey="id"
        size="sm"
        onRowClick={(row) => openHomework(row.courseId, row.id)}
        emptyText="등록된 과제가 없습니다."
      />
    </div>
  );
}
