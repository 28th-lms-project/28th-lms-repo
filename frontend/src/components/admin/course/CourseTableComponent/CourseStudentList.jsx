import { useId, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import CourseStudentSelect from "../selector/CourseStudentSelect";
import { useParams } from "react-router-dom";
import {
  addCourseStudent,
  getCourseStudents,
} from "../../../../api/admin/course/courseApi";
import usePermission from "../../../../hooks/usePermission";

import Button from "../../../common/ui/Button";
import Field from "../../../common/ui/Field";
import Panel from "../../../common/ui/Panel";
import StatusBox from "../../../common/ui/StatusBox";
import Table from "../../../common/ui/Table";
import { useToast } from "../../../common/ui/feedbackContext";
import { icons } from "../../../common/input/icons";
import { displayName } from "../../../../utils/displayName.js";

const STUDENT_COLUMNS = [
  { key: "rowNum", title: "번호", width: 80, align: "num" },
  { key: "id", title: "아이디", mono: true },
  {
    key: "name",
    title: "이름",
    render: (student) => displayName(student.name, student.nameSuffix),
  },
  {
    key: "pc id",
    title: "PC IP",
    mono: true,
    render: (student) => student["pc id"],
  },
];

export default function CourseStudentList() {
  const { showStudents, selectStudents } = useSelector(
    (store) => store.courses,
  );
  const dispatch = useDispatch();
  const toast = useToast();
  // 수강생 추가 폼 열림 여부
  const [showAddStudent, setShowAddStudent] = useState(false);
  // 칸 입력 오류 ([추가]를 누를 때 검사)
  const [studentError, setStudentError] = useState("");
  const [saving, setSaving] = useState(false);
  const studentsId = useId();
  const { id } = useParams();
  // [수강생 추가]: 추가 API(COURSE_STUDENT_CREATE) + 학생 선택 목록 API(COURSE_MEMBER_READ) 둘 다 필요
  const { can } = usePermission();
  const canAddStudent =
    can("COURSE_STUDENT_CREATE") && can("COURSE_MEMBER_READ");
  // 수강생 목록 조회 권한 (CourseItem 이 이 권한이 있을 때만 목록을 불러온다)
  const canReadStudents = can("COURSE_STUDENT_READ");

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
    setStudentError("");
    setShowAddStudent(false);
  };

  const onSubmitAddStudent = (event) => {
    event.preventDefault();
    if (saving) {
      return;
    }
    if (selectStudents.length === 0) {
      setStudentError("추가할 수강생을 고르세요.");
      return;
    }
    setStudentError("");
    const studentIds = selectStudents.map((student) => student.value);
    (async () => {
      setSaving(true);
      try {
        await addCourseStudent(id, studentIds);
        // 추가 성공 → 수강생 목록을 다시 불러와 slice 갱신 (표가 바로 새로 그려짐)
        const students = await getCourseStudents(id);
        dispatch(courseActions.showStudents(students));
        toast.success("수강생을 추가했습니다.");
        onCancelAddStudent();
      } catch (e) {
        toast.error(`수강생을 추가하지 못했습니다. ${e.message ?? ""}`.trim());
      } finally {
        setSaving(false);
      }
    })();
  };

  if (!canReadStudents) {
    return <StatusBox type="denied" />;
  }

  return (
    <div className="form-stack">
      <div className="toolbar">
        <span className="field-hint">수강생 {showStudents.length}명</span>
        {canAddStudent && !showAddStudent && (
          <Button
            variant="primary"
            icon={icons.add}
            onClick={onOpenAddStudent}
            className="toolbar-end"
          >
            수강생 추가
          </Button>
        )}
      </div>
      {canAddStudent && showAddStudent && (
        <form onSubmit={onSubmitAddStudent} noValidate>
          <Panel
            title="수강생 추가"
            footer={
              <>
                <Button onClick={onCancelAddStudent} disabled={saving}>
                  취소
                </Button>
                <Button type="submit" variant="primary" loading={saving}>
                  {saving ? "추가 중..." : "추가"}
                </Button>
              </>
            }
          >
            <Field
              label="수강생"
              htmlFor={studentsId}
              required
              error={studentError}
            >
              <CourseStudentSelect
                inputId={studentsId}
                excludeIds={enrolledIds}
              />
            </Field>
          </Panel>
        </form>
      )}
      <Table
        ariaLabel="수강생 목록"
        columns={STUDENT_COLUMNS}
        rows={showStudents}
        rowKey="id"
        size="sm"
        emptyText="수강생이 없습니다."
      />
    </div>
  );
}
