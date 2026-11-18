import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";

import StatusBox from "../../../common/ui/StatusBox";
import TransferList from "../../../common/ui/TransferList";
import styles from "./ExamQuestionPicker.module.css";
import { useAnswerTypeName } from "../../../../utils/examAnswerType";

const toKey = (question) => String(question.id);

/**
 * 시험 문제 선택 (TransferList).
 * 왼쪽: 선택한 과목의 문제, 오른쪽: 시험에 넣을 문제.
 * 선택값은 testSlice.selectedQuestions 에 저장된다 (addSelectedQuestion · removeSelectedQuestion).
 */
export default function ExamQuestionPicker() {
  const dispatch = useDispatch();
  const toAnswerTypeName = useAnswerTypeName();
  const { questions, selectSubjectId, selectedQuestions } = useSelector(
    (store) => store.test,
  );
  const subjectId = selectSubjectId?.value;

  // 과목이 바뀌면 선택 목록 초기화
  useEffect(() => {
    dispatch(testActions.clearSelectedQuestions());
  }, [dispatch, subjectId]);

  if (!subjectId) {
    return <StatusBox type="empty" size="sm" title="시험 과목을 고르세요." />;
  }

  const subjectQuestions = questions.filter(
    (question) => question.subjectId === subjectId,
  );
  const selectedKeys = selectedQuestions.map(toKey);
  const totalPoint = selectedQuestions.reduce(
    (sum, question) => sum + (Number(question.pointAlloc) || 0),
    0,
  );

  // 옮긴 결과(keys)와 지금 선택을 비교해서 늘어난 것은 추가, 빠진 것은 해제
  const onChangeSelected = (keys) => {
    const nextKeys = new Set(keys);
    const currentKeys = new Set(selectedKeys);
    for (const key of keys) {
      if (!currentKeys.has(key)) {
        const question = subjectQuestions.find((q) => toKey(q) === key);
        if (question) {
          dispatch(testActions.addSelectedQuestion(question));
        }
      }
    }
    for (const question of selectedQuestions) {
      if (!nextKeys.has(toKey(question))) {
        dispatch(testActions.removeSelectedQuestion(question.id));
      }
    }
  };

  return (
    <TransferList
      items={subjectQuestions}
      selectedKeys={selectedKeys}
      onChange={onChangeSelected}
      rowKey={toKey}
      leftTitle={`${selectSubjectId.label} 문제`}
      rightTitle="시험 문제"
      rightSummary={`총 ${totalPoint}점`}
      filter={(question, text) =>
        String(question.question ?? "").includes(text)
      }
      renderItem={(question) => (
        <span className={styles.item}>
          <span>{question.question}</span>
          <span className={styles.meta}>
            <span className="tag">{toAnswerTypeName(question.answerType)}</span>
            <span className="field-hint">{question.pointAlloc}점</span>
          </span>
        </span>
      )}
    />
  );
}
