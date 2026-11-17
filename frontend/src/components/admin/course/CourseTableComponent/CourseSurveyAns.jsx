import { useParams } from "react-router-dom";
import style from "./CourseSurveyAns.module.css";
import { useEffect, useState } from "react";
import {
  createCourseSurveyAnswers,
  getCourseSurveyQuestions,
  getMySurveyAnswered,
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
        const answered = await getMySurveyAnswered(courseId, courseSurveyId);
        if (answered) {
          if (!ignore) {
            alert("이미 참여한 설문입니다.");
            window.close();
          }
          return;
        }

        // 과정 설문 정보 + 문항/보기 조회
        const result = await getCourseSurveyQuestions(courseId, courseSurveyId);
        if (!result || !result.courseSurvey) {
          if (!ignore) {
            alert("설문을 찾을 수 없습니다.");
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

  const onClickSaveButtonHandler = async () => {
    const answerList = Object.keys(answers).map((questionId) => {
      const answer = answers[questionId];
      return {
        questionId: questionId,
        optionIds: answer.optionIds,
        textAnswer: answer.textAnswer,
      };
    });
    if (answerList.length < questions.length) {
      alert("모든 문항에 답변해주세요.");
      return;
    }
    console.log(answerList);
    console.log(answers);

    try {
      await createCourseSurveyAnswers(courseId, courseSurveyId, {
        answers: answerList,
      });
      alert("제출되었습니다.");
      window.close();
    } catch (e) {
      alert(e.message);
    }
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
