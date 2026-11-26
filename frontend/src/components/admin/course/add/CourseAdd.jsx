import { useId, useRef, useState } from "react";

import CourseTutorSelect from "../selector/CourseTutorSelect";
import CourseStudentSelect from "../selector/CourseStudentSelect";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createCourse } from "../../../../api/admin/course/courseApi";

import Button from "../../../common/ui/Button";
import Field from "../../../common/ui/Field";
import Panel from "../../../common/ui/Panel";
import { useToast } from "../../../common/ui/feedbackContext";

export default function CourseAdd() {
  const titleRef = useRef();
  const countRef = useRef();
  const startDateRef = useRef();
  const endDateRef = useRef();

  const baseId = useId();
  const nameId = `${baseId}-name`;
  const countId = `${baseId}-count`;
  const tutorId = `${baseId}-tutor`;
  const startId = `${baseId}-start`;
  const studentsId = `${baseId}-students`;

  // 칸별 입력 오류 ([등록]을 누를 때 검사)
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { addSelectTutor, selectStudents } = useSelector(
    (store) => store.courses,
  );

  const onSubmitAddCourse = (event) => {
    event.preventDefault();
    if (saving) {
      return;
    }
    const title = titleRef.current.value;
    const count = countRef.current.value;
    const startDate = startDateRef.current.value;
    const endDate = endDateRef.current.value;

    const nextErrors = {};
    if (!title.trim()) {
      nextErrors.title = "과정 명을 입력하세요.";
    }
    // COURSE.NO 는 NUMBER 컬럼이라 숫자만 허용
    if (!/^\d+$/.test(count.trim())) {
      nextErrors.count = "과정 기수는 숫자로 입력하세요.";
    }
    if (!addSelectTutor) {
      nextErrors.tutor = "담당 강사를 고르세요.";
    }
    if (!startDate || !endDate) {
      nextErrors.period = "과정 일정을 입력하세요.";
    } else if (startDate > endDate) {
      nextErrors.period = "종료일은 시작일 이후여야 합니다.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const formData = new FormData();
    formData.append("courseName", title);
    formData.append("no", count.trim());
    formData.append("startDate", startDate);
    formData.append("endDated", endDate);
    formData.append("tutorId", addSelectTutor.value);
    for (const studentId of selectStudents) {
      formData.append("studentId", studentId.value);
    }

    (async () => {
      setSaving(true);
      try {
        await createCourse(formData);
        toast.success("과정을 등록했습니다.");
        navigate("/my/course/list");
      } catch (error) {
        toast.error(
          `과정을 등록하지 못했습니다. ${error.message ?? ""}`.trim(),
        );
      } finally {
        setSaving(false);
      }
    })();
  };
  const onClickCancelHandler = () => {
    navigate(-1);
  };

  return (
    <form onSubmit={onSubmitAddCourse} noValidate>
      <Panel
        title="과정 등록"
        footer={
          <>
            <Button onClick={onClickCancelHandler} disabled={saving}>
              취소
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {saving ? "등록 중..." : "등록"}
            </Button>
          </>
        }
      >
        <div className="form-stack">
          <div className="form-row">
            <Field label="과정 명" htmlFor={nameId} required error={errors.title}>
              <input
                id={nameId}
                type="text"
                className="form-control"
                ref={titleRef}
                placeholder="예: 풀스택 개발자 과정"
              />
            </Field>
            <Field
              label="과정 기수"
              htmlFor={countId}
              required
              hint="숫자만"
              error={errors.count}
            >
              <input
                id={countId}
                type="text"
                inputMode="numeric"
                className="form-control"
                ref={countRef}
                placeholder="28"
              />
            </Field>
          </div>
          <div className="form-row">
            <Field
              label="담당 강사"
              htmlFor={tutorId}
              required
              error={errors.tutor}
            >
              <CourseTutorSelect inputId={tutorId} />
            </Field>
            <Field
              label="과정 일정"
              htmlFor={startId}
              required
              error={errors.period}
            >
              <div className="input-range">
                <input
                  id={startId}
                  type="date"
                  className="form-control"
                  ref={startDateRef}
                  aria-invalid={!!errors.period}
                  aria-describedby={`${startId}-msg`}
                />
                <span className="input-range-sep">~</span>
                <input
                  type="date"
                  className="form-control"
                  aria-label="종료일"
                  ref={endDateRef}
                  aria-invalid={!!errors.period}
                />
              </div>
            </Field>
          </div>
          <Field
            label="수강생"
            htmlFor={studentsId}
            hint="등록 뒤에도 과정 상세의 [수강생] 탭에서 바꿀 수 있습니다."
          >
            <CourseStudentSelect inputId={studentsId} />
          </Field>
        </div>
      </Panel>
    </form>
  );
}
