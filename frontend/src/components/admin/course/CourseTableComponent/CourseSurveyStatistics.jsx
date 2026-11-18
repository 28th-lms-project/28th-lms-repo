import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCourseSurveyStatistics } from "../../../../api/admin/system/survey/surveyApi";
import Button from "../../../common/ui/Button";
import Panel from "../../../common/ui/Panel";
import Progress from "../../../common/ui/Progress";
import StatusBox from "../../../common/ui/StatusBox";
import style from "./CourseSurveyStatistics.module.css";

/**
 * 설문 통계 팝업: 문항별 보기 선택 수 / 비율, 직접 입력 답변 목록
 */
export default function CourseSurveyStatistics() {
  const { courseId, courseSurveyId } = useParams();
  const [statistics, setStatistics] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getCourseSurveyStatistics(courseId, courseSurveyId);
        if (!ignore) {
          setStatistics(data);
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

  if (loadError) {
    return (
      <div className="popup-page">
        <main className="popup-body">
          <StatusBox type="error" detail={loadError.message} />
        </main>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="popup-page">
        <main className="popup-body">
          <StatusBox type="loading" />
        </main>
      </div>
    );
  }

  const { title, surveySubject, surveyType } = statistics.courseSurvey;

  let questionList;
  if (statistics.questions.length === 0) {
    questionList = <StatusBox type="empty" title="설문 문항이 없습니다." />;
  } else {
    questionList = statistics.questions.map((question, index) => (
      <Panel
        key={question.id}
        title={`${index + 1}. ${question.subject}`}
        subtitle={`${toTypeLabel(question.type)} · 응답 ${question.answerCount}명`}
      >
        <QuestionStat question={question} />
      </Panel>
    ));
  }

  return (
    <div className="popup-page">
      <header className="popup-header">
        <h1 className="popup-title">{title} 통계</h1>
        <div className="popup-actions">
          <Button onClick={() => window.close()}>닫기</Button>
        </div>
      </header>
      <main className="popup-body">
        <div className="form-stack">
          <div className="card card-accent">
            <p className="card-meta">
              {surveySubject} · {surveyType}
            </p>
            <div className="card-body">
              응답 {statistics.responseCount} / {statistics.studentCount}명
            </div>
            <Progress
              label="응답률"
              value={statistics.responseCount}
              max={statistics.studentCount}
              showValue
            />
          </div>
          {questionList}
        </div>
      </main>
    </div>
  );
}

function toTypeLabel(type) {
  if (type === "checkBox") {
    return "다중 선택";
  }
  if (type === "text") {
    return "직접 입력";
  }
  return "단일 선택";
}

// 문항별 통계
const QuestionStat = ({ question }) => {
  if (question.type === "text") {
    if (question.textAnswers.length === 0) {
      return <StatusBox type="empty" size="sm" title="답변이 없습니다." />;
    }
    return (
      <ul className="list-boxed">
        {question.textAnswers.map((text, index) => (
          <li key={index}>{text}</li>
        ))}
      </ul>
    );
  }

  if (question.options.length === 0) {
    return <StatusBox type="empty" size="sm" title="보기가 없습니다." />;
  }

  // 비율은 이 문항에 응답한 사람 수 기준 (다중 선택은 합이 100%를 넘을 수 있음)
  return (
    <div className="form-stack">
      {question.options.map((option) => (
        <div key={option.id} className={style.optionRow}>
          <span>{option.data}</span>
          <Progress
            label={`${option.data} 선택 비율`}
            value={option.count}
            max={question.answerCount}
            showValue
          />
          <span className="field-hint">{option.count}명</span>
        </div>
      ))}
    </div>
  );
};
