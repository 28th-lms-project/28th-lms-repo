import { useParams } from "react-router-dom";
import style from "./CourseSurveyAns.module.css";
import { useEffect, useState } from "react";
import {
  getCourseSurvey,
  getSurvey,
} from "../../../../api/admin/system/survey/surveyApi";
import { IconButton } from "../../../common/input/IconButton";

export default function CourseSurveyAns() {
  const { courseId, courseSurveyId } = useParams();
  const [surveys, setSurveys] = useState();
  const [questions, setQuestions] = useState();
  const [answers, setAnswers] = useState({});

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

  if (!surveys) {
    return <div>불러오는 중...</div>;
  }

  const onClickSaveButtonHandler = () => {
    console.log(answers);
  };

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
            <SurveyAnswer
              question={question}
              onChangeAnswerHandler={onChangeAnswerHandler}
              onClickSaveButtonHandler={onClickSaveButtonHandler}
            />
          </li>
        ))}
      </ol>
      <div>
        <IconButton onClick={onClickSaveButtonHandler}>저장</IconButton>
      </div>
    </div>
  );
}

// 문항 유형별 입력 렌더링
const SurveyAnswer = ({ question, onChangeAnswerHandler }) => {
  const { id, type, surveyDataList } = question;

  if (type === "text") {
    return (
      <input
        type="text"
        name={id}
        onChange={(e) => onChangeAnswerHandler(id, type, e.currentTarget.value)}
      />
    );
  }

  let inputType = "radio";
  if (type === "checkBox") {
    inputType = "checkbox";
  }

  return (
    <>
      <div>
        {surveyDataList.map((data) => (
          <label key={data.id}>
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
    </>
  );
};
