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

/**
 * 시험 응시(시험 명 클릭)가 가능한 역할.
 * ROLE_SUPER_ADMIN은 개발 중 응시 화면 테스트용으로 허용 — 배포 전에 제거할 것.
 */
const TEST_TAKER_ROLES = ["ROLE_STUDENT", "ROLE_SUPER_ADMIN"];
/** 문제 보기가 가능한 역할 (강사, 관리자, 최고 관리자) */
const QUESTION_VIEWER_ROLES = ["ROLE_TUTOR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"];

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
  // 로그인한 사용자의 역할 (GET /action-codes/me 결과)
  const roleId = useSelector((store) => store.permission.roleId);
  const canTakeTest = TEST_TAKER_ROLES.includes(roleId);
  const canViewQuestions = QUESTION_VIEWER_ROLES.includes(roleId);
  const columnCount = studentView ? 3 : 6;

  // 공개 여부를 바꾸려고 클릭한 시험 세트 (null이면 모달 닫힘)
  const [showYnTarget, setShowYnTarget] = useState(null);
  // 문제 보기 모달에 띄울 내용 { title, questions } (null이면 닫힘)
  const [questionView, setQuestionView] = useState(null);
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
      alert("수강생만 응시할 수 있습니다.");
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

  // TODO: 채점 기능
  const onClickGrade = (testSet) => {
    console.log("채점", testSet.id);
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
      {isTakeExamOpen && <ExamTakeModal />}
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: "80px" }} />
          <col />
          {!studentView && <col style={{ width: "100px" }} />}
          <col style={{ width: "100px" }} />
          {!studentView && <col style={{ width: "60px" }} />}
          {!studentView && <col style={{ width: "60px" }} />}
        </colgroup>
        <thead>
          <tr>
            <th style={headerCellStyle}>번호</th>
            <th style={headerCellStyle}>시험 명</th>
            {!studentView && <th style={headerCellStyle}>공개 여부</th>}
            <th style={headerCellStyle}>문제보기</th>
            {!studentView && <th style={headerCellStyle}>채점</th>}
            {!studentView && <th style={headerCellStyle}>삭제</th>}
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
              {!studentView && (
                <td
                  style={{ ...cellStyle, ...actionStyle }}
                  onClick={() => setShowYnTarget(testSet)}
                >
                  {testSet.showYn}
                </td>
              )}
              <td
                style={{ ...cellStyle, ...actionStyle }}
                onClick={() => onClickShowQuestions(testSet)}
              >
                문제 보기
              </td>
              {!studentView && (
                <td
                  style={{ ...cellStyle, ...actionStyle }}
                  onClick={() => onClickGrade(testSet)}
                >
                  채점
                </td>
              )}
              {!studentView && (
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
