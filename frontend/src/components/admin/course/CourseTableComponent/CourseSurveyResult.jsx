import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getCourseSurveyResult,
  getCourseSurveyStudentAnswers,
} from "../../../../api/admin/system/survey/surveyApi";
import Button from "../../../common/ui/Button";
import Panel from "../../../common/ui/Panel";
import StatusBox from "../../../common/ui/StatusBox";
import { useToast } from "../../../common/ui/feedbackContext";

/**
 * 설문 결과 팝업: 응답한 학생을 선택하면 그 학생의 답변을 보여준다 (읽기 전용)
 */
export default function CourseSurveyResult() {
  const { courseId, courseSurveyId } = useParams();
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [answers, setAnswers] = useState([]);

  // 설문 정보 + 문항 + 응답한 학생 목록
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getCourseSurveyResult(courseId, courseSurveyId);
        if (!ignore) {
          setResult(data);
          if (data.respondents.length > 0) {
            setSelectedStudentId(data.respondents[0].respondentId);
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

  // 선택한 학생의 답변
  useEffect(() => {
    if (!selectedStudentId) {
      return;
    }
    let ignore = false;
    (async () => {
      try {
        const data = await getCourseSurveyStudentAnswers(
          courseId,
          courseSurveyId,
          selectedStudentId,
        );
        if (!ignore) {
          setAnswers(data);
        }
      } catch (e) {
        if (!ignore) {
          toast.error(e.message);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [courseId, courseSurveyId, selectedStudentId, toast]);

  if (loadError) {
    return (
      <div className="popup-page">
        <main className="popup-body">
          <StatusBox type="error" detail={loadError.message} />
        </main>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="popup-page">
        <main className="popup-body">
          <StatusBox type="loading" />
        </main>
      </div>
    );
  }

  const { title, surveySubject, surveyType } = result.courseSurvey;

  // 강사는 익명 조회 (서버가 이름 · 수강생 ID 없이 "응답자 N"만 내려줌)
  const anonymous = Boolean(result.anonymous);
  let selectedName = "";
  result.respondents.forEach((student) => {
    if (student.respondentId === selectedStudentId) {
      selectedName = student.name;
    }
  });
  const answerTitle = anonymous
    ? `${selectedName}의 답변`
    : `${selectedName} 학생의 답변`;

  let body;
  if (result.respondents.length === 0) {
    body = <StatusBox type="empty" title="아직 응답한 학생이 없습니다." />;
  } else {
    body = (
      <div className="layout-split layout-split-start">
        <Panel
          title={anonymous ? "응답자 (익명)" : "응답한 학생"}
          subtitle={`${result.respondents.length}명`}
          flush
        >
          <ul className="list-group">
            {result.respondents.map((student) => {
              let current;
              if (student.respondentId === selectedStudentId) {
                current = "true";
              }
              return (
                <li key={student.respondentId}>
                  <button
                    type="button"
                    className="list-item"
                    aria-current={current}
                    onClick={() => setSelectedStudentId(student.respondentId)}
                  >
                    {student.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title={answerTitle}>
          <div className="form-stack">
            {result.surveyList.map((question, index) => (
              <AnswerView
                key={question.id}
                no={index + 1}
                question={question}
                answers={answers}
              />
            ))}
          </div>
        </Panel>
      </div>
    );
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
        <div className="form-stack">
          <p className="card-meta">
            {surveySubject} · {surveyType} · 응답 {result.respondents.length}명
          </p>
          {anonymous && (
            <p className="field-hint">
              익명 설문 결과입니다. 응답자의 이름 등 신원 정보는 표시되지 않습니다.
            </p>
          )}
          {body}
        </div>
      </main>
    </div>
  );
}

// 문항별 학생 답변 (읽기 전용)
const AnswerView = ({ no, question, answers }) => {
  const myAnswers = answers.filter((a) => a.surveyId === question.id);
  const labelId = `result-${question.id}-label`;

  let content;
  if (question.type === "text") {
    let text = "";
    if (myAnswers.length > 0) {
      text = myAnswers[0].textAnswer;
    }
    if (text) {
      content = <div className="answer-box">{text}</div>;
    } else {
      content = <div className="answer-box answer-box-empty">답변 없음</div>;
    }
  } else {
    let inputType = "radio";
    if (question.type === "checkBox") {
      inputType = "checkbox";
    }
    const selectedIds = myAnswers.map((a) => a.dataId);
    content = (
      <div className="form-check-group">
        {question.surveyDataList.map((data) => (
          <label key={data.id} className="form-check">
            <input
              type={inputType}
              checked={selectedIds.includes(data.id)}
              disabled
              readOnly
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
        {no}. {question.subject}
      </span>
      {content}
    </div>
  );
};
