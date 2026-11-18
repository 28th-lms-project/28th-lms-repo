import { useId, useState } from "react";
import { useParams } from "react-router-dom";
import { createHomework } from "../../../../api/admin/course/courseApi";

import Button from "../../../common/ui/Button";
import Field from "../../../common/ui/Field";
import Panel from "../../../common/ui/Panel";
import { useToast } from "../../../common/ui/feedbackContext";

/** 오늘 날짜 (yyyy-MM-dd, 브라우저 시간대 기준) */
const getTodayText = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
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
  // 칸별 입력 오류 ([등록]을 누를 때 검사)
  const [errors, setErrors] = useState({});
  const toast = useToast();

  const baseId = useId();
  const subjectId = `${baseId}-subject`;
  const endDateId = `${baseId}-end`;
  const contentId = `${baseId}-content`;

  const onSubmit = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    const nextErrors = {};
    if (!subject.trim()) {
      nextErrors.subject = "과제 제목을 입력하세요.";
    }
    if (!endDate) {
      nextErrors.endDate = "제출 마감일을 고르세요.";
    } else if (endDate < getTodayText()) {
      // 달력의 min 은 직접 입력하면 우회되므로 등록할 때 한 번 더 검사 (yyyy-MM-dd 는 문자열 비교 = 날짜 비교)
      nextErrors.endDate = "제출 마감일은 오늘 이후로 고르세요.";
    }
    if (!content.trim()) {
      nextErrors.content = "과제 내용을 입력하세요.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await createHomework(courseId, { subject, endDate, content });
      onSuccess();
    } catch (error) {
      // 입력값 검증 실패면 필드별 메시지를 함께 보여준다.
      const validationMessages = Object.values(error.validations ?? {}).flat();
      toast.error(
        validationMessages.length > 0
          ? `과제를 등록하지 못했습니다.\n${validationMessages.join("\n")}`
          : `과제를 등록하지 못했습니다. ${error.message ?? ""}`.trim(),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <Panel
        title="과제 등록"
        footer={
          <>
            <Button onClick={onCancel} disabled={submitting}>
              취소
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {submitting ? "등록 중..." : "등록"}
            </Button>
          </>
        }
      >
        <div className="form-stack">
          <div className="form-row">
            <Field
              label="과제 제목"
              htmlFor={subjectId}
              required
              error={errors.subject}
            >
              <input
                id={subjectId}
                type="text"
                className="form-control"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Field>
            <Field
              label="제출 마감일"
              htmlFor={endDateId}
              required
              error={errors.endDate}
            >
              <input
                id={endDateId}
                type="date"
                className="form-control"
                // 지난 날짜는 달력에서 고를 수 없게
                min={getTodayText()}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Field>
          </div>
          <Field
            label="과제 내용"
            htmlFor={contentId}
            required
            error={errors.content}
          >
            <textarea
              id={contentId}
              rows={10}
              className="form-control"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Field>
        </div>
      </Panel>
    </form>
  );
}
