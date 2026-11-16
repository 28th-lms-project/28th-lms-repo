import { useState } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Badge from "../../common/ui/Badge.jsx";
import Field from "../../common/ui/Field.jsx";
import Table from "../../common/ui/Table.jsx";
import Pagination from "../../common/ui/Pagination.jsx";
import Callout from "../../common/ui/Callout.jsx";
import Panel from "../../common/ui/Panel.jsx";
import StatCard from "../../common/ui/StatCard.jsx";
import StatusBox from "../../common/ui/StatusBox.jsx";
import SelectBox from "../../common/ui/SelectBox.jsx";
import QuestionBlock from "../../common/ui/QuestionBlock.jsx";
import Comment from "../../common/ui/Comment.jsx";
import PageHeader from "../../common/ui/PageHeader.jsx";
import Progress from "../../common/ui/Progress.jsx";
import { FileList } from "../../common/ui/FilePicker.jsx";
import { useConfirm, useToast } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons.js";

/* ───── 예시 데이터 ───── */
const STUDENTS = Array.from({ length: 23 }, (_, i) => ({
    id: `stu${String(i + 1).padStart(2, "0")}`,
    name: ["홍길동", "김철수", "이영희", "박민수", "최지우", "정해인", "윤아름"][i % 7],
    course: ["풀스택 개발자", "데이터 분석"][i % 2],
    state: i % 9 === 3 ? "수료" : "수강 중",
}));
const STUDENT_PAGE = 6;

const INITIAL_CODES = [
    { id: "C01", name: "수강 중", order: 1 },
    { id: "C02", name: "수료", order: 2 },
    { id: "C03", name: "중도 포기", order: 3 },
];

const INITIAL_ROLES = [
    { id: "ROLE_ADMIN", name: "관리자", protected: true },
    { id: "ROLE_MANAGER", name: "매니저" },
    { id: "ROLE_TUTOR", name: "강사" },
    { id: "ROLE_STUDENT", name: "학생" },
    { id: "ROLE_GUEST", name: "손님" },
];

const DAYS = [
    { key: "mon", title: "월" },
    { key: "tue", title: "화" },
    { key: "wed", title: "수" },
    { key: "thu", title: "목" },
    { key: "fri", title: "금" },
];
const TODAY = "wed";
const TIMETABLE = [
    { id: "p1", time: "09:00", mon: "Java", tue: "Java", wed: "Spring", thu: "Spring", fri: "SQL" },
    { id: "p2", time: "10:00", mon: "Java", tue: "Java", wed: "Spring", thu: "Spring", fri: "SQL" },
    { id: "lunch", time: "12:00", label: "점심 시간", break: true },
    { id: "p3", time: "13:00", mon: "React", tue: "React", wed: "실습", thu: "React", fri: "프로젝트" },
    { id: "p4", time: "14:00", mon: "React", tue: "실습", wed: "실습", thu: "React", fri: "프로젝트" },
];

const TUTORS = [
    { value: "t1", label: "김강사 (Java)" },
    { value: "t2", label: "이강사 (Spring)" },
    { value: "t3", label: "박강사 (React)" },
    { value: "t4", label: "최강사 (SQL)", isDisabled: true },
];
const STUDENT_OPTIONS = STUDENTS.slice(0, 8).map((s) => ({ value: s.id, label: `${s.name} (${s.id})` }));

const Q1_OPTIONS = [
    { value: "1", label: "int" },
    { value: "2", label: "String" },
    { value: "3", label: "boolean" },
    { value: "4", label: "double" },
];

const LONG_COMMENT =
    "과제 제출 형식 관련 질문입니다. 압축 파일 안에 소스 코드와 실행 결과 캡처를 같이 넣으라고 하셨는데, 캡처는 이미지 파일 하나로 합쳐야 하나요, 아니면 여러 장이어도 괜찮을까요? 그리고 README 파일은 필수인지도 궁금합니다.";

let nextCodeNo = 4;

export const StandardDataCatalog = () => {
    const toast = useToast();
    const confirm = useConfirm();

    /* 체크 선택 */
    const [checked, setChecked] = useState(["stu02"]);
    const [studentPage, setStudentPage] = useState(0);
    const studentRows = STUDENTS.slice(studentPage * STUDENT_PAGE, (studentPage + 1) * STUDENT_PAGE);

    const removeChecked = async () => {
        const ok = await confirm({ message: `${checked.length}명을 과정에서 뺄까요?`, confirmText: "빼기", danger: true });
        if (!ok) return;
        toast.success(`${checked.length}명을 뺐습니다. (예시)`);
        setChecked([]);
    };

    /* 편집 표 */
    const [codes, setCodes] = useState(INITIAL_CODES.map((c) => ({ ...c, status: undefined })));
    const changedCount = codes.filter((c) => c.status).length;
    const updateCode = (id, patch) =>
        setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch, status: c.status ?? "modified" } : c)));
    const toggleDelete = (code) => {
        if (code.status === "added") return setCodes((prev) => prev.filter((c) => c.id !== code.id));
        setCodes((prev) =>
            prev.map((c) => (c.id === code.id ? { ...c, status: c.status === "deleted" ? c.prevStatus : "deleted", prevStatus: c.status } : c)),
        );
    };
    const addCode = () => {
        const id = `C${String(nextCodeNo++).padStart(2, "0")}`;
        setCodes((prev) => [...prev, { id, name: "", order: prev.length + 1, status: "added" }]);
    };
    const saveCodes = () => {
        if (codes.some((c) => c.status !== "deleted" && !c.name.trim())) return toast.error("이름이 빈 코드가 있습니다.");
        setCodes((prev) => prev.filter((c) => c.status !== "deleted").map((c) => ({ ...c, status: undefined, prevStatus: undefined })));
        toast.success("저장했습니다. (예시)");
    };

    const codeColumns = [
        { key: "id", title: "코드", width: "18%", mono: true },
        {
            key: "name",
            title: "이름",
            render: (c) => (
                <input
                    className="cell-input"
                    aria-label={`${c.id} 이름`}
                    value={c.name}
                    placeholder="이름 입력"
                    disabled={c.status === "deleted"}
                    aria-invalid={c.status !== "deleted" && !c.name.trim()}
                    onChange={(e) => updateCode(c.id, { name: e.target.value })}
                />
            ),
        },
        {
            key: "order",
            title: "순서",
            width: "14%",
            align: "num",
            render: (c) => (
                <input
                    className="cell-input"
                    style={{ textAlign: "right" }}
                    type="number"
                    min={1}
                    aria-label={`${c.id} 순서`}
                    value={c.order}
                    disabled={c.status === "deleted"}
                    onChange={(e) => updateCode(c.id, { order: Number(e.target.value) })}
                />
            ),
        },
        {
            key: "actions",
            title: "작업",
            width: "22%",
            align: "actions",
            render: (c) => (
                <Button size="sm" variant={c.status === "deleted" ? "secondary" : "danger"} onClick={() => toggleDelete(c)}>
                    {c.status === "deleted" ? "되살리기" : "삭제"}
                </Button>
            ),
        },
    ];

    /* 순서 바꾸기 */
    const [roles, setRoles] = useState(INITIAL_ROLES);
    const orderChanged = roles.some((r, i) => r.id !== INITIAL_ROLES[i].id);
    const reorder = (from, to) =>
        setRoles((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });

    /* 셀렉트 */
    const [tutor, setTutor] = useState(null);
    const [students, setStudents] = useState(STUDENT_OPTIONS.slice(0, 2));
    const [tutorTouched, setTutorTouched] = useState(false);
    const tutorError = tutorTouched && !tutor ? "강사를 선택하세요." : "";

    /* 문제 */
    const [q1, setQ1] = useState("2");
    const [q2, setQ2] = useState(["1", "3"]);
    const [code, setCode] = useState("");

    /* 댓글 */
    const [reply, setReply] = useState("");

    return (
        <div>
            <p className={styles.standardIntro}>
                표 확장(체크 선택 · 편집 · 순서 · 시간표) · 검색 셀렉트 · 시험 문제 · 댓글 · 내용 블록 · 화면 예시. 스타일 원본: styles/table.css · content.css · status.css, common/ui/selectStyles.js
            </p>

            <GroupTitle>표 확장 (common/Grid 대신)</GroupTitle>
            <Variants wide>
                <Variant
                    name="체크 선택 + 일괄 작업 (checkedKeys)"
                    source="common/ui/Table.jsx"
                    note={"Grid checkable의 표준. 머리글 체크박스는 이 페이지 전체 (일부만 고르면 -).\n고를 수 없는 행은 isRowCheckable (예시: 수료생). 고른 건수와 일괄 버튼은 표 위 toolbar에"}
                    block
                    code={`
<Table
  columns={columns}
  rows={pageRows}
  checkedKeys={checked}
  onCheckedChange={setChecked}
  isRowCheckable={(row) => row.state !== "수료"}
/>`}
                >
                    <div className="toolbar" style={{ marginBottom: "12px", alignItems: "center" }}>
                        <span className="field-hint">{checked.length ? `${checked.length}명 선택됨` : "학생을 고르세요."}</span>
                        <div className="btn-group">
                            <Button size="sm" disabled={!checked.length} onClick={() => setChecked([])}>
                                선택 해제
                            </Button>
                            <Button size="sm" variant="danger" disabled={!checked.length} onClick={removeChecked}>
                                과정에서 빼기
                            </Button>
                        </div>
                    </div>
                    <Table
                        ariaLabel="수강생 목록 (체크 선택)"
                        size="sm"
                        columns={[
                            { key: "id", title: "아이디", width: "20%", mono: true },
                            { key: "name", title: "이름" },
                            { key: "course", title: "과정", width: "28%" },
                            {
                                key: "state",
                                title: "상태",
                                width: "16%",
                                align: "center",
                                render: (r) => <Badge tone={r.state === "수료" ? "neutral" : "primary"}>{r.state}</Badge>,
                            },
                        ]}
                        rows={studentRows}
                        checkedKeys={checked}
                        onCheckedChange={setChecked}
                        isRowCheckable={(r) => r.state !== "수료"}
                    />
                    <div className="table-footer">
                        <span>전체 {STUDENTS.length}명</span>
                        <Pagination page={studentPage} totalPages={Math.ceil(STUDENTS.length / STUDENT_PAGE)} onChange={setStudentPage} />
                    </div>
                </Variant>

                <Variant
                    name="편집 표 (rowStatus + cell-input)"
                    source="common/ui/Table.jsx · styles/table.css"
                    note={"Grid 편집 모드(코드 관리)의 표준. 칸 안 입력은 평소 글자처럼 보이고, 올리거나 누르면 입력 칸.\n추가(초록) · 수정(노랑) · 삭제 예정(빨강 + 취소선) 행은 왼쪽 선과 배경으로 표시하고 저장할 때 한꺼번에 보냄"}
                    block
                    code={`
const columns = [
  { key: "name", title: "이름", render: (row) => (
      <input className="cell-input" aria-label={\`\${row.id} 이름\`} value={row.name}
             aria-invalid={!row.name.trim()} onChange={...} />
  ) },
];
<Table columns={columns} rows={codes} rowStatus={(row) => row.status} />   // "added" | "modified" | "deleted"`}
                >
                    <Table ariaLabel="코드 목록 (편집)" size="sm" columns={codeColumns} rows={codes} rowStatus={(c) => c.status} />
                    <div className="table-footer">
                        <span>{changedCount ? `변경 ${changedCount}건 (저장 전)` : "변경 없음"}</span>
                        <div className="btn-group">
                            <Button size="sm" icon={icons.add} onClick={addCode}>
                                행 추가
                            </Button>
                            <Button size="sm" disabled={!changedCount} onClick={() => setCodes(INITIAL_CODES.map((c) => ({ ...c })))}>
                                되돌리기
                            </Button>
                            <Button size="sm" variant="primary" disabled={!changedCount} onClick={saveCodes}>
                                저장
                            </Button>
                        </div>
                    </div>
                </Variant>

                <Variant
                    name="순서 바꾸기 (onReorder + isRowLocked)"
                    source="common/ui/Table.jsx"
                    note={"역할 · 메뉴 순서 변경의 표준. 행을 끌어 놓거나, 손잡이(⠿)에 포커스한 뒤 ↑ ↓ 키.\n보호 행(관리자)은 \"고정\"으로 표시되고 옮기거나 그 자리에 놓을 수 없음. 바뀌면 Callout으로 저장 안내"}
                    block
                    code={`
<Table
  columns={columns}
  rows={roles}
  onReorder={(from, to) => setRoles(move(roles, from, to))}
  isRowLocked={(row) => row.protected}
/>`}
                >
                    {orderChanged && (
                        <div style={{ marginBottom: "12px" }}>
                            <Callout
                                tone="info"
                                actions={
                                    <>
                                        <Button size="sm" onClick={() => setRoles(INITIAL_ROLES)}>
                                            되돌리기
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => {
                                                toast.success("순서를 저장했습니다. (예시)");
                                                setRoles(INITIAL_ROLES);
                                            }}
                                        >
                                            저장
                                        </Button>
                                    </>
                                }
                            >
                                순서가 바뀌었습니다. 저장해야 반영됩니다.
                            </Callout>
                        </div>
                    )}
                    <Table
                        ariaLabel="역할 순서"
                        size="sm"
                        columns={[
                            { key: "order", title: "순서", width: "12%", align: "num", render: (_, i) => i + 1 },
                            { key: "id", title: "역할 코드", width: "34%", mono: true },
                            { key: "name", title: "이름" },
                        ]}
                        rows={roles}
                        onReorder={reorder}
                        isRowLocked={(r) => r.protected}
                        isRowMuted={(r) => r.protected}
                    />
                </Variant>

                <Variant
                    name="시간표 (bordered · col-highlight · rowClassName)"
                    source="styles/table.css"
                    note={"MyTimetable의 표준. 세로 칸선(bordered) · 오늘 열(className: \"col-highlight\") · 쉬는 시간 행(rowClassName → is-break).\n머리글 파랑(#bfd4fa) · 오늘 초록(#e3f6d0) 같은 직접 색 대신 토큰"}
                    block
                    code={`
<Table
  bordered
  columns={[
    { key: "time", title: "시간", mono: true },
    ...days.map((d) => ({ ...d, align: "center", className: d.key === today ? "col-highlight" : undefined })),
  ]}
  rows={periods}
  rowClassName={(row) => (row.break ? "is-break" : undefined)}
/>`}
                >
                    <Table
                        ariaLabel="시간표"
                        size="sm"
                        bordered
                        columns={[
                            { key: "time", title: "시간", width: "14%", mono: true, align: "center" },
                            ...DAYS.map((d) => ({
                                ...d,
                                align: "center",
                                className: d.key === TODAY ? "col-highlight" : undefined,
                                render: (r) => (r.break ? (d.key === "wed" ? r.label : "") : r[d.key]),
                            })),
                        ]}
                        rows={TIMETABLE}
                        rowClassName={(r) => (r.break ? "is-break" : undefined)}
                    />
                </Variant>
            </Variants>

            <GroupTitle>검색 셀렉트 (react-select)</GroupTitle>
            <Variants>
                <Variant
                    name="SelectBox: 하나 (검색 · 지우기)"
                    source="common/ui/SelectBox.jsx · selectStyles.js"
                    note={"react-select에 표준 모양(36px · 테두리 · 포커스 · 다크 모드)을 입힌 것. 강사 · 과목 선택처럼 목록이 길 때.\n짧은 목록이면 <select className=\"form-control\">. 고를 수 없는 항목은 isDisabled"}
                    code={`
<Field label="담당 강사" htmlFor="tutor" required error={error}>
  <SelectBox inputId="tutor" options={tutors} value={tutor} onChange={setTutor}
             isClearable aria-invalid={!!error} />
</Field>`}
                >
                    <div style={{ width: "100%" }}>
                        <Field label="담당 강사" htmlFor="std-tutor" required error={tutorError} hint="이름이나 과목으로 검색">
                            <SelectBox
                                inputId="std-tutor"
                                options={TUTORS}
                                value={tutor}
                                onChange={setTutor}
                                onBlur={() => setTutorTouched(true)}
                                isClearable
                                placeholder="강사 선택"
                                aria-invalid={!!tutorError}
                            />
                        </Field>
                    </div>
                </Variant>
                <Variant name="isMulti: 여러 개" note="고른 항목은 칩 (.tag와 같은 색). 칩의 ×로 하나씩 빼기" code={`<SelectBox isMulti options={students} value={value} onChange={setValue} />`}>
                    <div style={{ width: "100%" }}>
                        <Field label="수강생" htmlFor="std-students">
                            <SelectBox inputId="std-students" isMulti options={STUDENT_OPTIONS} value={students} onChange={setStudents} placeholder="수강생 선택" />
                        </Field>
                    </div>
                </Variant>
                <Variant name="작게 · 비활성 · 불러오는 중" note={'size="sm"(30px, 표 · 툴바 안) · isDisabled · isLoading'} code={`<SelectBox size="sm" ... />\n<SelectBox isDisabled ... />\n<SelectBox isLoading ... />`}>
                    <div className="form-stack" style={{ gap: "8px", width: "100%" }}>
                        <SelectBox size="sm" options={TUTORS} aria-label="강사 (작게)" placeholder="작게 (30px)" />
                        <SelectBox isDisabled options={TUTORS} value={TUTORS[0]} aria-label="강사 (비활성)" />
                        <SelectBox isLoading options={[]} aria-label="과목 (불러오는 중)" placeholder="과목 불러오는 중" />
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>시험 문제 · 보기</GroupTitle>
            <Variants>
                <Variant
                    name="QuestionBlock: 객관식 (하나)"
                    source="styles/content.css · common/ui/QuestionBlock.jsx"
                    note={"Exam*Modal 문제 블록 · admin/test 보기 목록(선택 #bbfdbb)의 표준.\n보기 전체가 눌리는 칸이고 진짜 radio라 방향키로 이동"}
                    code={`<QuestionBlock no={1} title="..." score={5} options={options} value={answer} onChange={setAnswer} />`}
                >
                    <div style={{ width: "100%" }}>
                        <QuestionBlock no={1} title="Java의 기본형(primitive type)이 아닌 것은?" score={5} options={Q1_OPTIONS} value={q1} onChange={setQ1} />
                    </div>
                </Variant>
                <Variant name="채점 결과 (showResult)" note="정답 초록 · 고른 오답 빨강. 고칠 수 없음 (잠긴 정답 표시)" code={`<QuestionBlock ... value={submitted} answer={correct} showResult />`}>
                    <div style={{ width: "100%" }}>
                        <QuestionBlock no={1} title="Java의 기본형(primitive type)이 아닌 것은?" score={5} options={Q1_OPTIONS} value="3" answer="2" showResult />
                    </div>
                </Variant>
                <Variant name="여러 개 고르기 (multiple) + 문제 내용" note="body: 회색 상자 (줄바꿈 유지)" code={`<QuestionBlock multiple body="..." options={...} value={[...]} onChange={...} />`}>
                    <div style={{ width: "100%" }}>
                        <QuestionBlock
                            no={2}
                            title="HTTP 메서드 중 멱등(idempotent)인 것을 모두 고르세요."
                            score={10}
                            multiple
                            body={"같은 요청을 여러 번 보내도 서버 상태가 한 번 보낸 것과 같으면 멱등입니다."}
                            options={[
                                { value: "1", label: "GET" },
                                { value: "2", label: "POST" },
                                { value: "3", label: "PUT" },
                                { value: "4", label: "PATCH" },
                            ]}
                            value={q2}
                            onChange={setQ2}
                        />
                    </div>
                </Variant>
                <Variant name="코드 문제 + 답안 칸 (children)" note="code: 고정폭 상자. 주관식 · 코드 답안은 children으로 textarea" code={`<QuestionBlock code={src}>\n  <textarea className="form-control form-control-mono" aria-label="답안" />\n</QuestionBlock>`}>
                    <div style={{ width: "100%" }}>
                        <QuestionBlock no={3} title="다음 코드의 출력 결과를 쓰세요." score={10} code={'int a = 7;\nint b = 2;\nSystem.out.println(a / b + a % b);'}>
                            <textarea
                                className="form-control form-control-mono"
                                aria-label="3번 답안"
                                placeholder="답안 입력"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                style={{ minHeight: "64px" }}
                            />
                        </QuestionBlock>
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>댓글</GroupTitle>
            <Variants wide>
                <Variant
                    name="Comment (답글 · 긴 글 접기) + 답글 입력"
                    source="styles/content.css · common/ui/Comment.jsx"
                    note={"HomeworkReply · ReplyForm의 표준. 120자를 넘는 글은 3줄로 접고 [더 보기].\n답글은 왼쪽 선으로 들여 씀. 작업 버튼은 btn-text"}
                    block
                    code={`
<ul className="comment-list">
  <Comment author="홍길동" time="2026-11-16 14:20" body={text}
           actions={<Button variant="text">답글</Button>}>
    <Comment author="김강사" badge={<Badge tone="primary">강사</Badge>} time="..." body="..." />
  </Comment>
</ul>`}
                >
                    <ul className="comment-list">
                        <Comment
                            author="홍길동"
                            time="2026-11-16 14:20"
                            body={LONG_COMMENT}
                            actions={
                                <>
                                    <Button variant="text">답글</Button>
                                    <Button variant="text">수정</Button>
                                    <Button variant="text">삭제</Button>
                                </>
                            }
                        >
                            <Comment author="김강사" badge={<Badge tone="primary">강사</Badge>} time="2026-11-16 15:02" body={"이미지는 여러 장이어도 괜찮습니다.\nREADME는 선택입니다."} />
                        </Comment>
                        <Comment author="이영희" time="2026-11-16 16:45" body="마감이 금요일 자정 맞나요?" actions={<Button variant="text">답글</Button>} />
                    </ul>
                    <div className="form-stack" style={{ gap: "8px", marginTop: "12px" }}>
                        <textarea
                            className="form-control"
                            aria-label="댓글 입력"
                            placeholder="댓글을 입력하세요."
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            style={{ minHeight: "64px" }}
                        />
                        <div className="btn-group btn-group-end">
                            <Button
                                variant="primary"
                                size="sm"
                                disabled={!reply.trim()}
                                onClick={() => {
                                    toast.success("댓글을 등록했습니다. (예시)");
                                    setReply("");
                                }}
                            >
                                등록
                            </Button>
                        </div>
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>내용 블록 (인용 · 세로 키-값 · 상자 목록)</GroupTitle>
            <Variants>
                <Variant name="quote: 의견 · 인용" source="styles/content.css" note="MyCounsel 의견 인용 상자의 표준" code={`<blockquote className="quote"><p>내용</p><footer>김강사</footer></blockquote>`}>
                    <blockquote className="quote" style={{ width: "100%" }}>
                        <p>{"기초 문법은 잘 이해하고 있습니다.\n예외 처리 부분을 한 번 더 복습하면 좋겠습니다."}</p>
                        <footer>김강사 · 2026-11-10 상담</footer>
                    </blockquote>
                </Variant>
                <Variant
                    name="desc-list-stacked: 라벨 위 · 값 아래"
                    source="styles/content.css"
                    note={"MyCounsel 3열 정보의 표준. 열 수는 --desc-columns (기본 3, 좁으면 2).\n항목마다 <div>로 dt + dd를 묶음"}
                    code={`<dl className="desc-list-stacked">\n  <div><dt>과정</dt><dd>풀스택 개발자</dd></div>\n</dl>`}
                >
                    <dl className="desc-list-stacked" style={{ width: "100%" }}>
                        <div>
                            <dt>과정</dt>
                            <dd>풀스택 개발자</dd>
                        </div>
                        <div>
                            <dt>상담 일시</dt>
                            <dd>2026-11-10 14:00</dd>
                        </div>
                        <div>
                            <dt>상담자</dt>
                            <dd>김강사</dd>
                        </div>
                        <div>
                            <dt>유형</dt>
                            <dd>
                                <span className="tag">학습</span>
                            </dd>
                        </div>
                        <div>
                            <dt>진단</dt>
                            <dd>
                                <Badge tone="warning">중</Badge>
                            </dd>
                        </div>
                    </dl>
                </Variant>
                <Variant
                    name="list-boxed: 회색 상자 글머리 목록"
                    source="styles/content.css"
                    note="RoleUserMoveModal 대상 목록의 표준. 길면 --list-max-height로 높이 제한 + 스크롤"
                    code={`<ul className="list-boxed" style={{ "--list-max-height": "120px" }}>...</ul>`}
                >
                    <div style={{ width: "100%" }}>
                        <p className="field-hint" style={{ marginBottom: "6px" }}>
                            아래 5명을 &quot;강사&quot; 역할로 옮깁니다.
                        </p>
                        <ul className="list-boxed" style={{ "--list-max-height": "120px" }}>
                            {STUDENTS.slice(0, 5).map((s) => (
                                <li key={s.id}>
                                    {s.name} ({s.id})
                                </li>
                            ))}
                        </ul>
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>화면 예시: 상세 · 대시보드 · 오류 화면</GroupTitle>
            <Variants wide>
                <Variant
                    name="상세 화면 (PageHeader + 메타 + 본문 + 첨부)"
                    source="PageHeader · Panel · FileList · Comment"
                    note="MyCourseData 상세(제목 + 작업 버튼 · 메타 12px · 본문 · 첨부 칩)를 표준 부품으로 만든 예시"
                    block
                >
                    <PageHeader
                        crumbs={[{ title: "내 강의실", to: "/sample" }, { title: "자료실", to: "/sample" }, { title: "1주차 강의자료" }]}
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
                                    <Badge tone="primary">진행 중</Badge>
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
                            onRetry={() => toast.show("다시 불러옵니다. (예시)")}
                        />
                    </div>
                </Variant>
            </Variants>
        </div>
    );
};
