import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  createCourseSurveyAnswers,
  getCourseSurveyQuestions,
  getMySurveyAnswered,
} from "../../../../api/admin/system/survey/surveyApi";
import Button from "../../../common/ui/Button";
import Panel from "../../../common/ui/Panel";
import StatusBox from "../../../common/ui/StatusBox";
import { useToast } from "../../../common/ui/feedbackContext";

export default function CourseSurveyAns() {
  const { courseId, courseSurveyId } = useParams();
  const toast = useToast();
  const [surveys, setSurveys] = useState();
  const [questions, setQuestions] = useState();
  const [answers, setAnswers] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [unansweredIds, setUnansweredIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const answered = await getMySurveyAnswered(courseId, courseSurveyId);
        if (answered) {
          if (!ignore) {
            // 창을 바로 닫으므로 토스트 대신 alert (닫히기 전에 읽을 수 있게)
            alert("이미 참여한 설문입니다.");
            window.close();
          }
          return;
        }

        // 과정 설문 정보 + 문항/보기 조회
        const result = await getCourseSurveyQuestions(courseId, courseSurveyId);
        if (!result || !result.courseSurvey) {
          if (!ignore) {
            setLoadError({ message: "설문을 찾을 수 없습니다." });
          }
          return;
        }

        if (!ignore) {
          setSurveys(result.courseSurvey);
          if (result.surveyList) {
            setQuestions(result.surveyList);
          } else {
            setQuestions([]);
          }
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

  const onChangeAnswerHandler = (questionId, type, value, checked) => {
    setAnswers((prev) => {
      if (type === "text") {
        return { ...prev, [questionId]: { textAnswer: value } };
      }
      if (type !== "checkBox") {
        return { ...prev, [questionId]: { optionIds: [value] } };
      }

      const prevAnswer = prev[questionId];
      let optionIds = [];

      if (prevAnswer) {
        optionIds = prevAnswer.optionIds;
      }

      if (checked) {
        if (optionIds.includes(value)) {
          return prev;
        }
        optionIds = [...optionIds, value];
      } else {
        optionIds = optionIds.filter((optionId) => optionId !== value);
      }
      return { ...prev, [questionId]: { optionIds } };
    });
  };

  if (loadError) {
    return (
      <div className="popup-page">
        <main className="popup-body">
          <StatusBox type="error" detail={loadError.message} />
        </main>
      </div>
    );
  }

  if (!surveys) {
    return (
      <div className="popup-page">
        <main className="popup-body">
          <StatusBox type="loading" />
        </main>
      </div>
    );
  }

  const onClickSaveButtonHandler = async () => {
    if (submitting) {
      return;
    }
    const answerList = Object.keys(answers).map((questionId) => {
      const answer = answers[questionId];
      return {
        questionId: questionId,
        optionIds: answer.optionIds,
        textAnswer: answer.textAnswer,
      };
    });
    if (answerList.length < questions.length) {
      const missing = questions
        .filter((question) => !answers[question.id])
        .map((question) => question.id);
      setUnansweredIds(missing);
      toast.error("모든 문항에 답변해주세요.");
      return;
    }
    setUnansweredIds([]);
    console.log(answerList);
    console.log(answers);

    setSubmitting(true);
    try {
      await createCourseSurveyAnswers(courseId, courseSurveyId, {
        answers: answerList,
      });
      // 창을 바로 닫으므로 토스트 대신 alert (닫히기 전에 읽을 수 있게)
      alert("제출되었습니다.");
      window.close();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 분해
  const { title, surveySubject, surveyType } = surveys;

  let saveText = "저장";
  if (submitting) {
    saveText = "저장 중...";
  }

  return (
    <div className="popup-page">
      <header className="popup-header">
        <h1 className="popup-title">{title}</h1>
        <div className="popup-actions">
          <Button onClick={() => window.close()}>닫기</Button>
        </div>
      </header>
      <main className="popup-body">
        <Panel
          title={`${surveySubject} · ${surveyType}`}
          subtitle={`${questions.length}문항`}
          footer={
            <Button
              variant="primary"
              loading={submitting}
              onClick={onClickSaveButtonHandler}
            >
              {saveText}
            </Button>
          }
        >
          <div className="form-stack">
            {questions.map((question, index) => (
              <SurveyAnswer
                key={question.id}
                no={index + 1}
                question={question}
                unanswered={unansweredIds.includes(question.id)}
                onChangeAnswerHandler={onChangeAnswerHandler}
              />
            ))}
          </div>
        </Panel>
      </main>
    </div>
  );
}

// 문항 유형별 입력 렌더링
const SurveyAnswer = ({ no, question, unanswered, onChangeAnswerHandler }) => {
  const { id, type, subject, surveyDataList } = question;
  const labelId = `question-${id}-label`;
  const messageId = `question-${id}-msg`;

  let input;
  if (type === "text") {
    input = (
      <input
        type="text"
        className="form-control"
        name={id}
        aria-labelledby={labelId}
        aria-invalid={unanswered}
        aria-describedby={messageId}
        onChange={(e) => onChangeAnswerHandler(id, type, e.currentTarget.value)}
      />
    );
  } else {
    let inputType = "radio";
    if (type === "checkBox") {
      inputType = "checkbox";
    }
    input = (
      <div className="form-check-group">
        {surveyDataList.map((data) => (
          <label key={data.id} className="form-check">
            <input
              type={inputType}
              name={id}
              value={data.id}
              onChange={(e) =>
                onChangeAnswerHandler(
                  id,
                  type,
                  data.id,
                  e.currentTarget.checked,
                )
              }
            />
            {data.data}
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="field" role="group" aria-labelledby={labelId}>
      <span className="field-label" id={labelId}>
        {no}. {subject}
      </span>
      {input}
      {unanswered && (
        <span className="field-error" id={messageId} role="alert">
          답변해주세요.
        </span>
      )}
    </div>
  );
};
