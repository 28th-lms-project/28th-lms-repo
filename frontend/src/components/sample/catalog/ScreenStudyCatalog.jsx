import { useId, useState } from "react";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Badge from "../../common/ui/Badge.jsx";
import Field from "../../common/ui/Field.jsx";
import Panel from "../../common/ui/Panel.jsx";
import Callout from "../../common/ui/Callout.jsx";
import Modal from "../../common/ui/Modal.jsx";
import Table from "../../common/ui/Table.jsx";
import Switch from "../../common/ui/Switch.jsx";
import Progress from "../../common/ui/Progress.jsx";
import SelectBox from "../../common/ui/SelectBox.jsx";
import QuestionBlock from "../../common/ui/QuestionBlock.jsx";
import Comment from "../../common/ui/Comment.jsx";
import StatusBox from "../../common/ui/StatusBox.jsx";
import { Tabs, TabPanel } from "../../common/ui/Tabs.jsx";
import { useConfirm, useToast } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons.js";

/*
 * 표준 UI 화면 예시: 시험 응시 · 문제 은행 목록 · 접속 기록 · 시간표 · 목록 위 추가 폼 · 댓글 수정.
 * 가이드: frontend/docs/ui-style-guide.md 8장 "화면 예시"
 */

/* 유형별 배지 색 (문제 은행 · 시험지에서 같게) */
const TYPE_LABEL = { select: "객관식", multiple: "객관식 (여러 개)", ox: "O/X", write: "주관식", code: "코드 작성" };
const TYPE_TONE = { select: "primary", multiple: "primary", ox: "neutral", write: "info", code: "warning" };

const PAPER = [
    { no: 1, type: "select", title: "Java의 기본형이 아닌 것은?", point: 2, options: ["int", "boolean", "String", "char"], answer: "3" },
    { no: 2, type: "multiple", title: "접근 제한자를 모두 고르세요.", point: 3, options: ["public", "protected", "friend", "private"], answer: ["1", "2", "4"] },
    { no: 3, type: "ox", title: "String은 불변 객체이다.", point: 1, answer: "O" },
    { no: 4, type: "write", title: "JVM이 하는 일을 한 문장으로 쓰세요.", point: 4, model: "바이트코드를 실행하고 메모리(GC)를 관리한다." },
    { no: 5, type: "code", title: "배열을 뒤집는 메서드를 작성하세요.", point: 4, body: "int[] reverse(int[] arr)\n// 원래 배열은 바꾸지 않습니다." },
];
const toOptions = (q) => (q.type === "ox" ? ["O", "X"].map((v) => ({ value: v, label: v })) : q.options?.map((label, i) => ({ value: String(i + 1), label })));
const isAnswered = (v) => (Array.isArray(v) ? v.length > 0 : !!String(v ?? "").trim());

/* ───── 시험 응시 · 시험지 보기 (ExamTakeModal · ExamQuestionViewModal) ───── */
const ExamTakeScreen = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const baseId = useId();
    const [mode, setMode] = useState(null); // take | view
    const [answers, setAnswers] = useState({});
    const [current, setCurrent] = useState(1);
    const done = PAPER.filter((q) => isAnswered(answers[q.no])).length;
    const total = PAPER.reduce((s, q) => s + q.point, 0);

    const go = (no) => {
        setCurrent(no);
        document.getElementById(`${baseId}-q${no}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const submit = async () => {
        const left = PAPER.length - done;
        const message = left ? `답하지 않은 문항이 ${left}개 있습니다. 그래도 제출할까요?\n제출하면 고칠 수 없습니다.` : "제출하면 고칠 수 없습니다. 제출할까요?";
        if (!(await confirm({ title: "답안 제출", message, confirmText: "제출" }))) return;
        setMode(null);
        setAnswers({});
        toast.success("답안을 제출했습니다. (예시)");
    };

    const view = mode === "view";

    return (
        <Variant
            name="시험 응시 (닫기 없음 · 문항 번호 이동 · 답한 수) / 시험지 보기 (정답)"
            source="Modal size=lg dismissible=false · question-nav · Progress · QuestionBlock · answer-box"
            note={
                "ExamTakeModal · ExamQuestionViewModal을 표준으로. 응시는 [제출]로만 닫힘 (X · Esc · 바깥 누르기 없음 → 답이 날아가지 않음). 안 푼 문항이 있으면 개수를 알려 주고 한 번 더 확인.\n" +
                "위의 문항 번호(question-nav-bar > question-nav)는 본문 위에 붙어 스크롤해도 보임. 답한 문항은 색, 누르면 그 문항으로 이동. 바닥에 '답함 n / N' 막대.\n" +
                "유형별 답 칸: 객관식 radio · 여러 개 checkbox · O/X는 두 보기 · 주관식 textarea · 코드는 고정폭 textarea. 시험지 보기(강사)는 같은 모양에 정답 초록 · 모범 답안 상자"
            }
        >
            <div className="form-row">
                <Button variant="primary" onClick={() => setMode("take")}>
                    시험 응시 열기
                </Button>
                <Button onClick={() => setMode("view")}>시험지 보기 (강사)</Button>
            </div>
            <Modal
                open={!!mode}
                onClose={view ? () => setMode(null) : undefined}
                dismissible={view}
                size="lg"
                title="Java 기초 중간 평가"
                summary={`문제 ${PAPER.length}개 · 총 ${total}점`}
                footer={
                    view ? (
                        <Button onClick={() => setMode(null)}>닫기</Button>
                    ) : (
                        <>
                            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                                <span className="field-hint" style={{ whiteSpace: "nowrap" }}>
                                    답함 {done} / {PAPER.length}
                                </span>
                                <Progress value={done} max={PAPER.length} size="sm" label="답한 문항" />
                            </div>
                            <Button variant="primary" onClick={submit}>
                                제출
                            </Button>
                        </>
                    )
                }
            >
                <div className="form-stack">
                    {!view && (
                        <nav className="question-nav-bar" aria-label="문항 이동">
                            <ol className="question-nav">
                                {PAPER.map((q) => (
                                    <li key={q.no}>
                                        <button
                                            type="button"
                                            className={`question-nav-item${isAnswered(answers[q.no]) ? " is-done" : ""}`}
                                            aria-current={current === q.no ? "step" : undefined}
                                            aria-label={`${q.no}번 (${isAnswered(answers[q.no]) ? "답함" : "안 함"})`}
                                            onClick={() => go(q.no)}
                                        >
                                            {q.no}
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    )}
                    {PAPER.map((q) => (
                        <div key={q.no} id={`${baseId}-q${q.no}`} onFocus={() => setCurrent(q.no)} style={{ scrollMarginTop: "72px" }}>
                            <QuestionBlock
                                no={q.no}
                                title={
                                    <>
                                        {q.title} <Badge tone={TYPE_TONE[q.type]}>{TYPE_LABEL[q.type]}</Badge>
                                    </>
                                }
                                score={q.point}
                                code={q.body}
                                options={toOptions(q)}
                                multiple={q.type === "multiple"}
                                value={view ? undefined : answers[q.no] ?? (q.type === "multiple" ? [] : "")}
                                onChange={view ? undefined : (v) => setAnswers((prev) => ({ ...prev, [q.no]: v }))}
                                answer={q.answer}
                                showResult={view && !!toOptions(q)}
                            >
                                {(q.type === "write" || q.type === "code") &&
                                    (view ? (
                                        <div className="answer-box answer-box-model">
                                            <span className="answer-box-label">모범 답안</span>
                                            {q.model ?? "없음 (강사가 채점)"}
                                        </div>
                                    ) : (
                                        <textarea
                                            className={`form-control${q.type === "code" ? " form-control-mono" : ""}`}
                                            rows={q.type === "code" ? 6 : 3}
                                            aria-label={`${q.no}번 답안`}
                                            value={answers[q.no] ?? ""}
                                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.no]: e.target.value }))}
                                        />
                                    ))}
                            </QuestionBlock>
                        </div>
                    ))}
                </div>
            </Modal>
        </Variant>
    );
};

/* ───── 문제 은행 목록 (Test.jsx) ───── */
const BANK = {
    JAVA: [
        { ...PAPER[0], crtDt: "2026-10-02", writer: "김강사", issued: 12, correct: 9 },
        { ...PAPER[1], crtDt: "2026-10-02", writer: "김강사", issued: 8, correct: 3 },
        { ...PAPER[2], crtDt: "2026-10-05", writer: "이강사", issued: 0, correct: 0 },
        { ...PAPER[4], crtDt: "2026-10-09", writer: "김강사", issued: 4, correct: 0 },
    ],
    DATABASE: [],
};
const SUBJECTS = [
    { id: "JAVA", label: "JAVA" },
    { id: "DATABASE", label: "DB" },
];

const QuestionBankListScreen = () => {
    const tabsId = useId();
    const [subject, setSubject] = useState("JAVA");
    const [open, setOpen] = useState([1]); // 문항마다 따로 펼침

    const toggle = (no) => setOpen((prev) => (prev.includes(no) ? prev.filter((n) => n !== no) : [...prev, no]));

    return (
        <Variant
            name="문제 은행 목록 (과목 탭 · 문제 카드 · 문항별 펼치기 · 출제 통계)"
            source="Tabs(count) · card · Badge · QuestionBlock(showResult) · card-meta"
            note={
                "Test(과목 li 탭 + 문제 카드 + 라벨 없는 숫자 3개 + '내용보기')를 표준으로.\n" +
                "통계는 이름을 붙인 한 줄 글자('출제 12회 · 정답률 75%'). StatCard는 너무 커서 목록 카드 안에는 쓰지 않음. 출제 0회는 '아직 안 냄'.\n" +
                "펼침은 문항마다 따로 (지금 Test는 하나를 누르면 전부 열림). 버튼은 aria-expanded. 정답은 초록"
            }
            block
        >
            <div style={{ width: "100%" }}>
                <Tabs
                    idBase={tabsId}
                    items={SUBJECTS.map((s) => ({ ...s, count: BANK[s.id].length }))}
                    value={subject}
                    onChange={setSubject}
                    ariaLabel="과목"
                />
                <TabPanel idBase={tabsId} tabId={subject}>
                    <div className="toolbar" style={{ marginBottom: "12px" }}>
                        <span className="field-hint">{BANK[subject].length}문제</span>
                        <Button variant="primary" icon={icons.add} style={{ marginLeft: "auto" }}>
                            문제 추가
                        </Button>
                    </div>
                    {BANK[subject].length === 0 ? (
                        <StatusBox type="empty" title="이 과목에 등록된 문제가 없습니다." />
                    ) : (
                        <div className="form-stack" style={{ gap: "12px" }}>
                            {BANK[subject].map((q) => {
                                const expanded = open.includes(q.no);
                                const hasDetail = !!toOptions(q) || q.body;
                                return (
                                    <article key={q.no} className="card">
                                        <div className="card-header">
                                            <h3 className="card-title">
                                                <Badge tone={TYPE_TONE[q.type]}>{TYPE_LABEL[q.type]}</Badge> {q.title}
                                            </h3>
                                            <span className="field-hint" style={{ whiteSpace: "nowrap" }}>
                                                {q.point}점
                                            </span>
                                        </div>
                                        <div className="card-meta">
                                            <span>
                                                {q.crtDt} · {q.writer}
                                            </span>
                                            <span>{q.issued ? `출제 ${q.issued}회 · 정답 ${q.correct}회 · 정답률 ${Math.round((q.correct / q.issued) * 100)}%` : "아직 안 냄"}</span>
                                        </div>
                                        <div className="toolbar" style={{ marginTop: "8px" }}>
                                            {hasDetail && (
                                                <Button size="sm" variant="text" aria-expanded={expanded} onClick={() => toggle(q.no)}>
                                                    {expanded ? "보기 · 정답 접기" : "보기 · 정답 펼치기"}
                                                </Button>
                                            )}
                                            <span style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                                                <Button size="sm" icon={icons.edit}>
                                                    수정
                                                </Button>
                                                <Button size="sm" variant="danger" icon={icons.delete}>
                                                    삭제
                                                </Button>
                                            </span>
                                        </div>
                                        {expanded && hasDetail && (
                                            <div style={{ marginTop: "8px" }}>
                                                <QuestionBlock
                                                    no={q.no}
                                                    title="보기 · 정답"
                                                    code={q.body}
                                                    options={toOptions(q)}
                                                    multiple={q.type === "multiple"}
                                                    answer={q.answer}
                                                    showResult={!!toOptions(q)}
                                                />
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </TabPanel>
            </div>
        </Variant>
    );
};

/* ───── 주간 접속 기록 (StudentConnected) ───── */
const WEEKS = [
    { label: "11-09 ~ 11-13", days: ["11-09", "11-10", "11-11", "11-12", "11-13"], today: null },
    { label: "11-16 ~ 11-20", days: ["11-16", "11-17", "11-18", "11-19", "11-20"], today: "11-16", off: { "11-18": "학원 행사" } },
];
const DAY_NAMES = ["월", "화", "수", "목", "금"];
const CONNECT = [
    { id: "stu01", name: "홍길동", times: ["08:52", "08:47", "09:03", "08:55", "08:58", "08:50"] },
    { id: "stu02", name: "김철수", times: ["09:12", null, "08:59", "09:01", "08:57", "09:07"] },
    { id: "stu03", name: "이영희", times: ["08:40", "08:44", "08:41", null, "08:43", null] },
];
const LATE = "09:00";

const ConnectedScreen = () => {
    const [week, setWeek] = useState(1);
    const w = WEEKS[week];
    const offset = week * 5 - 4; // 예시 데이터 자리 맞춤

    const columns = [
        { key: "name", title: "수강생", width: "100px" },
        ...w.days.map((d, i) => {
            const future = w.today && d > w.today;
            const off = w.off?.[d];
            return {
                key: d,
                title: off ? `${d} (${DAY_NAMES[i]}) 쉬는 날` : `${d} (${DAY_NAMES[i]})`,
                align: "center",
                className: d === w.today ? "col-highlight" : off ? "col-off" : undefined,
                render: (r) => {
                    if (off) return <span title={off}>쉼</span>;
                    if (future) return <span className="field-hint">-</span>;
                    const t = r.times[Math.max(0, offset + i)] ?? null;
                    if (!t) return <Badge tone="danger">결석</Badge>;
                    return t > LATE ? <Badge tone="warning">{t} 지각</Badge> : <span className="cell-mono">{t}</span>;
                },
            };
        }),
    ];

    return (
        <Variant
            name="주간 접속 기록 (주 이동 · 오늘 열 · 결석 · 지각)"
            source="toolbar · Button(아이콘) · Table bordered · col-highlight · Badge"
            note={
                "StudentConnected(이번 주 월~금 첫 접속 시각, 없으면 '-')를 표준으로.\n" +
                "위에 [‹ 지난주] 기간 [다음 주 ›] [이번 주]. 칸은 첫 접속 시각(고정폭), 없으면 '결석' 배지, 기준(09:00) 넘으면 '지각' 배지. 아직 안 온 날은 흐린 '-'.\n" +
                "쉬는 날(휴강 · 공휴일)은 머리에 '쉬는 날' + 열 전체 회색(col-off) + 칸은 '쉼'. 결석으로 세지 않음.\n오늘 열은 col-highlight. 다음 주는 오지 않았으므로 비활성"
            }
            block
        >
            <div className="form-stack" style={{ width: "100%" }}>
                <div className="toolbar">
                    <Button size="sm" onClick={() => setWeek(0)} disabled={week === 0} aria-label="지난주">
                        ‹ 지난주
                    </Button>
                    <strong style={{ fontVariantNumeric: "tabular-nums" }}>{w.label}</strong>
                    <Button size="sm" disabled aria-label="다음 주">
                        다음 주 ›
                    </Button>
                    {week !== 1 && (
                        <Button size="sm" variant="text" onClick={() => setWeek(1)}>
                            이번 주
                        </Button>
                    )}
                    <span className="field-hint" style={{ marginLeft: "auto" }}>
                        기준 {LATE} · 결석 = 그날 접속 없음
                    </span>
                </div>
                <Table columns={columns} rows={CONNECT} bordered size="sm" ariaLabel={`접속 기록 ${w.label} (예시)`} />
            </div>
        </Variant>
    );
};

/* ───── 날짜별 시간표: 날짜마다 두 줄 (MyTimetable) ───── */
const SLOTS = [
    { id: "p1", label: "1교시", time: "09:00" },
    { id: "p2", label: "2교시", time: "10:00" },
    { id: "lunch", label: "점심", time: "12:00", break: true },
    { id: "p3", label: "3교시", time: "13:00" },
];
const DAYS = [
    { date: "11-13 (금)", cells: { p1: ["Java", "컬렉션"], p2: ["Java", "스트림"], p3: ["SQL", "JOIN 실습"] } },
    { date: "11-16 (월)", today: true, cells: { p1: ["Spring", "DI · IoC"], p2: ["Spring", "Bean 등록"], p3: ["React", "상태 관리"] } },
    { date: "11-17 (화)", cells: { p1: ["Spring", "AOP"], p2: ["실습", "프로젝트"], p3: ["React", "라우터"] } },
    { date: "11-18 (수)", off: "쉬는 날 · 학원 행사" },
];

const TimetableScreen = () => {
    const [expanded, setExpanded] = useState(true);
    return (
        <Variant
            name="날짜별 시간표 (날짜마다 과목 · 내용 두 줄 · 오늘 행 · 접기)"
            source="table.table.table-bordered (rowSpan) · tr.is-highlight · tr 안 is-break 칸 · Panel(actions)"
            note={
                "MyTimetable 전체 시간표(날짜 칸 rowSpan 2 + 과목 줄 · 내용 줄)를 표준으로. 한 날짜가 두 줄이라 Table 컴포넌트 대신 같은 클래스의 <table>을 씀.\n" +
                "오늘은 두 줄 모두 tr.is-highlight (열 강조 col-highlight와 같은 색). 점심 칸은 두 줄을 합쳐 흐린 글자.\n" +
                "쉬는 날은 그 날짜를 한 줄(tr.is-off)로 합쳐 사유를 적음 (빈 칸 '-'과 구별, 점심 같은 쉬는 시간 is-break와도 구별).\n접기는 Panel 머리의 버튼 (aria-expanded). 날짜 머리는 <th scope=\"rowgroup\">"
            }
            block
        >
            <Panel
                title="전체 시간표"
                subtitle={`${DAYS.length}일`}
                flush
                actions={
                    <Button size="sm" variant="text" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
                        {expanded ? "접기" : "펼치기"}
                    </Button>
                }
            >
                {expanded && (
                    <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
                        <table className="table table-bordered table-sm">
                            <caption className="visually-hidden">날짜별 시간표 (예시)</caption>
                            <thead>
                                <tr>
                                    <th scope="col">날짜</th>
                                    {SLOTS.map((s) => (
                                        <th key={s.id} scope="col" className="col-center">
                                            {s.label}
                                            <br />
                                            <span className="field-hint">{s.time}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            {DAYS.map((d) =>
                                d.off ? (
                                    <tbody key={d.date}>
                                        <tr className="is-off">
                                            <th scope="rowgroup" style={{ whiteSpace: "nowrap" }}>
                                                {d.date}
                                            </th>
                                            <td colSpan={SLOTS.length}>{d.off}</td>
                                        </tr>
                                    </tbody>
                                ) : (
                                <tbody key={d.date}>
                                    {[0, 1].map((row) => (
                                        <tr key={row} className={d.today ? "is-highlight" : undefined}>
                                            {row === 0 && (
                                                <th scope="rowgroup" rowSpan={2} style={{ whiteSpace: "nowrap" }}>
                                                    {d.date}
                                                    {d.today && (
                                                        <>
                                                            {" "}
                                                            <Badge tone="success">오늘</Badge>
                                                        </>
                                                    )}
                                                </th>
                                            )}
                                            {SLOTS.map((s) =>
                                                s.break ? (
                                                    row === 0 && (
                                                        <td key={s.id} rowSpan={2} className="col-center field-hint">
                                                            점심
                                                        </td>
                                                    )
                                                ) : (
                                                    <td key={s.id} className={row === 0 ? undefined : "field-hint"} style={row === 0 ? { fontWeight: 600 } : undefined}>
                                                        {d.cells[s.id]?.[row] ?? "-"}
                                                    </td>
                                                ),
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                                ),
                            )}
                        </table>
                    </div>
                )}
            </Panel>
        </Variant>
    );
};

/* ───── 목록 위 추가 폼 (MyInterview · HomeWorkList · CourseStudentList) ───── */
const STUDENT_OPTIONS = ["홍길동", "김철수", "이영희", "박민수"].map((label, i) => ({ value: `stu0${i + 1}`, label }));
const INITIAL_INTERVIEWS = [
    { id: "i1", student: "홍길동", company: "가나소프트", at: "2026-11-18T14:00" },
    { id: "i2", student: "이영희", company: "다라테크", at: "2026-11-20T10:30" },
];
const COMPANY_MAX = 200;

const InlineAddScreen = () => {
    const toast = useToast();
    const [rows, setRows] = useState(INITIAL_INTERVIEWS);
    const [adding, setAdding] = useState(false);
    const [student, setStudent] = useState(null);
    const [at, setAt] = useState("");
    const [company, setCompany] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const errors = submitted
        ? { student: !student ? "수강생을 고르세요." : "", at: !at ? "면접 일시를 고르세요." : "", company: !company.trim() ? "회사명을 입력하세요." : "" }
        : {};

    const close = () => {
        setAdding(false);
        setStudent(null);
        setAt("");
        setCompany("");
        setSubmitted(false);
    };

    const submit = (event) => {
        event.preventDefault();
        setSubmitted(true);
        if (!student || !at || !company.trim()) return;
        setSaving(true);
        setTimeout(() => {
            setRows((prev) => [...prev, { id: `i${prev.length + 1}`, student: student.label, company: company.trim(), at }].sort((a, b) => a.at.localeCompare(b.at)));
            setSaving(false);
            close();
            toast.success("면접 일정을 등록했습니다. (예시)");
        }, 700);
    };

    const columns = [
        { key: "student", title: "수강생", width: "20%" },
        { key: "company", title: "회사명" },
        { key: "at", title: "면접 일시", width: "28%", mono: true, render: (r) => r.at.replace("T", " ") },
    ];

    return (
        <Variant
            name="목록 위 추가 폼 (펼쳐서 등록 → 목록에 바로 반영)"
            source="toolbar · Panel(form) · Field · SelectBox · datetime-local · Table"
            note={
                "MyInterview · HomeWorkList · CourseStudentList의 '[등록]을 누르면 목록 위에 폼이 열림'을 표준으로.\n" +
                "폼이 열리면 [등록] 버튼은 숨기고, 폼은 Panel + 바닥 [취소] [등록](저장 중 loading). 저장하면 폼을 닫고 목록에 바로 넣고 토스트.\n" +
                "언제 쓰나: 입력 칸 4개 이하 + 목록을 보면서 넣는 게 편할 때. 칸이 많거나 다른 화면을 가리면 안 될 때는 폼 모달(md), 긴 글이면 별도 화면"
            }
            block
        >
            <div className="form-stack" style={{ width: "100%" }}>
                <div className="toolbar">
                    <span className="field-hint">면접 일정 {rows.length}건</span>
                    {!adding && (
                        <Button variant="primary" icon={icons.add} onClick={() => setAdding(true)} style={{ marginLeft: "auto" }}>
                            일정 등록
                        </Button>
                    )}
                </div>
                {adding && (
                    <form onSubmit={submit} noValidate>
                        <Panel
                            title="면접 일정 등록"
                            footer={
                                <>
                                    <Button onClick={close} disabled={saving}>
                                        취소
                                    </Button>
                                    <Button type="submit" variant="primary" loading={saving}>
                                        {saving ? "등록 중..." : "등록"}
                                    </Button>
                                </>
                            }
                        >
                            <div className="form-row">
                                <Field label="수강생" htmlFor="std-iv-student" required error={errors.student}>
                                    <SelectBox inputId="std-iv-student" options={STUDENT_OPTIONS} value={student} onChange={setStudent} aria-invalid={!!errors.student} />
                                </Field>
                                <Field label="면접 일시" htmlFor="std-iv-at" required error={errors.at}>
                                    <input
                                        id="std-iv-at"
                                        type="datetime-local"
                                        className="form-control"
                                        value={at}
                                        onChange={(e) => setAt(e.target.value)}
                                        aria-invalid={!!errors.at}
                                        aria-describedby="std-iv-at-msg"
                                    />
                                </Field>
                                <Field label="회사명" htmlFor="std-iv-company" required error={errors.company} count={{ current: company.length, max: COMPANY_MAX }}>
                                    <input
                                        id="std-iv-company"
                                        className="form-control"
                                        maxLength={COMPANY_MAX}
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        aria-invalid={!!errors.company}
                                        aria-describedby="std-iv-company-msg"
                                    />
                                </Field>
                            </div>
                        </Panel>
                    </form>
                )}
                <Table columns={columns} rows={rows} size="sm" ariaLabel="면접 일정 (예시)" emptyText="등록된 면접 일정이 없습니다." />
            </div>
        </Variant>
    );
};

/* ───── 댓글: 같은 자리에서 수정 · 권한 · 마감 잠금 (HomeworkReply) ───── */
const ME = "홍길동";
const INITIAL_REPLIES = [
    { id: "r1", author: "홍길동", time: "2026-11-15 21:04", body: "github.com/hong/week1 제출합니다." },
    { id: "r2", author: "김철수", time: "2026-11-15 22:40", body: "github.com/kim/week1 제출합니다.\n실행 캡처는 README에 있습니다." },
];

const ReplyEditScreen = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const [replies, setReplies] = useState(INITIAL_REPLIES);
    const [asTutor, setAsTutor] = useState(false);
    const [closed, setClosed] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState("");

    const startEdit = (r) => {
        setEditingId(r.id);
        setDraft(r.body);
    };
    const cancelEdit = async () => {
        const original = replies.find((r) => r.id === editingId)?.body;
        if (draft !== original && !(await confirm({ message: "고친 내용을 버릴까요?", confirmText: "버리기", danger: true }))) return;
        setEditingId(null);
    };
    const saveEdit = () => {
        if (!draft.trim()) return toast.error("내용을 입력하세요.");
        setReplies((prev) => prev.map((r) => (r.id === editingId ? { ...r, body: draft.trim(), edited: true } : r)));
        setEditingId(null);
        toast.success("댓글을 고쳤습니다. (예시)");
    };
    const remove = async (r) => {
        if (!(await confirm({ message: `${r.author}님의 댓글을 삭제할까요?`, confirmText: "삭제", danger: true }))) return;
        setReplies((prev) => prev.filter((x) => x.id !== r.id));
        toast.success("삭제했습니다. (예시)");
    };

    return (
        <Variant
            name="댓글: 같은 자리에서 수정 · 누가 무엇을 할 수 있나 · 마감 뒤 잠금"
            source="Comment(actions · badge) · textarea · Button(text) · Callout · Switch(예시 상태)"
            note={
                "HomeworkReply(내 댓글만 수정, 삭제는 본인 · 강사 · 관리자, 마감 뒤에는 버튼 숨김)를 표준으로.\n" +
                "수정은 그 댓글 자리에서 textarea로 바뀌고 [취소] [저장]. 고친 채로 취소하면 확인. 고친 댓글은 시간 옆 '(수정됨)'.\n" +
                "할 수 없는 동작의 버튼은 숨김 (비활성 아님). 마감 뒤에는 위에 이유를 한 번만 안내"
            }
            block
        >
            <div className="form-stack" style={{ width: "100%" }}>
                <div className="form-row" style={{ gap: "20px" }}>
                    <Switch checked={asTutor} onChange={setAsTutor}>
                        강사로 보기
                    </Switch>
                    <Switch checked={closed} onChange={setClosed}>
                        마감 지남
                    </Switch>
                </div>
                {closed && <Callout tone="neutral">제출이 마감되어 댓글을 쓰거나 고칠 수 없습니다.</Callout>}
                <ul className="comment-list">
                    {replies.map((r) => {
                        const mine = r.author === ME;
                        const canEdit = !closed && mine;
                        const canDelete = !closed && (mine || asTutor);
                        if (editingId === r.id)
                            return (
                                <li key={r.id} className="comment">
                                    <div className="comment-head">
                                        <span className="comment-author">{r.author}</span>
                                        <Badge tone="info">수정 중</Badge>
                                    </div>
                                    <textarea className="form-control" rows={3} aria-label="댓글 수정" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
                                    <div className="comment-actions">
                                        <Button size="sm" variant="text" onClick={cancelEdit}>
                                            취소
                                        </Button>
                                        <Button size="sm" variant="primary" onClick={saveEdit}>
                                            저장
                                        </Button>
                                    </div>
                                </li>
                            );
                        return (
                            <Comment
                                key={r.id}
                                author={r.author}
                                badge={mine ? <Badge>내 글</Badge> : undefined}
                                time={`${r.time}${r.edited ? " (수정됨)" : ""}`}
                                body={r.body}
                                actions={
                                    (canEdit || canDelete) && (
                                        <>
                                            {canEdit && (
                                                <Button size="sm" variant="text" onClick={() => startEdit(r)} disabled={!!editingId}>
                                                    수정
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button size="sm" variant="text" onClick={() => remove(r)}>
                                                    삭제
                                                </Button>
                                            )}
                                        </>
                                    )
                                }
                            />
                        );
                    })}
                </ul>
            </div>
        </Variant>
    );
};

/* ───── 설문 결과: 문항별 집계 | 학생별 응답 (CourseSurveyResult + 집계) ───── */
const SV_STUDENTS = ["홍길동", "김철수", "이영희", "박민수", "최지우", "정해인", "윤아름", "임수정", "한지민"].map((name, i) => ({ id: `r${i + 1}`, name }));
const SV_TOTAL = 12; // 수강생 수 (3명 미응답)
const SV_QUESTIONS = [
    { id: "q1", type: "radio", subject: "강의 내용에 얼마나 만족하나요?", options: ["매우 만족", "만족", "보통", "불만족"] },
    { id: "q2", type: "checkBox", subject: "도움이 된 것을 모두 고르세요.", options: ["실습", "예제 코드", "질의응답", "과제 피드백"] },
    { id: "q3", type: "text", subject: "바라는 점을 적어 주세요." },
];
/** 학생별 답: 보기는 번호(1부터), 주관식은 글 */
const SV_ANSWERS = {
    r1: { q1: "1", q2: ["1", "2"], q3: "실습 시간이 조금 더 길면 좋겠습니다." },
    r2: { q1: "2", q2: ["1"], q3: "" },
    r3: { q1: "1", q2: ["1", "3", "4"], q3: "과제 피드백이 빨라서 좋았습니다." },
    r4: { q1: "3", q2: ["2"], q3: "" },
    r5: { q1: "2", q2: ["1", "2"], q3: "예제 코드를 미리 받고 싶습니다." },
    r6: { q1: "1", q2: ["4"], q3: "" },
    r7: { q1: "2", q2: ["1", "3"], q3: "" },
    r8: { q1: "4", q2: [], q3: "진도가 조금 빠릅니다." },
    r9: { q1: "1", q2: ["1", "2", "3"], q3: "" },
};
const SV_TYPE_LABEL = { radio: "하나 고르기", checkBox: "여러 개 고르기", text: "글로 답하기" };

const countAnswers = (q) => {
    const list = Object.values(SV_ANSWERS).map((a) => a[q.id]);
    if (q.type === "text") return list.filter((v) => v && v.trim());
    return q.options.map((label, i) => {
        const value = String(i + 1);
        return { id: value, label, count: list.filter((v) => (Array.isArray(v) ? v.includes(value) : v === value)).length };
    });
};

const SurveyResultScreen = () => {
    const tabsId = useId();
    const [tab, setTab] = useState("summary");
    const [studentId, setStudentId] = useState("r1");
    const answered = SV_STUDENTS.length;
    const student = SV_STUDENTS.find((s) => s.id === studentId);

    return (
        <Variant
            name="설문 결과: 문항별 집계 | 학생별 응답"
            source="popup-page · Progress · Tabs · Table(막대 칸) · list-boxed · layout-split-start · list-group · QuestionBlock(읽기 전용) · answer-box"
            note={
                "CourseSurveyResult(학생 한 명씩 답 보기)에 집계를 더한 표준. 위에 응답률(응답 n / 수강생 N명 + 막대), 탭 [문항별 집계 | 학생별 응답].\n" +
                "집계: 객관식은 보기마다 응답 수 + 비율 막대 (여러 개 고르기는 응답자 대비 비율이라 합이 100%를 넘을 수 있음을 안내), 주관식은 답 목록(빈 답 제외).\n" +
                "학생별: 왼쪽 응답자 목록(aria-current) | 오른쪽 그 학생의 답 (QuestionBlock은 value만 넘겨 읽기 전용, 주관식은 answer-box, 빈 답은 answer-box-empty)"
            }
            block
        >
            <div className="popup-page" style={{ width: "100%", minHeight: "auto", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-lg)" }}>
                <header className="popup-header">
                    <h1 className="popup-title">사후 설문 결과 · 풀스택 28기</h1>
                </header>
                <div className="popup-body form-stack">
                    <div className="progress-row" style={{ maxWidth: "420px" }}>
                        <span className="field-hint" style={{ whiteSpace: "nowrap" }}>
                            응답 {answered} / {SV_TOTAL}명
                        </span>
                        <Progress value={answered} max={SV_TOTAL} label="응답률" showValue />
                    </div>
                    <Tabs
                        idBase={tabsId}
                        items={[
                            { id: "summary", label: "문항별 집계" },
                            { id: "student", label: "학생별 응답", count: answered },
                        ]}
                        value={tab}
                        onChange={setTab}
                        ariaLabel="결과 보기 방식"
                    />
                    <TabPanel idBase={tabsId} tabId={tab}>
                        {tab === "summary" ? (
                            <div className="form-stack">
                                {SV_QUESTIONS.map((q, i) => {
                                    const result = countAnswers(q);
                                    return (
                                        <Panel key={q.id} title={`${i + 1}. ${q.subject}`} badge={<Badge>{SV_TYPE_LABEL[q.type]}</Badge>} flush={q.type !== "text"}>
                                            {q.type === "text" ? (
                                                result.length ? (
                                                    <ul className="list-boxed">
                                                        {result.map((text) => (
                                                            <li key={text}>{text}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <StatusBox type="empty" size="sm" title="적은 답이 없습니다." />
                                                )
                                            ) : (
                                                <Table
                                                    size="sm"
                                                    rows={result}
                                                    ariaLabel={`${i + 1}번 문항 집계`}
                                                    columns={[
                                                        { key: "label", title: "보기", width: "28%" },
                                                        {
                                                            key: "bar",
                                                            title: "비율",
                                                            render: (r) => <Progress value={r.count} max={answered} label={`${r.label} 비율`} showValue size="sm" />,
                                                        },
                                                        { key: "count", title: "응답", width: "72px", align: "num", render: (r) => `${r.count}명` },
                                                    ]}
                                                />
                                            )}
                                            {q.type === "checkBox" && (
                                                <p className="field-hint" style={{ margin: "8px 12px" }}>
                                                    여러 개 고르기라 비율의 합이 100%를 넘을 수 있습니다 (응답자 {answered}명 기준).
                                                </p>
                                            )}
                                        </Panel>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="layout-split layout-split-start" style={{ "--layout-aside-width": "180px" }}>
                                <Panel title="응답자" subtitle={`${answered}명`} flush>
                                    <ul className="list-group">
                                        {SV_STUDENTS.map((s) => (
                                            <li key={s.id}>
                                                <button type="button" className="list-item" aria-current={s.id === studentId || undefined} onClick={() => setStudentId(s.id)}>
                                                    {s.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </Panel>
                                <div className="form-stack">
                                    <p className="field-hint">{student.name}의 응답</p>
                                    {SV_QUESTIONS.map((q, i) => {
                                        const value = SV_ANSWERS[studentId][q.id];
                                        return q.type === "text" ? (
                                            <QuestionBlock key={q.id} no={i + 1} title={q.subject}>
                                                <div className={`answer-box${value ? "" : " answer-box-empty"}`}>{value || "적지 않음"}</div>
                                            </QuestionBlock>
                                        ) : (
                                            <QuestionBlock
                                                key={q.id}
                                                no={i + 1}
                                                title={q.subject}
                                                options={q.options.map((label, n) => ({ value: String(n + 1), label }))}
                                                multiple={q.type === "checkBox"}
                                                value={value}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </TabPanel>
                </div>
            </div>
        </Variant>
    );
};

export const ScreenStudyCatalog = () => (
    <>
        <GroupTitle>화면 예시: 시험 응시 · 문제 은행 목록</GroupTitle>
        <Variants wide>
            <ExamTakeScreen />
            <QuestionBankListScreen />
        </Variants>
        <GroupTitle>화면 예시: 강의실 (접속 기록 · 시간표 · 면접 일정 · 댓글)</GroupTitle>
        <Variants wide>
            <ConnectedScreen />
            <TimetableScreen />
            <InlineAddScreen />
            <ReplyEditScreen />
        </Variants>
        <GroupTitle>화면 예시: 설문 결과 (집계)</GroupTitle>
        <Variants wide>
            <SurveyResultScreen />
        </Variants>
    </>
);
