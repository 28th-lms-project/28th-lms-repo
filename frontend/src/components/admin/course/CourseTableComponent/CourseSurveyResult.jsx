import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getCourseSurveyResult,
  getCourseSurveyStudentAnswers,
} from "../../../../api/admin/system/survey/surveyApi";
import style from "./CourseSurveyAns.module.css";

/**
 * 설문 결과 팝업: 응답한 학생을 선택하면 그 학생의 답변을 보여준다 (읽기 전용)
 */
export default function CourseSurveyResult() {
  const { courseId, courseSurveyId } = useParams();
  const [result, setResult] = useState(null);
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
            setSelectedStudentId(data.respondents[0].courseStudentId);
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
          alert(e.message);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [courseId, courseSurveyId, selectedStudentId]);

  if (!result) {
    return <div>불러오는 중...</div>;
  }

  const { title, surveySubject, surveyType } = result.courseSurvey;

  return (
    <div className={style.container}>
      <h2>{title}</h2>
      <p>
        {surveySubject} · {surveyType} · 응답 {result.respondents.length}명
      </p>

      {result.respondents.length === 0 && <p>아직 응답한 학생이 없습니다.</p>}

      {result.respondents.length > 0 && (
        <div style={{ display: "flex", gap: "24px" }}>
          <ul>
            {result.respondents.map((student) => {
              let fontWeight = "normal";
              if (student.courseStudentId === selectedStudentId) {
                fontWeight = "bold";
              }
              return (
                <li
                  key={student.courseStudentId}
                  style={{ cursor: "pointer", fontWeight }}
                  onClick={() => setSelectedStudentId(student.courseStudentId)}
                >
                  {student.name}
                </li>
              );
            })}
          </ul>

          <ol>
            {result.surveyList.map((question) => (
              <li key={question.id}>
                <div>{question.subject}</div>
                <AnswerView question={question} answers={answers} />
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// 문항별 학생 답변 (읽기 전용)
const AnswerView = ({ question, answers }) => {
  const myAnswers = answers.filter((a) => a.surveyId === question.id);

  if (question.type === "text") {
    let text = "";
    if (myAnswers.length > 0) {
      text = myAnswers[0].textAnswer;
    }
    return <input type="text" value={text} readOnly />;
  }

  let inputType = "radio";
  if (question.type === "checkBox") {
    inputType = "checkbox";
  }
  const selectedIds = myAnswers.map((a) => a.dataId);

  return (
    <div>
      {question.surveyDataList.map((data) => (
        <label key={data.id}>
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
};
