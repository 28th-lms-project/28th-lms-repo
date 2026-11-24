import { useEffect, useId, useState } from "react";
import { useSelector } from "react-redux";
import {
  correctStudentTest,
  updateAnswerGrade,
} from "../../../../api/admin/system/test/testApi";
import usePermission from "../../../../hooks/usePermission";

import Badge from "../../../common/ui/Badge";
import Button from "../../../common/ui/Button";
import Modal from "../../../common/ui/Modal";
import QuestionBlock from "../../../common/ui/QuestionBlock";
import StatusBox from "../../../common/ui/StatusBox";
import { Tabs, TabPanel } from "../../../common/ui/Tabs";
import { useConfirm, useToast } from "../../../common/ui/feedbackContext";
import {
  ANSWER_TYPE,
  toAnswerTypeCode,
  useAnswerTypeName,
} from "../../../../utils/examAnswerType";
import { displayName } from "../../../../utils/displayName.js";

/** 채점 결과 코드 → 화면 표시 (배지 tone 은 가이드 배지 규칙) */
const GRADE_LABELS = {
  Y: { text: "정답", tone: "success" },
  N: { text: "오답", tone: "danger" },
  R: { text: "채점 중", tone: "warning" },
  H: { text: "부분정답", tone: "info" },
};

/** 강사가 누를 수 있는 채점 버튼 (R 채점 중 은 자동 채점 전용) */
const GRADE_BUTTONS = ["Y", "N", "H"];

/** answerSheet1~5 중 내용이 있는 선택지만 QuestionBlock 보기 { value: "1", label } 로 */
const choicesOf = (question) =>
  [
    question.answerSheet1,
    question.answerSheet2,
    question.answerSheet3,
    question.answerSheet4,
    question.answerSheet5,
  ]
    .map((text, index) => ({ value: String(index + 1), label: text }))
    .filter((choice) => choice.label);

const OX_OPTIONS = [
  { value: "O", label: "O" },
  { value: "X", label: "X" },
];

/** "1,3" → ["1", "3"] (정답 · 다항 답안) */
const splitNumbers = (value) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * 시험 채점 화면 (Modal lg).
 * 위쪽에 강의를 듣는 수강생 탭, 아래에 문제 · 정답과 선택한 수강생의 답안을 보여준다.
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
  const { can } = usePermission();
  const canGrade = can("EXAM_COURSE_EXAM_GRADE");
  const toast = useToast();
  const confirm = useConfirm();
  const tabsId = useId();
  const toAnswerTypeName = useAnswerTypeName();

  // 선택한 수강생 ID (처음엔 첫 번째 수강생)
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.id ?? null,
  );
  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );

  // 수강생별 답안.
  // { [수강생ID]: { status: "loading" | "error" | "loaded", error, byQuestion: { [문제ID]: { id: 답안ID, answer, isCorrect } } } }
  const [studentAnswers, setStudentAnswers] = useState({});
  const selectedEntry = studentAnswers[selectedStudentId];
  const answersOfStudent = selectedEntry?.byQuestion ?? {};

  /** 수강생 답안 조회 → { [문제ID]: { id, answer, isCorrect } } 로 저장 */
  const loadStudentAnswers = async (studentId) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [studentId]: { status: "loading" },
    }));
    try {
      const list = await correctStudentTest(testSetId, studentId);
      const byQuestion = Object.fromEntries(
        (list ?? []).map((item) => [
          item.testId,
          { id: item.id, answer: item.answer, isCorrect: item.isCorrect },
        ]),
      );
      setStudentAnswers((prev) => ({
        ...prev,
        [studentId]: { status: "loaded", byQuestion },
      }));
    } catch (error) {
      setStudentAnswers((prev) => ({
        ...prev,
        [studentId]: { status: "error", error },
      }));
    }
  };

  // 모달이 열릴 때 첫 번째 수강생의 답안 조회
  useEffect(() => {
    if (testSetId && students[0]?.id) {
      loadStudentAnswers(students[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 수강생 탭 선택 (Tabs 의 id 는 문자열) */
  const onChangeStudentTab = (tabId) => {
    const student = students.find((s) => String(s.id) === tabId);
    if (!student) {
      return;
    }
    setSelectedStudentId(student.id);
    // 이미 불러온 수강생이면 다시 부르지 않음 (실패했으면 다시 부름)
    const entry = studentAnswers[student.id];
    if (!entry || entry.status === "error") {
      loadStudentAnswers(student.id);
    }
  };

  /** 채점한 문항 수 (정답 · 오답 · 부분정답) */
  const gradedCountOf = (studentId) => {
    const entry = studentAnswers[studentId];
    if (entry?.status !== "loaded") {
      return undefined;
    }
    return Object.values(entry.byQuestion).filter((answer) =>
      GRADE_BUTTONS.includes(answer.isCorrect),
    ).length;
  };

  /** [정답] [오답] [부분정답] 클릭: 확인 → 서버에 저장 후 화면 반영 */
  const onClickGrade = async (question, grade) => {
    const studentAnswer = answersOfStudent[question.id];
    if (!studentAnswer?.id || studentAnswer.isCorrect === grade) {
      return;
    }
    const questionNo = questions.indexOf(question) + 1;
    const studentName = selectedStudent?.name
      ? displayName(selectedStudent.name, selectedStudent.nameSuffix)
      : "수강생";
    const ok = await confirm({
      title: "채점",
      message: `${studentName} 학생의 ${questionNo}번 문제를 '${GRADE_LABELS[grade].text}'(으)로 채점할까요?`,
      confirmText: "채점",
    });
    if (!ok) {
      return;
    }
    const studentId = selectedStudentId;
    try {
      await updateAnswerGrade(studentAnswer.id, grade);
      setStudentAnswers((prev) => {
        const entry = prev[studentId];
        return {
          ...prev,
          [studentId]: {
            ...entry,
            byQuestion: {
              ...entry.byQuestion,
              [question.id]: {
                ...entry.byQuestion[question.id],
                isCorrect: grade,
              },
            },
          },
        };
      });
      toast.success("채점 결과를 저장했습니다.");
    } catch (error) {
      toast.error(
        `채점 결과를 저장하지 못했습니다. ${error.message ?? ""}`.trim(),
      );
    }
  };

  const totalPoint = questions.reduce(
    (sum, question) => sum + (Number(question.pointAlloc) || 0),
    0,
  );

  /** 문항 하나: 문제 · 정답 + 학생 답안 + 채점 버튼 */
  const renderQuestion = (question, index) => {
    const studentAnswer = answersOfStudent[question.id];
    const answered = Boolean(studentAnswer?.answer);
    const grade = GRADE_LABELS[studentAnswer?.isCorrect];
    const studentName = selectedStudent?.name
      ? displayName(selectedStudent.name, selectedStudent.nameSuffix)
      : "수강생";
    // 저장 값이 코드 · 옛 한글 이름 어느 쪽이어도 코드로 바꿔서 비교
    const answerType = toAnswerTypeCode(question.answerType);
    const isChoice = [ANSWER_TYPE.SELECT, ANSWER_TYPE.MULTIPLE].includes(
      answerType,
    );
    const isOx = answerType === ANSWER_TYPE.CHECK;
    const isCode = answerType === ANSWER_TYPE.CODE;
    const multiple = answerType === ANSWER_TYPE.MULTIPLE;

    // 객관식 · O/X: 학생이 고른 보기를 value 로, 정답을 answer 로 → 정답 초록 · 고른 오답 빨강
    const blockProps = isChoice
      ? {
          options: choicesOf(question),
          multiple,
          value: multiple
            ? splitNumbers(studentAnswer?.answer)
            : (studentAnswer?.answer ?? ""),
          answer: splitNumbers(question.correctAnswer),
          showResult: true,
        }
      : isOx
        ? {
            options: OX_OPTIONS,
            value: studentAnswer?.answer ?? "",
            answer: question.correctAnswer ?? "",
            showResult: true,
          }
        : {};

    return (
      <QuestionBlock
        key={question.id}
        no={index + 1}
        title={
          <>
            {question.question}{" "}
            <span className="tag">{toAnswerTypeName(question.answerType)}</span>
          </>
        }
        score={Number(question.pointAlloc) || 0}
        body={!isCode ? question.subQuestion || undefined : undefined}
        code={isCode ? question.subQuestion || undefined : undefined}
        {...blockProps}
      >
        {/* 주관식 · 코드작성: 모범 답안 상자 */}
        {!isChoice && !isOx && question.correctAnswer && (
          <div className="answer-box answer-box-model">
            <span className="answer-box-label">모범 답안</span>
            {question.correctAnswer}
          </div>
        )}
        {/* 학생 답안 (객관식 · O/X 는 위 보기에 표시되므로 결과 배지만) */}
        {answered ? (
          <div
            className={`answer-box${isCode ? " answer-box-code" : ""}`}
          >
            <span className="answer-box-label">
              {studentName} 답안{" "}
              {grade && <Badge tone={grade.tone}>{grade.text}</Badge>}
            </span>
            {!isChoice && !isOx && studentAnswer.answer}
          </div>
        ) : (
          <div className="answer-box answer-box-empty">
            제출한 답안이 없습니다.
          </div>
        )}
        {/* 채점 버튼: 채점 권한(EXAM_COURSE_EXAM_GRADE)이 있을 때만. 제출한 답안(행)이 없으면 비활성 */}
        {canGrade && (
          <div
            className="btn-group"
            role="group"
            aria-label={`${index + 1}번 채점`}
          >
            {GRADE_BUTTONS.map((buttonGrade) => (
              <Button
                key={buttonGrade}
                size="sm"
                disabled={!studentAnswer?.id}
                aria-pressed={studentAnswer?.isCorrect === buttonGrade}
                onClick={() => onClickGrade(question, buttonGrade)}
              >
                {GRADE_LABELS[buttonGrade].text}
              </Button>
            ))}
          </div>
        )}
      </QuestionBlock>
    );
  };

  let tabBody;
  if (questions.length === 0) {
    tabBody = (
      <StatusBox type="empty" size="sm" title="등록된 문제가 없습니다." />
    );
  } else if (!selectedEntry || selectedEntry.status === "loading") {
    tabBody = <StatusBox type="loading" size="sm" />;
  } else if (selectedEntry.status === "error") {
    tabBody = (
      <StatusBox
        type="error"
        size="sm"
        title="답안을 불러오지 못했습니다."
        detail={selectedEntry.error?.message}
        onRetry={() => loadStudentAnswers(selectedStudentId)}
      />
    );
  } else {
    tabBody = (
      <div className="form-stack">
        <p className="field-hint">
          채점 {gradedCountOf(selectedStudentId)} / {questions.length}문항
          (탭의 숫자 = 채점한 문항 수)
        </p>
        {questions.map(renderQuestion)}
      </div>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`${title} · 채점`}
      summary={`수강생 ${students.length}명 · 문제 ${questions.length}개 · 총 ${totalPoint}점`}
      footer={<Button onClick={onClose}>닫기</Button>}
    >
      {students.length === 0 ? (
        <StatusBox
          type="empty"
          size="sm"
          title="이 과정을 듣는 수강생이 없습니다."
        />
      ) : (
        <>
          <Tabs
            idBase={tabsId}
            items={students.map((student) => ({
              id: String(student.id),
              label: student.name
                ? displayName(student.name, student.nameSuffix)
                : student.id,
              count: gradedCountOf(student.id),
            }))}
            value={String(selectedStudentId)}
            onChange={onChangeStudentTab}
            ariaLabel="수강생"
          />
          <TabPanel idBase={tabsId} tabId={String(selectedStudentId)}>
            {tabBody}
          </TabPanel>
        </>
      )}
    </Modal>
  );
}
