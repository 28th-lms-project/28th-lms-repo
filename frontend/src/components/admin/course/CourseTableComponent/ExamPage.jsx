import { useEffect, useRef, useState } from "react";
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
import { IconButton } from "../../../sample/input/IconButton";
import { icons } from "../../../sample/input/icons";
import usePermission from "../../../../hooks/usePermission";

export default function ExamPage() {
  const { id } = useParams();
  console.log(id);
  const dispatch = useDispatch();
  const { questions, selectSubjectId, selectedQuestions } = useSelector(
    (store) => store.test,
  );
  // 시험 추가 폼 열림 여부
  const [showAddExam, setShowAddExam] = useState(false);
  // [시험 추가]: POST addTestSet 의 권한
  const { can } = usePermission();
  const canAddExam = can("EXAM_COURSE_SET_CREATE");
  // 이 강좌의 시험 세트 목록 (ExamSetTable)
  const [testSets, setTestSets] = useState([]);

  // 공개 여부 수정 성공: 목록에서 해당 시험 세트의 값만 바꾼다
  const onChangeShowYn = (testSetId, showYn) => {
    setTestSets((prev) =>
      prev.map((testSet) =>
        testSet.id === testSetId ? { ...testSet, showYn } : testSet,
      ),
    );
  };
  // 시험 제목 input (RegistExamSetVO.setName)
  const examTitleRef = useRef();
  // 시험 공개 여부 checkbox (RegistExamSetVO.showYn: 체크 시 "Y")
  const isPublicRef = useRef();

  // 폼을 닫을 때 선택한 과목도 비운다 (다시 열었을 때 Select와 표가 어긋나지 않도록)
  // 제목/공개여부 input은 폼이 사라졌다 다시 그려지므로 따로 비우지 않아도 된다.
  const onCancelAddExam = () => {
    dispatch(testActions.selectSubjectId(""));
    setShowAddExam(false);
  };

  const onClickAddExam = async () => {
    const examTitle = examTitleRef.current.value.trim();
    const isPublic = isPublicRef.current.checked;

    // 입력값 검사를 통과한 경우에만 API 호출
    if (!selectSubjectId) {
      alert("시험과목을 선택하세요.");
      return;
    }
    if (!examTitle) {
      alert("시험 제목을 입력하세요.");
      return;
    }
    if (selectedQuestions.length === 0) {
      alert("문제를 선택하세요.");
      return;
    }

    const addTestSet = {
      courseId: id,
      testType: selectSubjectId.value,
      setName: examTitle,
      showYn: isPublic ? "Y" : "N",
      questeions: selectedQuestions,
    };
    console.log(addTestSet);
    console.log("선택된 문제", selectedQuestions);

    try {
      const result = await makeNewTestSet(id, addTestSet);
      const tests = await searchTestSets(id);
      console.log(result);
      console.log(tests);
      setTestSets(tests);
      // 등록 성공: 추가 폼 닫기 (선택한 과목도 함께 비움)
      onCancelAddExam();
    } catch (e) {
      console.log(e);
      alert("등록에 실패했습니다.");
    }
  };

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
  }, [id]);

  useEffect(() => {
    // 과목을 고르기 전에는 조회하지 않음 (빈 값으로 호출하면 404)
    if (!id || !selectSubjectId) {
      return;
    }
    let ignoreUpdateState = false;

    (async () => {
      // const controller = new AbortController();
      // const options = { signal: controller.signal };
      try {
        const response = await searchTest(selectSubjectId.value);
        const searchTestSet = await searchTestSets(id);
        if (!ignoreUpdateState) {
          console.log(response);

          console.log(searchTestSet);
          console.log(questions);
          dispatch(testActions.setTestList(response));
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
  }, [dispatch, selectSubjectId]);

  return (
    <>
      {!showAddExam && (
        <>
          {canAddExam && (
            <IconButton
              color="#666"
              icon={icons.add}
              onClick={() => setShowAddExam(true)}
              // 가로로 늘어나지 않고, hover 시 글씨가 굵어져도 크기가 변하지 않도록 고정
              style={{ width: "120px", flexShrink: 0 }}
            >
              시험 추가
            </IconButton>
          )}
          <div style={{ marginTop: "8px" }}>
            <ExamSetTable testSets={testSets} onChangeShowYn={onChangeShowYn} />
          </div>
        </>
      )}
      {showAddExam && (
        <>
          <ExamSubjectSelect />
          <TestSubjectSelect />
          <input
            type="text"
            ref={examTitleRef}
            placeholder="시험 제목을 입력하세요"
            style={{ width: "100%", marginTop: "8px", boxSizing: "border-box" }}
          />
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "8px",
            }}
          >
            <input type="checkbox" ref={isPublicRef} />
            시험 공개
          </label>
          <div style={{ display: "flex", gap: "8px", margin: "8px 0" }}>
            <IconButton color="#666" icon={icons.add} onClick={onClickAddExam}>
              추가
            </IconButton>
            <IconButton
              color="#666"
              icon={icons.close}
              onClick={onCancelAddExam}
            >
              취소
            </IconButton>
          </div>
          <ExamQuestionPicker />
        </>
      )}
    </>
  );
}
