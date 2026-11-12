import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Grid } from "../../../sample/Grid";
import { testActions } from "../../../../store/slices/testSliceStore";

const QUESTION_HEADER = [
  { id: "no", title: "번호" },
  { id: "question", title: "문제" },
  { id: "answerType", title: "유형" },
  { id: "pointAlloc", title: "배점" },
];
const COLUMN_STYLE = "60px 1fr 100px 70px";

/** Grid content 형식으로 변환. 번호 칸은 화면 순번 */
const toContent = (questions) =>
  questions.map((question, index) =>
    QUESTION_HEADER.map((col) => ({
      id: `${question.id}-${col.id}`,
      value: col.id === "no" ? index + 1 : question[col.id],
    })),
  );

/** 클릭한 셀의 행 번호. 행이 아닌 곳을 클릭하면 -1 */
const clickedRowIndex = (event) => {
  const cell = event.target.closest("li[data-row-index]");
  return cell ? Number(cell.dataset.rowIndex) : -1;
};

/**
 * 시험 문제 선택.
 * 왼쪽: 선택한 과목의 문제 (클릭하면 오른쪽으로 이동)
 * 오른쪽: 선택된 문제 (클릭하면 선택 해제)
 */
export default function ExamQuestionPicker() {
  const dispatch = useDispatch();
  const { questions, selectSubjectId, selectedQuestions } = useSelector(
    (store) => store.test,
  );
  const subjectId = selectSubjectId?.value;

  // 과목이 바뀌면 선택 목록 초기화
  useEffect(() => {
    dispatch(testActions.clearSelectedQuestions());
  }, [dispatch, subjectId]);

  const selectedIds = new Set(selectedQuestions.map((question) => question.id));
  const subjectQuestions = questions.filter(
    (question) =>
      question.subjectId === subjectId && !selectedIds.has(question.id),
  );

  const onClickSubjectQuestion = (event) => {
    const question = subjectQuestions[clickedRowIndex(event)];
    if (question) {
      dispatch(testActions.addSelectedQuestion(question));
    }
  };

  const onClickSelectedQuestion = (event) => {
    const question = selectedQuestions[clickedRowIndex(event)];
    if (question) {
      dispatch(testActions.removeSelectedQuestion(question.id));
    }
  };

  if (!subjectId) {
    return <div>시험과목을 선택하세요.</div>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        alignItems: "start",
      }}
    >
      <div onClick={onClickSubjectQuestion}>
        <h4>
          {subjectId} 문제 ({subjectQuestions.length})
        </h4>
        <Grid
          header={QUESTION_HEADER}
          content={toContent(subjectQuestions)}
          columnStyle={COLUMN_STYLE}
        />
      </div>
      <div onClick={onClickSelectedQuestion}>
        <h4>선택된 문제 ({selectedQuestions.length})</h4>
        <Grid
          header={QUESTION_HEADER}
          content={toContent(selectedQuestions)}
          columnStyle={COLUMN_STYLE}
        />
      </div>
    </div>
  );
}
