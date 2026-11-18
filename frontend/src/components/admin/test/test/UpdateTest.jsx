import { useEffect, useId, useRef, useState } from "react";
import { IconButton } from "../../../sample/input/IconButton";
import { icons } from "../../../sample/input/icons";
import {
  deleteTestQuestion,
  searchTestQuestion,
  updateTestQuestion,
} from "../../../../api/admin/system/test/testApi";
import { useDispatch, useSelector } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";
import style from "./Update.module.css";
import { questActions } from "../../../../store/slices/questionSliceStore";

export default function UpdateTest({ questionId, answerTypes }) {
  const [modifying, setModifying] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const dispatch = useDispatch();
  const { id, answers, correctAnswer, pointAlloc, question, subQuestion } =
    useSelector((state) => state.question);

  const [answerCnt, setAnswerCnt] = useState(0);
  const [selectedAnswerType, setSelectedAnswerType] = useState("");
  const [oxAnswer, setOxAnswer] = useState("");
  const [multiAnswers, setMultiAnswers] = useState([]);
  const answerTypeGroup = useId();

  const questionRef = useRef();

  const pointRef = useRef();
  const subQuestRef = useRef();
  const correctRef = useRef(); // 정답 번호
  const answerRefs = useRef([]); // 보기 입력창 5개

  const renderFieldErrors = (field) => {
    const messages = fieldErrors[field];
    if (!messages) {
      return null;
    }
    return messages.map((message, index) => (
      <p key={`${field}-${index}`} className={style.fieldError} role="alert">
        {message}
      </p>
    ));
  };

  const hasFieldError = (field) => {
    const messages = fieldErrors[field];
    if (!messages) {
      return false;
    }
    return messages.length > 0;
  };

  useEffect(() => {
    if (!modifying) {
      return;
    }
    let ignoreUpdateState = false;

    (async () => {
      try {
        const response = await searchTestQuestion(questionId);
        console.log(response);

        if (!ignoreUpdateState) {
          dispatch(questActions.setViewQuestion(response));
          setAnswerCnt(Number(response.answerCount));
          setSelectedAnswerType(response.answerType);
          if (
            response.correctAnswer === "O" ||
            response.correctAnswer === "X"
          ) {
            setOxAnswer(response.correctAnswer);
          } else {
            setOxAnswer("");
          }

          if (
            response.answerType === "ANSWER_MULTIPLE" &&
            response.correctAnswer
          ) {
            setMultiAnswers(
              String(response.correctAnswer)
                .split(",")
                .map((answer) => answer.trim())
                .filter(Boolean),
            );
          } else {
            setMultiAnswers([]);
          }
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
  }, [questionId, dispatch, modifying]);

  const onClickDeleteButtonHandler = (questionId) => {
    if (confirm("삭제하시겠습니까?")) {
      (async () => {
        try {
          await deleteTestQuestion(questionId);
          dispatch(testActions.deleteTestQuestion(questionId));
          alert("삭제 완료");
        } catch (e) {
          alert(e.message);
        }
      })();
    }
  };

  const onClickCancelHandler = () => {
    setFieldErrors({});
    setModifying(false);
    dispatch(questActions.clearViewQuestion());
  };

  const onClickUpdateHandler = () => {
    setFieldErrors({});
    if (selectedAnswerType === "ANSWER_MULTIPLE" && multiAnswers.length < 2) {
      setFieldErrors({ correctAnswer: ["정답을 2개 이상 선택해주세요."] });
      return;
    }
    const noChoices =
      selectedAnswerType === "ANSWER_WRITE" ||
      selectedAnswerType === "ANSWER_CODE" ||
      selectedAnswerType === "ANSWER_CHECK";

    let count = null;
    if (!noChoices) {
      count = Number(answerCnt);
    }

    const getAnswer = (index) => {
      if (noChoices) {
        return null;
      }
      if (index >= count) {
        return "";
      }
      const input = answerRefs.current[index];
      if (!input) {
        return "";
      }
      return input.value;
    };

    const getCorrectAnswer = () => {
      // 주관식 · 코드작성은 강사가 채점하므로 정답 없음
      if (
        selectedAnswerType === "ANSWER_WRITE" ||
        selectedAnswerType === "ANSWER_CODE"
      ) {
        return null;
      }
      if (selectedAnswerType === "ANSWER_CHECK") {
        return oxAnswer;
      }
      if (selectedAnswerType === "ANSWER_MULTIPLE") {
        return [...multiAnswers]
          .sort((a, b) => Number(a) - Number(b))
          .join(",");
      }
      return correctRef.current.value;
    };

    // 백엔드 ModifyExamQuestionVO 필드 이름과 똑같이 맞춤
    const modQuestion = {
      question: questionRef.current.value,
      subQuestion: subQuestRef.current.value,
      answerType: selectedAnswerType,
      correctAnswer: getCorrectAnswer(),
      pointAlloc: Number(pointRef.current.value),
      answerSheet1: getAnswer(0),
      answerSheet2: getAnswer(1),
      answerSheet3: getAnswer(2),
      answerSheet4: getAnswer(3),
      answerSheet5: getAnswer(4),
      answerCount: count,
    };

    // // 배점은 1~4점만 허용 (백엔드 @Min(1) @Max(4)와 동일)
    // if (modQuestion.pointAlloc < 1 || modQuestion.pointAlloc > 4) {
    //   alert("배점은 1~4점 사이로 입력해주세요.");
    //   pointRef.current.focus();
    //   return;
    // }

    // // 아래 검사는 백엔드 ExamServiceImpl.validateQuestionAnswers와 같은 규칙
    // const count = modQuestion.answerCount;
    // if (count < 1 || count > 5) {
    //   alert("보기 개수는 1~5개 사이로 입력해주세요.");
    //   answerCntRef.current.focus();
    //   return;
    // }

    // // 보기 개수만큼은 채워져 있어야 하고, 그 뒤 칸은 비어 있어야 함
    // for (let i = 0; i < 5; i++) {
    //   const text = answerRefs.current[i].value.trim();
    //   if (i < count && text === "") {
    //     alert(`보기 개수가 ${count}개이므로 ${i + 1}번 보기를 입력해주세요.`);
    //     answerRefs.current[i].focus();
    //     return;
    //   }
    //   if (i >= count && text !== "") {
    //     alert(`보기 개수가 ${count}개이므로 ${i + 1}번 보기는 비워주세요.`);
    //     answerRefs.current[i].focus();
    //     return;
    //   }
    // }

    // const correct = Number(modQuestion.correctAnswer);
    // if (!Number.isInteger(correct) || correct < 1 || correct > count) {
    //   alert(`정답 번호는 1~${count} 사이로 입력해주세요.`);
    //   correctRef.current.focus();
    //   return;
    // }

    (async () => {
      try {
        // 서버가 수정된 문제를 돌려주면 그걸로 목록을 갱신
        const updatedQuestion = await updateTestQuestion(
          questionId,
          modQuestion,
        );
        dispatch(testActions.updateTestQuestion(updatedQuestion));
        alert("수정 완료");
        onClickCancelHandler();
      } catch (e) {
        if (e.validations) {
          setFieldErrors(e.validations);
        } else {
          alert(e.message);
        }
      }
    })();
  };
  let minAnswerCnt = "1";
  if (selectedAnswerType === "ANSWER_MULTIPLE") {
    minAnswerCnt = "2";
  }
  return (
    <>
      {!modifying && (
        <>
          <IconButton
            icon={icons.edit}
            onClick={() => {
              setFieldErrors({});
              setSelectedAnswerType("");
              setOxAnswer("");
              setMultiAnswers([]);
              setModifying(true);
            }}
          >
            수정
          </IconButton>

          <IconButton
            icon={icons.delete}
            onClick={() => {
              onClickDeleteButtonHandler(questionId);
            }}
          >
            삭제
          </IconButton>
        </>
      )}
      {modifying && (
        <>
          <IconButton icon={icons.close} onClick={onClickCancelHandler}>
            취소
          </IconButton>

          <IconButton icon={icons.edit} onClick={onClickUpdateHandler}>
            저장
          </IconButton>

          <div className={style.testMod} key={id}>
            {renderFieldErrors("global")}
            <div className={style.testTypes}>
              {answerTypes.map((type) => (
                <div key={type.id} className={style.type}>
                  <input
                    type="radio"
                    className={style.Type}
                    name={answerTypeGroup}
                    value={type.id}
                    checked={selectedAnswerType === type.id}
                    onChange={() => {
                      setSelectedAnswerType(type.id);
                      setOxAnswer("");
                      setMultiAnswers([]);
                      if (
                        (type.id === "ANSWER_SELECT" ||
                          type.id === "ANSWER_MULTIPLE") &&
                        Number(answerCnt) < 2
                      ) {
                        setAnswerCnt(4);
                      }
                      setFieldErrors({});
                    }}
                  />
                  <label>{type.name}</label>
                </div>
              ))}
            </div>
            {renderFieldErrors("answerType")}
            <textarea
              className={style.testQuestion}
              placeholder="문제 내용"
              defaultValue={question}
              ref={questionRef}
            ></textarea>
            {renderFieldErrors("question")}
            <textarea
              className={style.testSubQuestion}
              placeholder="부연 문제"
              defaultValue={subQuestion}
              ref={subQuestRef}
            ></textarea>
            {renderFieldErrors("subQuestion")}

            {(selectedAnswerType === "ANSWER_WRITE" ||
              selectedAnswerType === "ANSWER_CODE") && (
              <p>수강생이 작성한 답변은 제출 후 강사가 채점합니다.</p>
            )}
            {selectedAnswerType === "ANSWER_CHECK" && (
              <fieldset>
                <legend>정답</legend>
                {["O", "X"].map((option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name={`${answerTypeGroup}-ox`}
                      value={option}
                      checked={oxAnswer === option}
                      onChange={() => setOxAnswer(option)}
                    />
                    {option}
                  </label>
                ))}
                {renderFieldErrors("correctAnswer")}
              </fieldset>
            )}
            {selectedAnswerType === "ANSWER_MULTIPLE" && (
              <fieldset>
                <legend>정답 (2개 이상 선택)</legend>
                {[1, 2, 3, 4, 5]
                  .filter((num) => num <= Number(answerCnt))
                  .map((num) => (
                    <label key={num}>
                      <input
                        type="checkbox"
                        value={String(num)}
                        checked={multiAnswers.includes(String(num))}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          const value = String(num);
                          setMultiAnswers((previous) => {
                            if (checked) {
                              return [...previous, value];
                            }
                            return previous.filter(
                              (answer) => answer !== value,
                            );
                          });
                          setFieldErrors({});
                        }}
                      />
                      {num}번 보기
                    </label>
                  ))}
                {renderFieldErrors("correctAnswer")}
              </fieldset>
            )}
            <div
              hidden={
                selectedAnswerType === "ANSWER_WRITE" ||
                selectedAnswerType === "ANSWER_CODE" ||
                selectedAnswerType === "ANSWER_CHECK" ||
                selectedAnswerType === "ANSWER_MULTIPLE"
              }
            >
              <input
                type="number"
                min="1"
                max={answerCnt}
                placeholder={`정답은 1~${answerCnt}사이의 값을 입력하세요`}
                defaultValue={correctAnswer}
                ref={correctRef}
              />
              {renderFieldErrors("correctAnswer")}
            </div>
            <div>
              <label>배점</label>
              <input
                type="number"
                min="1"
                max="4"
                placeholder="배점 (1~4)"
                defaultValue={pointAlloc}
                ref={pointRef}
              />
              {renderFieldErrors("pointAlloc")}
            </div>
            <div
              hidden={
                selectedAnswerType === "ANSWER_WRITE" ||
                selectedAnswerType === "ANSWER_CODE" ||
                selectedAnswerType === "ANSWER_CHECK"
              }
            >
              <label>보기</label>
              <input
                type="number"
                min={minAnswerCnt}
                max="5"
                value={answerCnt}
                onChange={(e) => {
                  setAnswerCnt(e.target.value);
                  setMultiAnswers((previous) =>
                    previous.filter(
                      (answer) => Number(answer) <= Number(e.target.value),
                    ),
                  );
                  setFieldErrors({});
                }}
              />
              개{renderFieldErrors("answerCount")}
            </div>
            {answers.map((answer, index) => (
              <div
                key={index}
                hidden={
                  selectedAnswerType === "ANSWER_WRITE" ||
                  selectedAnswerType === "ANSWER_CODE" ||
                  selectedAnswerType === "ANSWER_CHECK" ||
                  (index >= Number(answerCnt) &&
                    !hasFieldError(`answerSheet${index + 1}`))
                }
              >
                <input
                  type="text"
                  placeholder={`${index + 1}번 보기`}
                  defaultValue={answer}
                  hidden={index >= Number(answerCnt)}
                  ref={(el) => {
                    answerRefs.current[index] = el;
                  }}
                />
                {renderFieldErrors(`answerSheet${index + 1}`)}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
