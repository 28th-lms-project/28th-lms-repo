import { useId, useState } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Badge from "../../common/ui/Badge.jsx";
import Field from "../../common/ui/Field.jsx";
import Panel from "../../common/ui/Panel.jsx";
import Callout from "../../common/ui/Callout.jsx";
import Modal from "../../common/ui/Modal.jsx";
import Switch from "../../common/ui/Switch.jsx";
import Progress from "../../common/ui/Progress.jsx";
import Table from "../../common/ui/Table.jsx";
import SelectBox from "../../common/ui/SelectBox.jsx";
import ChoiceGroup from "../../common/ui/ChoiceGroup.jsx";
import Comment from "../../common/ui/Comment.jsx";
import PageHeader from "../../common/ui/PageHeader.jsx";
import FilePicker from "../../common/ui/FilePicker.jsx";
import TransferList from "../../common/ui/TransferList.jsx";
import ListEditor from "../../common/ui/ListEditor.jsx";
import { newListItem } from "../../common/ui/listEditorItem.js";
import { Tabs, TabPanel } from "../../common/ui/Tabs.jsx";
import { useConfirm, useToast } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons.js";

/* ───── 예시 데이터 ───── */
const TUTORS = [
    { value: "t1", label: "김강사 (Java)" },
    { value: "t2", label: "이강사 (Spring)" },
    { value: "t3", label: "박강사 (React)" },
];
const STUDENT_OPTIONS = ["홍길동", "김철수", "이영희", "박민수", "최지우", "정해인"].map((name, i) => ({
    value: `stu0${i + 1}`,
    label: `${name} (stu0${i + 1})`,
}));

const COURSE_TABS = ["수강생", "접속시간", "시간표", "과제", "시험", "면접일정", "교육자료", "설문", "상담목록"].map((label, i) => ({
    id: String(i),
    label,
}));

const QUESTIONS = [
    { id: "q1", question: "Java의 기본형이 아닌 것은?", answerType: "객관식-단항", pointAlloc: 5 },
    { id: "q2", question: "JVM이 하는 일을 설명하세요.", answerType: "주관식", pointAlloc: 10 },
    { id: "q3", question: "String은 불변 객체이다.", answerType: "O/X", pointAlloc: 5 },
    { id: "q4", question: "배열을 뒤집는 메서드를 작성하세요.", answerType: "코드작성", pointAlloc: 20 },
    { id: "q5", question: "접근 제한자를 모두 고르세요.", answerType: "객관식-다항", pointAlloc: 10 },
    { id: "q6", question: "오버로딩과 오버라이딩의 차이는?", answerType: "주관식", pointAlloc: 10 },
    { id: "q7", question: "인터페이스는 다중 구현이 가능하다.", answerType: "O/X", pointAlloc: 5 },
];
const TYPE_TONE = { "객관식-단항": "primary", "객관식-다항": "primary", "O/X": "neutral", 주관식: "info", 코드작성: "warning" };

const GRADE_STUDENTS = ["홍길동", "김철수", "이영희", "박민수", "최지우", "정해인", "윤아름", "임수정", "한지민", "오세훈", "서지수", "강다니엘"].map(
    (name, i) => ({ id: `s${i + 1}`, label: name }),
);
const GRADE_QUESTIONS = [
    { id: "g1", no: 1, title: "String은 불변 객체이다.", type: "O/X", point: 5, model: "O", answer: "O" },
    { id: "g2", no: 2, title: "JVM이 하는 일을 설명하세요.", type: "주관식", point: 10, model: "바이트코드를 기계어로 바꿔 실행하고 메모리(GC)를 관리한다.", answer: "자바 코드를 실행해 준다." },
    { id: "g3", no: 3, title: "배열을 뒤집는 메서드를 작성하세요.", type: "코드작성", point: 20, model: "", answer: "" },
];
const GRADES = [
    { value: "Y", label: "정답", tone: "success" },
    { value: "H", label: "부분 정답", tone: "info" },
    { value: "N", label: "오답", tone: "danger" },
];

const HOMEWORK = {
    subject: "1주차 과제: 배열 뒤집기",
    endDate: "2026-11-20",
    content: "정수 배열을 받아 순서를 뒤집은 새 배열을 돌려주는 메서드를 작성하세요.\n\n- 원래 배열은 바꾸지 않습니다.\n- 실행 결과 캡처를 함께 올립니다.",
};
const SUBMITTED = ["홍길동", "김철수", "이영희", "최지우"];
const NOT_SUBMITTED = ["박민수", "정해인"];

const SURVEY_TYPES = [
    { value: "radio", label: "하나 고르기" },
    { value: "checkBox", label: "여러 개 고르기" },
    { value: "text", label: "글로 답하기" },
];
let nextSurveyNo = 3;
const newSurvey = (no) => ({ id: `sv${no}`, subject: "", type: "radio", items: [newListItem(), newListItem()] });

export const StandardScreenCatalog = () => {
    const toast = useToast();
    const confirm = useConfirm();

    /* 새 부품 단독 예시 */
    const [demoPicked, setDemoPicked] = useState(["q2"]);
    const [demoOptions, setDemoOptions] = useState(() => [newListItem("매우 만족"), newListItem("만족"), newListItem("보통")]);

    /* 과정 등록 폼 */
    const [courseName, setCourseName] = useState("");
    const [tutor, setTutor] = useState(null);
    const [courseStart, setCourseStart] = useState("2026-12-01");
    const [courseEnd, setCourseEnd] = useState("2027-05-31");
    const [courseStudents, setCourseStudents] = useState([]);
    const [timetable, setTimetable] = useState(null);
    const [courseSubmitted, setCourseSubmitted] = useState(false);
    const [courseSaving, setCourseSaving] = useState(false);
    const nameError = courseSubmitted && !courseName.trim() ? "과정 명을 입력하세요." : "";
    const tutorError = courseSubmitted && !tutor ? "담당 강사를 고르세요." : "";
    const rangeError = courseStart && courseEnd && courseStart > courseEnd ? "종료일이 시작일보다 빠릅니다." : "";
    const submitCourse = (event) => {
        event.preventDefault();
        setCourseSubmitted(true);
        if (!courseName.trim() || !tutor || rangeError) return;
        setCourseSaving(true);
        setTimeout(() => {
            setCourseSaving(false);
            toast.success("과정을 등록했습니다. (예시)");
        }, 900);
    };

    /* 과정 상세 */
    const courseTabsId = useId();
    const [courseTab, setCourseTab] = useState("0");

    /* 시험 문제 고르기 */
    const [examTitle, setExamTitle] = useState("Java 기초 중간 평가");
    const [examPublic, setExamPublic] = useState(false);
    const [picked, setPicked] = useState(["q1", "q3"]);
    const totalPoint = picked.reduce((sum, id) => sum + (QUESTIONS.find((q) => q.id === id)?.pointAlloc ?? 0), 0);

    /* 채점 */
    const gradeTabsId = useId();
    const [gradeOpen, setGradeOpen] = useState(false);
    const [gradeStudent, setGradeStudent] = useState("s1");
    const [grades, setGrades] = useState({ "s1-g1": "Y" });
    const gradedCount = Object.keys(grades).filter((k) => k.startsWith(`${gradeStudent}-`)).length;

    /* 과제 상세 */
    const [editing, setEditing] = useState(false);
    const [hwContent, setHwContent] = useState(HOMEWORK.content);
    const [hwEndDate, setHwEndDate] = useState(HOMEWORK.endDate);
    const [draftContent, setDraftContent] = useState(HOMEWORK.content);
    const [draftEndDate, setDraftEndDate] = useState(HOMEWORK.endDate);
    const [hwSaving, setHwSaving] = useState(false);
    const [deadlinePassed, setDeadlinePassed] = useState(false);
    const [reply, setReply] = useState("");
    const [pickCount, setPickCount] = useState("2");
    const [pickedNames, setPickedNames] = useState([]);
    const dirty = draftContent !== hwContent || draftEndDate !== hwEndDate;

    const startEdit = () => {
        setDraftContent(hwContent);
        setDraftEndDate(hwEndDate);
        setEditing(true);
    };
    const cancelEdit = async () => {
        if (dirty && !(await confirm({ message: "고친 내용을 버리고 나갈까요?", confirmText: "버리기", danger: true }))) return;
        setEditing(false);
    };
    const saveEdit = () => {
        setHwSaving(true);
        setTimeout(() => {
            setHwContent(draftContent);
            setHwEndDate(draftEndDate);
            setHwSaving(false);
            setEditing(false);
            toast.success("과제를 수정했습니다. (예시)");
        }, 800);
    };
    const deleteHomework = async () => {
        if (await confirm({ title: "과제 삭제", message: `${HOMEWORK.subject}을(를) 삭제할까요?\n댓글도 함께 지워집니다.`, confirmText: "삭제", danger: true })) {
            toast.success("삭제했습니다. (예시)");
        }
    };
    const pickRandom = () => {
        const n = Math.min(Number(pickCount) || 0, SUBMITTED.length);
        setPickedNames([...SUBMITTED].sort(() => Math.random() - 0.5).slice(0, n));
    };

    /* 설문 편집기 */
    const surveyGroupId = useId();
    const [surveyGroup, setSurveyGroup] = useState("pre");
    const [surveys, setSurveys] = useState(() => [
        { id: "sv1", subject: "강의 내용에 얼마나 만족하나요?", type: "radio", items: [newListItem("매우 만족"), newListItem("만족"), newListItem("불만족")] },
        { id: "sv2", subject: "더 배우고 싶은 내용을 적어 주세요.", type: "text", items: [] },
    ]);
    const updateSurvey = (id, patch) => setSurveys((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const removeSurvey = async (survey, index) => {
        if (await confirm({ message: `${index + 1}번 문항을 지울까요?`, confirmText: "지우기", danger: true })) {
            setSurveys((prev) => prev.filter((s) => s.id !== survey.id));
        }
    };

    return (
        <div>
            <p className={styles.standardIntro}>
                admin/course · survey 화면을 표준 부품으로 만든 예시와, 그 화면에만 필요했던 새 부품(두 목록 사이 옮기기 · 반복 입력 행). 스타일 원본: styles/content.css · nav.css(팝업)
            </p>

            <GroupTitle>새 부품</GroupTitle>
            <Variants>
                <Variant
                    name="TransferList: 두 목록 사이 옮기기"
                    source="styles/content.css · common/ui/TransferList.jsx"
                    note={"ExamQuestionPicker(Grid 둘 + 클릭으로 이동)의 표준. 체크한 뒤 가운데 버튼으로 옮기고, 두 번 누르면 바로 옮김.\n머리 체크박스는 그 목록 모두 체크. filter를 주면 왼쪽에 검색 칸"}
                    code={`
<TransferList
  items={questions}
  selectedKeys={picked}
  onChange={setPicked}
  renderItem={(q) => q.question}
  filter={(q, text) => q.question.includes(text)}
/>`}
                >
                    <div style={{ width: "100%" }}>
                        <TransferList
                            items={QUESTIONS.slice(0, 4)}
                            selectedKeys={demoPicked}
                            onChange={setDemoPicked}
                            renderItem={(q) => q.question}
                            height={150}
                        />
                    </div>
                </Variant>
                <Variant
                    name="ListEditor: 반복 입력 행"
                    source="styles/content.css · common/ui/ListEditor.jsx"
                    note={"Survey 보기 입력(입력 + 삭제 · 추가 버튼)의 표준. 줄에서 Enter → 아래에 새 줄, 빈 줄에서 Backspace → 그 줄 지움.\nmin · max로 줄 수 제한. 새 줄은 newListItem()"}
                    code={`
import { newListItem } from "../common/ui/listEditorItem";

const [options, setOptions] = useState([newListItem(), newListItem()]);
<ListEditor label="보기" items={options} onChange={setOptions} min={2} max={6} addLabel="보기 추가" />`}
                >
                    <div style={{ width: "100%" }}>
                        <ListEditor label="보기" items={demoOptions} onChange={setDemoOptions} min={2} max={6} addLabel="보기 추가" placeholder="보기 내용" />
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>화면 예시: 과정</GroupTitle>
            <Variants wide>
                <Variant
                    name="과정 등록 폼"
                    source="Panel · Field · SelectBox · input-range · FilePicker"
                    note={"CourseAdd(h3 라벨 + 스타일 없는 입력 4개 + FileField)를 표준 부품으로. 빈 채로 [등록]을 누르면 오류 표시.\n폼 전체를 <form>으로 감싸 Enter로도 제출, 저장 중에는 버튼 loading"}
                    block
                >
                    <form onSubmit={submitCourse} noValidate>
                        <Panel
                            title="과정 등록"
                            footer={
                                <>
                                    <Button>취소</Button>
                                    <Button type="submit" variant="primary" icon={icons.add} loading={courseSaving}>
                                        {courseSaving ? "등록 중..." : "등록"}
                                    </Button>
                                </>
                            }
                        >
                            <div className="form-stack">
                                <div className="form-row">
                                    <Field label="과정 명" htmlFor="std-course-name" required error={nameError}>
                                        <input
                                            id="std-course-name"
                                            className="form-control"
                                            placeholder="예: 풀스택 개발자 과정"
                                            value={courseName}
                                            onChange={(e) => setCourseName(e.target.value)}
                                            aria-invalid={!!nameError}
                                            aria-describedby="std-course-name-msg"
                                        />
                                    </Field>
                                    <Field label="기수" htmlFor="std-course-count" hint="숫자만">
                                        <input id="std-course-count" type="number" min={1} className="form-control" placeholder="28" />
                                    </Field>
                                </div>
                                <div className="form-row">
                                    <Field label="담당 강사" htmlFor="std-course-tutor" required error={tutorError}>
                                        <SelectBox inputId="std-course-tutor" options={TUTORS} value={tutor} onChange={setTutor} isClearable aria-invalid={!!tutorError} />
                                    </Field>
                                    <Field label="과정 기간" htmlFor="std-course-start" required error={rangeError}>
                                        <div className="input-range">
                                            <input
                                                id="std-course-start"
                                                type="date"
                                                className="form-control"
                                                value={courseStart}
                                                onChange={(e) => setCourseStart(e.target.value)}
                                                aria-invalid={!!rangeError}
                                                aria-describedby="std-course-start-msg"
                                            />
                                            <span className="input-range-sep">~</span>
                                            <input
                                                type="date"
                                                className="form-control"
                                                aria-label="종료일"
                                                value={courseEnd}
                                                onChange={(e) => setCourseEnd(e.target.value)}
                                                aria-invalid={!!rangeError}
                                            />
                                        </div>
                                    </Field>
                                </div>
                                <Field label="수강생" htmlFor="std-course-students" hint="등록 뒤에도 과정 상세의 [수강생] 탭에서 바꿀 수 있습니다.">
                                    <SelectBox inputId="std-course-students" isMulti options={STUDENT_OPTIONS} value={courseStudents} onChange={setCourseStudents} placeholder="수강생 선택" />
                                </Field>
                                <Field label="시간표 파일" htmlFor="std-course-timetable" hint="엑셀(.xlsx)">
                                    <FilePicker id="std-course-timetable" accept=".xlsx" label="파일 선택" onSelect={([f]) => setTimetable(f ?? null)} fileName={timetable?.name} />
                                </Field>
                            </div>
                        </Panel>
                    </form>
                </Variant>

                <Variant
                    name="과정 상세 (머리 + 진행 + 탭 9개)"
                    source="PageHeader · Progress · desc-list-stacked · Tabs"
                    note={"CourseItem(h3 + 기간 + \"52% 진행중\" 글자 + IconButton 탭 9개, active 클래스 미정의)을 표준으로.\n탭이 많아 좁으면 탭 줄이 가로로 스크롤됨. 선택 탭은 주소 ?tab=에 (setSearchParams)"}
                    block
                >
                    <PageHeader
                        crumbs={[{ title: "과정 관리", to: "/sample" }, { title: "풀스택 개발자 과정 28기" }]}
                        title="풀스택 개발자 과정 28기"
                        actions={<Button icon={icons.edit}>과정 수정</Button>}
                    />
                    <div className="card" style={{ marginBottom: "16px" }}>
                        <dl className="desc-list-stacked" style={{ "--desc-columns": 4 }}>
                            <div>
                                <dt>기간</dt>
                                <dd>2026-06-01 ~ 2026-11-30</dd>
                            </div>
                            <div>
                                <dt>담당 강사</dt>
                                <dd>김강사</dd>
                            </div>
                            <div>
                                <dt>수강생</dt>
                                <dd>24명</dd>
                            </div>
                            <div>
                                <dt>상태</dt>
                                <dd>
                                    <Badge tone="info">진행 중</Badge>
                                </dd>
                            </div>
                        </dl>
                        <Progress label="과정 진행" value={168} max={182} showValue />
                    </div>
                    <Tabs idBase={courseTabsId} items={COURSE_TABS} value={courseTab} onChange={setCourseTab} ariaLabel="과정 메뉴 (예시)" />
                    <TabPanel idBase={courseTabsId} tabId={courseTab}>
                        <p className="field-hint">[{COURSE_TABS[Number(courseTab)].label}] 탭 내용 (각 화면 예시 참고)</p>
                    </TabPanel>
                </Variant>
            </Variants>

            <GroupTitle>화면 예시: 시험</GroupTitle>
            <Variants wide>
                <Variant
                    name="시험 만들기: 문제 고르기"
                    source="Field · Switch · TransferList"
                    note={"ExamPage 추가 화면(제목 입력 + 공개 체크 + ExamQuestionPicker)의 표준. 고른 문제의 총 배점은 오른쪽 머리에.\n문제 유형은 Badge (같은 유형 = 같은 tone)"}
                    block
                >
                    <Panel
                        title="시험 추가"
                        footer={
                            <>
                                <Button>취소</Button>
                                <Button variant="primary" disabled={!picked.length || !examTitle.trim()} onClick={() => toast.success(`문제 ${picked.length}개로 시험을 만들었습니다. (예시)`)}>
                                    시험 만들기
                                </Button>
                            </>
                        }
                    >
                        <div className="form-stack">
                            <div className="form-row" style={{ alignItems: "center" }}>
                                <Field label="시험 제목" htmlFor="std-exam-title" required>
                                    <input id="std-exam-title" className="form-control" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
                                </Field>
                                <div style={{ flex: "0 0 auto", paddingTop: "20px" }}>
                                    <Switch checked={examPublic} onChange={setExamPublic}>
                                        수강생에게 공개
                                    </Switch>
                                </div>
                            </div>
                            <TransferList
                                items={QUESTIONS}
                                selectedKeys={picked}
                                onChange={setPicked}
                                leftTitle="Java 문제"
                                rightTitle="시험 문제"
                                rightSummary={`총 ${totalPoint}점`}
                                filter={(q, text) => q.question.includes(text)}
                                renderItem={(q) => (
                                    <span style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "space-between" }}>
                                        <span>{q.question}</span>
                                        <span style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                                            <Badge tone={TYPE_TONE[q.answerType]}>{q.answerType}</Badge>
                                            <span className="field-hint">{q.pointAlloc}점</span>
                                        </span>
                                    </span>
                                )}
                            />
                        </div>
                    </Panel>
                </Variant>

                <Variant
                    name="채점 화면 (큰 모달 + 수강생 탭 + 답안 상자 + 채점 버튼)"
                    source="Modal lg · Tabs · answer-box · btn[aria-pressed] · Badge"
                    note={"ExamGradeModal(인라인 스타일 모달, 수강생 버튼 줄, 채점 색 버튼)의 표준.\n수강생이 많으면 탭 줄이 가로 스크롤. 모범 답안은 초록 상자, 미제출은 점선 상자 + 채점 버튼 비활성"}
                    code={`
<div className="answer-box answer-box-model">
  <span className="answer-box-label">모범 답안</span>{model}
</div>
<div className="answer-box">
  <span className="answer-box-label">{student} 답안 <Badge tone="success">정답</Badge></span>{answer}
</div>
<div className="answer-box answer-box-empty">제출한 답안이 없습니다.</div>`}
                >
                    <Button variant="primary" onClick={() => setGradeOpen(true)}>
                        채점 화면 열기
                    </Button>
                    <Modal
                        open={gradeOpen}
                        onClose={() => setGradeOpen(false)}
                        size="lg"
                        title="Java 기초 중간 평가 · 채점"
                        summary={`수강생 ${GRADE_STUDENTS.length}명 · ${GRADE_QUESTIONS.length}문항 · 35점`}
                        footer={<Button onClick={() => setGradeOpen(false)}>닫기</Button>}
                    >
                        <Tabs
                            idBase={gradeTabsId}
                            items={GRADE_STUDENTS.map((s) => ({
                                ...s,
                                count: Object.keys(grades).filter((k) => k.startsWith(`${s.id}-`)).length || undefined,
                            }))}
                            value={gradeStudent}
                            onChange={setGradeStudent}
                            ariaLabel="수강생"
                        />
                        <TabPanel idBase={gradeTabsId} tabId={gradeStudent}>
                            <p className="field-hint" style={{ marginBottom: "12px" }}>
                                채점 {gradedCount} / {GRADE_QUESTIONS.length}문항 (탭의 숫자 = 채점한 문항 수)
                            </p>
                            {GRADE_QUESTIONS.map((q) => {
                                const key = `${gradeStudent}-${q.id}`;
                                const grade = GRADES.find((g) => g.value === grades[key]);
                                const studentName = GRADE_STUDENTS.find((s) => s.id === gradeStudent).label;
                                return (
                                    <article key={q.id} className="question">
                                        <header className="question-head">
                                            <span className="question-no">{q.no}</span>
                                            <h4 className="question-title">{q.title}</h4>
                                            <span className="question-score">
                                                {q.type} · {q.point}점
                                            </span>
                                        </header>
                                        {q.model && (
                                            <div className="answer-box answer-box-model">
                                                <span className="answer-box-label">모범 답안</span>
                                                {q.model}
                                            </div>
                                        )}
                                        {q.answer ? (
                                            <div className={`answer-box ${q.type === "코드작성" ? "answer-box-code" : ""}`}>
                                                <span className="answer-box-label">
                                                    {studentName} 답안 {grade && <Badge tone={grade.tone}>{grade.label}</Badge>}
                                                </span>
                                                {q.answer}
                                            </div>
                                        ) : (
                                            <div className="answer-box answer-box-empty">제출한 답안이 없습니다.</div>
                                        )}
                                        <div className="btn-group" role="group" aria-label={`${q.no}번 채점`}>
                                            {GRADES.map((g) => (
                                                <Button
                                                    key={g.value}
                                                    size="sm"
                                                    disabled={!q.answer}
                                                    aria-pressed={grades[key] === g.value}
                                                    onClick={() => setGrades((prev) => ({ ...prev, [key]: g.value }))}
                                                >
                                                    {g.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </article>
                                );
                            })}
                        </TabPanel>
                    </Modal>
                </Variant>
            </Variants>

            <GroupTitle>화면 예시: 과제</GroupTitle>
            <Variants wide>
                <Variant
                    name="과제 상세 (보기 ↔ 수정 · 본문 | 댓글 · 제출 현황)"
                    source="PageHeader · layout-split · Panel · Comment · Callout"
                    note={"HomeworkItem(인라인 스타일 65% | 30%, 스타일 없는 수정 · 삭제 버튼)의 표준.\n[수정] → 마감일 · 본문이 입력 칸으로 바뀌고 머리 버튼이 [취소 · 저장]으로. 고친 채로 취소하면 확인 창.\n마감이 지나면 [수정] · 댓글 입력 대신 안내 (아래 스위치로 확인)"}
                    block
                >
                    <div style={{ marginBottom: "12px" }}>
                        <Switch checked={deadlinePassed} onChange={setDeadlinePassed}>
                            마감 지남 (예시 전환)
                        </Switch>
                    </div>
                    <PageHeader
                        crumbs={[{ title: "풀스택 개발자 과정 28기", to: "/sample" }, { title: "과제", to: "/sample" }, { title: HOMEWORK.subject }]}
                        title={HOMEWORK.subject}
                        description={
                            editing ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                    제출 마감
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        style={{ width: "auto" }}
                                        aria-label="제출 마감일"
                                        value={draftEndDate}
                                        onChange={(e) => setDraftEndDate(e.target.value)}
                                    />
                                </span>
                            ) : (
                                <>
                                    제출 마감 {hwEndDate} {deadlinePassed ? <Badge tone="danger">마감</Badge> : <Badge tone="warning">D-4</Badge>}
                                </>
                            )
                        }
                        actions={
                            editing ? (
                                <>
                                    <Button onClick={cancelEdit} disabled={hwSaving}>
                                        취소
                                    </Button>
                                    <Button variant="primary" loading={hwSaving} disabled={!dirty} onClick={saveEdit}>
                                        {hwSaving ? "저장 중..." : "저장"}
                                    </Button>
                                </>
                            ) : (
                                !deadlinePassed && (
                                    <>
                                        <Button icon={icons.edit} onClick={startEdit}>
                                            수정
                                        </Button>
                                        <Button variant="danger" icon={icons.delete} onClick={deleteHomework}>
                                            삭제
                                        </Button>
                                    </>
                                )
                            )
                        }
                    />
                    <div className="toolbar" style={{ marginBottom: "16px", alignItems: "center" }}>
                        <span>
                            <strong>{NOT_SUBMITTED.length}명 미제출</strong>
                            <span className="field-hint"> · {NOT_SUBMITTED.join(", ")}</span>
                        </span>
                        <div className="btn-group" style={{ alignItems: "center" }}>
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: "72px" }}
                                min={1}
                                max={SUBMITTED.length}
                                aria-label="뽑을 인원"
                                value={pickCount}
                                onChange={(e) => setPickCount(e.target.value)}
                            />
                            <Button size="sm" onClick={pickRandom}>
                                제출자 랜덤 뽑기
                            </Button>
                            {pickedNames.map((name) => (
                                <span key={name} className="tag">
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="layout-split" style={{ "--layout-aside-width": "360px" }}>
                        <Panel title="과제 내용">
                            {editing ? (
                                <textarea
                                    className="form-control"
                                    aria-label="과제 내용"
                                    style={{ minHeight: "240px" }}
                                    value={draftContent}
                                    onChange={(e) => setDraftContent(e.target.value)}
                                />
                            ) : (
                                <p className="card-body" style={{ whiteSpace: "pre-wrap", minHeight: "240px" }}>
                                    {hwContent}
                                </p>
                            )}
                        </Panel>
                        <Panel
                            title="제출 (댓글)"
                            subtitle={`${SUBMITTED.length}건`}
                            actions={<Button size="sm" icon={icons.refresh} aria-label="댓글 새로고침" />}
                            footer={
                                deadlinePassed ? (
                                    <div style={{ width: "100%" }}>
                                        <Callout tone="warning">과제 마감일이 지났습니다. 더 이상 제출할 수 없습니다.</Callout>
                                    </div>
                                ) : (
                                    <div className="form-stack" style={{ gap: "8px", width: "100%" }}>
                                        <textarea
                                            className="form-control"
                                            aria-label="제출 내용"
                                            placeholder="제출 내용 · 링크를 입력하세요."
                                            style={{ minHeight: "64px" }}
                                            value={reply}
                                            onChange={(e) => setReply(e.target.value)}
                                        />
                                        <div className="btn-group btn-group-end">
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                disabled={!reply.trim()}
                                                onClick={() => {
                                                    toast.success("제출했습니다. (예시)");
                                                    setReply("");
                                                }}
                                            >
                                                제출
                                            </Button>
                                        </div>
                                    </div>
                                )
                            }
                        >
                            <ul className="comment-list" style={{ maxHeight: "220px", overflowY: "auto" }}>
                                <Comment author="홍길동" time="2026-11-15 21:04" body="github.com/hong/week1 제출합니다." />
                                <Comment author="김철수" time="2026-11-16 09:12" body="캡처 첨부했습니다." />
                                <Comment author="이영희" time="2026-11-16 10:30" body="원래 배열을 복사한 뒤 뒤집었습니다." />
                            </ul>
                        </Panel>
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>화면 예시: 설문</GroupTitle>
            <Variants wide>
                <Variant
                    name="설문 문항 편집기 (편집 | 미리 보기)"
                    source="Tabs · Panel · SelectBox · ChoiceGroup · ListEditor"
                    note={"Survey(li 탭 · 회색 탭 바 · 인라인 입력 + 삭제/추가 버튼 · 스타일 없는 미리 보기)의 표준.\n사전 / 사후는 탭, 문항마다 카드: 질문 · 답하는 방식(세그먼트) · 보기(ListEditor). 오른쪽 미리 보기가 바로 따라 바뀜"}
                    block
                >
                    <Tabs
                        idBase={surveyGroupId}
                        items={[
                            { id: "pre", label: "사전 설문", count: surveys.length },
                            { id: "post", label: "사후 설문", count: 0 },
                        ]}
                        value={surveyGroup}
                        onChange={setSurveyGroup}
                        ariaLabel="설문 종류"
                    />
                    <TabPanel idBase={surveyGroupId} tabId={surveyGroup}>
                        <div className="layout-split" style={{ "--layout-aside-width": "340px" }}>
                            <div className="form-stack">
                                {surveys.map((survey, index) => (
                                    <Panel
                                        key={survey.id}
                                        title={`문항 ${index + 1}`}
                                        actions={
                                            <Button size="sm" variant="danger" icon={icons.delete} onClick={() => removeSurvey(survey, index)}>
                                                삭제
                                            </Button>
                                        }
                                    >
                                        <div className="form-stack" style={{ gap: "12px" }}>
                                            <Field label="질문" htmlFor={`${survey.id}-subject`} required>
                                                <input
                                                    id={`${survey.id}-subject`}
                                                    className="form-control"
                                                    placeholder="질문을 입력하세요."
                                                    value={survey.subject}
                                                    onChange={(e) => updateSurvey(survey.id, { subject: e.target.value })}
                                                />
                                            </Field>
                                            <div className="field">
                                                <span className="field-label">답하는 방식</span>
                                                <ChoiceGroup
                                                    variant="segmented"
                                                    name={`${survey.id}-type`}
                                                    legend={`문항 ${index + 1} 답하는 방식`}
                                                    options={SURVEY_TYPES}
                                                    value={survey.type}
                                                    onChange={(type) =>
                                                        updateSurvey(survey.id, {
                                                            type,
                                                            items: type !== "text" && survey.items.length < 2 ? [newListItem(), newListItem()] : survey.items,
                                                        })
                                                    }
                                                />
                                            </div>
                                            {survey.type !== "text" && (
                                                <div className="field">
                                                    <span className="field-label">보기</span>
                                                    <ListEditor
                                                        label={`문항 ${index + 1} 보기`}
                                                        items={survey.items}
                                                        onChange={(items) => updateSurvey(survey.id, { items })}
                                                        min={2}
                                                        max={8}
                                                        placeholder="보기 내용"
                                                        addLabel="보기 추가"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </Panel>
                                ))}
                                <Button
                                    icon={icons.add}
                                    onClick={() => {
                                        const survey = newSurvey(nextSurveyNo++);
                                        setSurveys((prev) => [...prev, survey]);
                                    }}
                                    disabled={surveyGroup !== "pre"}
                                >
                                    문항 추가
                                </Button>
                            </div>
                            <Panel title="미리 보기" subtitle="수강생 화면">
                                <div className="form-stack">
                                    {surveys.map((survey, index) => (
                                        <fieldset key={survey.id} style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }}>
                                            <legend className="field-label" style={{ padding: 0, marginBottom: "8px" }}>
                                                {index + 1}. {survey.subject || <span className="field-hint">(질문 없음)</span>}
                                            </legend>
                                            {survey.type === "text" ? (
                                                <textarea className="form-control" aria-label={`${index + 1}번 답`} style={{ minHeight: "64px" }} />
                                            ) : (
                                                <div className="form-check-group" style={{ flexDirection: "column", gap: "6px" }}>
                                                    {survey.items.map((item) => (
                                                        <label key={item.id} className="form-check">
                                                            <input type={survey.type === "radio" ? "radio" : "checkbox"} name={`preview-${survey.id}`} />
                                                            {item.value || <span className="field-hint">(빈 보기)</span>}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </fieldset>
                                    ))}
                                </div>
                            </Panel>
                        </div>
                    </TabPanel>
                </Variant>
            </Variants>

            <GroupTitle>팝업 창 화면</GroupTitle>
            <Variants wide>
                <Variant
                    name="popup-page (사이드바 없는 화면 틀)"
                    source="styles/nav.css"
                    note={"HomeWorkList가 window.open으로 연 /popup/homework처럼 사이드바 없이 뜨는 화면의 틀. 머리(제목 + 버튼 · 닫기)는 위에 붙고 본문만 스크롤.\n먼저 모달(Modal lg) · 같은 창의 상세 화면으로 될지 검토 (팝업은 차단 · 권한 조회 · 뒤로 가기 문제가 있음)"}
                    block
                    code={`
<div className="popup-page">
  <header className="popup-header">
    <h1 className="popup-title">1주차 과제</h1>
    <div className="popup-actions"><Button onClick={() => window.close()}>닫기</Button></div>
  </header>
  <main className="popup-body">…</main>
</div>`}
                >
                    <div style={{ height: "260px", overflow: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
                        <div className="popup-page" style={{ minHeight: "100%" }}>
                            <header className="popup-header">
                                <h1 className="popup-title">{HOMEWORK.subject}</h1>
                                <div className="popup-actions">
                                    <Button size="sm" icon={icons.refresh} aria-label="새로고침" />
                                    <Button size="sm" onClick={() => toast.show("팝업이면 window.close()로 닫습니다. (예시)")}>
                                        닫기
                                    </Button>
                                </div>
                            </header>
                            <main className="popup-body">
                                <Table
                                    ariaLabel="제출 현황 (팝업 예시)"
                                    size="sm"
                                    columns={[
                                        { key: "name", title: "이름" },
                                        { key: "state", title: "제출", width: "30%", align: "center", render: (r) => <Badge tone={r.done ? "success" : "neutral"}>{r.done ? "제출" : "미제출"}</Badge> },
                                    ]}
                                    rows={[...SUBMITTED, ...NOT_SUBMITTED].map((name) => ({ id: name, name, done: SUBMITTED.includes(name) }))}
                                />
                            </main>
                        </div>
                    </div>
                </Variant>
            </Variants>
        </div>
    );
};
