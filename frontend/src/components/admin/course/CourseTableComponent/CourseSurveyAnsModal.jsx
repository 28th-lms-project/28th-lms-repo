import { useEffect, useId, useState } from "react";
import {
  createCourseSurveyAnswers,
  getCourseSurveyQuestions,
} from "../../../../api/admin/system/survey/surveyApi";
import Button from "../../../common/ui/Button";
import Modal from "../../../common/ui/Modal";
import Progress from "../../../common/ui/Progress";
import QuestionBlock from "../../../common/ui/QuestionBlock";
import StatusBox from "../../../common/ui/StatusBox";
import { useConfirm, useToast } from "../../../common/ui/feedbackContext";
import styles from "./CourseSurveyAnsModal.module.css";

/** 답을 입력(선택)했는지. 체크박스는 배열, 그 외는 문자열 */
const isAnswered = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "string") {
    return value.trim() !== "";
  }
  return false;
};

/** 문항의 보기 → QuestionBlock 보기 { value: 보기 ID, label } (보기가 없는 빈 줄은 뺌) */
const optionsOf = (question) => {
  if (!question.surveyDataList) {
    return [];
  }
  return question.surveyDataList
    .filter((data) => data.id)
    .map((data) => ({ value: data.id, label: data.data }));
};

/**
 * 설문 응답 모달 (Modal lg). 시험 응시 모달(ExamTakeModal)과 같은 모양.
 * 위에 문항 번호 막대, 바닥에 "답함 n / N" + [취소] [제출].
 * 답을 하나라도 적었으면 닫을 때 한 번 확인한다. 제출 중에는 닫히지 않는다.
 *
 * @param courseId 과정 ID
 * @param courseSurveyId 과정 설문 ID
 * @param onClose 닫기
 * @param onSubmitted 제출 성공 (목록 다시 불러오기용)
 */
export default function CourseSurveyAnsModal({
  courseId,
  courseSurveyId,
  onClose,
  onSubmitted,
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const baseId = useId();

  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadError, setLoadError] = useState(null);
  // key: 문항 ID, value: 체크박스는 보기 ID 배열, 단일 선택 · 주관식은 문자열
  const [answers, setAnswers] = useState({});
  const [unansweredIds, setUnansweredIds] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // 과정 설문 정보 + 문항/보기 조회
        const result = await getCourseSurveyQuestions(courseId, courseSurveyId);
        if (ignore) {
          return;
        }
        if (!result || !result.courseSurvey) {
          setLoadError({ message: "설문을 찾을 수 없습니다." });
          return;
        }
        setSurvey(result.courseSurvey);
        if (result.surveyList) {
          setQuestions(result.surveyList);
          if (result.surveyList.length > 0) {
            setCurrentId(result.surveyList[0].id);
          }
        } else {
          setQuestions([]);
        }
      } catch (e) {
        if (!ignore) {
          setLoadError(e);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [courseId, courseSurveyId]);

  const answeredCount = questions.filter((question) =>
    isAnswered(answers[question.id]),
  ).length;

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // 답을 적으면 그 문항의 "답변해주세요." 문구를 지움
    setUnansweredIds((prev) => prev.filter((id) => id !== questionId));
  };

  const questionDomId = (questionId) => `${baseId}-q-${questionId}`;

  // 문항 번호를 누르면 그 문항으로 스크롤
  const goToQuestion = (questionId) => {
    setCurrentId(questionId);
    const element = document.getElementById(questionDomId(questionId));
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 답을 적은 게 있으면 사라진다는 것을 알리고 닫음
  const requestClose = async () => {
    if (submitting) {
      return;
    }
    if (answeredCount > 0) {
      const ok = await confirm({
        title: "설문 닫기",
        message: "작성한 답이 사라집니다. 닫을까요?",
        confirmText: "닫기",
      });
      if (!ok) {
        return;
      }
    }
    onClose();
  };

  const onClickSubmit = async () => {
    if (submitting) {
      return;
    }
    const missing = questions
      .filter((question) => !isAnswered(answers[question.id]))
      .map((question) => question.id);
    if (missing.length > 0) {
      setUnansweredIds(missing);
      toast.error("모든 문항에 답변해주세요.");
      goToQuestion(missing[0]);
      return;
    }
    setUnansweredIds([]);

    const ok = await confirm({
      title: "설문 제출",
      message: "제출하면 고칠 수 없습니다. 제출할까요?",
      confirmText: "제출",
    });
    if (!ok) {
      return;
    }

    // 서버 형식: { questionId, optionIds } (선택형) · { questionId, textAnswer } (주관식)
    const answerList = questions.map((question) => {
      const value = answers[question.id];
      if (question.type === "text") {
        return { questionId: question.id, textAnswer: value };
      }
      if (Array.isArray(value)) {
        return { questionId: question.id, optionIds: value };
      }
      return { questionId: question.id, optionIds: [value] };
    });

    setSubmitting(true);
    try {
      await createCourseSurveyAnswers(courseId, courseSurveyId, {
        answers: answerList,
      });
      toast.success("설문을 제출했습니다.");
      onSubmitted();
    } catch (e) {
      // 예: 이미 참여함(409) · 수강생 아님 — 서버 문구를 보여 주고 창은 유지
      toast.error(`설문을 제출하지 못했습니다. ${e.message}`.trim());
    } finally {
      setSubmitting(false);
    }
  };

  /** 문항 하나: 선택형은 보기, 주관식은 입력 칸 */
  const renderQuestion = (question, index) => {
    const value = answers[question.id];
    const unanswered = unansweredIds.includes(question.id);
    const messageId = `${questionDomId(question.id)}-msg`;

    let blockProps;
    if (question.type === "text") {
      let text = "";
      if (typeof value === "string") {
        text = value;
      }
      blockProps = {
        children: (
          <textarea
            className="form-control"
            rows={3}
            aria-label={`${index + 1}번 답`}
            aria-invalid={unanswered}
            aria-describedby={messageId}
            value={text}
            onChange={(event) => setAnswer(question.id, event.target.value)}
            placeholder="답을 입력하세요."
          />
        ),
      };
    } else {
      const multiple = question.type === "checkBox";
      let chosen = value;
      if (chosen === undefined) {
        chosen = "";
        if (multiple) {
          chosen = [];
        }
      }
      blockProps = {
        options: optionsOf(question),
        multiple,
        value: chosen,
        onChange: (next) => setAnswer(question.id, next),
      };
    }

    return (
      <div
        key={question.id}
        id={questionDomId(question.id)}
        className={styles.question}
        onFocus={() => setCurrentId(question.id)}
      >
        <QuestionBlock no={index + 1} title={question.subject} {...blockProps} />
        {unanswered && (
          <p id={messageId} className="field-error" role="alert">
            답변해주세요.
          </p>
        )}
      </div>
    );
  };

  let body;
  if (loadError) {
    body = (
      <StatusBox
        type="error"
        size="sm"
        title="설문을 불러오지 못했습니다."
        detail={loadError.message}
      />
    );
  } else if (!survey) {
    body = <StatusBox type="loading" size="sm" title="설문을 불러오는 중..." />;
  } else if (questions.length === 0) {
    body = <StatusBox type="empty" size="sm" title="설문 문항이 없습니다." />;
  } else {
    body = (
      <div className="form-stack">
        <nav className="question-nav-bar" aria-label="문항 이동">
          <ol className="question-nav">
            {questions.map((question, index) => {
              const done = isAnswered(answers[question.id]);
              let itemClass = "question-nav-item";
              let stateText = "안 함";
              if (done) {
                itemClass = "question-nav-item is-done";
                stateText = "답함";
              }
              let current;
              if (currentId === question.id) {
                current = "step";
              }
              return (
                <li key={question.id}>
                  <button
                    type="button"
                    className={itemClass}
                    aria-current={current}
                    aria-label={`${index + 1}번 (${stateText})`}
                    onClick={() => goToQuestion(question.id)}
                  >
                    {index + 1}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        {questions.map(renderQuestion)}
      </div>
    );
  }

  let title = "설문";
  let summary;
  if (survey) {
    title = survey.title;
    summary = `${survey.surveySubject} · ${survey.surveyType} · ${questions.length}문항`;
  }

  let submitText = "제출";
  if (submitting) {
    submitText = "제출 중...";
  }

  // 문항이 있을 때만 진행 막대 · [제출]
  const canSubmit = survey !== null && questions.length > 0;

  return (
    <Modal
      open
      onClose={requestClose}
      dismissible={!submitting}
      size="lg"
      title={title}
      summary={summary}
      footer={
        <>
          {canSubmit && (
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
          <Button onClick={requestClose} disabled={submitting}>
            취소
          </Button>
          {canSubmit && (
            <Button
              variant="primary"
              loading={submitting}
              onClick={onClickSubmit}
            >
              {submitText}
            </Button>
          )}
        </>
      }
    >
      {body}
    </Modal>
  );
}
