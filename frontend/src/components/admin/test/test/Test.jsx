import { useEffect, useId, useMemo, useState } from "react";
import PageHeader from "../../../common/ui/PageHeader";
import useBreadcrumbs from "../../../../hooks/useBreadcrumbs";
import { searchTest } from "../../../../api/admin/system/test/testApi";
import style from "./Test.module.css";

import { useDispatch, useSelector } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";
import AddTest from "./AddTest";
import UpdateTest from "./UpdateTest";
import { getCodeOptionList } from "../../../../api/admin/system/code/codeApi";
import usePermission from "../../../../hooks/usePermission";
import Badge from "../../../common/ui/Badge";
import QuestionBlock from "../../../common/ui/QuestionBlock";
import StatusBox from "../../../common/ui/StatusBox";
import { Tabs, TabPanel } from "../../../common/ui/Tabs";
import { useToast } from "../../../common/ui/feedbackContext";
import MyPassword from "../../../my/info/MyPassword";
import Field from "../../../common/ui/Field";
import SelectBox from "../../../common/ui/SelectBox";
import { toAnswerTypeCode } from "../../../../utils/examAnswerType";

/* 보기가 있는 유형 (보기는 항상 표시, 정답은 [정답 확인]을 눌러야 표시) */
const CHOICE_TYPES = ["ANSWER_SELECT", "ANSWER_MULTIPLE"];

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
  const { can, status } = usePermission();
  const crumbs = useBreadcrumbs();
  // 시험 문제 관리는 들어올 때마다 비밀번호를 다시 확인 (내 정보 · 상담 기록과 같은 방식)
  const [passwordVerified, setPasswordVerified] = useState(false);

  // 문제 조회 권한(EXAM_QUESTION_READ)이 있으면 들어올 수 있음 (서버 ExamController 의 @RequireAction 과 같은 기준)
  if (status === "loaded" && can("EXAM_QUESTION_READ")) {
    if (!passwordVerified) {
      return (
        <>
          <PageHeader crumbs={crumbs} title={crumbs.at(-1)?.title} />
          <MyPassword onVerified={() => setPasswordVerified(true)} />
        </>
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
  return (
    <>
      <PageHeader crumbs={crumbs} title={crumbs.at(-1)?.title} />
      {content}
    </>
  );
}

function TestManagement() {
  const { questions } = useSelector((state) => state.test);
  const crumbs = useBreadcrumbs();
  const dispatch = useDispatch();
  const toast = useToast();
  const subjectTabId = useId();
  const { can } = usePermission();
  // 버튼별 권한. 권한이 없으면 버튼을 숨김 (가이드 8장)
  const canCreate = can("EXAM_QUESTION_CREATE");
  const canUpdate = can("EXAM_QUESTION_UPDATE");
  const canDelete = can("EXAM_QUESTION_DELETE");

  // 정답을 펼친 문제 id (문제마다 따로, 기본은 숨김)
  const [openIds, setOpenIds] = useState([]);
  // 목록 필터: 문제 유형 ("" 전체) · 난이도 ("" 전체, 배점 1~5점 = 난이도 1~5) · 검색어 (문제 제목 · 내용)
  const [typeFilter, setTypeFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [keyword, setKeyword] = useState("");
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

  const filteredQuestions = useMemo(() => {
    const word = keyword.trim().toLowerCase();
    return questions.filter((question) => {
      if (typeFilter && toAnswerTypeCode(question.answerType) !== typeFilter) {
        return false;
      }
      if (
        difficultyFilter &&
        String(question.pointAlloc) !== difficultyFilter
      ) {
        return false;
      }
      if (!word) {
        return true;
      }
      return [question.question, question.subQuestion]
        .filter(Boolean)
        .some((text) => text.toLowerCase().includes(word));
    });
  }, [questions, typeFilter, difficultyFilter, keyword]);

  const isFiltered =
    typeFilter !== "" || difficultyFilter !== "" || keyword.trim() !== "";

  const typeOptions = [
    { value: "", label: "전체 유형" },
    ...answerTypeList.map((type) => ({ value: type.id, label: type.name })),
  ];

  // 난이도 = 배점 (1~5점). 이 과목에서 난이도별 문제 수를 함께 표시
  const difficultyOptions = [
    { value: "", label: "전체 난이도" },
    ...[1, 2, 3, 4, 5].map((level) => ({
      value: String(level),
      label: `난이도 ${level} (${
        questions.filter((question) => Number(question.pointAlloc) === level)
          .length
      }문제)`,
    })),
  ];

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
  } else if (filteredQuestions.length === 0) {
    questionList = (
      <StatusBox type="empty" title="조건에 맞는 문제가 없습니다." />
    );
  } else {
    questionList = (
      <ul className={`list-group ${style.questionList}`} aria-label="문제 목록">
        {filteredQuestions.map((question, index) => {
          // 옛 데이터(한글 이름 등)도 코드로 바꿔서 비교
          const answerType = toAnswerTypeCode(question.answerType);
          const isOx = answerType === "ANSWER_CHECK";
          const isChoice = CHOICE_TYPES.includes(answerType);
          const isCode = answerType === "ANSWER_CODE";
          // 목록에는 문제 제목만. 줄을 누르면 내용 · 보기 · 정답 · 수정/삭제가 펼쳐지고 다시 누르면 접힘
          const expanded = openIds.includes(question.id);
          const detailId = `question-detail-${question.id}`;

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

          // 펼쳤을 때: 문제 내용(본문 · 코드) + 보기와 정답(초록), 주관식 · 코드는 모범 답안
          const choiceOptions = question.answers.map((answer) => ({
            value: String(answer.no),
            label: answer.text,
          }));
          let contentBlock = null;
          if (isChoice || isOx) {
            contentBlock = (
              <QuestionBlock
                no={isOx ? "O/X" : "보기"}
                title={isOx ? "O/X 문제" : "보기 · 정답"}
                body={question.subQuestion || undefined}
                options={isOx ? OX_OPTIONS : choiceOptions}
                multiple={answerType === "ANSWER_MULTIPLE"}
                answer={
                  isOx
                    ? question.correctAnswer
                    : getCorrectNumbers(question.correctAnswer)
                }
                showResult
              />
            );
          } else if (question.subQuestion) {
            contentBlock = (
              <QuestionBlock
                no="내용"
                title="문제 내용"
                body={!isCode ? question.subQuestion : undefined}
                code={isCode ? question.subQuestion : undefined}
              />
            );
          }

          let answerBlock = null;
          if (!isChoice && !isOx) {
            answerBlock = (
              <div className="answer-box answer-box-model">
                <span className="answer-box-label">모범 답안</span>
                {question.correctAnswer ||
                  "등록된 모범 답안이 없습니다. (강사 채점)"}
              </div>
            );
          }

          return (
            <li key={question.id}>
              <button
                type="button"
                className={`list-item ${style.questionRow}`}
                aria-expanded={expanded}
                aria-controls={detailId}
                onClick={() => toggleOpen(question.id)}
              >
                <span className="field-hint">{index + 1}.</span>
                <Badge tone={toTypeTone(answerType)}>
                  {toAnswerTypeName(answerType)}
                </Badge>
                <span className={style.questionTitle}>{question.question}</span>
                <span className="field-hint">
                  난이도 {question.pointAlloc} · {question.pointAlloc}점
                </span>
                <span className={style.chevron} aria-hidden="true">
                  {expanded ? "▲" : "▼"}
                </span>
              </button>
              {expanded && (
                <div id={detailId} className={style.questionDetail}>
                  {contentBlock}
                  {answerBlock && (
                    <div className={style.answerArea}>{answerBlock}</div>
                  )}
                  <div className="card-meta">
                    <span>
                      {question.crtDt} · {question.crtrId}
                    </span>
                    {stats}
                  </div>
                  <UpdateTest
                    questionId={question.id}
                    answerTypes={answerTypeList}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <>
      <PageHeader crumbs={crumbs} title={crumbs.at(-1)?.title} />
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
              canCreate={canCreate}
            />
          )}
          {!loadError && questions.length > 0 && (
            <div className="toolbar">
              <div className="form-row">
                <Field label="문제 유형" htmlFor="testTypeFilter">
                  <SelectBox
                    inputId="testTypeFilter"
                    size="sm"
                    options={typeOptions}
                    value={typeOptions.find(
                      (option) => option.value === typeFilter,
                    )}
                    onChange={(option) => setTypeFilter(option?.value ?? "")}
                  />
                </Field>
                <Field label="난이도 (배점)" htmlFor="testDifficultyFilter">
                  <SelectBox
                    inputId="testDifficultyFilter"
                    size="sm"
                    options={difficultyOptions}
                    value={difficultyOptions.find(
                      (option) => option.value === difficultyFilter,
                    )}
                    onChange={(option) =>
                      setDifficultyFilter(option?.value ?? "")
                    }
                  />
                </Field>
                <Field label="검색" htmlFor="testKeyword">
                  <input
                    id="testKeyword"
                    type="search"
                    className="form-control"
                    placeholder="문제 제목 · 내용"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                  />
                </Field>
              </div>
              <span className="field-hint" role="status">
                {isFiltered
                  ? `${filteredQuestions.length} / ${questions.length}문제`
                  : `${questions.length}문제`}
              </span>
            </div>
          )}
          {questionList}
        </div>
      </TabPanel>
    </>
  );
}
