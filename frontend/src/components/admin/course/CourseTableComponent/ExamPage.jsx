import { useEffect, useId, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  makeNewTestSet,
  searchTest,
  searchTestSets,
} from "../../../../api/admin/system/test/testApi";
import { testActions } from "../../../../store/slices/testSliceStore";

import TestSubjectSelect from "../selector/TestSubjectSelect";
import ExamSubjectSelect from "../selector/ExamSubjectSelect";
import ExamQuestionPicker from "./ExamQuestionPicker";
import ExamSetTable from "./ExamSetTable";
import usePermission from "../../../../hooks/usePermission";

import Button from "../../../common/ui/Button";
import Field from "../../../common/ui/Field";
import Panel from "../../../common/ui/Panel";
import StatusBox from "../../../common/ui/StatusBox";
import { useToast } from "../../../common/ui/feedbackContext";
import { icons } from "../../../common/input/icons";

export default function ExamPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const toast = useToast();
  const { selectSubjectId, selectedQuestions } = useSelector(
    (store) => store.test,
  );
  // 시험 추가 폼 열림 여부
  const [showAddExam, setShowAddExam] = useState(false);
  // [시험 등록]: POST addTestSet 의 권한
  const { can } = usePermission();
  const canAddExam = can("EXAM_COURSE_SET_CREATE");
  // 이 강좌의 시험 세트 목록 (ExamSetTable)
  const [testSets, setTestSets] = useState([]);
  // 시험 세트 목록을 불러오지 못했을 때의 오류 (표 자리에 StatusBox로 보여 줌)
  const [loadError, setLoadError] = useState(null);
  // 칸별 입력 오류 ([등록]을 누를 때 검사)
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const baseId = useId();
  const subjectId = `${baseId}-subject`;
  const typeId = `${baseId}-type`;
  const titleId = `${baseId}-title`;

  // 공개 여부 수정 성공: 목록에서 해당 시험 세트의 값만 바꾼다
  const onChangeShowYn = (testSetId, showYn) => {
    setTestSets((prev) =>
      prev.map((testSet) =>
        testSet.id === testSetId ? { ...testSet, showYn } : testSet,
      ),
    );
  };
  // 삭제 성공: 목록에서 해당 시험 세트를 뺀다
  const onDeleteTestSet = (testSetId) => {
    setTestSets((prev) => prev.filter((testSet) => testSet.id !== testSetId));
  };
  // 시험 제목 input (RegistExamSetVO.setName)
  const examTitleRef = useRef();
  // 시험 공개 여부 checkbox (RegistExamSetVO.showYn: 체크 시 "Y")
  const isPublicRef = useRef();

  // 폼을 닫을 때 선택한 과목도 비운다 (다시 열었을 때 Select와 표가 어긋나지 않도록)
  // 제목/공개여부 input은 폼이 사라졌다 다시 그려지므로 따로 비우지 않아도 된다.
  const onCancelAddExam = () => {
    dispatch(testActions.selectSubjectId(""));
    setErrors({});
    setShowAddExam(false);
  };

  const onSubmitAddExam = async (event) => {
    event.preventDefault();
    if (saving) {
      return;
    }
    const examTitle = examTitleRef.current.value.trim();
    const isPublic = isPublicRef.current.checked;

    // 입력값 검사를 통과한 경우에만 API 호출
    const nextErrors = {};
    if (!selectSubjectId) {
      nextErrors.subject = "시험 과목을 고르세요.";
    }
    if (!examTitle) {
      nextErrors.title = "시험 제목을 입력하세요.";
    }
    if (selectedQuestions.length === 0) {
      nextErrors.questions = "시험 문제를 고르세요.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const addTestSet = {
      courseId: id,
      testType: selectSubjectId.value,
      setName: examTitle,
      showYn: isPublic ? "Y" : "N",
      questeions: selectedQuestions,
    };

    setSaving(true);
    try {
      await makeNewTestSet(id, addTestSet);
      const tests = await searchTestSets(id);
      setTestSets(tests);
      setLoadError(null);
      toast.success("시험을 등록했습니다.");
      // 등록 성공: 추가 폼 닫기 (선택한 과목도 함께 비움)
      onCancelAddExam();
    } catch (e) {
      toast.error(`시험을 등록하지 못했습니다. ${e.message ?? ""}`.trim());
    } finally {
      setSaving(false);
    }
  };

  // 시험 탭을 떠나면(폼을 [취소] 없이 떠난 경우 포함) 고른 과목 · 문제를 비운다
  // (slice 에 남으면 다음에 폼을 열 때 이전 과목으로 문제 목록 · 등록이 이어짐)
  useEffect(
    () => () => {
      dispatch(testActions.selectSubjectId(""));
      dispatch(testActions.clearSelectedQuestions());
    },
    [dispatch],
  );

  // 탭에 들어오면 시험 세트 목록 조회
  useEffect(() => {
    if (!id) {
      return;
    }
    let ignoreUpdateState = false;

    (async () => {
      try {
        const result = await searchTestSets(id);
        if (!ignoreUpdateState) {
          setTestSets(result);
          setLoadError(null);
        }
      } catch (e) {
        if (!ignoreUpdateState) {
          setLoadError(e);
        }
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [id]);

  useEffect(() => {
    // 과목을 고르기 전에는 조회하지 않음 (빈 값으로 호출하면 404)
    if (!id || !selectSubjectId) {
      return;
    }
    let ignoreUpdateState = false;

    (async () => {
      try {
        const response = await searchTest(selectSubjectId.value);
        if (!ignoreUpdateState) {
          dispatch(testActions.setTestList(response));
        }
      } catch (e) {
        if (!ignoreUpdateState) {
          toast.error(
            `문제 목록을 불러오지 못했습니다. ${e.message ?? ""}`.trim(),
          );
        }
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 기존 동작 유지: 과목이 바뀔 때만 조회
  }, [dispatch, selectSubjectId]);

  if (showAddExam) {
    return (
      <form onSubmit={onSubmitAddExam} noValidate>
        <Panel
          title="시험 등록"
          footer={
            <>
              <Button onClick={onCancelAddExam} disabled={saving}>
                취소
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {saving ? "등록 중..." : "등록"}
              </Button>
            </>
          }
        >
          <div className="form-stack">
            <div className="form-row">
              <Field
                label="시험 과목"
                htmlFor={subjectId}
                required
                error={errors.subject}
              >
                <TestSubjectSelect inputId={subjectId} />
              </Field>
              <Field label="시험 종류" htmlFor={typeId}>
                <ExamSubjectSelect inputId={typeId} />
              </Field>
              <Field
                label="시험 제목"
                htmlFor={titleId}
                required
                error={errors.title}
              >
                <input
                  id={titleId}
                  type="text"
                  className="form-control"
                  ref={examTitleRef}
                />
              </Field>
            </div>
            <label className="form-check">
              <input type="checkbox" ref={isPublicRef} /> 수강생에게 공개
            </label>
            <Field group label="시험 문제" required error={errors.questions}>
              <ExamQuestionPicker />
            </Field>
          </div>
        </Panel>
      </form>
    );
  }

  return (
    <div className="form-stack">
      <div className="toolbar">
        <span className="field-hint">시험 {testSets.length}건</span>
        {canAddExam && (
          <Button
            variant="primary"
            icon={icons.add}
            onClick={() => setShowAddExam(true)}
            className="toolbar-end"
          >
            시험 등록
          </Button>
        )}
      </div>
      {loadError ? (
        <StatusBox
          type="error"
          title="시험 목록을 불러오지 못했습니다."
          detail={loadError.message}
        />
      ) : (
        <ExamSetTable
          testSets={testSets}
          onChangeShowYn={onChangeShowYn}
          onDelete={onDeleteTestSet}
        />
      )}
    </div>
  );
}
