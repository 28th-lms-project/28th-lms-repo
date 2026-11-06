import { useEffect, useState } from "react";
import PageContainer from "../../../common/PageContainer";
import { searchTest } from "../../../../api/admin/system/test/testApi";
import style from "./Test.module.css";

import { useDispatch, useSelector } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";
import AddTest from "./AddTest";
import UpdateTest from "./UpdateTest";

export default function Test() {
  const subjects = [
    { id: "TEST", name: "TEST " },
    { id: "JAVA", name: "JAVA " },
    { id: "React", name: "React " },
    { id: "Spring Boot", name: "Spring Boot " },
    { id: "HTML", name: "HTML " },
  ];

  let firstSubjectId = "";

  if (subjects.length > 0) {
    firstSubjectId = subjects[0].id;
  }

  const [selectedSubjectId, setSelectedSubjectId] = useState(firstSubjectId);

  const [showAnswer, setShowAnswer] = useState(false);

  const { questions } = useSelector((state) => state.test);

  const dispatch = useDispatch();

  useEffect(() => {
    let ignoreUpdateState = false;
    if (!selectedSubjectId) {
      return;
    }

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
            {subjects.map((subject) => (
              <li
                key={subject.id}
                onClick={() => setSelectedSubjectId(subject.id)}
                className={selectedSubjectId === subject.id ? "active" : ""}
              >
                {subject.name}
              </li>
            ))}
          </ul>
          {/* <ul className={style.testCourseList}>
            <li>JAVA</li>
            <li>Test Course</li>
            <li>Test Course</li>
            <li>Test Course</li>
            <li>Test Course</li>
            <li>Test Course</li>
            <li>Test Course</li>
            <li>Test Course</li>
            <li>Test Course</li>
            <li>Test Course</li>
            <li>Test Course</li>
          </ul> */}
        </div>
        <div className={style.testSection}>
          {/* <IconButton icon={icons.add} onClick={onClickAddButtonHandler(selectedSubjectId)}>추가</IconButton> */}
          <AddTest subjectId={selectedSubjectId} />
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
