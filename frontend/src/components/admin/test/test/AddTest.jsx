import { useRef, useState } from "react";
import { IconButton } from "../../../sample/input/IconButton";
import { icons } from "../../../sample/input/icons";
import style from "./AddTest.module.css";
import { useDispatch, useSelector } from "react-redux";
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
  const [answerCnt, setAnswerCnt] = useState(4);
  const questionRef = useRef();
  const dispatch = useDispatch();
  const pointRef = useRef();
  const subQuestRef = useRef();
  const correctRef = useRef(); // 정답 번호
  const answerTypeRef = useRef(); // 라디오들을 감싸는 div
  const answerRefs = useRef([]); // 보기 입력창 5개

  const count = Number(answerCnt);
  const getAnswer = (index) => {
    if (index < count) {
      return answerRefs.current[index].value;
    }
    return "";
  };
  const onClickAddButtonHandler = () => {
    const question = questionRef.current.value;
    const point = pointRef.current.value;
    const subQuest = subQuestRef.current.value;
    const correct = correctRef.current.value;
    const answerCount = answerCnt;
    // const answers = answerRefs.current;

    const checked = answerTypeRef.current.querySelector("input:checked");
    let answerType = "";
    if (checked) {
      answerType = checked.value;
    }
    const registTestQ = {
      subjectId: subjectId,
      question: question,
      pointAlloc: point,
      subQuestion: subQuest,
      correctAnswer: correct,
      answerType: answerType,
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
        alert(e.message);
      }
    })();
  };

  return (
    <>
      {!addState && (
        <IconButton icon={icons.add} onClick={() => setAddState(true)}>
          문제 추가
        </IconButton>
      )}
      {addState && (
        <>
          <IconButton icon={icons.close} onClick={() => setAddState(false)}>
            취소
          </IconButton>

          <IconButton icon={icons.edit} onClick={onClickAddButtonHandler}>
            등록
          </IconButton>

          <div className={style.testForm}>
            <div className={style.testTypes} ref={answerTypeRef}>
              {answerTypes.map((type) => (
                <div key={type.value} className={style.type}>
                  <input
                    type="radio"
                    name="answerType"
                    className={style.Type}
                    value={type.value}
                  />
                  <label>{type.label}</label>
                </div>
              ))}
            </div>
            <textarea
              className={style.testQuestion}
              placeholder="문제 내용"
              ref={questionRef}
            ></textarea>
            <textarea
              className={style.testSubQuestion}
              placeholder="부연 문제"
              ref={subQuestRef}
            ></textarea>

            <input
              type="number"
              min="1"
              max={answerCnt}
              placeholder={`정답은 1~${answerCnt}사이의 값을 입력하세요`}
              ref={correctRef}
            />
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
            </div>
            <div>
              <label>보기</label>
              <input
                type="number"
                min="1"
                max="5"
                onChange={(e) => setAnswerCnt(e.target.value)}
                defaultValue={4}
              />
              개
            </div>
            {answerNumbers.slice(0, Number(answerCnt)).map((num, index) => (
              <input
                type="text"
                key={num}
                placeholder={`보기 ${num}`}
                ref={(el) => {
                  answerRefs.current[index] = el;
                }}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
