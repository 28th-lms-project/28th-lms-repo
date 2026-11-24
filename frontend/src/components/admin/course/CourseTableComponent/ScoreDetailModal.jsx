import { useEffect, useState } from "react";
import Badge from "../../../common/ui/Badge";
import Button from "../../../common/ui/Button";
import Modal from "../../../common/ui/Modal";
import QuestionBlock from "../../../common/ui/QuestionBlock";
import StatusBox from "../../../common/ui/StatusBox";
import {
  ANSWER_TYPE,
  toAnswerTypeCode,
  useAnswerTypeName,
} from "../../../../utils/examAnswerType";
import {
  formatPoint,
  formatTestType,
  getScoreStatus,
} from "../../../../utils/scoreFormat.js";

/** 채점 결과 코드 → 화면 표시 (ExamGradeModal 과 같은 규칙) */
const GRADE_LABELS = {
  Y: { text: "정답", tone: "success" },
  N: { text: "오답", tone: "danger" },
  R: { text: "채점 중", tone: "warning" },
  H: { text: "부분정답", tone: "info" },
};

/** 자동 채점 유형 (서버 ExamServiceImpl.gradeAnswer: 객관식 단항 · O/X). 그 외는 강사 채점 */
const AUTO_GRADED_TYPES = [ANSWER_TYPE.SELECT, ANSWER_TYPE.CHECK];

/** 문항 채점 방식: 자동 채점 완료 / 강사 채점 완료 / 미채점 */
const gradeMethodOf = (item, answerType) => {
  if (!item.isCorrect) {
    return null;
  }
  if (item.isCorrect === "R") {
    return "미채점";
  }
  return AUTO_GRADED_TYPES.includes(answerType) ? "자동 채점" : "강사 채점";
};

const STATUS_TONE = {
  unsubmitted: "neutral",
  pending: "warning",
  done: "success",
};

const OX_OPTIONS = [
  { value: "O", label: "O" },
  { value: "X", label: "X" },
];

const choicesOf = (item) =>
  [
    item.answerSheet1,
    item.answerSheet2,
    item.answerSheet3,
    item.answerSheet4,
    item.answerSheet5,
  ]
    .map((text, index) => ({ value: String(index + 1), label: text }))
    .filter((choice) => choice.label);

/** "1,3" → ["1", "3"] */
const splitNumbers = (value) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * 시험 1건 상세 성적 (읽기 전용 Modal lg).
 * 시험명 · 응시일 · 총점 · 획득 점수와 문항별 배점 · 획득 점수 · 정답 · 제출 답안 · 채점 결과를 보여준다.
 *
 * @param load (options) => Promise<ScoreDetailVO>  상세 성적 조회 함수 (강사용 / 학생용 API 를 넘긴다)
 * @param answerLabel 답안 상자 이름 ("홍길동 답안", "내 답안")
 * @param onClose 닫기
 */
export default function ScoreDetailModal({ load, answerLabel, onClose }) {
  const toAnswerTypeName = useAnswerTypeName();
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    load({ signal: controller.signal })
      .then((result) => {
        setDetail(result);
        setStatus("loaded");
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        setErrorMessage(error.message || "상세 성적을 불러오지 못했습니다.");
        setStatus("failed");
      });
    return () => controller.abort();
  }, [load]);

  const items = detail?.items ?? [];
  const scoreStatus = detail ? getScoreStatus(detail) : null;

  /** 유형별 보기 · 정답 표시 (객관식 · O/X 는 보기에 정답 초록 · 고른 오답 빨강) */
  const blockPropsOf = (item) => {
    const answerType = toAnswerTypeCode(item.answerType);
    if (answerType === ANSWER_TYPE.SELECT || answerType === ANSWER_TYPE.MULTIPLE) {
      return {
        options: choicesOf(item),
        multiple: answerType === ANSWER_TYPE.MULTIPLE,
        value:
          answerType === ANSWER_TYPE.MULTIPLE
            ? splitNumbers(item.answer)
            : (item.answer ?? ""),
        answer: splitNumbers(item.correctAnswer),
        showResult: true,
      };
    }
    if (answerType === ANSWER_TYPE.CHECK) {
      return {
        options: OX_OPTIONS,
        value: item.answer ?? "",
        answer: item.correctAnswer ?? "",
        showResult: true,
      };
    }
    return {};
  };

  const renderItem = (item, index) => {
    const answerType = toAnswerTypeCode(item.answerType);
    const isCode = answerType === ANSWER_TYPE.CODE;
    const isChoice = [
      ANSWER_TYPE.SELECT,
      ANSWER_TYPE.MULTIPLE,
      ANSWER_TYPE.CHECK,
    ].includes(answerType);
    const grade = GRADE_LABELS[item.isCorrect];
    const answered = item.answer !== null && item.answer !== undefined && item.answer !== "";

    return (
      <QuestionBlock
        key={item.testId}
        no={index + 1}
        title={
          <>
            {item.question}{" "}
            <span className="tag">{toAnswerTypeName(item.answerType)}</span>
          </>
        }
        score={item.pointAlloc ?? 0}
        body={!isCode ? item.subQuestion || undefined : undefined}
        code={isCode ? item.subQuestion || undefined : undefined}
        {...blockPropsOf(item)}
      >
        {!isChoice && item.correctAnswer && (
          <div className="answer-box answer-box-model">
            <span className="answer-box-label">모범 답안</span>
            {item.correctAnswer}
          </div>
        )}
        {answered ? (
          <div className={`answer-box${isCode ? " answer-box-code" : ""}`}>
            <span className="answer-box-label">
              {answerLabel}{" "}
              {grade && <Badge tone={grade.tone}>{grade.text}</Badge>}{" "}
              {gradeMethodOf(item, answerType) && (
                <span className="tag">{gradeMethodOf(item, answerType)}</span>
              )}{" "}
              <Badge tone="neutral">
                {item.earnedPoint ?? 0} / {item.pointAlloc ?? 0}점
              </Badge>
            </span>
            {!isChoice && item.answer}
          </div>
        ) : (
          <div className="answer-box answer-box-empty">
            제출한 답안이 없습니다.{" "}
            {grade && <Badge tone={grade.tone}>{grade.text}</Badge>}
          </div>
        )}
      </QuestionBlock>
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      closeOnBackdrop
      size="lg"
      className="modal-wide"
      title={detail ? detail.setName : "상세 성적"}
      summary={
        detail
          ? `${formatTestType(detail.testType)} · 문제 ${items.length}개`
          : undefined
      }
      footer={<Button onClick={onClose}>닫기</Button>}
    >
      {status === "loading" && <StatusBox type="loading" size="sm" />}
      {status === "failed" && (
        <StatusBox type="error" size="sm" detail={errorMessage} />
      )}
      {status === "loaded" && detail && (
        <div className="form-stack">
          <dl className="desc-list-stacked" style={{ "--desc-columns": 4 }}>
            {detail.userName && (
              <div>
                <dt>수강생</dt>
                <dd>{detail.userName}</dd>
              </div>
            )}
            <div>
              <dt>응시일</dt>
              <dd>{detail.submittedAt ?? "미응시"}</dd>
            </div>
            <div>
              <dt>획득 점수 / 총점</dt>
              <dd>{formatPoint(detail.score, detail.totalPoint)}</dd>
            </div>
            <div>
              <dt>채점 상태</dt>
              <dd>
                <Badge tone={STATUS_TONE[scoreStatus.key]}>
                  {scoreStatus.label}
                </Badge>
              </dd>
            </div>
          </dl>
          {items.length === 0 ? (
            <StatusBox type="empty" size="sm" title="등록된 문제가 없습니다." />
          ) : (
            items.map(renderItem)
          )}
        </div>
      )}
    </Modal>
  );
}
