import { useId, useMemo, useState } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Badge from "../../common/ui/Badge.jsx";
import Field from "../../common/ui/Field.jsx";
import Table from "../../common/ui/Table.jsx";
import Pagination from "../../common/ui/Pagination.jsx";
import { Tabs, TabPanel } from "../../common/ui/Tabs.jsx";
import Panel from "../../common/ui/Panel.jsx";
import StatCard from "../../common/ui/StatCard.jsx";
import Callout from "../../common/ui/Callout.jsx";
import StatusBox from "../../common/ui/StatusBox.jsx";
import { useToast, useConfirm } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons.js";
import SelectBox from "../../common/ui/SelectBox.jsx";
import Comment from "../../common/ui/Comment.jsx";
import PageHeader from "../../common/ui/PageHeader.jsx";
import Progress from "../../common/ui/Progress.jsx";
import FilePicker, { FileList } from "../../common/ui/FilePicker.jsx";
import Modal from "../../common/ui/Modal.jsx";
import Switch from "../../common/ui/Switch.jsx";
import ChoiceGroup from "../../common/ui/ChoiceGroup.jsx";
import TransferList from "../../common/ui/TransferList.jsx";
import ListEditor from "../../common/ui/ListEditor.jsx";
import QuestionBlock from "../../common/ui/QuestionBlock.jsx";
import { newListItem } from "../../common/ui/listEditorItem.js";
import { ScreenSystemCatalog } from "./ScreenSystemCatalog.jsx";
import { ScreenClassroomCatalog, ScreenExamTakeCatalog, ScreenSurveyResultCatalog } from "./ScreenStudyCatalog.jsx";
import { ScreenMyCatalog } from "./ScreenMyCatalog.jsx";

/*
 * 표준 UI: 부품을 조합한 화면 예시.
 * 스타일 원본은 src/styles/*.css의 전역 클래스, React 컴포넌트는 common/ui/. 가이드: frontend/docs/ui-style-guide.md 8장
 */

/* ───── 예시 데이터 ───── */
const NAMES = ["홍길동", "김철수", "이영희", "박민수", "최지우", "정해인", "강다니엘", "윤아름", "임수정", "한지민", "오세훈", "서지수"];

const ROLES = ["학생", "학생", "학생", "강사", "관리자"];

const MEMBERS = Array.from({ length: 47 }, (_, i) => ({
    id: `user${String(i + 1).padStart(2, "0")}`,
    name: NAMES[i % NAMES.length],
    role: ROLES[i % ROLES.length],
    score: 55 + ((i * 37) % 45),
    joined: `2026-${String((i % 9) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
    locked: i % 11 === 4,
}));

const PAGE_SIZE = 8;

const sortRows = (rows, sort) => {
    if (!sort) return rows;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => (a[sort.key] > b[sort.key] ? dir : a[sort.key] < b[sort.key] ? -dir : 0));
};

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
    { id: "q1", question: "Java의 기본형이 아닌 것은?", answerType: "객관식 (하나)", pointAlloc: 5 },
    { id: "q2", question: "JVM이 하는 일을 설명하세요.", answerType: "주관식", pointAlloc: 10 },
    { id: "q3", question: "String은 불변 객체이다.", answerType: "O/X", pointAlloc: 5 },
    { id: "q4", question: "배열을 뒤집는 메서드를 작성하세요.", answerType: "코드 작성", pointAlloc: 20 },
    { id: "q5", question: "접근 제한자를 모두 고르세요.", answerType: "객관식 (여러 개)", pointAlloc: 10 },
    { id: "q6", question: "오버로딩과 오버라이딩의 차이는?", answerType: "주관식", pointAlloc: 10 },
    { id: "q7", question: "인터페이스는 다중 구현이 가능하다.", answerType: "O/X", pointAlloc: 5 },
];

const GRADE_STUDENTS = ["홍길동", "김철수", "이영희", "박민수", "최지우", "정해인", "윤아름", "임수정", "한지민", "오세훈", "서지수", "강다니엘"].map(
    (name, i) => ({ id: `s${i + 1}`, label: name }),
);

const GRADE_QUESTIONS = [
    { id: "g1", no: 1, title: "String은 불변 객체이다.", type: "O/X", point: 5, model: "O", answer: "O" },
    { id: "g2", no: 2, title: "JVM이 하는 일을 설명하세요.", type: "주관식", point: 10, model: "바이트코드를 기계어로 바꿔 실행하고 메모리(GC)를 관리한다.", answer: "자바 코드를 실행해 준다." },
    { id: "g3", no: 3, title: "배열을 뒤집는 메서드를 작성하세요.", type: "코드 작성", point: 20, model: "", answer: "" },
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

const ListDetailScreen = () => {
    /* 표 */
    const [sort] = useState({ key: "joined", direction: "desc" }); // 이 예시는 정렬을 바꾸지 않음
    const [page, setPage] = useState(0);
    const [selectedId, setSelectedId] = useState("user01");
    const sorted = useMemo(() => sortRows(MEMBERS, sort), [sort]);
    const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
    const selected = MEMBERS.find((m) => m.id === selectedId);

    const memberColumns = [
        { key: "id", title: "아이디", width: "18%", mono: true, sortable: true },
        { key: "name", title: "이름", sortable: true },
        { key: "role", title: "역할", width: "14%" },
        { key: "score", title: "평균", width: "12%", align: "num", sortable: true, render: (r) => `${r.score}점` },
        {
            key: "status",
            title: "상태",
            width: "14%",
            align: "center",
            render: (r) => (r.locked ? <Badge tone="danger">잠김</Badge> : <Badge tone="success">정상</Badge>),
        },
        { key: "joined", title: "가입일", width: "16%", sortable: true },
    ];

    return (
        <>
            <GroupTitle>화면 예시: 목록 | 상세</GroupTitle>
            <Variants wide>
                <Variant
                    name="toolbar + layout-split (Table · Pagination | Panel)"
                    source="styles/panel.css (MemberManagement 화면 구조)"
                    note="화면 하나를 표준 부품만으로 만든 예. 위 표와 선택 상태를 같이 씀"
                    block
                    code={`
<div className="form-stack">
  <div className="toolbar">
    <div className="form-row">...검색 필드 · 버튼...</div>
    <Button variant="primary" icon={icons.add}>회원 등록</Button>
  </div>
  <div className="layout-split">
    <div><Table ... /><div className="table-footer">...</div></div>
    <Panel title={selected.name} ...>...</Panel>
  </div>
</div>`}
                >
                    <div className="form-stack">
                        <div className="toolbar">
                            <div className="form-row">
                                <Field label="검색 조건" htmlFor="std-split-type">
                                    <select id="std-split-type" className="form-control">
                                        <option>이름</option>
                                        <option>아이디</option>
                                    </select>
                                </Field>
                                <Field label="검색어" htmlFor="std-split-q">
                                    <input id="std-split-q" type="search" className="form-control" placeholder="검색어" />
                                </Field>
                                <div className="btn-group">
                                    <Button>검색</Button>
                                    <Button>초기화</Button>
                                </div>
                            </div>
                            <Button variant="primary" icon={icons.add}>회원 등록</Button>
                        </div>
                        <div className="layout-split">
                            <div>
                                <Table
                                    ariaLabel="회원 목록 (조합 예시)"
                                    size="sm"
                                    columns={memberColumns.filter((c) => ["id", "name", "role", "status"].includes(c.key))}
                                    rows={pageRows}
                                    selectedKey={selectedId}
                                    onRowClick={(row) => setSelectedId(row.id)}
                                />
                                <div className="table-footer">
                                    <span>전체 {MEMBERS.length}건</span>
                                    <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                                </div>
                            </div>
                            {selected ? (
                                <Panel
                                    title={selected.name}
                                    badge={selected.locked ? <Badge tone="danger">잠김</Badge> : <Badge tone="success">정상</Badge>}
                                    footer={
                                        <>
                                            <Button variant="danger" className="btn-start">{selected.locked ? "잠금 해제" : "잠금"}</Button>
                                            <Button variant="primary">저장</Button>
                                        </>
                                    }
                                >
                                    <dl className="desc-list" style={{ "--desc-label-width": "72px" }}>
                                        <dt>아이디</dt>
                                        <dd className="cell-mono">{selected.id}</dd>
                                        <dt>역할</dt>
                                        <dd>{selected.role}</dd>
                                        <dt>평균</dt>
                                        <dd>{selected.score}점</dd>
                                        <dt>가입일</dt>
                                        <dd>{selected.joined}</dd>
                                    </dl>
                                </Panel>
                            ) : (
                                <StatusBox type="empty" title="회원을 고르세요." />
                            )}
                        </div>
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const DetailScreens = () => {
    const toast = useToast();

    return (
        <>
            <GroupTitle>화면 예시: 상세 · 대시보드 · 오류 화면</GroupTitle>
            <Variants wide>
                <Variant
                    name="상세 화면 (PageHeader + 메타 + 본문 + 첨부)"
                    source="PageHeader · Panel · FileList · Comment"
                    note="MyCourseData 상세(제목 + 작업 버튼 · 메타 12px · 본문 · 첨부 칩)를 표준 부품으로 만든 예시"
                    block
                >
                    <PageHeader
                        crumbs={[{ title: "내 강의실" }, { title: "자료실", to: "/sample" }, { title: "1주차 강의자료" }]}
                        title="1주차 강의자료"
                        actions={
                            <>
                                <Button icon={icons.edit}>수정</Button>
                                <Button variant="danger" icon={icons.delete}>
                                    삭제
                                </Button>
                            </>
                        }
                    />
                    <Panel
                        title="Java 기초: 변수와 자료형"
                        badge={<span className="tag">강의자료</span>}
                        footer={<Button>목록으로</Button>}
                    >
                        <p className="card-meta" style={{ marginBottom: "12px" }}>
                            김강사 · 2026-03-02 09:00 · 조회 42
                        </p>
                        <p className="card-body" style={{ whiteSpace: "pre-line", marginBottom: "16px" }}>
                            {"1주차 수업 자료입니다.\n실습 예제는 압축 파일 안에 있습니다. 수업 전에 미리 받아 두세요."}
                        </p>
                        <FileList
                            files={[
                                { key: "a1", name: "1주차_강의자료.pdf", size: 2_411_520, href: "#" },
                                { key: "a2", name: "실습_예제코드.zip", size: 845_312, href: "#" },
                            ]}
                        />
                    </Panel>
                </Variant>

                <Variant
                    name="대시보드 (StatCard · 진행 카드 · 패널)"
                    source="StatCard · card-grid · Progress · Panel"
                    note="main/Main 대시보드 카드를 표준 부품으로 만든 예시. 맨 위 수치 → 과정 진행 → 최근 목록 순"
                    block
                >
                    <div className="form-stack">
                        <div className="card-grid">
                            <StatCard label="수강 중 과정" value={2} unit="개" />
                            <StatCard label="평균 점수" value={86.5} unit="점" hint="지난달보다 +3.2" trend="up" />
                            <StatCard label="출석률" value={94} unit="%" hint="지각 2회" trend="down" />
                            <StatCard label="남은 과제" value={3} unit="건" hint="가장 빠른 마감: 금요일" />
                        </div>
                        <div className="card-grid">
                            <div className="card">
                                <div className="card-header">
                                    <strong className="card-title">풀스택 개발자 과정</strong>
                                    <Badge tone="info">진행 중</Badge>
                                </div>
                                <p className="card-meta">2026-03-02 ~ 2026-08-28</p>
                                <Progress label="풀스택 과정 진행" value={52} max={120} showValue />
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <strong className="card-title">데이터 분석 과정</strong>
                                    <Badge tone="warning">마감 임박</Badge>
                                </div>
                                <p className="card-meta">2026-06-01 ~ 2026-11-20</p>
                                <Progress label="데이터 분석 과정 진행" value={96} tone="warning" showValue />
                            </div>
                        </div>
                        <Panel title="최근 공지" flush>
                            <ul className="list-group">
                                {["11월 시험 일정 안내", "실습실 사용 시간 변경", "수료 기준 안내"].map((t, i) => (
                                    <li key={t}>
                                        <button type="button" className="list-item">
                                            {t}
                                            <span className="list-item-end">2026-11-{String(14 - i * 3).padStart(2, "0")}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    </div>
                </Variant>

                <Variant
                    name='오류 화면 (StatusBox size="lg")'
                    source="styles/status.css · common/ui/StatusBox.jsx"
                    note={'common/error 404 · 라우트 오류 상자의 표준. type="notFound"는 큰 "404"가 기본.\n오류는 code="500" + detail(개발 환경에서만 상세) + 다시 시도'}
                    block
                    code={`
<StatusBox type="notFound" size="lg" detail="주소가 바뀌었거나 삭제된 화면입니다."
           actions={<><Button onClick={() => navigate(-1)}>뒤로</Button><Button variant="primary">홈으로</Button></>} />
<StatusBox type="error" size="lg" code="500" title="화면을 그리지 못했습니다." onRetry={reload} />`}
                >
                    <div className="layout-split" style={{ "--layout-aside-width": "1fr" }}>
                        <StatusBox
                            type="notFound"
                            size="lg"
                            detail="주소가 바뀌었거나 삭제된 화면입니다."
                            actions={
                                <>
                                    <Button>뒤로</Button>
                                    <Button variant="primary" icon={icons.home}>
                                        홈으로
                                    </Button>
                                </>
                            }
                        />
                        <StatusBox
                            type="error"
                            size="lg"
                            code="500"
                            title="화면을 그리지 못했습니다."
                            detail="TypeError: Cannot read properties of undefined (개발 환경에서만 표시)"
                            onRetry={() => toast.show("다시 불러옵니다.")}
                        />
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const CourseScreens = () => {
    const toast = useToast();

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
            toast.success("과정을 등록했습니다.");
        }, 900);
    };

    /* 과정 상세 */
    const courseTabsId = useId();
    const [courseTab, setCourseTab] = useState("0");

    return (
        <>
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
                                    <Button type="submit" variant="primary" loading={courseSaving}>
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
                                        />
                                    </Field>
                                    <Field label="기수" htmlFor="std-course-count" hint="숫자만">
                                        <input id="std-course-count" type="number" min={1} className="form-control" placeholder="28" />
                                    </Field>
                                </div>
                                <div className="form-row">
                                    <Field label="담당 강사" htmlFor="std-course-tutor" required error={tutorError}>
                                        <SelectBox inputId="std-course-tutor" options={TUTORS} value={tutor} onChange={setTutor} isClearable />
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
                        crumbs={[{ title: "과정 관리" }, { title: "과정 목록", to: "/sample" }, { title: "풀스택 개발자 과정 28기" }]}
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
        </>
    );
};

const ExamScreens = () => {
    const toast = useToast();

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

    return (
        <>
            <GroupTitle>화면 예시: 시험</GroupTitle>
            <Variants wide>
                <Variant
                    name="시험 만들기: 문제 고르기"
                    source="Field · form-check(공개) · TransferList"
                    note={"ExamPage 추가 화면(제목 입력 + 공개 체크 + ExamQuestionPicker)의 표준. 고른 문제의 총 배점은 오른쪽 머리에.\n문제 유형은 분류라 tag"}
                    block
                >
                    <Panel
                        title="시험 추가"
                        footer={
                            <>
                                <Button>취소</Button>
                                <Button variant="primary" disabled={!picked.length || !examTitle.trim()} onClick={() => toast.success("시험을 등록했습니다.")}>
                                    시험 등록
                                </Button>
                            </>
                        }
                    >
                        <div className="form-stack">
                            <div className="form-row" style={{ alignItems: "center" }}>
                                <Field label="시험 제목" htmlFor="std-exam-title" required>
                                    <input id="std-exam-title" className="form-control" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
                                </Field>
                                <label className="form-check">
                                    <input type="checkbox" checked={examPublic} onChange={(e) => setExamPublic(e.target.checked)} /> 수강생에게 공개
                                </label>
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
                                            <span className="tag">{q.answerType}</span>
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
                                            <div className={`answer-box ${q.type === "코드 작성" ? "answer-box-code" : ""}`}>
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
        </>
    );
};

/* 문제 은행: 문제 하나 추가 · 수정 (admin/test AddTest · UpdateTest) */
const QB_TYPES = [
    { value: "ANSWER_SELECT", label: "객관식 (하나)" },
    { value: "ANSWER_MULTIPLE", label: "객관식 (여러 개)" },
    { value: "ANSWER_CHECK", label: "O/X" },
    { value: "ANSWER_WRITE", label: "주관식" },
    { value: "ANSWER_CODE", label: "코드 작성" },
];
const QB_CHOICE_TYPES = ["ANSWER_SELECT", "ANSWER_MULTIPLE"];
const QB_MODES = [
    { value: "add", label: "새 문제" },
    { value: "edit", label: "수정 (저장된 문제)" },
];

const emptyQuestion = () => ({
    type: "",
    question: "",
    subQuestion: "",
    point: "4",
    items: [newListItem(), newListItem(), newListItem(), newListItem()],
    correct: [], // 객관식: 정답 줄 id
    ox: "",
});

const savedQuestion = () => {
    const items = [newListItem("public"), newListItem("protected"), newListItem("friend"), newListItem("private")];
    return {
        type: "ANSWER_MULTIPLE",
        question: "Java의 접근 제한자를 모두 고르세요.",
        subQuestion: "",
        point: "3",
        items,
        correct: [items[0].id, items[1].id, items[3].id],
        ox: "",
    };
};

const validateQuestion = (q) => {
    const errors = {};
    if (!q.type) errors.type = "문제 유형을 고르세요.";
    if (!q.question.trim()) errors.question = "문제를 입력하세요.";
    const point = Number(q.point);
    if (!Number.isInteger(point) || point < 1 || point > 4) errors.point = "배점은 1~4점입니다.";
    if (QB_CHOICE_TYPES.includes(q.type)) {
        if (q.items.some((item) => !item.value.trim())) errors.items = "빈 보기가 있습니다. 내용을 쓰거나 줄을 지우세요.";
        else if (q.type === "ANSWER_SELECT" && q.correct.length !== 1) errors.items = "정답 보기 하나를 고르세요 (왼쪽 동그라미).";
        else if (q.type === "ANSWER_MULTIPLE" && q.correct.length < 2) errors.items = "정답 보기를 2개 이상 고르세요 (왼쪽 네모).";
    }
    if (q.type === "ANSWER_CHECK" && !q.ox) errors.ox = "정답(O 또는 X)을 고르세요.";
    return errors;
};

const QuestionBankScreen = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const formId = useId();
    const [mode, setMode] = useState("add");
    const [q, setQ] = useState(emptyQuestion);
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);

    const update = (patch) => setQ((prev) => ({ ...prev, ...patch }));
    const errors = submitted ? validateQuestion(q) : {};
    const isChoice = QB_CHOICE_TYPES.includes(q.type);
    const isMultiple = q.type === "ANSWER_MULTIPLE";
    const isCode = q.type === "ANSWER_CODE";
    const editing = mode === "edit";

    const changeMode = (next) => {
        setMode(next);
        setQ(next === "edit" ? savedQuestion() : emptyQuestion());
        setSubmitted(false);
    };

    const changeType = (type) => {
        // 하나 ↔ 여러 개를 바꾸면 정답 표시는 다시 고름. 보기 내용은 그대로
        const keepCorrect = type === "ANSWER_MULTIPLE" && q.type === "ANSWER_SELECT";
        update({ type, correct: keepCorrect ? q.correct : [], ox: "" });
    };

    const changeItems = (items) => {
        const ids = items.map((item) => item.id);
        update({ items, correct: q.correct.filter((id) => ids.includes(id)) });
    };

    const toggleCorrect = (id) => {
        if (!isMultiple) return update({ correct: [id] });
        update({ correct: q.correct.includes(id) ? q.correct.filter((c) => c !== id) : [...q.correct, id] });
    };

    const submit = (event) => {
        event.preventDefault();
        setSubmitted(true);
        if (Object.keys(validateQuestion(q)).length) return;
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            setSubmitted(false);
            toast.success(editing ? "문제를 저장했습니다." : "문제를 등록했습니다.");
            if (!editing) setQ(emptyQuestion());
        }, 900);
    };

    const remove = async () => {
        const ok = await confirm({ message: "이 문제를 삭제할까요?\n시험에 이미 쓰인 문제는 시험에서도 빠집니다.", confirmText: "삭제", danger: true });
        if (ok) toast.success("삭제했습니다.");
    };

    const previewOptions = isChoice
        ? q.items.map((item, i) => ({ value: item.id, label: item.value || `보기 ${i + 1}` }))
        : q.type === "ANSWER_CHECK"
          ? [
                { value: "O", label: "O" },
                { value: "X", label: "X" },
            ]
          : undefined;
    const previewAnswer = isChoice ? q.correct : q.ox;

    return (
        <>
            <GroupTitle>화면 예시: 문제 은행 (추가 · 수정)</GroupTitle>
            <Variants wide>
                <Variant
                    name="문제 추가 · 수정 폼 (+ 미리 보기)"
                    source="Panel · Field · ChoiceGroup · ListEditor(renderMarker) · Callout · QuestionBlock"
                    note={
                        "AddTest · UpdateTest(유형 라디오 + 이름 없는 textarea 2개 + 정답 번호 · 보기 개수 숫자 칸 + 보기 5칸)를 표준 부품으로. 추가와 수정은 같은 폼 (수정은 값이 채워져 열림).\n" +
                        "보기 개수 · 정답 번호 칸을 없애고, 보기 줄을 더하고 빼며 줄 앞 동그라미(하나) · 네모(여러 개)로 정답을 바로 표시. 유형에 따라 보기 · O/X 정답 · 채점 안내만 바뀜.\n" +
                        "빈 채로 [등록]을 누르면 오류. 오른쪽은 수강생에게 보이는 모양 (정답은 초록)"
                    }
                    block
                >
                    <div className="form-stack" style={{ width: "100%" }}>
                        <ChoiceGroup variant="segmented" name={`${formId}-mode`} legend="예시 상태" options={QB_MODES} value={mode} onChange={changeMode} />
                        <div className="layout-split" style={{ "--layout-aside-width": "360px" }}>
                            <form onSubmit={submit} noValidate>
                                <Panel
                                    title={editing ? "문제 수정" : "문제 추가"}
                                    badge={<Badge>JAVA</Badge>}
                                    footer={
                                        <>
                                            {editing && (
                                                <Button variant="danger" icon={icons.delete} onClick={remove} className="btn-start">
                                                    삭제
                                                </Button>
                                            )}
                                            <Button onClick={() => changeMode(mode)}>취소</Button>
                                            <Button type="submit" variant="primary" loading={saving}>
                                                {saving ? (editing ? "저장 중..." : "등록 중...") : editing ? "저장" : "등록"}
                                            </Button>
                                        </>
                                    }
                                >
                                    <div className="form-stack">
                                        <Field group label="문제 유형" required error={errors.type}>
                                            <ChoiceGroup name={`${formId}-type`} options={QB_TYPES} value={q.type} onChange={changeType} />
                                        </Field>
                                        <Field label="문제" htmlFor={`${formId}-question`} required error={errors.question}>
                                            <textarea
                                                id={`${formId}-question`}
                                                className="form-control"
                                                rows={2}
                                                placeholder="예: Java의 기본형이 아닌 것은?"
                                                value={q.question}
                                                onChange={(e) => update({ question: e.target.value })}
                                            />
                                        </Field>
                                        <Field
                                            label={isCode ? "부연 설명 · 예시 코드" : "부연 설명"}
                                            htmlFor={`${formId}-sub`}
                                            hint="선택. 조건 · 예시 코드처럼 문제 아래 회색 상자에 보이는 내용 (줄바꿈 유지)"
                                        >
                                            <textarea
                                                id={`${formId}-sub`}
                                                className={`form-control${isCode ? " form-control-mono" : ""}`}
                                                rows={isCode ? 5 : 3}
                                                value={q.subQuestion}
                                                onChange={(e) => update({ subQuestion: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="배점" htmlFor={`${formId}-point`} required error={errors.point} hint="1~4점">
                                            <input
                                                id={`${formId}-point`}
                                                type="number"
                                                min={1}
                                                max={4}
                                                className="form-control"
                                                style={{ width: "120px" }}
                                                value={q.point}
                                                onChange={(e) => update({ point: e.target.value })}
                                            />
                                        </Field>

                                        {isChoice && (
                                            <Field
                                                group
                                                label="보기 · 정답"
                                                required
                                                error={errors.items}
                                                hint={isMultiple ? "2~5개. 정답 보기를 왼쪽 네모로 모두 표시 (2개 이상)" : "2~5개. 정답 보기 하나를 왼쪽 동그라미로 표시"}
                                            >
                                                <ListEditor
                                                    label="보기"
                                                    items={q.items}
                                                    onChange={changeItems}
                                                    min={2}
                                                    max={5}
                                                    addLabel="보기 추가"
                                                    placeholder="보기 내용"
                                                    renderMarker={(item, index) => (
                                                        <label className="list-editor-mark" title="정답으로 표시">
                                                            <input
                                                                type={isMultiple ? "checkbox" : "radio"}
                                                                name={`${formId}-correct`}
                                                                checked={q.correct.includes(item.id)}
                                                                onChange={() => toggleCorrect(item.id)}
                                                                aria-label={`보기 ${index + 1} 정답`}
                                                            />
                                                        </label>
                                                    )}
                                                />
                                            </Field>
                                        )}
                                        {q.type === "ANSWER_CHECK" && (
                                            <Field group label="정답" required error={errors.ox}>
                                                <ChoiceGroup
                                                    variant="segmented"
                                                    name={`${formId}-ox`}
                                                    options={[
                                                        { value: "O", label: "O" },
                                                        { value: "X", label: "X" },
                                                    ]}
                                                    value={q.ox}
                                                    onChange={(ox) => update({ ox })}
                                                />
                                            </Field>
                                        )}
                                        {(q.type === "ANSWER_WRITE" || isCode) && (
                                            <Callout tone="info">정답을 따로 적지 않습니다. 수강생이 제출한 답안을 강사가 채점 화면에서 채점합니다.</Callout>
                                        )}
                                    </div>
                                </Panel>
                            </form>

                            <Panel title="미리 보기" subtitle="수강생 화면">
                                {q.type ? (
                                    <QuestionBlock
                                        no={1}
                                        title={q.question || "문제를 입력하세요"}
                                        score={Number(q.point) || undefined}
                                        body={!isCode ? q.subQuestion || undefined : undefined}
                                        code={isCode ? q.subQuestion || undefined : undefined}
                                        options={previewOptions}
                                        multiple={isMultiple}
                                        answer={previewAnswer}
                                        showResult={!!previewOptions}
                                    >
                                        {!previewOptions && (
                                            <textarea
                                                className={`form-control${isCode ? " form-control-mono" : ""}`}
                                                rows={3}
                                                disabled
                                                placeholder="수강생 답안 칸"
                                                aria-label="수강생 답안 칸 (미리 보기)"
                                            />
                                        )}
                                    </QuestionBlock>
                                ) : (
                                    <StatusBox type="empty" size="sm" title="문제 유형을 고르면 여기에 보입니다." />
                                )}
                            </Panel>
                        </div>
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const HomeworkScreen = () => {
    const toast = useToast();
    const confirm = useConfirm();

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
            toast.success("과제를 저장했습니다.");
        }, 800);
    };

    const deleteHomework = async () => {
        if (await confirm({ title: "과제 삭제", message: `${HOMEWORK.subject}을(를) 삭제할까요?\n댓글도 함께 지워집니다.`, confirmText: "삭제", danger: true })) {
            toast.success("삭제했습니다.");
        }
    };

    const pickRandom = () => {
        const n = Math.min(Number(pickCount) || 0, SUBMITTED.length);
        setPickedNames([...SUBMITTED].sort(() => Math.random() - 0.5).slice(0, n));
    };

    return (
        <>
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
                    <div className="form-stack">
                        <div className="toolbar" style={{ alignItems: "center" }}>
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
                                        <div className="comment-form">
                                            <textarea
                                                className="form-control"
                                                aria-label="제출 내용"
                                                placeholder="제출 내용 · 링크를 입력하세요."
                                                value={reply}
                                                onChange={(e) => setReply(e.target.value)}
                                            />
                                            <div className="btn-group btn-group-end">
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    disabled={!reply.trim()}
                                                    onClick={() => {
                                                        toast.success("제출했습니다.");
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
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const SurveyScreen = () => {
    const confirm = useConfirm();

    /* 설문 편집기 */
    const surveyGroupId = useId();
    const [surveyGroup, setSurveyGroup] = useState("pre");

    const [surveys, setSurveys] = useState(() => [
        { id: "sv1", subject: "강의 내용에 얼마나 만족하나요?", type: "radio", items: [newListItem("매우 만족"), newListItem("만족"), newListItem("불만족")] },
        { id: "sv2", subject: "더 배우고 싶은 내용을 적어 주세요.", type: "text", items: [] },
    ]);
    const updateSurvey = (id, patch) => setSurveys((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

    const removeSurvey = async (survey, index) => {
        if (await confirm({ message: `${index + 1}번 문항을 삭제할까요?`, confirmText: "삭제", danger: true })) {
            setSurveys((prev) => prev.filter((s) => s.id !== survey.id));
        }
    };

    return (
        <>
            <GroupTitle>화면 예시: 설문 편집기</GroupTitle>
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
                                            <Field group label="답하는 방식">
                                                <ChoiceGroup
                                                    variant="segmented"
                                                    name={`${survey.id}-type`}
                                                    options={SURVEY_TYPES}
                                                    value={survey.type}
                                                    onChange={(type) =>
                                                        updateSurvey(survey.id, {
                                                            type,
                                                            items: type !== "text" && survey.items.length < 2 ? [newListItem(), newListItem()] : survey.items,
                                                        })
                                                    }
                                                />
                                            </Field>
                                            {survey.type !== "text" && (
                                                <Field group label="보기">
                                                    <ListEditor
                                                        label={`문항 ${index + 1} 보기`}
                                                        items={survey.items}
                                                        onChange={(items) => updateSurvey(survey.id, { items })}
                                                        min={2}
                                                        max={8}
                                                        placeholder="보기 내용"
                                                        addLabel="보기 추가"
                                                    />
                                                </Field>
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
        </>
    );
};

export const StandardScreenCatalog = () => (
    <div>
        <p className={styles.standardIntro}>부품을 조합한 화면 예시. 기존 화면(admin/course · test · survey · system, my, login 등)을 표준 부품으로 바꾸면 이런 모양이 됩니다.</p>
        <ListDetailScreen />
        <DetailScreens />
        <CourseScreens />
        <ExamScreens />
        <ScreenExamTakeCatalog />
        <QuestionBankScreen />
        <HomeworkScreen />
        <ScreenClassroomCatalog />
        <SurveyScreen />
        <ScreenSurveyResultCatalog />
        <ScreenSystemCatalog />
        <ScreenMyCatalog />
    </div>
);
