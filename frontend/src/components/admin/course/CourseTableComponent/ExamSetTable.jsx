import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";
import {
  deleteTestSet,
  updateTestSetShowYn,
  viewTestSetQuestions,
} from "../../../../api/admin/system/test/testApi";
import ConfirmModal from "./ConfirmModal";
import ExamQuestionViewModal from "./ExamQuestionViewModal";
import ExamTakeModal from "./ExamTakeModal";
import ExamGradeModal from "./ExamGradeModal";
import usePermission from "../../../../hooks/usePermission";

/**
 * 버튼별 권한 코드 (백엔드 ExamController 의 @RequireAction).
 * 역할 이름이 아니라 권한 코드로 판단한다 (frontend/docs/permission-guide.md 6장).
 * - 문제 보기: 호출 API(questionlist)는 EXAM_COURSE_SET_READ 지만, 응시하는 수강생도 그 권한이 필요해
 *   정답이 보이는 문제 보기는 강사 · 관리자용인 답안 조회 권한으로 판단한다.
 *   TODO: 정답 없는 수강생용 문제 조회 API가 생기면 다시 정리
 */
const PERMISSION = {
  TAKE_TEST: "EXAM_COURSE_EXAM_SUBMIT",
  VIEW_QUESTIONS: "EXAM_COURSE_EXAM_ANSWER_READ",
  UPDATE_SHOW_YN: "EXAM_COURSE_SET_UPDATE",
  GRADE: "EXAM_COURSE_EXAM_ANSWER_READ",
  DELETE: "EXAM_COURSE_SET_DELETE",
};

const BORDER_COLOR = "#e5e5e5";

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
  color: "#333",
  borderTop: `1px solid ${BORDER_COLOR}`,
  borderBottom: `1px solid #ccc`,
};

const headerCellStyle = {
  padding: "10px 12px",
  fontWeight: "bold",
  textAlign: "center",
  backgroundColor: "#fff",
  borderLeft: `1px dashed ${BORDER_COLOR}`,
  borderRight: `1px dashed ${BORDER_COLOR}`,
  borderBottom: `1px solid ${BORDER_COLOR}`,
  whiteSpace: "nowrap",
};

const cellStyle = {
  padding: "12px",
  textAlign: "left",
  borderLeft: `1px dashed ${BORDER_COLOR}`,
  borderRight: `1px dashed ${BORDER_COLOR}`,
  borderBottom: `1px dashed ${BORDER_COLOR}`,
  whiteSpace: "nowrap",
};

const actionStyle = {
  cursor: "pointer",
};

/** 짝수/홀수 행 배경색 (이미지처럼 연한 회색 줄무늬) */
const rowStyle = (index) => ({
  backgroundColor: index % 2 === 0 ? "#f7f7f7" : "#fff",
});

/**
 * 시험 세트 목록 표.
 * 번호는 최신 순서대로 역순(맨 위가 가장 큰 번호). 실제 시험 세트 id는 클릭 처리에만 사용한다.
 *
 * @param testSets searchTestSets 결과 (ExamSetVO 목록)
 * @param onChangeShowYn 공개 여부 수정 성공 시 호출 (testSetId, showYn)
 * @param studentView true면 수강생 화면: 공개 여부 / 채점 / 삭제 컬럼을 숨긴다
 *
 * 화면 표시용 권한 구분이며, 실제 차단은 서버가 해야 한다.
 */
export default function ExamSetTable({
  testSets = [],
  onChangeShowYn = () => {},
  studentView = false,
}) {
  const { can } = usePermission();
  const canTakeTest = can(PERMISSION.TAKE_TEST);
  const canViewQuestions = can(PERMISSION.VIEW_QUESTIONS);
  // 공개 여부 · 채점 · 삭제는 수강생 화면(studentView)에서는 권한이 있어도 숨긴다
  const canUpdateShowYn = !studentView && can(PERMISSION.UPDATE_SHOW_YN);
  const canGrade = !studentView && can(PERMISSION.GRADE);
  const canDelete = !studentView && can(PERMISSION.DELETE);
  const columnCount =
    2 +
    [canUpdateShowYn, canViewQuestions, canGrade, canDelete].filter(Boolean)
      .length;

  // 공개 여부를 바꾸려고 클릭한 시험 세트 (null이면 모달 닫힘)
  const [showYnTarget, setShowYnTarget] = useState(null);
  // 문제 보기 모달에 띄울 내용 { title, questions } (null이면 닫힘)
  const [questionView, setQuestionView] = useState(null);
  // 채점 모달에 띄울 내용 { title, questions } (null이면 닫힘)
  const [gradeView, setGradeView] = useState(null);
  // 이 강의를 듣는 수강생 (CourseItem에서 강좌를 열 때 불러와 둔 목록)
  const { showStudents } = useSelector((store) => store.courses);
  // 시험 응시 모달 열림 여부 (내용은 testSlice.takeExam)
  const isTakeExamOpen = useSelector((store) => store.test.takeExam !== null);
  const dispatch = useDispatch();

  // "Y"가 아니면(N, null) 공개로, "Y"면 비공개로 바꾼다
  const nextShowYn = (testSet) => (testSet.showYn === "Y" ? "N" : "Y");

  const onConfirmShowYn = async () => {
    const testSet = showYnTarget;
    const showYn = nextShowYn(testSet);
    setShowYnTarget(null);
    try {
      await updateTestSetShowYn(testSet.id, showYn);
      onChangeShowYn(testSet.id, showYn);
    } catch (e) {
      console.log(e);
      alert("공개 여부 변경에 실패했습니다.");
    }
  };

  // TODO: 시험 응시 화면이 생기면 여기서 연다
  // 문제 목록을 불러와 시험 응시 모달을 연다
  // TODO: 정답이 빠진 수강생용 문제 조회 API가 생기면 교체 (지금 API는 정답까지 내려줌)
  const onClickTestName = async (testSet) => {
    if (!canTakeTest) {
      alert("시험 응시 권한이 없습니다.");
      return;
    }
    // 공개(Y)되지 않은 시험은 응시 불가 (서버에서도 한 번 더 막음)
    if (testSet.showYn !== "Y") {
      alert("공개되지 않은 시험입니다.");
      return;
    }
    try {
      const result = await viewTestSetQuestions(testSet.id);
      dispatch(
        testActions.openTakeExam({
          testSetId: testSet.id,
          title: testSet.setName,
          questions: result?.examList ?? [],
        }),
      );
    } catch (e) {
      console.log(e);
      alert("문제를 불러오지 못했습니다.");
    }
  };

  // 문제 목록을 불러와 문제 보기 모달을 연다
  const onClickShowQuestions = async (testSet) => {
    if (!canViewQuestions) {
      alert("권한이 없습니다.");
      return;
    }
    try {
      const result = await viewTestSetQuestions(testSet.id);
      setQuestionView({
        title: testSet.setName,
        questions: result?.examList ?? [],
      });
    } catch (e) {
      console.log(e);
      alert("문제를 불러오지 못했습니다.");
    }
  };

  // 문제 목록을 불러와 채점 모달을 연다 (수강생 탭 + 문제 · 정답)
  // TODO: 수강생 답안 조회 API가 완성되면 ExamGradeModal 의 studentAnswers 로 연결
  const onClickGrade = async (testSet) => {
    if (!canGrade) {
      alert("권한이 없습니다.");
      return;
    }
    try {
      const result = await viewTestSetQuestions(testSet.id);
      // 채점 모달은 testSetId 를 slice(testSlice.gradeTestSetId)에서 꺼내 쓴다
      dispatch(testActions.setGradeTestSetId(testSet.id));
      setGradeView({
        title: testSet.setName,
        questions: result?.examList ?? [],
      });
    } catch (e) {
      console.log(e);
      alert("문제를 불러오지 못했습니다.");
    }
  };

  // TODO: 삭제 API가 생기면 확인 후 호출
  const onClickDelete = (testSet) => {
    if (!confirm("삭제하시겠습니까?")) {
      return;
    }
    (async () => {
      const result = await deleteTestSet(testSet.id);
      console.log(result);
    })();
  };

  return (
    <>
      {showYnTarget && (
        <ConfirmModal
          message={
            nextShowYn(showYnTarget) === "Y"
              ? "공개하시겠습니까?"
              : "비공개하시겠습니까?"
          }
          onConfirm={onConfirmShowYn}
          onCancel={() => setShowYnTarget(null)}
        />
      )}
      {questionView && (
        <ExamQuestionViewModal
          title={questionView.title}
          questions={questionView.questions}
          onClose={() => setQuestionView(null)}
        />
      )}
      {gradeView && (
        <ExamGradeModal
          title={gradeView.title}
          questions={gradeView.questions}
          students={showStudents ?? []}
          onClose={() => {
            dispatch(testActions.clearGradeTestSetId());
            setGradeView(null);
          }}
        />
      )}
      {isTakeExamOpen && <ExamTakeModal />}
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: "80px" }} />
          <col />
          {canUpdateShowYn && <col style={{ width: "100px" }} />}
          {canViewQuestions && <col style={{ width: "100px" }} />}
          {canGrade && <col style={{ width: "60px" }} />}
          {canDelete && <col style={{ width: "60px" }} />}
        </colgroup>
        <thead>
          <tr>
            <th style={headerCellStyle}>번호</th>
            <th style={headerCellStyle}>시험 명</th>
            {canUpdateShowYn && <th style={headerCellStyle}>공개 여부</th>}
            {canViewQuestions && <th style={headerCellStyle}>문제보기</th>}
            {canGrade && <th style={headerCellStyle}>채점</th>}
            {canDelete && <th style={headerCellStyle}>삭제</th>}
          </tr>
        </thead>
        <tbody>
          {testSets.length === 0 && (
            <tr>
              <td
                colSpan={columnCount}
                style={{ ...cellStyle, textAlign: "center" }}
              >
                등록된 시험이 없습니다.
              </td>
            </tr>
          )}
          {testSets.map((testSet, index) => (
            <tr key={testSet.id} style={rowStyle(index)}>
              <td style={cellStyle}>{testSets.length - index}</td>
              <td
                style={{ ...cellStyle, ...actionStyle }}
                onClick={() => onClickTestName(testSet)}
              >
                {testSet.setName}
              </td>
              {canUpdateShowYn && (
                <td
                  style={{ ...cellStyle, ...actionStyle }}
                  onClick={() => setShowYnTarget(testSet)}
                >
                  {testSet.showYn}
                </td>
              )}
              {canViewQuestions && (
                <td
                  style={{ ...cellStyle, ...actionStyle }}
                  onClick={() => onClickShowQuestions(testSet)}
                >
                  문제 보기
                </td>
              )}
              {canGrade && (
                <td
                  style={{ ...cellStyle, ...actionStyle }}
                  onClick={() => onClickGrade(testSet)}
                >
                  채점
                </td>
              )}
              {canDelete && (
                <td
                  style={{ ...cellStyle, ...actionStyle }}
                  onClick={() => onClickDelete(testSet)}
                >
                  삭제
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
