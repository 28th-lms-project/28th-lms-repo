import { useEffect, useRef, useState } from "react";
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

// 라디오 버튼 목록. value는 DB에 저장된 ANSWER_TYPE 값과 똑같이 맞춰야 합니다.
const answerTypes = [
  { value: "객관식-단항", label: "객관식 - 단항" },
  { value: "객관식-다항", label: "객관식 - 다항" },
  { value: "주관식", label: "주관식" },
  { value: "O/X", label: "O/X" },
  { value: "코드작성", label: "코드작성" },
];

export default function UpdateTest({ questionId }) {
  const [modifying, setModifying] = useState(false);

  const dispatch = useDispatch();
  const {
    id,
    answerType,
    answers,
    answerCount,
    correctAnswer,
    pointAlloc,
    question,
    subQuestion,
  } = useSelector((state) => state.modTest);

  const [answerCnt, setAnswerCnt] = useState(0);
  const questionRef = useRef();

  const pointRef = useRef();
  const subQuestRef = useRef();
  const correctRef = useRef(); // 정답 번호
  const answerTypeRef = useRef(); // 라디오들을 감싸는 div
  const answerRefs = useRef([]); // 보기 입력창 5개

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
    setModifying(false);
    dispatch(questActions.clearViewQuestion());
  };

  const onClickUpdateHandler = () => {
    // 라디오 중 선택된 것 찾기
    const checkedType = answerTypeRef.current.querySelector("input:checked");
    let selectedType = "";
    if (checkedType) {
      selectedType = checkedType.value;
    }

    const count = answerCount;

    // 백엔드 ModifyExamQuestionVO 필드 이름과 똑같이 맞춤
    const modQuestion = {
      question: questionRef.current.value,
      subQuestion: subQuestRef.current.value,
      answerType: selectedType,
      correctAnswer: correctRef.current.value,
      pointAlloc: Number(pointRef.current.value),
      answerSheet1: answerRefs.current[0].value,
      answerSheet2: answerRefs.current[1].value,
      answerSheet3: answerRefs.current[2].value,
      answerSheet4: answerRefs.current[3].value,
      answerSheet5: answerRefs.current[4].value,
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
        alert(e.message);
      }
    })();
  };

  return (
    <>
      {!modifying && (
        <>
          <IconButton icon={icons.edit} onClick={() => setModifying(true)}>
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
            <div className={style.testTypes} ref={answerTypeRef}>
              {answerTypes.map((type) => (
                <div key={type.value} className={style.type}>
                  <input
                    type="radio"
                    className={style.Type}
                    name="answerType"
                    value={type.value}
                    defaultChecked={answerType === type.value}
                  />
                  <label>{type.label}</label>
                </div>
              ))}
            </div>
            <textarea
              className={style.testQuestion}
              placeholder="문제 내용"
              defaultValue={question}
              ref={questionRef}
            ></textarea>
            <textarea
              className={style.testSubQuestion}
              placeholder="부연 문제"
              defaultValue={subQuestion}
              ref={subQuestRef}
            ></textarea>

            <input
              type="number"
              min="1"
              max={answerCount}
              placeholder={`정답은 1~${answerCnt}사이의 값을 입력하세요`}
              defaultValue={correctAnswer}
              ref={correctRef}
            />
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
            </div>
            <div>
              <label>보기</label>
              <input
                type="number"
                min="1"
                max="5"
                value={answerCnt}
                onChange={(e) => setAnswerCnt(e.target.value)}
              />
              개
            </div>
            {answers.map((answer, index) => (
              <input
                key={index}
                type="text"
                placeholder={`${index + 1}번 보기`}
                defaultValue={answer}
                hidden={index >= Number(answerCnt)}
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
