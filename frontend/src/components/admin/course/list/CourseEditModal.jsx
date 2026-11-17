import { useId, useState } from "react";
import { useDispatch } from "react-redux";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import {
  getCourse,
  getCourses,
  updateCourse,
} from "../../../../api/admin/course/courseApi";

import Button from "../../../common/ui/Button";
import Field from "../../../common/ui/Field";
import Modal from "../../../common/ui/Modal";
import { useToast } from "../../../common/ui/feedbackContext";

/** "2026-11-16 00:00:00" 같은 값도 <input type="date"> 형식(yyyy-MM-dd)으로 자른다 */
const toDateInputValue = (value) => (value ? String(value).slice(0, 10) : "");

/** 입력값 검사. 칸 이름 → 오류 문구 (일정 오류는 startDate 칸에 표시) */
const validate = (form) => {
  const errors = {};
  if (!form.courseName.trim()) {
    errors.courseName = "과정 명을 입력하세요.";
  }
  // COURSE.NO 는 NUMBER 컬럼이라 숫자만 허용
  if (!/^\d+$/.test(String(form.no).trim())) {
    errors.no = "과정 기수는 숫자로 입력하세요.";
  }
  if (!form.startDate || !form.endDated) {
    errors.startDate = "과정 일정을 입력하세요.";
  } else if (form.startDate > form.endDated) {
    errors.startDate = "종료일은 시작일 이후여야 합니다.";
  }
  return errors;
};

/**
 * 과정 수정 모달 (과정 명 / 기수 / 시작일 / 종료일).
 * 항목은 백엔드 ModifyCourseVO 에 맞춘다.
 *
 * @param course 수정할 과정 (showCourse)
 * @param onClose [취소] · Esc · 닫기(X)
 */
export default function CourseEditModal({ course, onClose }) {
  const [form, setForm] = useState({
    courseName: course.courseName ?? "",
    no: course.no ?? "",
    startDate: toDateInputValue(course.startDate),
    endDated: toDateInputValue(course.endDated),
  });
  const [errors, setErrors] = useState({});

  const baseId = useId();
  const nameId = `${baseId}-name`;
  const noId = `${baseId}-no`;
  const startId = `${baseId}-start`;

  const onChangeField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const dispatch = useDispatch();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const onSubmitSave = async (event) => {
    event.preventDefault();
    if (saving) {
      return;
    }
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const modifyCourse = {
      courseName: form.courseName.trim(),
      no: String(form.no).trim(),
      startDate: form.startDate,
      endDated: form.endDated,
    };

    setSaving(true);
    try {
      // 수정 API는 과정 ID만 돌려주므로, 저장 뒤 과정 정보를 다시 조회한다
      await updateCourse(course.id, modifyCourse);
      const updated = await getCourse(course.id);
      // 화면 위쪽 과정 정보 갱신
      dispatch(courseActions.loadShowCourse(updated));
      // 과정 버튼 목록(CourseMain)의 과정 명도 갱신
      const courses = await getCourses();
      dispatch(courseActions.load(courses));
      toast.success("과정을 저장했습니다.");
      onClose();
    } catch (error) {
      // 입력값 검증 실패면 필드별 메시지를 함께 보여준다
      const validationMessages = Object.values(error.validations ?? {}).flat();
      toast.error(
        validationMessages.length > 0
          ? `과정을 저장하지 못했습니다.\n${validationMessages.join("\n")}`
          : `과정을 저장하지 못했습니다. ${error.message ?? ""}`.trim(),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="과정 수정"
      onSubmit={onSubmitSave}
      dismissible={!saving}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </>
      }
    >
      <div className="form-stack">
        <Field
          label="과정 명"
          htmlFor={nameId}
          required
          error={errors.courseName}
        >
          <input
            id={nameId}
            type="text"
            name="courseName"
            className="form-control"
            value={form.courseName}
            onChange={onChangeField}
          />
        </Field>

        <Field
          label="과정 기수"
          htmlFor={noId}
          required
          hint="숫자만"
          error={errors.no}
        >
          <input
            id={noId}
            type="text"
            inputMode="numeric"
            name="no"
            className="form-control"
            value={form.no}
            onChange={onChangeField}
          />
        </Field>

        <Field
          label="과정 일정"
          htmlFor={startId}
          required
          error={errors.startDate}
        >
          <div className="input-range">
            <input
              id={startId}
              type="date"
              name="startDate"
              className="form-control"
              value={form.startDate}
              onChange={onChangeField}
              aria-invalid={!!errors.startDate}
              aria-describedby={`${startId}-msg`}
            />
            <span className="input-range-sep">~</span>
            <input
              type="date"
              name="endDated"
              className="form-control"
              aria-label="종료일"
              value={form.endDated}
              onChange={onChangeField}
              aria-invalid={!!errors.startDate}
            />
          </div>
        </Field>
      </div>
    </Modal>
  );
}
