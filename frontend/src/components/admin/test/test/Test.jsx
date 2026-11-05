import { useEffect } from "react";
import PageContainer from "../../../common/PageContainer";
import { searchTest } from "../../../../api/admin/system/test/testApi";
import style from "./Test.module.css";
import { IconButton } from "../../../sample/input/IconButton";
import { icons } from "../../../sample/input/icons";
import { useDispatch, useSelector } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";

export default function Test() {
  const { id, courseId, setName, testType, questions } = useSelector(
    (state) => state.test,
  );
  console.log(questions);

  const dispatch = useDispatch();

  useEffect(() => {
    let ignoreUpdateState = false;
    (async () => {
      const response = await searchTest();

      if (!ignoreUpdateState) {
        dispatch(testActions.setTestList(response[0]));
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [dispatch]);

  return (
    <PageContainer>
      <div className={style.testContainer}>
        <div className={style.testHeader}>
          <ul className={style.testCourseList}>
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
            <li>Test Course</li>
          </ul>
        </div>
        <div className={style.testSection}>
          <IconButton icon={icons.add}>추가</IconButton>

          <div className={style.testQuestionsContainer}>
            {questions.map((question) => (
              <div key={question.id} className={style.testQuestion}>
                <div className={style.testQuestionButton}>
                  <div className={style.testButtonContainer}>
                    <IconButton icon={icons.edit}>수정</IconButton>
                  </div>
                  <div className={style.testButtonContainer}>
                    <IconButton icon={icons.delete}>삭제</IconButton>
                  </div>
                </div>

                <div className={style.testQuestionTitle}>
                  <div>[{question.answerType}]</div>
                  <h3>
                    {question.question} ({question.pointAlloc} 점)
                  </h3>
                </div>

                <div>
                  {question.crtDt} - {question.crtId}1에 의해 작성됨
                </div>

                <div className={style.testQuestionStats}>
                  <span>{question.issuedCount}</span>
                  <span>{question.correctCount}</span>
                  <span>{question.correctRate}</span>
                </div>

                <div className={style.answerList}>
                  <ul>
                    {question.answers.map((answer) => (
                      <li
                        key={answer.no}
                        className={
                          question.correctAnswer === answer.no
                            ? style.active
                            : ""
                        }
                      >
                        <input
                          type="radio"
                          checked={question.correctAnswer === answer.no}
                          onChange={() => {}}
                        />
                        <label>
                          {" "}
                          {answer.no}. {answer.text}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
