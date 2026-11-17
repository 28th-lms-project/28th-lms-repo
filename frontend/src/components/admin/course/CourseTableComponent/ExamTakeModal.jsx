import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";
import { createTestAnswers } from "../../../../api/admin/system/test/testApi";

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
  width: "800px",
  maxWidth: "92vw",
  maxHeight: "88vh",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#fff",
  borderRadius: "8px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
  overflow: "hidden",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 24px",
  borderBottom: "1px solid #e5e5e5",
};

const titleStyle = { margin: 0, fontSize: "18px", color: "#222" };

const summaryStyle = { fontSize: "13px", color: "#666" };

const bodyStyle = {
  padding: "8px 24px 24px",
  overflowY: "auto",
};

const questionStyle = {
  padding: "20px 0",
  borderBottom: "1px dashed #e5e5e5",
};

const questionTitleStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  margin: "0 0 12px",
  fontSize: "15px",
  fontWeight: "bold",
  color: "#222",
  lineHeight: 1.5,
};

const metaStyle = {
  flexShrink: 0,
  fontSize: "13px",
  fontWeight: "normal",
  color: "#666",
};

const subQuestionStyle = {
  margin: "0 0 12px",
  padding: "12px",
  backgroundColor: "#f7f7f7",
  border: "1px solid #e5e5e5",
  borderRadius: "4px",
  fontSize: "14px",
  whiteSpace: "pre-wrap",
};

const choiceStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 4px",
  fontSize: "14px",
  cursor: "pointer",
};

const textInputStyle = {
  width: "100%",
  padding: "8px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  boxSizing: "border-box",
};

const codeInputStyle = {
  ...textInputStyle,
  minHeight: "160px",
  fontFamily: "Consolas, 'Courier New', monospace",
  resize: "vertical",
};

const footerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 24px",
  borderTop: "1px solid #e5e5e5",
};

const submitButtonStyle = {
  minWidth: "72px",
  padding: "8px 16px",
  fontSize: "14px",
  borderRadius: "4px",
  cursor: "pointer",
  border: "1px solid #333",
  backgroundColor: "#333",
  color: "#fff",
};

/** answerSheet1~5 중 내용이 있는 선택지만 { no: "1", text } 로 */
const choicesOf = (question) =>
  [
    question.answerSheet1,
    question.answerSheet2,
    question.answerSheet3,
    question.answerSheet4,
    question.answerSheet5,
  ]
    .map((text, index) => ({ no: String(index + 1), text }))
    .filter((choice) => choice.text);

/** 답을 입력(선택)했는지 */
const isAnswered = (value) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value?.trim?.() ?? value);

/**
 * 시험 응시 화면 (문제 보기 모달과 같은 모양).
 * 정답은 표시하지 않고, 객관식은 선택 / 주관식 · 코드작성은 입력할 수 있다.
 * [닫기] 버튼과 바깥 클릭 닫기는 없고, [제출]로만 닫힌다.
 * 아직 제출 API가 없어 [제출]은 입력한 답안을 console.log로 찍고 닫는다.
 *
 * 표시할 내용은 testSlice.takeExam { testSetId, title, questions } 에서 읽고,
 * 닫을 때는 closeTakeExam 을 dispatch 한다.
 */
export default function ExamTakeModal() {
  const dispatch = useDispatch();
  const {
    testSetId,
    title,
    questions = [],
  } = useSelector((store) => store.test.takeExam ?? {});
  const onClose = () => dispatch(testActions.closeTakeExam());

  // key: 문제 ID, value: 답안 (다항은 선택한 번호 배열)
  const [answers, setAnswers] = useState({});

  const totalPoint = questions.reduce(
    (sum, question) => sum + (Number(question.pointAlloc) || 0),
    0,
  );
  const answeredCount = questions.filter((question) =>
    isAnswered(answers[question.id]),
  ).length;

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleMultiAnswer = (questionId, no) => {
    setAnswers((prev) => {
      const selected = prev[questionId] ?? [];
      const next = selected.includes(no)
        ? selected.filter((value) => value !== no)
        : [...selected, no];
      return { ...prev, [questionId]: next };
    });
  };

  // 제출 중이면 버튼을 다시 누를 수 없게 (중복 제출 방지)
  const [submitting, setSubmitting] = useState(false);

  // 응시 화면은 [제출]로만 닫힌다. 제출 API가 성공했을 때만 닫고, 실패하면 알림 후 창을 유지한다
  const onClickSubmit = async () => {
    if (submitting) {
      return;
    }
    // 문제가 없는 시험은 제출할 답이 없으므로 바로 닫음
    if (questions.length === 0) {
      onClose();
      return;
    }
    if (answeredCount < questions.length) {
      if (
        !confirm(
          `답하지 않은 문제가 ${questions.length - answeredCount}개 있습니다. 제출하시겠습니까?`,
        )
      ) {
        return;
      }
    }
    // 다항은 "1,3" 처럼 오름차순 문자열로 (서버 정답 형식과 맞춤)
    const submitAnswers = questions.map((question) => {
      const value = answers[question.id];
      return {
        testId: question.id,
        answer: Array.isArray(value)
          ? [...value].sort((a, b) => Number(a) - Number(b)).join(",")
          : (value ?? ""),
      };
    });
    setSubmitting(true);
    try {
      await createTestAnswers(testSetId, submitAnswers);
      alert("답안이 제출되었습니다.");
      onClose();
    } catch (error) {
      // 예: 이미 제출한 시험(400), 비공개 시험(403) — 서버 메시지를 그대로 보여주고 창은 유지
      alert(error.message || "답안 제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  /** 객관식(단항/다항) 선택지 */
  const renderChoices = (question, multiple) => {
    const selected = answers[question.id];
    return choicesOf(question).map((choice) => (
      <label key={choice.no} style={choiceStyle}>
        <input
          type={multiple ? "checkbox" : "radio"}
          name={`take-${question.id}`}
          checked={
            multiple
              ? (selected ?? []).includes(choice.no)
              : selected === choice.no
          }
          onChange={() =>
            multiple
              ? toggleMultiAnswer(question.id, choice.no)
              : setAnswer(question.id, choice.no)
          }
        />
        {choice.no}. {choice.text}
      </label>
    ));
  };

  /** O/X 선택지 */
  const renderOx = (question) =>
    ["O", "X"].map((value) => (
      <label key={value} style={choiceStyle}>
        <input
          type="radio"
          name={`take-${question.id}`}
          checked={answers[question.id] === value}
          onChange={() => setAnswer(question.id, value)}
        />
        {value}
      </label>
    ));

  /** 주관식 / 코드작성 입력칸 */
  const renderTextAnswer = (question, isCode) =>
    isCode ? (
      <textarea
        style={codeInputStyle}
        value={answers[question.id] ?? ""}
        onChange={(event) => setAnswer(question.id, event.target.value)}
        placeholder="코드를 작성하세요"
        spellCheck={false}
      />
    ) : (
      <input
        type="text"
        style={textInputStyle}
        value={answers[question.id] ?? ""}
        onChange={(event) => setAnswer(question.id, event.target.value)}
        placeholder="답을 입력하세요"
      />
    );

  const renderAnswerArea = (question) => {
    switch (question.answerType) {
      case "객관식-단항":
        return renderChoices(question, false);
      case "객관식-다항":
        return renderChoices(question, true);
      case "O/X":
        return renderOx(question);
      case "코드작성":
        return renderTextAnswer(question, true);
      case "주관식":
      default:
        return renderTextAnswer(question, false);
    }
  };

  // 바깥 클릭으로 닫히면 답안이 사라지므로, 응시 화면은 바깥 클릭으로 닫지 않는다
  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>{title}</h3>
          <span style={summaryStyle}>
            총 {questions.length}문항 · {totalPoint}점
          </span>
        </div>

        <div style={bodyStyle}>
          {questions.length === 0 && (
            <p style={{ padding: "20px 0", textAlign: "center" }}>
              등록된 문제가 없습니다.
            </p>
          )}
          {questions.map((question, index) => (
            <div key={question.id} style={questionStyle}>
              <p style={questionTitleStyle}>
                <span style={{ whiteSpace: "pre-wrap" }}>
                  {index + 1}. {question.question}
                </span>
                <span style={metaStyle}>
                  {question.answerType} · {question.pointAlloc ?? 0}점
                </span>
              </p>
              {question.subQuestion && (
                <div style={subQuestionStyle}>{question.subQuestion}</div>
              )}
              {renderAnswerArea(question)}
            </div>
          ))}
        </div>

        <div style={footerStyle}>
          <span style={summaryStyle}>
            답한 문제 {answeredCount} / {questions.length}
          </span>
          <button
            type="button"
            style={submitButtonStyle}
            onClick={onClickSubmit}
            disabled={submitting}
          >
            {submitting ? "제출 중..." : "제출"}
          </button>
        </div>
      </div>
    </div>
  );
}
