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
import { useToast } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons.js";

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

const MENU_TREE = {
    top: ["시스템 관리", "과정 관리", "내 강의실"],
    mid: { "시스템 관리": ["회원 관리", "역할 관리", "메뉴 관리", "코드 관리"], "과정 관리": ["과정 목록", "시험 관리"], "내 강의실": ["시간표", "자료실"] },
};

const sortRows = (rows, sort) => {
    if (!sort) return rows;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => (a[sort.key] > b[sort.key] ? dir : a[sort.key] < b[sort.key] ? -dir : 0));
};

export const StandardLayoutCatalog = () => {
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

    /* 탭 */
    const tabsId = useId();
    const pillsId = useId();
    const [tab, setTab] = useState("timetable");
    const [pill, setPill] = useState("choice");

    /* 카드 · 목록 */
    const [selectedCourse, setSelectedCourse] = useState("fullstack");
    const [top, setTop] = useState("시스템 관리");
    const [mid, setMid] = useState("회원 관리");
    const [orderChanged, setOrderChanged] = useState(true);

    return (
        <div>
            <p className={styles.standardIntro}>
                표 · 탭 · 패널 · 카드 · 안내 상자 · 목록 · 배치. 스타일 원본: styles/table.css · tabs.css · panel.css
            </p>

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

            <GroupTitle>탭</GroupTitle>
            <Variants>
                <Variant
                    name="밑줄 탭 (구역 전환) + 건수 · 비활성"
                    source="styles/tabs.css · common/ui/Tabs.jsx"
                    note="← → Home End로 이동. 쿼리 파라미터 탭도 value · onChange만 연결하면 됨"
                    block
                    code={`
const idBase = useId();
<Tabs idBase={idBase} ariaLabel="강의실 메뉴"
      items={[{ id: "timetable", label: "시간표" },
              { id: "data", label: "자료실", count: 12 }]}
      value={tab} onChange={setTab} />
<TabPanel idBase={idBase} tabId={tab}>...</TabPanel>`}
                >
                    <Tabs
                        idBase={tabsId}
                        ariaLabel="강의실 메뉴"
                        items={[
                            { id: "timetable", label: "시간표" },
                            { id: "data", label: "자료실", count: 12 },
                            { id: "counsel", label: "상담", count: 3 },
                            { id: "interview", label: "면접" },
                            { id: "survey", label: "설문 (준비 중)", disabled: true },
                        ]}
                        value={tab}
                        onChange={setTab}
                    />
                    <TabPanel idBase={tabsId} tabId={tab}>
                        <StatusBox type="empty" size="sm" title={`"${tab}" 탭 내용`} />
                    </TabPanel>
                </Variant>
                <Variant
                    name="pills (작은 묶음 전환)"
                    source="styles/tabs.css"
                    note="variant='pills'. 객관식 / 주관식처럼 같은 목록의 보기 방식 전환"
                    block
                    code={`<Tabs variant="pills" idBase={id} ariaLabel="문제 유형" items={...} value={v} onChange={setV} />`}
                >
                    <Tabs
                        variant="pills"
                        idBase={pillsId}
                        ariaLabel="문제 유형"
                        items={[
                            { id: "choice", label: "객관식" },
                            { id: "short", label: "주관식" },
                            { id: "ox", label: "O/X" },
                        ]}
                        value={pill}
                        onChange={setPill}
                    />
                    <TabPanel idBase={pillsId} tabId={pill}>
                        <p className={styles.note}>선택: {pill}</p>
                    </TabPanel>
                </Variant>
            </Variants>

            <GroupTitle>패널</GroupTitle>
            <Variants>
                <Variant
                    name="Panel (제목 · 배지 · 머리 버튼 · 바닥 버튼)"
                    source="styles/panel.css · common/ui/Panel.jsx"
                    block
                    code={`
<Panel title="홍길동" badge={<Badge tone="success">정상</Badge>}
       actions={<Button size="sm" icon={icons.edit}>수정</Button>}
       footer={<><Button variant="danger">잠금</Button>
                 <Button variant="primary">저장</Button></>}>
  <dl className="desc-list">...</dl>
</Panel>`}
                >
                    <Panel
                        title="홍길동"
                        badge={<Badge tone="success">정상</Badge>}
                        actions={<Button size="sm" icon={icons.edit}>수정</Button>}
                        footer={
                            <>
                                <Button variant="danger">잠금</Button>
                                <Button variant="primary">저장</Button>
                            </>
                        }
                    >
                        <dl className="desc-list">
                            <dt>아이디</dt>
                            <dd className="cell-mono">user01</dd>
                            <dt>이메일</dt>
                            <dd><a className="btn-text" href="mailto:test@example.com">test@example.com</a></dd>
                            <dt>역할</dt>
                            <dd>학생</dd>
                        </dl>
                    </Panel>
                </Variant>
                <Variant
                    name="flush 패널 (표 · 목록을 가장자리까지) + 건수"
                    source="common/ui/Panel.jsx"
                    block
                    code={`<Panel title="허용 권한" subtitle="12건" flush>
  <ul className="list-group">...</ul>
</Panel>`}
                >
                    <Panel title="허용 권한" subtitle="4건" flush actions={<Button size="sm" icon={icons.add}>추가</Button>}>
                        <ul className="list-group">
                            {["MEMBER_READ", "MEMBER_WRITE", "COURSE_READ", "EXAM_GRADE"].map((code) => (
                                <li key={code}>
                                    <div className="list-item">
                                        <span className="cell-mono">{code}</span>
                                        <span className="list-item-end">
                                            <Button size="sm" variant="text">해제</Button>
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </Variant>
            </Variants>

            <GroupTitle>카드</GroupTitle>
            <Variants wide>
                <Variant
                    name="수치 카드 (StatCard)"
                    source="styles/panel.css · common/ui/StatCard.jsx"
                    block
                    code={`<div className="card-grid">
  <StatCard label="평균 점수" value="87.5" unit="점" hint="지난 시험보다 +4.2" trend="up" />
</div>`}
                >
                    <div className="card-grid">
                        <StatCard label="평균 점수" value="87.5" unit="점" hint="지난 시험보다 +4.2" trend="up" />
                        <StatCard label="출석률" value="96" unit="%" hint="결석 2회" />
                        <StatCard label="미제출 과제" value="3" unit="건" hint="마감 지남 1건" trend="down" />
                        <StatCard label="수강생" value="28" unit="명" />
                    </div>
                </Variant>
                <Variant
                    name="선택 카드 · 강조선 카드"
                    source="styles/panel.css (.card-clickable · .is-selected · .card-accent)"
                    note="누를 수 있는 카드는 <button className='card card-clickable'> + aria-pressed"
                    block
                    code={`
<button type="button" className={\`card card-clickable \${selected ? "is-selected" : ""}\`}
        aria-pressed={selected} onClick={...}>
  <span className="card-header"><span className="card-title">풀스택 28기</span><Badge tone="primary">진행 중</Badge></span>
  <span className="card-meta">2026-03-02 ~ 2026-12-18 · 28명</span>
</button>

<div className="card card-accent">...</div>`}
                >
                    <div className="card-grid">
                        {[
                            ["fullstack", "풀스택 28기", "진행 중", "2026-03-02 ~ 2026-12-18 · 28명"],
                            ["backend", "백엔드 27기", "진행 중", "2026-05-11 ~ 2026-11-30 · 22명"],
                            ["front", "프론트엔드 12기", "종료", "2025-09-01 ~ 2026-02-27 · 19명"],
                        ].map(([id, name, state, meta]) => (
                            <button
                                key={id}
                                type="button"
                                className={`card card-clickable ${selectedCourse === id ? "is-selected" : ""}`}
                                aria-pressed={selectedCourse === id}
                                onClick={() => setSelectedCourse(id)}
                            >
                                <span className="card-header">
                                    <span className="card-title">{name}</span>
                                    <Badge tone={state === "종료" ? "neutral" : "primary"}>{state}</Badge>
                                </span>
                                <span className="card-meta">{meta}</span>
                            </button>
                        ))}
                        <div className="card card-accent">
                            <h3 className="card-title">홍길동</h3>
                            <p className="card-meta">풀스택 28기 · 수강 중</p>
                            <p className="card-body">왼쪽 강조선 카드: 화면 맨 위 요약 정보</p>
                        </div>
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>안내 상자 (Callout)</GroupTitle>
            <Variants>
                <Variant
                    name="tone 4가지"
                    source="styles/panel.css · common/ui/Callout.jsx"
                    note="화면에 머무는 안내. 결과 알림은 토스트, 화면을 못 쓰는 상태는 StatusBox"
                    block
                    code={`
<Callout tone="warning" title="주의">
  이 역할을 빼면 지금 계정이 메뉴 관리에 들어올 수 없습니다.
</Callout>`}
                >
                    <div className="form-stack">
                        <Callout tone="info">초기 비밀번호는 아이디와 같습니다.</Callout>
                        <Callout tone="success">모든 과제를 제출했습니다.</Callout>
                        <Callout tone="warning" title="주의">
                            이 역할을 빼면 지금 계정이 메뉴 관리에 들어올 수 없습니다.
                        </Callout>
                        <Callout tone="danger">마감이 지났습니다. 제출하면 지각으로 기록됩니다.</Callout>
                    </div>
                </Variant>
                <Variant
                    name="버튼이 있는 안내 (변경 알림)"
                    source="common/ui/Callout.jsx (actions)"
                    note="Role.jsx의 '순서가 변경되었습니다' 바"
                    block
                    code={`
<Callout tone="info" actions={<>
  <Button size="sm">되돌리기</Button>
  <Button size="sm" variant="primary">저장</Button>
</>}>순서가 변경되었습니다.</Callout>`}
                >
                    {orderChanged ? (
                        <Callout
                            tone="info"
                            actions={
                                <>
                                    <Button size="sm" onClick={() => setOrderChanged(false)}>되돌리기</Button>
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => {
                                            setOrderChanged(false);
                                            toast.success("순서를 저장했습니다.");
                                        }}
                                    >
                                        저장
                                    </Button>
                                </>
                            }
                        >
                            순서가 변경되었습니다.
                        </Callout>
                    ) : (
                        <Button size="sm" onClick={() => setOrderChanged(true)}>다시 보기</Button>
                    )}
                </Variant>
            </Variants>

            <GroupTitle>키-값 목록 · 타임라인</GroupTitle>
            <Variants>
                <Variant
                    name="desc-list · desc-list-boxed"
                    source="styles/panel.css"
                    note="라벨 폭은 style={{ '--desc-label-width': '80px' }}로 조절"
                    block
                    code={`
<dl className="desc-list">
  <dt>아이디</dt><dd>user01</dd>
</dl>
<dl className="desc-list desc-list-boxed" style={{ "--desc-label-width": "80px" }}>...</dl>`}
                >
                    <div className="form-stack">
                        <dl className="desc-list">
                            <dt>과정</dt>
                            <dd>풀스택 28기</dd>
                            <dt>기간</dt>
                            <dd>2026-03-02 ~ 2026-12-18</dd>
                            <dt>담당 강사</dt>
                            <dd>김강사</dd>
                        </dl>
                        <dl className="desc-list desc-list-boxed" style={{ "--desc-label-width": "80px" }}>
                            <dt>아이디</dt>
                            <dd className="cell-mono">user01</dd>
                            <dt>이름</dt>
                            <dd>홍길동</dd>
                        </dl>
                    </div>
                </Variant>
                <Variant
                    name="timeline"
                    source="styles/panel.css (MyCounsel 상담 기록)"
                    block
                    code={`
<ol className="timeline">
  <li className="timeline-item">
    <div className="timeline-meta">2026-11-10 <span className="tag">학습</span></div>
    <p className="timeline-body">...</p>
  </li>
</ol>`}
                >
                    <ol className="timeline">
                        <li className="timeline-item">
                            <div className="timeline-meta">
                                2026-11-10 <span className="tag">학습</span>
                            </div>
                            <p className="timeline-body">진도 확인, 복습 자료 안내.</p>
                        </li>
                        <li className="timeline-item">
                            <div className="timeline-meta">
                                2026-10-28 <span className="tag">진로</span>
                            </div>
                            <p className="timeline-body">{"희망 직무: 백엔드\n포트폴리오 방향 상담"}</p>
                        </li>
                    </ol>
                </Variant>
            </Variants>

            <GroupTitle>선택 목록 · 3단 배치</GroupTitle>
            <Variants wide>
                <Variant
                    name="layout-3col + flush Panel + list-group"
                    source="styles/panel.css (메뉴 관리 · 코드 관리 · 권한 화면의 3단)"
                    note="선택 항목: <button className='list-item' aria-current='true'>. 미사용은 is-muted"
                    block
                    code={`
<div className="layout-3col">
  <Panel title="대메뉴" flush actions={<Button size="sm" icon={icons.add}>추가</Button>}>
    <ul className="list-group">
      <li><button type="button" className="list-item" aria-current={selected || undefined}>...</button></li>
    </ul>
  </Panel>
  ...
</div>`}
                >
                    <div className="layout-3col">
                        <Panel title="대메뉴" flush actions={<Button size="sm" icon={icons.add}>추가</Button>}>
                            <ul className="list-group">
                                {MENU_TREE.top.map((name) => (
                                    <li key={name}>
                                        <button
                                            type="button"
                                            className="list-item"
                                            aria-current={top === name || undefined}
                                            onClick={() => {
                                                setTop(name);
                                                setMid(MENU_TREE.mid[name][0]);
                                            }}
                                        >
                                            {name}
                                            <span className="list-item-end">
                                                <Badge>{MENU_TREE.mid[name].length}</Badge>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                        <Panel title="중메뉴" flush actions={<Button size="sm" icon={icons.add}>추가</Button>}>
                            <ul className="list-group">
                                {MENU_TREE.mid[top].map((name) => (
                                    <li key={name}>
                                        <button
                                            type="button"
                                            className={`list-item ${name === "코드 관리" ? "is-muted" : ""}`}
                                            aria-current={mid === name || undefined}
                                            onClick={() => setMid(name)}
                                        >
                                            {name}
                                            {name === "코드 관리" && <span className="list-item-end">(미사용)</span>}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                        <Panel title="소메뉴" flush>
                            <StatusBox type="empty" size="sm" title={`"${mid}" 아래 소메뉴가 없습니다.`} />
                        </Panel>
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>화면 조합 예시: 목록 | 상세</GroupTitle>
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
                                    <Button variant="primary">검색</Button>
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
                                            <Button variant="danger">{selected.locked ? "잠금 해제" : "잠금"}</Button>
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
                                <StatusBox type="empty" title="회원을 선택하세요." />
                            )}
                        </div>
                    </div>
                </Variant>
            </Variants>
        </div>
    );
};
