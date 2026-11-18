import { useEffect, useId, useState } from "react";
import PageContainer from "../../../common/PageContainer";
import { searchTest } from "../../../../api/admin/system/test/testApi";
import style from "./Test.module.css";

import { useDispatch, useSelector } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";
import AddTest from "./AddTest";
import UpdateTest from "./UpdateTest";
import { getCodeOptionList } from "../../../../api/admin/system/code/codeApi";
import usePermission from "../../../../hooks/usePermission";
import Badge from "../../../common/ui/Badge";
import Button from "../../../common/ui/Button";
import QuestionBlock from "../../../common/ui/QuestionBlock";
import StatusBox from "../../../common/ui/StatusBox";
import { Tabs, TabPanel } from "../../../common/ui/Tabs";
import { useToast } from "../../../common/ui/feedbackContext";
import MyPassword from "../../../my/info/MyPassword";

const NO_DETAIL_TYPES = ["ANSWER_CHECK", "ANSWER_WRITE", "ANSWER_CODE"];

/* 유형별 배지 색 (샘플 문제 은행 · 시험지와 같게) */
const TYPE_TONE = {
  ANSWER_SELECT: "primary",
  ANSWER_MULTIPLE: "primary",
  ANSWER_CHECK: "neutral",
  ANSWER_WRITE: "info",
  ANSWER_CODE: "warning",
};

const OX_OPTIONS = [
  { value: "O", label: "O" },
  { value: "X", label: "X" },
];

const getCorrectNumbers = (correctAnswer) => {
  if (correctAnswer === null || correctAnswer === undefined) {
    return [];
  }
  return String(correctAnswer)
    .split(",")
    .map((number) => number.trim());
};

const toTypeTone = (answerType) => {
  if (TYPE_TONE[answerType]) {
    return TYPE_TONE[answerType];
  }
  return "neutral";
};

export default function Test() {
  const { isSuperAdmin, status } = usePermission();
  // 시험 문제 관리는 들어올 때마다 비밀번호를 다시 확인 (내 정보 · 상담 기록과 같은 방식)
  const [passwordVerified, setPasswordVerified] = useState(false);

  if (status === "loaded" && isSuperAdmin) {
    if (!passwordVerified) {
      return (
        <PageContainer>
          <MyPassword onVerified={() => setPasswordVerified(true)} />
        </PageContainer>
      );
    }
    return <TestManagement />;
  }

  // idle: 비로그인(조회하지 않음) → 표시 없음
  let content = null;
  if (status === "loading") {
    content = <StatusBox type="loading" title="권한 확인 중..." />;
  } else if (status === "failed") {
    content = (
      <StatusBox
        type="error"
        title="권한 정보를 불러오지 못했습니다."
        detail="새로고침 후 다시 시도해주세요."
      />
    );
  } else if (status === "loaded") {
    content = <StatusBox type="denied" />;
  }
  return <PageContainer>{content}</PageContainer>;
}

function TestManagement() {
  const { questions } = useSelector((state) => state.test);
  const dispatch = useDispatch();
  const toast = useToast();
  const subjectTabId = useId();

  // 보기 · 정답을 펼친 문제 id (문제마다 따로)
  const [openIds, setOpenIds] = useState([]);
  const [subjectList, setSubjectList] = useState([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [answerTypeList, setAnswerTypeList] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const toAnswerTypeName = (id) => {
    const found = answerTypeList.find((type) => type.id === id);
    if (!found) {
      return id;
    }
    return found.name;
  };

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((openId) => openId !== id);
      }
      return [...prev, id];
    });
  };

  useEffect(() => {
    getCodeOptionList("TEST_SUBJECT")
      .then((codes) => {
        setSubjectList(codes);

        if (codes.length > 0) {
          setSelectedSubjectId(codes[0].id);
        }

        getCodeOptionList("TEST_ANSWER_TYPE")
          .then(setAnswerTypeList)
          .catch((e) => toast.error(e.message));
      })
      .catch((e) => toast.error(e.message));
  }, [toast]);

  useEffect(() => {
    if (!selectedSubjectId) {
      // 과목 목록을 받기 전에는 조회하지 않음
      return;
    }
    let ignoreUpdateState = false;
    (async () => {
      try {
        const response = await searchTest(selectedSubjectId);

        if (!ignoreUpdateState) {
          dispatch(testActions.setTestList(response));
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
  }, [dispatch, selectedSubjectId, reloadKey]);

  const subjectTabs = subjectList.map((subject) => ({
    id: subject.id,
    label: subject.name,
  }));

  let questionList;
  if (loadError) {
    questionList = (
      <StatusBox
        type="error"
        detail={loadError.message}
        onRetry={() => setReloadKey((prev) => prev + 1)}
      />
    );
  } else if (questions.length === 0) {
    questionList = (
      <StatusBox type="empty" title="이 과목에 등록된 문제가 없습니다." />
    );
  } else {
    questionList = (
      <div className="form-stack">
        {questions.map((question) => {
          const isOx = question.answerType === "ANSWER_CHECK";
          // 보기가 있는 유형만 [보기 · 정답 펼치기] (O/X는 정답을 항상 보여줌)
          const hasDetail = !NO_DETAIL_TYPES.includes(question.answerType);
          const expanded = openIds.includes(question.id);

          let toggleButton = null;
          if (hasDetail) {
            let toggleText = "보기 · 정답 펼치기";
            if (expanded) {
              toggleText = "보기 · 정답 접기";
            }
            toggleButton = (
              <Button
                size="sm"
                variant="text"
                aria-expanded={expanded}
                onClick={() => toggleOpen(question.id)}
              >
                {toggleText}
              </Button>
            );
          }

          let stats = null;
          if (
            question.issuedCount !== null &&
            question.issuedCount !== undefined
          ) {
            stats = (
              <span>
                출제 {question.issuedCount}회 · 정답 {question.correctCount}회 ·
                정답률 {question.correctRate}%
              </span>
            );
          }

          let answerBlock = null;
          if (isOx) {
            answerBlock = (
              <QuestionBlock
                no="정답"
                title="O/X 정답"
                options={OX_OPTIONS}
                answer={question.correctAnswer}
                showResult
              />
            );
          } else if (hasDetail && expanded) {
            answerBlock = (
              <QuestionBlock
                no="보기"
                title="보기 · 정답"
                options={question.answers.map((answer) => ({
                  value: String(answer.no),
                  label: answer.text,
                }))}
                multiple={question.answerType === "ANSWER_MULTIPLE"}
                answer={getCorrectNumbers(question.correctAnswer)}
                showResult
              />
            );
          }

          return (
            <article key={question.id} className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Badge tone={toTypeTone(question.answerType)}>
                    {toAnswerTypeName(question.answerType)}
                  </Badge>{" "}
                  {question.question}
                </h3>
                <span className="field-hint">{question.pointAlloc}점</span>
              </div>
              <div className="card-meta">
                <span>
                  {question.crtDt} · {question.crtrId}
                </span>
                {stats}
              </div>
              <UpdateTest questionId={question.id} answerTypes={answerTypeList}>
                {toggleButton}
              </UpdateTest>
              {answerBlock && (
                <div className={style.answerArea}>{answerBlock}</div>
              )}
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <PageContainer>
      <Tabs
        idBase={subjectTabId}
        ariaLabel="과목"
        items={subjectTabs}
        value={selectedSubjectId}
        onChange={setSelectedSubjectId}
      />
      <TabPanel idBase={subjectTabId} tabId={selectedSubjectId}>
        <div className="form-stack">
          {selectedSubjectId && (
            <AddTest
              subjectId={selectedSubjectId}
              answerTypes={answerTypeList}
              questionCount={questions.length}
            />
          )}
          {questionList}
        </div>
      </TabPanel>
    </PageContainer>
  );
}
