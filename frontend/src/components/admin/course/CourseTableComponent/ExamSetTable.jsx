import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";
import {
  deleteTestSet,
  updateTestSetShowYn,
  viewTestSetQuestions,
} from "../../../../api/admin/system/test/testApi";
import ExamQuestionViewModal from "./ExamQuestionViewModal";
import ExamTakeModal from "./ExamTakeModal";
import ExamGradeModal from "./ExamGradeModal";
import usePermission from "../../../../hooks/usePermission";

import Badge from "../../../common/ui/Badge";
import Button from "../../../common/ui/Button";
import Table from "../../../common/ui/Table";
import { useConfirm, useToast } from "../../../common/ui/feedbackContext";
import { icons } from "../../../common/input/icons";

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

/** 오류 토스트 문구: "~하지 못했습니다. 이유" */
const failText = (prefix, error) =>
  `${prefix} ${error?.message ?? ""}`.trim();

/**
 * 시험 세트 목록 표.
 * 번호는 최신 순서대로 역순(맨 위가 가장 큰 번호). 실제 시험 세트 id는 클릭 처리에만 사용한다.
 *
 * @param testSets searchTestSets 결과 (ExamSetVO 목록)
 * @param onChangeShowYn 공개 여부 수정 성공 시 호출 (testSetId, showYn)
 * @param onDelete 삭제 성공 시 호출 (testSetId). 목록에서 빼는 것은 부모가 한다
 * @param studentView true면 수강생 화면: 공개 여부 / 채점 / 삭제 컬럼을 숨긴다
 *
 * 화면 표시용 권한 구분이며, 실제 차단은 서버가 해야 한다.
 */
export default function ExamSetTable({
  testSets = [],
  onChangeShowYn = () => {},
  onDelete = () => {},
  studentView = false,
}) {
  const { can } = usePermission();
  const toast = useToast();
  const confirm = useConfirm();
  const canTakeTest = can(PERMISSION.TAKE_TEST);
  const canViewQuestions = can(PERMISSION.VIEW_QUESTIONS);
  // 공개 여부 · 채점 · 삭제는 수강생 화면(studentView)에서는 권한이 있어도 숨긴다
  const canUpdateShowYn = !studentView && can(PERMISSION.UPDATE_SHOW_YN);
  const canGrade = !studentView && can(PERMISSION.GRADE);
  const canDelete = !studentView && can(PERMISSION.DELETE);

  // 문제 보기 모달에 띄울 내용 { title, questions } (null이면 닫힘)
  const [questionView, setQuestionView] = useState(null);
  // 채점 모달에 띄울 내용 { title, questions } (null이면 닫힘)
  const [gradeView, setGradeView] = useState(null);
  // 이 화면에서 방금 제출한 시험 ID (목록을 다시 불러오기 전에도 "응시 완료"로 보이게)
  const [submittedIds, setSubmittedIds] = useState(() => new Set());
  const isSubmitted = (testSet) =>
    testSet.submittedYn === "Y" || submittedIds.has(testSet.id);
  // 이 강의를 듣는 수강생 (CourseItem에서 강좌를 열 때 불러와 둔 목록)
  const { showStudents } = useSelector((store) => store.courses);
  // 시험 응시 모달 열림 여부 (내용은 testSlice.takeExam)
  const isTakeExamOpen = useSelector((store) => store.test.takeExam !== null);
  const dispatch = useDispatch();

  // "Y"가 아니면(N, null) 공개로, "Y"면 비공개로 바꾼다
  const nextShowYn = (testSet) => (testSet.showYn === "Y" ? "N" : "Y");

  // [공개] · [비공개] → 확인 창 → 공개 여부 수정
  const onClickShowYn = async (testSet) => {
    const showYn = nextShowYn(testSet);
    const actionText = showYn === "Y" ? "공개" : "비공개";
    const ok = await confirm({
      title: `시험 ${actionText}`,
      message: `${testSet.setName} 시험을 ${actionText}할까요?`,
      confirmText: actionText,
    });
    if (!ok) {
      return;
    }
    try {
      await updateTestSetShowYn(testSet.id, showYn);
      onChangeShowYn(testSet.id, showYn);
      toast.success(`시험을 ${actionText}했습니다.`);
    } catch (e) {
      toast.error(failText(`시험을 ${actionText}하지 못했습니다.`, e));
    }
  };

  // TODO: 시험 응시 화면이 생기면 여기서 연다
  // 문제 목록을 불러와 시험 응시 모달을 연다
  // TODO: 정답이 빠진 수강생용 문제 조회 API가 생기면 교체 (지금 API는 정답까지 내려줌)
  const onClickTestName = async (testSet) => {
    if (!canTakeTest) {
      toast.error("시험 응시 권한이 없습니다.");
      return;
    }
    // 이미 응시한 시험은 다시 열지 않음 (서버도 제출 때 중복을 막음)
    if (isSubmitted(testSet)) {
      toast.error("이미 응시한 시험입니다.");
      return;
    }
    // 공개(Y)되지 않은 시험은 응시 불가 (서버에서도 한 번 더 막음)
    if (testSet.showYn !== "Y") {
      toast.error("공개되지 않은 시험입니다.");
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
      toast.error(failText("문제를 불러오지 못했습니다.", e));
    }
  };

  // 문제 목록을 불러와 문제 보기 모달을 연다
  const onClickShowQuestions = async (testSet) => {
    if (!canViewQuestions) {
      toast.error("권한이 없습니다.");
      return;
    }
    try {
      const result = await viewTestSetQuestions(testSet.id);
      setQuestionView({
        title: testSet.setName,
        questions: result?.examList ?? [],
      });
    } catch (e) {
      toast.error(failText("문제를 불러오지 못했습니다.", e));
    }
  };

  // 문제 목록을 불러와 채점 모달을 연다 (수강생 탭 + 문제 · 정답)
  // TODO: 수강생 답안 조회 API가 완성되면 ExamGradeModal 의 studentAnswers 로 연결
  const onClickGrade = async (testSet) => {
    if (!canGrade) {
      toast.error("권한이 없습니다.");
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
      toast.error(failText("문제를 불러오지 못했습니다.", e));
    }
  };

  // [삭제] → 확인 창 → 삭제 → 부모가 목록에서 뺀다
  const onClickDelete = async (testSet) => {
    const ok = await confirm({
      title: "시험 삭제",
      message: `${testSet.setName} 시험을 삭제할까요?`,
      confirmText: "삭제",
      danger: true,
    });
    if (!ok) {
      return;
    }
    try {
      await deleteTestSet(testSet.id);
      toast.success("시험을 삭제했습니다.");
      onDelete(testSet.id);
    } catch (e) {
      toast.error(failText("시험을 삭제하지 못했습니다.", e));
    }
  };

  // 역할마다 다른 칸은 columns 배열을 걸러서 만든다
  const hasActions = canViewQuestions || canGrade || canDelete;
  const columns = [
    {
      key: "no",
      title: "번호",
      width: 80,
      align: "num",
      render: (testSet) => testSets.length - testSets.indexOf(testSet),
    },
    {
      key: "setName",
      title: "시험 명",
      render: (testSet) => {
        if (!canTakeTest) {
          return testSet.setName;
        }
        // 응시할 수 없는 이유: 이미 응시함(서버가 로그인 사용자 기준으로 계산) · 비공개
        const submitted = isSubmitted(testSet);
        let blockedReason = "";
        if (submitted) {
          blockedReason = "이미 응시한 시험입니다.";
        } else if (testSet.showYn !== "Y") {
          blockedReason = "공개되지 않은 시험입니다.";
        }
        return (
          <div className="btn-group">
            {/* 비활성 버튼은 마우스 이벤트가 없어 title 을 감싸는 span 에 둔다 */}
            <span title={blockedReason || undefined}>
              <Button
                variant="text"
                size="sm"
                disabled={Boolean(blockedReason)}
                onClick={() => onClickTestName(testSet)}
              >
                {testSet.setName}
              </Button>
            </span>
            {submitted && <Badge tone="success">응시 완료</Badge>}
          </div>
        );
      },
    },
    canUpdateShowYn && {
      key: "showYn",
      title: "공개 여부",
      width: 170,
      render: (testSet) => (
        <div className="btn-group">
          {testSet.showYn === "Y" ? (
            <Badge tone="info">공개</Badge>
          ) : (
            <Badge>비공개</Badge>
          )}
          <Button size="sm" onClick={() => onClickShowYn(testSet)}>
            {nextShowYn(testSet) === "Y" ? "공개" : "비공개"}
          </Button>
        </div>
      ),
    },
    hasActions && {
      key: "actions",
      title: "작업",
      align: "actions",
      width: 240,
      render: (testSet) => (
        <>
          {canViewQuestions && (
            <Button size="sm" onClick={() => onClickShowQuestions(testSet)}>
              문제 보기
            </Button>
          )}
          {canGrade && (
            <Button size="sm" onClick={() => onClickGrade(testSet)}>
              채점
            </Button>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="danger"
              icon={icons.delete}
              onClick={() => onClickDelete(testSet)}
            >
              삭제
            </Button>
          )}
        </>
      ),
    },
  ].filter(Boolean);

  return (
    <>
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
      {isTakeExamOpen && (
        <ExamTakeModal
          onSubmitted={(testSetId) =>
            setSubmittedIds((prev) => new Set(prev).add(testSetId))
          }
        />
      )}
      <Table
        ariaLabel="시험 목록"
        columns={columns}
        rows={testSets}
        rowKey="id"
        size="sm"
        emptyText="등록된 시험이 없습니다."
      />
    </>
  );
}
