import { useEffect, useState } from "react";
import PageContainer from "../../../common/PageContainer";
import { searchTest } from "../../../../api/admin/system/test/testApi";
import style from "./Test.module.css";

import { useDispatch, useSelector } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";
import AddTest from "./AddTest";
import UpdateTest from "./UpdateTest";
import { courseActions } from "../../../../store/slices/courseSliceStore";

export default function Test() {
  let firstSubjectId = "";

  const { courseList } = useSelector((state) => state.courses);
  const { questions } = useSelector((state) => state.test);
  const dispatch = useDispatch();

  const [selectedSubjectId, setSelectedSubjectId] = useState(firstSubjectId);
  const [showAnswer, setShowAnswer] = useState(false);

  const currentCourseId = selectedSubjectId || courseList[0]?.id || "";

  useEffect(() => {
    if (courseList.length > 0) {
      return;
    }
    let ignoreUpdateState = false;
    (async () => {
      const result = await fetch("http://localhost:8080/course/view");
      const resultJson = await result.json();
      if (!ignoreUpdateState) {
        dispatch(courseActions.load(resultJson));
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [dispatch, courseList.length]);

  useEffect(() => {
    if (!currentCourseId) {
      return;
    }
    let ignoreUpdateState = false;

    (async () => {
      try {
        const response = await searchTest(currentCourseId);
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
  }, [dispatch, currentCourseId]);

  return (
    <PageContainer>
      <div className={style.testContainer}>
        <div className={style.testHeader}>
          <ul className={style.testCourseList}>
            {courseList.map((course) => (
              <li
                key={course.id}
                onClick={() => setSelectedSubjectId(course.id)}
                className={currentCourseId === course.id ? "active" : ""}
              >
                {course.courseName}
              </li>
            ))}
          </ul>
        </div>
        <div className={style.testSection}>
          {/* <IconButton icon={icons.add} onClick={onClickAddButtonHandler(selectedSubjectId)}>추가</IconButton> */}
          <AddTest subjectId={currentCourseId} />
          <div className={style.testQuestionsContainer}>
            {questions.map((question) => (
              <div key={question.id} className={style.testQuestion}>
                <div className={style.testQuestionButton}>
                  <div className={style.testButtonContainer}>
                    <UpdateTest questionId={question.id} />
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

                {question.answerType === "O/X" ? (
                  <div className={style.answerList}>
                    <ul>
                      {["O", "X"].map((option) => (
                        <li
                          key={option}
                          className={
                            question.correctAnswer === option
                              ? style.active
                              : ""
                          }
                        >
                          <label>
                            <input
                              type="radio"
                              checked={question.correctAnswer === option}
                              readOnly
                            />
                            {option}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  !["주관식", "코드작성"].includes(question.answerType) && (
                    <div className={style.answerList}>
                      <div onClick={() => setShowAnswer(!showAnswer)}>
                        내용보기
                      </div>
                      {showAnswer && (
                        <ul>
                          {question.answers.map((answer) => (
                            <li
                              key={answer.no}
                              className={
                                String(question.correctAnswer ?? "")
                                  .split(",")
                                  .map((number) => number.trim())
                                  .includes(answer.no)
                                  ? style.active
                                  : ""
                              }
                            >
                              <input
                                type={
                                  question.answerType === "객관식-다항"
                                    ? "checkbox"
                                    : "radio"
                                }
                                checked={String(question.correctAnswer ?? "")
                                  .split(",")
                                  .map((number) => number.trim())
                                  .includes(answer.no)}
                                onChange={() => {}}
                              />
                              <label>
                                {" "}
                                {answer.no}. {answer.text}
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
