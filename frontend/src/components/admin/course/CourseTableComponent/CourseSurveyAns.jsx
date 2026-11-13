import { useParams } from "react-router-dom";
import style from "./CourseSurveyAns.module.css";
import { useEffect, useState } from "react";
import {
  getCourseSurvey,
  getSurvey,
} from "../../../../api/admin/system/survey/surveyApi";

export default function CourseSurveyAns() {
  const { courseId, courseSurveyId } = useParams();
  const [surveys, setSurveys] = useState();
  const [questions, setQuestions] = useState();
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // 1. 과정 설문 목록에서 선택한 설문 찾기
        const result = await getCourseSurvey(courseId);
        let found = null;
        if (result) {
          found = result.find((s) => s.id === courseSurveyId);
        }
        if (!found) {
          if (!ignore) {
            alert("설문을 찾을 수 없습니다.");
          }
          return;
        }

        // 2. 설문 그룹으로 문항 + 보기 조회
        const surveyResult = await getSurvey(found.surveyGroup);

        if (!ignore) {
          setSurveys(found);
          if (surveyResult) {
            setQuestions(surveyResult.surveyList);
          } else {
            setQuestions([]);
          }
        }
      } catch (e) {
        if (!ignore) {
          alert(e.message);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [courseId, courseSurveyId]);

  if (!surveys) {
    return <div>불러오는 중...</div>;
  }

  // 분해
  const { title, surveySubject, surveyType } = surveys;

  return (
    <div className={style.container}>
      <h2>{title}</h2>
      <p>
        {surveySubject} · {surveyType}
      </p>
      <ol>
        {questions.map((question) => (
          <li key={question.id}>
            <div>{question.subject}</div>
            <SurveyAnswer question={question} />
          </li>
        ))}
      </ol>
    </div>
  );
}

// 문항 유형별 입력 렌더링
function SurveyAnswer({ question }) {
  const { id, type, surveyDataList } = question;

  if (type === "text") {
    return <input type="text" name={id} />;
  }

  let inputType = "radio";
  if (type === "checkBox") {
    inputType = "checkbox";
  }

  return (
    <div>
      {surveyDataList.map((data) => (
        <label key={data.id}>
          <input type={inputType} name={id} value={data.id} />
          {data.data}
        </label>
      ))}
    </div>
  );
}
