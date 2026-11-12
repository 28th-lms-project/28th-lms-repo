import { useState } from "react";

const CORRECT_COLOR = "#1a7f37";

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
  // 선택지는 정답 표시용이라 클릭해도 바뀌지 않음
  cursor: "default",
};

const correctChoiceStyle = {
  ...choiceStyle,
  color: CORRECT_COLOR,
  fontWeight: "bold",
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

const modelAnswerStyle = {
  marginTop: "8px",
  fontSize: "13px",
  color: CORRECT_COLOR,
};

const footerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  padding: "12px 24px",
  borderTop: "1px solid #e5e5e5",
};

const closeButtonStyle = {
  minWidth: "72px",
  padding: "8px 16px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  backgroundColor: "#fff",
  color: "#333",
  cursor: "pointer",
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

/** 정답 번호 목록. 단항 "2" → ["2"], 다항 "1,3" → ["1", "3"] */
const correctNumbersOf = (question) =>
  (question.correctAnswer ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

/**
 * 시험 세트 문제 보기 (강사 / 관리자용).
 * 자격증 시험지처럼 문제 · 선택지 · 입력칸을 보여주고, 배점과 정답을 함께 표시한다.
 * 입력값은 화면에서만 유지하며 제출하지 않는다.
 *
 * @param title 시험 제목
 * @param questions 문제 목록 (ExamQuestionVO[])
 * @param onClose 닫기
 */
export default function ExamQuestionViewModal({
  title,
  questions = [],
  onClose,
}) {
  // key: 문제 ID, value: 주관식 / 코드작성 입력값
  const [answers, setAnswers] = useState({});

  const totalPoint = questions.reduce(
    (sum, question) => sum + (Number(question.pointAlloc) || 0),
    0,
  );

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  /**
   * 정답 표시용 선택지 input.
   * 정답이면 체크된 상태로 고정하고, onChange에서 아무것도 하지 않아 클릭해도 바뀌지 않는다.
   * (disabled를 쓰면 회색으로 흐려져 정답 체크가 잘 안 보이므로 쓰지 않음)
   */
  const renderLockedInput = (type, name, isCorrect) => (
    <input
      type={type}
      name={name}
      checked={isCorrect}
      readOnly
      onChange={() => {}}
      style={{ cursor: "default", accentColor: CORRECT_COLOR }}
    />
  );

  /** 객관식(단항/다항) 선택지. 정답에 체크 고정 */
  const renderChoices = (question, multiple) => {
    const correctNumbers = correctNumbersOf(question);
    return choicesOf(question).map((choice) => {
      const isCorrect = correctNumbers.includes(choice.no);
      return (
        <label
          key={choice.no}
          style={isCorrect ? correctChoiceStyle : choiceStyle}
        >
          {renderLockedInput(
            multiple ? "checkbox" : "radio",
            `question-${question.id}`,
            isCorrect,
          )}
          {choice.no}. {choice.text}
          {isCorrect && " (정답)"}
        </label>
      );
    });
  };

  /** O/X 선택지. 정답에 체크 고정 */
  const renderOx = (question) =>
    ["O", "X"].map((value) => {
      const isCorrect = question.correctAnswer === value;
      return (
        <label key={value} style={isCorrect ? correctChoiceStyle : choiceStyle}>
          {renderLockedInput("radio", `question-${question.id}`, isCorrect)}
          {value}
          {isCorrect && " (정답)"}
        </label>
      );
    });

  /** 주관식 / 코드작성 입력칸. 모범 답안이 있으면 아래에 표시 */
  const renderTextAnswer = (question, isCode) => (
    <>
      {isCode ? (
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
      )}
      {question.correctAnswer && (
        <div style={modelAnswerStyle}>모범 답안: {question.correctAnswer}</div>
      )}
    </>
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

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={boxStyle} onClick={(event) => event.stopPropagation()}>
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
          <button type="button" style={closeButtonStyle} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
