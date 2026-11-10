import { useId, useRef, useState } from "react";
import { IconButton } from "../../../sample/input/IconButton";
import { icons } from "../../../sample/input/icons";
import style from "./AddTest.module.css";
import { useDispatch } from "react-redux";
import { createNewQuestion } from "../../../../api/admin/system/test/testApi";
import { testActions } from "../../../../store/slices/testSliceStore";

export default function AddTest({ subjectId }) {
  const answerTypes = [
    { value: "객관식-단항", label: "객관식 - 단항" },
    { value: "객관식-다항", label: "객관식 - 다항" },
    { value: "주관식", label: "주관식" },
    { value: "O/X", label: "O/X" },
    { value: "코드작성", label: "코드작성" },
  ];

  const answerNumbers = [1, 2, 3, 4, 5];

  const [addState, setAddState] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [answerCnt, setAnswerCnt] = useState(4);
  const [selectedAnswerType, setSelectedAnswerType] = useState("");
  const [oxAnswer, setOxAnswer] = useState("");
  const [multiAnswers, setMultiAnswers] = useState([]);

  const answerTypeGroup = useId();
  const isManualGraded = ["주관식", "코드작성"].includes(selectedAnswerType);
  const isOx = selectedAnswerType === "O/X";
  const isMulti = selectedAnswerType === "객관식-다항";
  const usesChoices = !isManualGraded && !isOx;

  const questionRef = useRef();
  const pointRef = useRef();
  const subQuestRef = useRef();
  const correctRef = useRef(); // 정답 번호
  const answerRefs = useRef([]); // 보기 입력창 5개

  const dispatch = useDispatch();

  const renderFieldErrors = (field) => {
    const message = fieldErrors[field];
    if (!message) {
      return null;
    }
    return fieldErrors[field]?.map((message, index) => (
      <p key={`${field}-${index}`} className={style.fieldError} role="alert">
        {message}
      </p>
    ));
  };

  const hasFieldError = (field) => {
    const message = fieldErrors[field];
    if (!message) {
      return false;
    }
    return message.lenth > 0;
  };

  const count = Number(answerCnt);
  const getAnswer = (index) => {
    if (!usesChoices) {
      return null;
    }
    if (index < count) {
      return answerRefs.current[index].value;
    }
    return "";
  };
  const getCorrectAnswer = () => {
    if (isManualGraded) {
      return null;
    }
    if (isOx) {
      return oxAnswer;
    }
    if (isMulti) {
      return [...multiAnswers].sort((a, b) => Number(a) - Number(b)).join(",");
    }
    return correctRef.current.value;
  };
  let minAnswerCnt = "1";
  if (isMulti) {
    minAnswerCnt = "2";
  }
  const onClickAddButtonHandler = () => {
    setFieldErrors({});
    if (isMulti && multiAnswers.length < 2) {
      setFieldErrors({ correctAnswer: ["정답을 2개 이상 선택해주세요."] });
      return;
    }
    const question = questionRef.current.value;
    const point = pointRef.current.value;
    const subQuest = subQuestRef.current.value;
    const correct = getCorrectAnswer();
    let answerCount = null;
    if (usesChoices) {
      answerCount = Number(answerCnt);
    }
    const registTestQ = {
      subjectId: subjectId,
      question: question,
      pointAlloc: point,
      subQuestion: subQuest,
      correctAnswer: correct,
      answerType: selectedAnswerType,
      answerCount: answerCount,
      answerSheet1: getAnswer(0),
      answerSheet2: getAnswer(1),
      answerSheet3: getAnswer(2),
      answerSheet4: getAnswer(3),
      answerSheet5: getAnswer(4),
    };
    (async () => {
      try {
        const response = await createNewQuestion(registTestQ);
        dispatch(testActions.addTestQuestion(response));
        alert("등록완료");
        setAddState(false);
        console.log(response);
      } catch (e) {
        if (e.validations) {
          setFieldErrors(e.validations);
        } else {
          alert(e.message);
        }
      }
    })();
  };

  return (
    <>
      {!addState && (
        <IconButton
          icon={icons.add}
          onClick={() => {
            setFieldErrors({});
            setSelectedAnswerType("");
            setOxAnswer("");
            setMultiAnswers([]);
            setAnswerCnt(4);
            setAddState(true);
          }}
        >
          문제 추가
        </IconButton>
      )}
      {addState && (
        <>
          <IconButton
            icon={icons.close}
            onClick={() => {
              setFieldErrors({});
              setAddState(false);
            }}
          >
            취소
          </IconButton>

          <IconButton icon={icons.edit} onClick={onClickAddButtonHandler}>
            등록
          </IconButton>

          <div className={style.testForm}>
            {renderFieldErrors("subjectId")}
            {renderFieldErrors("global")}
            <div className={style.testTypes}>
              {answerTypes.map((type) => (
                <div key={type.value} className={style.type}>
                  <input
                    type="radio"
                    name={answerTypeGroup}
                    className={style.Type}
                    value={type.value}
                    checked={selectedAnswerType === type.value}
                    onChange={() => {
                      setSelectedAnswerType(type.value);
                      setOxAnswer("");
                      setMultiAnswers([]);
                      if (
                        ["객관식-단항", "객관식-다항"].includes(type.value) &&
                        Number(answerCnt) < 2
                      ) {
                        setAnswerCnt(4);
                      }
                      setFieldErrors({});
                    }}
                  />
                  <label>{type.label}</label>
                </div>
              ))}
            </div>
            {renderFieldErrors("answerType")}
            <textarea
              className={style.testQuestion}
              placeholder="문제 내용"
              ref={questionRef}
            ></textarea>
            {renderFieldErrors("question")}
            <textarea
              className={style.testSubQuestion}
              placeholder="부연 문제"
              ref={subQuestRef}
            ></textarea>
            {renderFieldErrors("subQuestion")}

            {isManualGraded && (
              <p>수강생이 작성한 답변은 제출 후 강사가 채점합니다.</p>
            )}
            {isOx && (
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
            {isMulti && (
              <fieldset>
                <legend>정답 (2개 이상 선택)</legend>
                {answerNumbers
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
            <div hidden={!usesChoices || isMulti}>
              <input
                type="number"
                min="1"
                max={answerCnt}
                placeholder={`정답은 1~${answerCnt}사이의 값을 입력하세요`}
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
                ref={pointRef}
                defaultValue={4}
              />
              {renderFieldErrors("pointAlloc")}
            </div>
            <div hidden={!usesChoices}>
              <label>보기</label>
              <input
                type="number"
                min={minAnswerCnt}
                max="5"
                onChange={(e) => {
                  setAnswerCnt(e.target.value);
                  setMultiAnswers((previous) =>
                    previous.filter(
                      (answer) => Number(answer) <= Number(e.target.value),
                    ),
                  );
                  setFieldErrors({});
                }}
                value={answerCnt}
              />
              개{renderFieldErrors("answerCount")}
            </div>
            {answerNumbers.map((num, index) => (
              <div
                key={num}
                hidden={
                  !usesChoices ||
                  (index >= Number(answerCnt) &&
                    !hasFieldError(`answerSheet${num}`))
                }
              >
                <input
                  type="text"
                  hidden={index >= Number(answerCnt)}
                  placeholder={`보기 ${num}`}
                  ref={(el) => {
                    answerRefs.current[index] = el;
                  }}
                />
                {renderFieldErrors(`answerSheet${num}`)}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
