import { useState } from "react";
import { useDispatch } from "react-redux";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import {
  getCourses,
  updateCourse,
} from "../../../../api/admin/course/courseApi";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const boxStyle = {
  width: "420px",
  maxWidth: "90vw",
  padding: "24px",
  backgroundColor: "#fff",
  borderRadius: "8px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
};

const titleStyle = {
  margin: "0 0 16px",
  fontSize: "18px",
  color: "#333",
};

const labelStyle = {
  display: "block",
  margin: "12px 0 4px",
  fontSize: "14px",
  fontWeight: "bold",
  color: "#333",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  boxSizing: "border-box",
};

const dateRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const buttonAreaStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "20px",
};

const buttonStyle = {
  minWidth: "72px",
  padding: "8px 16px",
  fontSize: "14px",
  borderRadius: "4px",
  cursor: "pointer",
};

const saveButtonStyle = {
  ...buttonStyle,
  border: "1px solid #333",
  backgroundColor: "#333",
  color: "#fff",
};

const cancelButtonStyle = {
  ...buttonStyle,
  border: "1px solid #ccc",
  backgroundColor: "#fff",
  color: "#333",
};

/** "2026-11-16 00:00:00" 같은 값도 <input type="date"> 형식(yyyy-MM-dd)으로 자른다 */
const toDateInputValue = (value) => (value ? String(value).slice(0, 10) : "");

/**
 * 과정 수정 모달 (과정 명 / 기수 / 시작일 / 종료일).
 * 항목은 백엔드 ModifyCourseVO 에 맞춘다.
 *
 * @param course 수정할 과정 (showCourse)
 * @param onClose [취소] 또는 바깥 클릭
 */
export default function CourseEditModal({ course, onClose }) {
  const [form, setForm] = useState({
    courseName: course.courseName ?? "",
    no: course.no ?? "",
    startDate: toDateInputValue(course.startDate),
    endDated: toDateInputValue(course.endDated),
  });

  const onChangeField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);

  const onClickSave = async () => {
    if (saving) {
      return;
    }
    if (!form.courseName.trim()) {
      alert("과정 명을 입력해주세요.");
      return;
    }
    // COURSE.NO 는 NUMBER 컬럼이라 숫자만 허용
    if (!/^\d+$/.test(String(form.no).trim())) {
      alert("과정 기수는 숫자로 입력해주세요.");
      return;
    }
    if (!form.startDate || !form.endDated) {
      alert("과정 일정을 입력해주세요.");
      return;
    }
    if (form.startDate > form.endDated) {
      alert("종료일은 시작일 이후여야 합니다.");
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
      const updated = await updateCourse(course.id, modifyCourse);
      // 화면 위쪽 과정 정보 갱신
      dispatch(courseActions.loadShowCourse(updated));
      // 과정 버튼 목록(CourseMain)의 과정 명도 갱신
      const courses = await getCourses();
      dispatch(courseActions.load(courses));
      onClose();
    } catch (error) {
      // 입력값 검증 실패면 필드별 메시지를 함께 보여준다
      const validationMessages = Object.values(error.validations ?? {}).flat();
      alert(
        validationMessages.length > 0
          ? validationMessages.join("\n")
          : error.message || "과정 수정에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={boxStyle} onClick={(event) => event.stopPropagation()}>
        <h3 style={titleStyle}>과정 수정</h3>

        <label style={labelStyle} htmlFor="courseEditName">
          과정 명
        </label>
        <input
          id="courseEditName"
          type="text"
          name="courseName"
          value={form.courseName}
          onChange={onChangeField}
          placeholder="과정 명"
          style={inputStyle}
        />

        <label style={labelStyle} htmlFor="courseEditNo">
          과정 기수
        </label>
        <input
          id="courseEditNo"
          type="text"
          inputMode="numeric"
          name="no"
          value={form.no}
          onChange={onChangeField}
          placeholder="과정 기수 (숫자)"
          style={inputStyle}
        />

        <label style={labelStyle}>과정 일정</label>
        <div style={dateRowStyle}>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={onChangeField}
            style={inputStyle}
          />
          ~
          <input
            type="date"
            name="endDated"
            value={form.endDated}
            onChange={onChangeField}
            style={inputStyle}
          />
        </div>

        <div style={buttonAreaStyle}>
          <button
            type="button"
            style={saveButtonStyle}
            onClick={onClickSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          <button type="button" style={cancelButtonStyle} onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
