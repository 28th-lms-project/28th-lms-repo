import Button from "../../../common/ui/Button";
import Modal from "../../../common/ui/Modal";
import QuestionBlock from "../../../common/ui/QuestionBlock";
import StatusBox from "../../../common/ui/StatusBox";
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

/** 정답 번호 목록. 단항 "2" → ["2"], 다항 "1,3" → ["1", "3"] */
const correctNumbersOf = (question) =>
  (question.correctAnswer ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

/**
 * 시험 세트 문제 보기 (강사 / 관리자용, 읽기 전용).
 * 시험 응시 모달과 같은 모양으로 문제 · 보기를 보여주고, 정답(초록)과 모범 답안을 함께 표시한다.
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
  const toAnswerTypeName = useAnswerTypeName();
  const totalPoint = questions.reduce(
    (sum, question) => sum + (Number(question.pointAlloc) || 0),
    0,
  );

  /** 유형별 정답 표시 (QuestionBlock props + children) */
  const answerPropsOf = (question) => {
    // 저장 값이 코드 · 옛 한글 이름 어느 쪽이어도 코드로 바꿔서 비교
    const answerType = toAnswerTypeCode(question.answerType);
    switch (answerType) {
      case ANSWER_TYPE.SELECT:
      case ANSWER_TYPE.MULTIPLE:
        return {
          options: choicesOf(question),
          multiple: answerType === ANSWER_TYPE.MULTIPLE,
          answer: correctNumbersOf(question),
          showResult: true,
        };
      case ANSWER_TYPE.CHECK:
        return {
          options: OX_OPTIONS,
          answer: question.correctAnswer ?? "",
          showResult: true,
        };
      case ANSWER_TYPE.CODE:
      case ANSWER_TYPE.WRITE:
      default:
        return {
          children: (
            <div className="answer-box answer-box-model">
              <span className="answer-box-label">모범 답안</span>
              {question.correctAnswer || "없음 (강사가 채점)"}
            </div>
          ),
        };
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      closeOnBackdrop
      size="lg"
      title={title}
      summary={`문제 ${questions.length}개 · 총 ${totalPoint}점`}
      footer={<Button onClick={onClose}>닫기</Button>}
    >
      {questions.length === 0 ? (
        <StatusBox type="empty" size="sm" title="등록된 문제가 없습니다." />
      ) : (
        <div className="form-stack">
          {questions.map((question, index) => {
            const isCode =
              toAnswerTypeCode(question.answerType) === ANSWER_TYPE.CODE;
            return (
              <QuestionBlock
                key={question.id}
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
            );
          })}
        </div>
      )}
    </Modal>
  );
}
