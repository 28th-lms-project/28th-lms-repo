import { useMemo, useState } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Badge from "../../common/ui/Badge.jsx";
import Table from "../../common/ui/Table.jsx";
import Pagination from "../../common/ui/Pagination.jsx";
import Callout from "../../common/ui/Callout.jsx";
import { useToast, useConfirm } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons.js";
import TransferList from "../../common/ui/TransferList.jsx";

/*
 * 표준 UI: 표 · 페이지 이동 · 표 확장(체크 선택 · 편집 · 순서 · 시간표) · 두 목록 사이 옮기기.
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

let nextCodeNo = 4;

const QUESTIONS = [
    { id: "q1", question: "Java의 기본형이 아닌 것은?", answerType: "객관식-단항", pointAlloc: 5 },
    { id: "q2", question: "JVM이 하는 일을 설명하세요.", answerType: "주관식", pointAlloc: 10 },
    { id: "q3", question: "String은 불변 객체이다.", answerType: "O/X", pointAlloc: 5 },
    { id: "q4", question: "배열을 뒤집는 메서드를 작성하세요.", answerType: "코드작성", pointAlloc: 20 },
    { id: "q5", question: "접근 제한자를 모두 고르세요.", answerType: "객관식-다항", pointAlloc: 10 },
    { id: "q6", question: "오버로딩과 오버라이딩의 차이는?", answerType: "주관식", pointAlloc: 10 },
    { id: "q7", question: "인터페이스는 다중 구현이 가능하다.", answerType: "O/X", pointAlloc: 5 },
];

const TableGroup = () => {
    const toast = useToast();

    /* 표 */
    const [sort, setSort] = useState({ key: "joined", direction: "desc" });
    const [page, setPage] = useState(0);
    const [selectedId, setSelectedId] = useState("user01");
    const [tableState, setTableState] = useState("data");
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
            <GroupTitle>표 · 페이지 이동</GroupTitle>
            <Variants wide>
                <Variant
                    name="Table (정렬 · 선택 행 · 배지 칸 · 숫자 칸) + Pagination"
                    source="styles/table.css · common/ui/Table.jsx · Pagination.jsx"
                    note={"머리글을 누르면 정렬, 행을 누르거나 Enter로 선택 (선택 행: 강조 배경 + 왼쪽 선).\nPagination은 0부터 세는 page (API와 같음). 아래 버튼으로 빈 · 로딩 상태 확인"}
                    block
                    code={`
<Table
  ariaLabel="회원 목록"
  columns={[
    { key: "id", title: "아이디", width: "18%", mono: true, sortable: true },
    { key: "name", title: "이름", sortable: true },
    { key: "score", title: "평균", align: "num", render: (r) => \`\${r.score}점\` },
    { key: "status", title: "상태", align: "center",
      render: (r) => <Badge tone={r.locked ? "danger" : "success"}>...</Badge> },
  ]}
  rows={pageRows}
  rowKey="id"
  selectedKey={selectedId}
  onRowClick={(row) => setSelectedId(row.id)}
  sort={sort}
  onSortChange={setSort}
  loading={loading}
  emptyText="검색 결과가 없습니다."
/>
<div className="table-footer">
  <span>전체 {total}건</span>
  <Pagination page={page} totalPages={totalPages} onChange={setPage} />
</div>`}
                >
                    <div className="btn-group" style={{ marginBottom: "12px" }}>
                        {[
                            ["data", "데이터"],
                            ["loading", "로딩"],
                            ["empty", "빈 목록"],
                        ].map(([value, label]) => (
                            <Button key={value} size="sm" variant={tableState === value ? "primary" : "secondary"} onClick={() => setTableState(value)}>
                                {label}
                            </Button>
                        ))}
                    </div>
                    <Table
                        ariaLabel="회원 목록"
                        columns={memberColumns}
                        rows={tableState === "data" ? pageRows : []}
                        selectedKey={selectedId}
                        onRowClick={(row) => setSelectedId(row.id)}
                        isRowMuted={(row) => row.locked}
                        sort={sort}
                        onSortChange={(next) => {
                            setSort(next);
                            setPage(0);
                        }}
                        loading={tableState === "loading"}
                        emptyText="검색 결과가 없습니다."
                    />
                    <div className="table-footer">
                        <span>
                            전체 {MEMBERS.length}건 · 선택: {selected?.name ?? "-"}
                        </span>
                        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                    </div>
                </Variant>
                <Variant
                    name="작업 칸 · 작은 표 · 줄무늬 · 높이 제한(머리글 고정)"
                    source="styles/table.css"
                    note="align: 'actions'는 오른쪽 정렬 버튼 칸. maxHeight를 주면 표 안에서 스크롤되고 머리글이 고정됨"
                    block
                    code={`
<Table size="sm" striped maxHeight={240}
  columns={[..., { key: "actions", title: "작업", align: "actions",
    render: (r) => <><Button size="sm">수정</Button>
                     <Button size="sm" variant="danger">삭제</Button></> }]} />`}
                >
                    <Table
                        ariaLabel="역할 목록"
                        size="sm"
                        striped
                        maxHeight={240}
                        columns={[
                            { key: "id", title: "아이디", mono: true, width: "22%" },
                            { key: "name", title: "이름" },
                            { key: "role", title: "역할", width: "16%" },
                            {
                                key: "actions",
                                title: "작업",
                                align: "actions",
                                width: 170,
                                render: (r) => (
                                    <>
                                        <Button size="sm" icon={icons.edit} onClick={() => toast.show(`${r.name} 수정`)}>
                                            수정
                                        </Button>
                                        <Button size="sm" variant="danger" icon={icons.delete} aria-label={`${r.name} 삭제`} title="삭제" />
                                    </>
                                ),
                            },
                        ]}
                        rows={MEMBERS.slice(0, 14)}
                    />
                </Variant>
            </Variants>
        </>
    );
};

const TableExtGroup = () => {
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

    return (
        <>
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
                    note={"역할 · 메뉴 순서 변경의 표준. 손잡이(⠿)를 잡고 끌거나, 손잡이에 포커스한 뒤 ↑ ↓ 키. 행의 다른 곳은 끌리지 않음.\n보호 행(관리자)은 \"고정\"으로 표시되고 옮기거나 그 자리에 놓을 수 없음. 바뀌면 Callout으로 저장 안내"}
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
        </>
    );
};

const TransferGroup = () => {
    /* 새 부품 단독 예시 */
    const [demoPicked, setDemoPicked] = useState(["q2"]);

    return (
        <>
            <GroupTitle>두 목록 사이 옮기기</GroupTitle>
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
            </Variants>
        </>
    );
};

export const StandardDataCatalog = () => (
    <div>
        <p className={styles.standardIntro}>표 · 페이지 이동 · 표 확장(체크 선택 · 편집 · 순서 · 시간표) · 두 목록 사이 옮기기. 스타일 원본: styles/table.css · content.css(transfer)</p>
        <TableGroup />
        <TableExtGroup />
        <TransferGroup />
    </div>
);
