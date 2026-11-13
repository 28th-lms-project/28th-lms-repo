import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  correctStudentTest,
  updateAnswerGrade,
} from "../../../../api/admin/system/test/testApi";
import ConfirmModal from "./ConfirmModal";

const CORRECT_COLOR = "#1a7f37";
const ACTIVE_COLOR = "#333";

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
  width: "900px",
  maxWidth: "94vw",
  maxHeight: "90vh",
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

/** 수강생 탭 줄: 많으면 가로 스크롤 */
const tabBarStyle = {
  display: "flex",
  gap: "4px",
  padding: "8px 24px 0",
  borderBottom: "1px solid #e5e5e5",
  overflowX: "auto",
  flexShrink: 0,
};

const tabStyle = {
  padding: "8px 14px",
  fontSize: "14px",
  color: "#666",
  backgroundColor: "#f7f7f7",
  // border 축약형과 borderColor 를 섞으면 탭 전환 시 React 경고가 나므로 나눠서 지정
  borderStyle: "solid",
  borderWidth: "1px 1px 0", // 위 · 좌우만 (아래 없음)
  borderColor: "#e5e5e5",
  borderRadius: "6px 6px 0 0",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const activeTabStyle = {
  ...tabStyle,
  color: "#fff",
  backgroundColor: ACTIVE_COLOR,
  borderColor: ACTIVE_COLOR,
  fontWeight: "bold",
};

const bodyStyle = {
  padding: "8px 24px 24px",
  overflowY: "auto",
};

const emptyStyle = {
  padding: "40px 0",
  textAlign: "center",
  color: "#666",
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
  padding: "4px",
  fontSize: "14px",
  color: "#333",
};

const correctChoiceStyle = {
  ...choiceStyle,
  color: CORRECT_COLOR,
  fontWeight: "bold",
};

const modelAnswerStyle = {
  fontSize: "13px",
  color: CORRECT_COLOR,
};

const studentAnswerStyle = {
  marginTop: "12px",
  padding: "12px",
  border: "1px solid #e5e5e5",
  borderRadius: "4px",
  backgroundColor: "#fafafa",
  fontSize: "14px",
};

const studentAnswerLabelStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: "bold",
  color: "#555",
};

const studentAnswerTextStyle = {
  whiteSpace: "pre-wrap",
  fontFamily: "Consolas, 'Courier New', monospace",
  color: "#222",
};

const noAnswerStyle = { color: "#999" };

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

/** 채점 결과 코드 → 화면 표시 */
const GRADE_LABELS = {
  Y: { text: "정답", color: CORRECT_COLOR },
  N: { text: "오답", color: "#d1242f" },
  R: { text: "채점 중", color: "#9a6700" },
  H: { text: "부분정답", color: "#0969da" },
};

/** 강사가 누를 수 있는 채점 버튼 (R 채점 중 은 자동 채점 전용) */
const GRADE_BUTTONS = ["Y", "N", "H"];

const gradeButtonAreaStyle = {
  display: "flex",
  gap: "6px",
  marginTop: "10px",
};

const gradeButtonStyle = {
  minWidth: "72px",
  padding: "6px 12px",
  fontSize: "13px",
  borderStyle: "solid",
  borderWidth: "1px",
  borderColor: "#ccc",
  borderRadius: "4px",
  backgroundColor: "#fff",
  color: "#333",
  cursor: "pointer",
};

/** 선택된 채점 버튼: 해당 결과 색으로 채움 */
const selectedGradeButtonStyle = (grade) => ({
  ...gradeButtonStyle,
  borderColor: GRADE_LABELS[grade].color,
  backgroundColor: GRADE_LABELS[grade].color,
  color: "#fff",
  fontWeight: "bold",
});

const disabledGradeButtonStyle = {
  ...gradeButtonStyle,
  color: "#bbb",
  cursor: "not-allowed",
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
 * 시험 채점 화면.
 * 위쪽에 강의를 듣는 수강생 탭, 아래에 문제 · 정답과 선택한 수강생의 답안 자리를 보여준다.
 *
 * @param title 시험 제목
 * @param questions 문제 목록 (ExamQuestionVO[])
 * @param students 수강생 목록 [{ id, name }]
 * @param onClose 닫기
 *
 * 수강생 답안은 탭을 고를 때 GET admin/{testSetId}/correct/{userId} 로 불러오고,
 * 문제마다 [정답] [오답] [부분정답] 버튼으로 PUT /admin/test/answer/{answerId}/grade 에 저장한다.
 */
export default function ExamGradeModal({
  title,
  questions = [],
  students = [],
  onClose,
}) {
  // 채점 중인 시험 세트 ID (ExamSetTable 에서 [채점] 클릭 시 slice 에 저장)
  const testSetId = useSelector((store) => store.test.gradeTestSetId);

  // 선택한 수강생 ID (처음엔 첫 번째 수강생)
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.id ?? null,
  );
  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );

  // 수강생별 답안. { [수강생ID]: { [문제ID]: { id: 답안ID, answer, isCorrect } } }
  const [studentAnswers, setStudentAnswers] = useState({});
  const answersOfStudent = studentAnswers[selectedStudentId] ?? {};

  /** 수강생 답안 조회 → { [문제ID]: { id, answer, isCorrect } } 로 저장 */
  const loadStudentAnswers = async (studentId) => {
    try {
      const list = await correctStudentTest(testSetId, studentId);
      const byQuestion = Object.fromEntries(
        (list ?? []).map((item) => [
          item.testId,
          { id: item.id, answer: item.answer, isCorrect: item.isCorrect },
        ]),
      );
      setStudentAnswers((prev) => ({ ...prev, [studentId]: byQuestion }));
    } catch (e) {
      console.log(e);
      alert("답안을 불러오지 못했습니다.");
    }
  };

  // 모달이 열릴 때 첫 번째 수강생의 답안 조회
  useEffect(() => {
    if (testSetId && students[0]?.id) {
      // API 응답 후(await 뒤)에 setState 하므로 동기 호출이 아님 (Grid.jsx 와 같은 방식으로 규칙 해제)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadStudentAnswers(students[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 수강생 탭 클릭 */
  const onClickStudentTab = (studentId) => {
    console.log("선택한 수강생 ID", studentId);
    setSelectedStudentId(studentId);
    // 이미 불러온 수강생이면 다시 부르지 않음
    if (!studentAnswers[studentId]) {
      loadStudentAnswers(studentId);
    }
  };

  /** [정답] [오답] [부분정답] 클릭: 서버에 저장 후 화면 반영 */
  // 확인창을 띄울 채점 대상 { question, grade } (null이면 확인창 닫힘)
  const [gradeTarget, setGradeTarget] = useState(null);

  /** 채점 버튼 클릭: 바로 저장하지 않고 확인창을 띄운다 */
  const onClickGrade = (question, grade) => {
    const studentAnswer = answersOfStudent[question.id];
    if (!studentAnswer?.id || studentAnswer.isCorrect === grade) {
      return;
    }
    setGradeTarget({ question, grade });
  };

  /** 확인창 문구. 예) 홍길동 학생의 3번 문제를 '정답'으로 채점하시겠습니까? */
  const gradeConfirmMessage = (target) => {
    const questionNo = questions.indexOf(target.question) + 1;
    const studentName = selectedStudent?.name ?? "수강생";
    return `${studentName} 학생의 ${questionNo}번 문제를 '${GRADE_LABELS[target.grade].text}'(으)로 채점하시겠습니까?`;
  };

  /** 확인창 [확인]: 서버에 저장 후 화면 반영 */
  const onConfirmGrade = async () => {
    const { question, grade } = gradeTarget;
    setGradeTarget(null);
    const studentAnswer = answersOfStudent[question.id];
    const studentId = selectedStudentId;
    try {
      await updateAnswerGrade(studentAnswer.id, grade);
      setStudentAnswers((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [question.id]: { ...prev[studentId][question.id], isCorrect: grade },
        },
      }));
    } catch (e) {
      console.log(e);
      alert("채점 결과를 저장하지 못했습니다.");
    }
  };

  const totalPoint = questions.reduce(
    (sum, question) => sum + (Number(question.pointAlloc) || 0),
    0,
  );

  /** 정답 표시 (읽기 전용) */
  const renderCorrectAnswer = (question) => {
    if (["객관식-단항", "객관식-다항"].includes(question.answerType)) {
      const correctNumbers = correctNumbersOf(question);
      return choicesOf(question).map((choice) => {
        const isCorrect = correctNumbers.includes(choice.no);
        return (
          <div
            key={choice.no}
            style={isCorrect ? correctChoiceStyle : choiceStyle}
          >
            {isCorrect ? "✔" : "○"} {choice.no}. {choice.text}
          </div>
        );
      });
    }
    if (question.answerType === "O/X") {
      return ["O", "X"].map((value) => {
        const isCorrect = question.correctAnswer === value;
        return (
          <div key={value} style={isCorrect ? correctChoiceStyle : choiceStyle}>
            {isCorrect ? "✔" : "○"} {value}
          </div>
        );
      });
    }
    // 주관식 / 코드작성: 저장된 모범 답안이 있으면 표시
    return question.correctAnswer ? (
      <div style={modelAnswerStyle}>모범 답안: {question.correctAnswer}</div>
    ) : null;
  };

  /** 선택한 수강생의 답안 */
  const renderStudentAnswer = (question) => {
    const studentAnswer = answersOfStudent[question.id];
    const grade = GRADE_LABELS[studentAnswer?.isCorrect];
    return (
      <div style={studentAnswerStyle}>
        <div style={studentAnswerLabelStyle}>
          <span>{selectedStudent?.name ?? "수강생"} 답안</span>
          {grade && <span style={{ color: grade.color }}>{grade.text}</span>}
        </div>
        {studentAnswer?.answer ? (
          <div style={studentAnswerTextStyle}>{studentAnswer.answer}</div>
        ) : (
          <div style={noAnswerStyle}>제출한 답안이 없습니다.</div>
        )}
        {/* 채점 버튼: 제출한 답안(행)이 없으면 저장할 대상이 없어 비활성 */}
        <div style={gradeButtonAreaStyle}>
          {GRADE_BUTTONS.map((buttonGrade) => {
            const disabled = !studentAnswer?.id;
            const selected = studentAnswer?.isCorrect === buttonGrade;
            return (
              <button
                key={buttonGrade}
                type="button"
                disabled={disabled}
                style={
                  disabled
                    ? disabledGradeButtonStyle
                    : selected
                      ? selectedGradeButtonStyle(buttonGrade)
                      : gradeButtonStyle
                }
                onClick={() => onClickGrade(question, buttonGrade)}
              >
                {GRADE_LABELS[buttonGrade].text}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={boxStyle} onClick={(event) => event.stopPropagation()}>
        {gradeTarget && (
          <ConfirmModal
            message={gradeConfirmMessage(gradeTarget)}
            onConfirm={onConfirmGrade}
            onCancel={() => setGradeTarget(null)}
          />
        )}
        <div style={headerStyle}>
          <h3 style={titleStyle}>{title} · 채점</h3>
          <span style={summaryStyle}>
            수강생 {students.length}명 · 총 {questions.length}문항 ·{" "}
            {totalPoint}점
          </span>
        </div>

        {students.length > 0 && (
          <div style={tabBarStyle}>
            {students.map((student) => (
              <button
                key={student.id}
                type="button"
                style={
                  student.id === selectedStudentId ? activeTabStyle : tabStyle
                }
                onClick={() => onClickStudentTab(student.id)}
              >
                {student.name ?? student.id}
              </button>
            ))}
          </div>
        )}

        <div style={bodyStyle}>
          {students.length === 0 && (
            <p style={emptyStyle}>이 강의를 듣는 수강생이 없습니다.</p>
          )}
          {students.length > 0 && questions.length === 0 && (
            <p style={emptyStyle}>등록된 문제가 없습니다.</p>
          )}
          {students.length > 0 &&
            questions.map((question, index) => (
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
                {renderCorrectAnswer(question)}
                {renderStudentAnswer(question)}
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
