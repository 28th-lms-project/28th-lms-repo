import { useState } from "react";
import { useParams } from "react-router-dom";
import { IconButton } from "../../../sample/input/IconButton";
import { createHomeworkReply } from "../../../../api/admin/course/courseApi";

/**
 * 과제 댓글 작성 폼
 * - 본문(textarea)에 링크를 그냥 붙여넣는 방식
 * @param {Function} onCancel 취소 버튼 클릭 시 호출
 * @param {Function} onSuccess 등록 성공 시 호출
 */
export default function ReplyForm({ onCancel, onSuccess }) {
  const { courseId, homeworkId } = useParams();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onClickSubmit = async () => {
    if (submitting) {
      return;
    }
    if (!content.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await createHomeworkReply(courseId, homeworkId, { content });
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
        gap: "5px",
        width: "100%",
      }}
    >
      <textarea
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글 입력... (링크도 그냥 붙여넣기)"
        style={{
          width: "100%",
          resize: "none",
          fontSize: "12px",
          padding: "5px",
          boxSizing: "border-box",
        }}
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
