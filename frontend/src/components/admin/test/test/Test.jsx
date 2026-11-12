import { useEffect, useState } from "react";
import PageContainer from "../../../common/PageContainer";
import { searchTest } from "../../../../api/admin/system/test/testApi";
import style from "./Test.module.css";

import { useDispatch, useSelector } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";
import AddTest from "./AddTest";
import UpdateTest from "./UpdateTest";
import { getCodeOptionList } from "../../../../api/admin/system/code/codeApi";

const INPUT_TYPE = { "객관식-다항": "checkbox" };

const getCorrectNumbers = (correctAnswer) => {
  if (correctAnswer === null || correctAnswer === undefined) {
    return [];
  }
  return String(correctAnswer)
    .split(",")
    .map((number) => number.trim());
};

export default function Test() {
  const { questions } = useSelector((state) => state.test);
  const dispatch = useDispatch();

  const [showAnswer, setShowAnswer] = useState(false);
  const [subjectList, setSubjectList] = useState([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [answerTypeList, setAnswerTypeList] = useState([]);

  useEffect(() => {
    getCodeOptionList("TEST_SUBJECT")
      .then((codes) => {
        setSubjectList(codes);

        getCodeOptionList("TEST_ANSWER_TYPE")
          .then(setAnswerTypeList)
          .catch((e) => alert(e.message));

        if (codes.length > 0) {
          setSelectedSubjectId(codes[0].id);
        }
      })
      .catch((e) => alert(e.message));
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) {
      // 과목 목록을 받기 전에는 조회하지 않음
      return;
    }
    let ignoreUpdateState = false;
    (async () => {
      try {
        const response = await searchTest(selectedSubjectId);

        if (!ignoreUpdateState) {
          dispatch(testActions.setTestList(response));
        }
      } catch (e) {
        if (!ignoreUpdateState) {
          alert(e.message);
        }
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [dispatch, selectedSubjectId]);

  return (
    <PageContainer>
      <div className={style.testContainer}>
        <div className={style.testHeader}>
          <ul className={style.testCourseList}>
            {subjectList.map((subject) => (
              <li
                key={subject.id}
                onClick={() => setSelectedSubjectId(subject.id)}
                className={
                  (selectedSubjectId === subject.id && style.active) ||
                  undefined
                }
              >
                {subject.name}
              </li>
            ))}
          </ul>
        </div>
        <div className={style.testSection}>
          {selectedSubjectId && (
            <AddTest
              subjectId={selectedSubjectId}
              answerTypes={answerTypeList}
            />
          )}
          <div className={style.testQuestionsContainer}>
            {questions.map((question) => (
              <div key={question.id} className={style.testQuestion}>
                <div className={style.testQuestionButton}>
                  <div className={style.testButtonContainer}>
                    <UpdateTest
                      questionId={question.id}
                      answerTypes={answerTypeList}
                    />
                  </div>
                </div>

                <div className={style.testQuestionTitle}>
                  <div>[{question.answerType}]</div>
                  <h3>
                    {question.question} ({question.pointAlloc} 점)
                  </h3>
                </div>

                <div>
                  {question.crtDt} - {question.crtrId}에 의해 작성됨
                </div>

                <div className={style.testQuestionStats}>
                  <span>{question.issuedCount}</span>
                  <span>{question.correctCount}</span>
                  <span>{question.correctRate}</span>
                </div>

                {question.answerType === "O/X" && (
                  <div className={style.answerList}>
                    <ul>
                      {["O", "X"].map((option) => {
                        const isCorrect = question.correctAnswer === option;
                        return (
                          <li
                            key={option}
                            className={(isCorrect && style.active) || undefined}
                          >
                            <label>
                              <input
                                type="radio"
                                checked={isCorrect}
                                readOnly
                              />
                              {option}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {!["O/X", "주관식", "코드작성"].includes(
                  question.answerType,
                ) && (
                  <div className={style.answerList}>
                    <div onClick={() => setShowAnswer(!showAnswer)}>
                      내용보기
                    </div>
                    {showAnswer && (
                      <ul>
                        {question.answers.map((answer) => {
                          const isCorrect = getCorrectNumbers(
                            question.correctAnswer,
                          ).includes(answer.no);
                          return (
                            <li
                              key={answer.no}
                              className={
                                (isCorrect && style.active) || undefined
                              }
                            >
                              <input
                                type={
                                  INPUT_TYPE[question.answerType] || "radio"
                                }
                                checked={isCorrect}
                                readOnly
                              />
                              <label>
                                {" "}
                                {answer.no}. {answer.text}
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
