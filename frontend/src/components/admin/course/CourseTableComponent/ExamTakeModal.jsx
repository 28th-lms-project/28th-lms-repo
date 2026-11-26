import { useId, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";
import { createTestAnswers } from "../../../../api/admin/system/test/testApi";

import Button from "../../../common/ui/Button";
import Modal from "../../../common/ui/Modal";
import Progress from "../../../common/ui/Progress";
import QuestionBlock from "../../../common/ui/QuestionBlock";
import StatusBox from "../../../common/ui/StatusBox";
import { useConfirm, useToast } from "../../../common/ui/feedbackContext";
import styles from "./ExamTakeModal.module.css";
import {
  ANSWER_TYPE,
  toAnswerTypeCode,
  useAnswerTypeName,
} from "../../../../utils/examAnswerType";

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

/** 답을 입력(선택)했는지 */
const isAnswered = (value) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value?.trim?.() ?? value);

/**
 * 시험 응시 모달 (Modal lg).
 * 정답은 표시하지 않고, 객관식은 선택 / 주관식 · 코드작성은 입력할 수 있다.
 * X · Esc · 바깥 클릭으로는 닫히지 않고, [제출]로만 닫힌다 (답안이 사라지지 않도록).
 *
 * 표시할 내용은 testSlice.takeExam { testSetId, title, questions } 에서 읽고,
 * 닫을 때는 closeTakeExam 을 dispatch 한다.
 *
 * @param {(testSetId: string) => void} [onSubmitted] 제출 성공 시 호출 (목록에 "응시 완료" 표시용)
 */
export default function ExamTakeModal({ onSubmitted = () => {} }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const confirm = useConfirm();
  const baseId = useId();
  const {
    testSetId,
    title,
    questions = [],
  } = useSelector((store) => store.test.takeExam ?? {});
  const onClose = () => dispatch(testActions.closeTakeExam());
  const toAnswerTypeName = useAnswerTypeName();

  // key: 문제 ID, value: 답안 (다항은 선택한 번호 배열)
  const [answers, setAnswers] = useState({});
  // 지금 보고 있는 문항 (문항 번호 막대의 aria-current)
  const [currentId, setCurrentId] = useState(questions[0]?.id ?? null);

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

  const questionDomId = (question) => `${baseId}-q-${question.id}`;
  // 문항 번호를 누르면 그 문항으로 스크롤
  const goToQuestion = (question) => {
    setCurrentId(question.id);
    document
      .getElementById(questionDomId(question))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    // 제출하면 고칠 수 없으므로 항상 한 번 묻는다 (안 푼 문항이 있으면 개수도 알림)
    const left = questions.length - answeredCount;
    const ok = await confirm({
      title: "답안 제출",
      message: left
        ? `답하지 않은 문항이 ${left}개 있습니다. 그래도 제출할까요?\n제출하면 고칠 수 없습니다.`
        : "제출하면 고칠 수 없습니다. 제출할까요?",
      confirmText: "제출",
    });
    if (!ok) {
      return;
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
      toast.success("답안을 제출했습니다.");
      onSubmitted(testSetId);
      onClose();
    } catch (error) {
      // 예: 이미 제출한 시험(400), 비공개 시험(403) — 서버 메시지를 보여주고 창은 유지
      toast.error(
        `답안을 제출하지 못했습니다. ${error.message ?? ""}`.trim(),
      );
    } finally {
      setSubmitting(false);
    }
  };

  /** 유형별 보기 · 답 칸 (QuestionBlock props + children) */
  const answerPropsOf = (question) => {
    const value = answers[question.id];
    const onChange = (next) => setAnswer(question.id, next);
    // 저장 값이 코드 · 옛 한글 이름 어느 쪽이어도 코드로 바꿔서 비교
    const answerType = toAnswerTypeCode(question.answerType);
    switch (answerType) {
      case ANSWER_TYPE.SELECT:
        return { options: choicesOf(question), value: value ?? "", onChange };
      case ANSWER_TYPE.MULTIPLE:
        return {
          options: choicesOf(question),
          multiple: true,
          value: value ?? [],
          onChange,
        };
      case ANSWER_TYPE.CHECK:
        return { options: OX_OPTIONS, value: value ?? "", onChange };
      case ANSWER_TYPE.CODE:
      case ANSWER_TYPE.WRITE:
      default: {
        const isCode = answerType === ANSWER_TYPE.CODE;
        return {
          children: (
            <textarea
              className={`form-control${isCode ? " form-control-mono" : ""}`}
              rows={isCode ? 6 : 3}
              aria-label={`${questions.indexOf(question) + 1}번 답안`}
              value={value ?? ""}
              onChange={(event) => setAnswer(question.id, event.target.value)}
              placeholder={isCode ? "코드를 작성하세요." : "답을 입력하세요."}
              spellCheck={isCode ? false : undefined}
            />
          ),
        };
      }
    }
  };

  return (
    <Modal
      open
      dismissible={false}
      size="lg"
      title={title}
      summary={`문제 ${questions.length}개 · 총 ${totalPoint}점`}
      footer={
        <>
          {questions.length > 0 && (
            <div className={`progress-row ${styles.progress}`}>
              <span className={`field-hint ${styles.progressText}`}>
                답함 {answeredCount} / {questions.length}
              </span>
              <Progress
                value={answeredCount}
                max={questions.length}
                size="sm"
                label="답한 문항"
              />
            </div>
          )}
          <Button variant="primary" loading={submitting} onClick={onClickSubmit}>
            {submitting ? "제출 중..." : "제출"}
          </Button>
        </>
      }
    >
      {questions.length === 0 ? (
        <StatusBox type="empty" size="sm" title="등록된 문제가 없습니다." />
      ) : (
        <div className="form-stack">
          <nav className="question-nav-bar" aria-label="문항 이동">
            <ol className="question-nav">
              {questions.map((question, index) => {
                const done = isAnswered(answers[question.id]);
                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      className={`question-nav-item${done ? " is-done" : ""}`}
                      aria-current={
                        currentId === question.id ? "step" : undefined
                      }
                      aria-label={`${index + 1}번 (${done ? "답함" : "안 함"})`}
                      onClick={() => goToQuestion(question)}
                    >
                      {index + 1}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          {questions.map((question, index) => {
            const isCode =
              toAnswerTypeCode(question.answerType) === ANSWER_TYPE.CODE;
            return (
              <div
                key={question.id}
                id={questionDomId(question)}
                className={styles.question}
                onFocus={() => setCurrentId(question.id)}
              >
                <QuestionBlock
                  no={index + 1}
                  title={
                    <>
                      {question.question}{" "}
                      <span className="tag">
                        {toAnswerTypeName(question.answerType)}
                      </span>
                    </>
                  }
                  score={Number(question.pointAlloc) || 0}
                  body={!isCode ? question.subQuestion || undefined : undefined}
                  code={isCode ? question.subQuestion || undefined : undefined}
                  {...answerPropsOf(question)}
                />
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
