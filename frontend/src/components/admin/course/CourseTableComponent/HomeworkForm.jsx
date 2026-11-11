import { useState } from "react";
import { useParams } from "react-router-dom";
import { IconButton } from "../../../sample/input/IconButton";
import { createHomework } from "../../../../api/admin/course/courseApi";

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: "7px",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "0",
};

/**
 * 과제 등록 폼 (제목 · 제출마감일 · 내용)
 * @param {Function} onCancel 취소 버튼 클릭 시 호출
 * @param {Function} onSuccess 등록 성공 시 호출
 */
export default function HomeworkForm({ onCancel, onSuccess }) {
  // 과정 상세 페이지(/.../:id)의 과정 ID
  const { id: courseId } = useParams();
  const [subject, setSubject] = useState("");
  const [endDate, setEndDate] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onClickSubmit = async () => {
    if (submitting) {
      return;
    }
    if (!subject.trim()) {
      alert("과제 제목을 입력해주세요.");
      return;
    }
    if (!endDate) {
      alert("제출마감일을 선택해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("과제 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await createHomework(courseId, { subject, endDate, content });
      onSuccess();
    } catch (error) {
      // 입력값 검증 실패면 필드별 메시지를 함께 보여준다.
      const validationMessages = Object.values(error.validations ?? {}).flat();
      alert(
        validationMessages.length > 0
          ? validationMessages.join("\n")
          : error.message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "15px",
        margin: "10px 0",
        backgroundColor: "#fff",
        border: "1px solid #eee",
        borderRadius: "7px",
      }}
    >
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="과제 제목을 입력하세요."
        style={inputStyle}
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        style={inputStyle}
      />
      <textarea
        rows={10}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="과제 내용을 입력하세요."
        style={{ ...inputStyle, resize: "vertical" }}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px" }}>
        <IconButton onClick={onClickSubmit} disabled={submitting}>
          {submitting ? "등록 중..." : "등록"}
        </IconButton>
        <IconButton onClick={onCancel} disabled={submitting}>
          취소
        </IconButton>
      </div>
    </div>
  );
}
