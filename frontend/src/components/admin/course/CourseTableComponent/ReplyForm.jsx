import { useState } from "react";
import { useParams } from "react-router-dom";
import { createHomeworkReply } from "../../../../api/admin/course/courseApi";

import Button from "../../../common/ui/Button";
import { useToast } from "../../../common/ui/feedbackContext";

/**
 * 과제 댓글 작성 폼 (comment-form)
 * - 본문(textarea)에 링크를 그냥 붙여넣는 방식
 * @param {Function} [onCancel] 있으면 [취소] 버튼을 보여주고 클릭 시 호출
 * @param {Function} onSuccess 등록 성공 시 호출 (입력 칸은 비운다)
 */
export default function ReplyForm({ onCancel, onSuccess }) {
  const { courseId, homeworkId } = useParams();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const onClickSubmit = async () => {
    if (submitting || !content.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await createHomeworkReply(courseId, homeworkId, { content });
      setContent("");
      onSuccess();
    } catch (error) {
      // 입력값 검증 실패면 필드별 메시지를 함께 보여준다.
      const validationMessages = Object.values(error.validations ?? {}).flat();
      toast.error(
        validationMessages.length > 0
          ? `댓글을 등록하지 못했습니다.\n${validationMessages.join("\n")}`
          : `댓글을 등록하지 못했습니다. ${error.message ?? ""}`.trim(),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-form">
      <textarea
        className="form-control"
        rows={3}
        aria-label="댓글 내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="제출 내용 · 링크를 입력하세요."
      />
      <div className="btn-group btn-group-end">
        {onCancel && (
          <Button size="sm" onClick={onCancel} disabled={submitting}>
            취소
          </Button>
        )}
        <Button
          size="sm"
          variant="primary"
          loading={submitting}
          disabled={!content.trim()}
          onClick={onClickSubmit}
        >
          {submitting ? "등록 중..." : "등록"}
        </Button>
      </div>
    </div>
  );
}
