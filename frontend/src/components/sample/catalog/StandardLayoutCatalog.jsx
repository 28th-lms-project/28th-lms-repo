import { useState, useId } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Badge from "../../common/ui/Badge.jsx";
import PageHeader, { Breadcrumb } from "../../common/ui/PageHeader.jsx";
import SideNav from "../../common/ui/SideNav.jsx";
import { useToast } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons.js";
import Table from "../../common/ui/Table.jsx";
import { Tabs, TabPanel } from "../../common/ui/Tabs.jsx";
import Panel from "../../common/ui/Panel.jsx";
import StatCard from "../../common/ui/StatCard.jsx";
import StatusBox from "../../common/ui/StatusBox.jsx";

/*
 * 표준 UI: 화면 머리 · 사이드 메뉴 · 탭 · 패널 · 카드 · 선택 목록 · 배치 · 팝업 창 틀.
 * 스타일 원본은 src/styles/*.css의 전역 클래스, React 컴포넌트는 common/ui/. 가이드: frontend/docs/ui-style-guide.md 8장
 */

/* ───── 예시 데이터 ───── */
const NAV_GROUPS = [
    {
        key: "system",
        title: "시스템 관리",
        items: [
            { key: "member", title: "회원 관리", icon: icons.setting },
            { key: "role", title: "역할 관리", icon: icons.setting },
            { key: "menu", title: "메뉴 관리", icon: icons.setting },
        ],
    },
    {
        key: "my",
        title: "내 강의실",
        items: [
            { key: "timetable", title: "시간표", icon: icons.home },
            { key: "data", title: "자료실", icon: icons.download },
            { key: "counsel", title: "상담 기록", icon: icons.edit },
        ],
    },
];

/* ───── 예시 데이터 ───── */
const MENU_TREE = {
    top: ["시스템 관리", "과정 관리", "내 강의실"],
    mid: { "시스템 관리": ["회원 관리", "역할 관리", "메뉴 관리", "코드 관리"], "과정 관리": ["과정 목록", "시험 관리"], "내 강의실": ["시간표", "자료실"] },
};

const HOMEWORK = {
    subject: "1주차 과제: 배열 뒤집기",
    endDate: "2026-11-20",
    content: "정수 배열을 받아 순서를 뒤집은 새 배열을 돌려주는 메서드를 작성하세요.\n\n- 원래 배열은 바꾸지 않습니다.\n- 실행 결과 캡처를 함께 올립니다.",
};

const SUBMITTED = ["홍길동", "김철수", "이영희", "최지우"];

const NOT_SUBMITTED = ["박민수", "정해인"];

const PageHeaderGroup = () => {
    return (
        <>
            <GroupTitle>화면 머리 · 브레드크럼</GroupTitle>
            <Variants wide>
                <Variant
                    name="PageHeader (브레드크럼 + 제목 + 설명 + 버튼)"
                    source="styles/nav.css · common/ui/PageHeader.jsx"
                    note={"기존 PageContainer 머리(⌂ > 대 > 중, 22px 제목)를 대신할 모양. 마지막 항목은 현재 화면이라 링크 없이 굵게.\n버튼은 화면 전체에 걸리는 동작만 (등록 · 내보내기). 목록 위 검색은 toolbar"}
                    block
                    code={`
<PageHeader
  crumbs={[
    { title: "시스템 관리", to: "/admin/system" },
    { title: "회원 관리" },
  ]}
  title="회원 관리"
  description="회원 정보 · 역할 · 잠금 상태를 관리합니다."
  actions={<Button variant="primary" icon={icons.add}>회원 등록</Button>}
/>`}
                >
                    <PageHeader
                        crumbs={[{ title: "시스템 관리", to: "/sample" }, { title: "회원 관리" }]}
                        title="회원 관리"
                        description="회원 정보 · 역할 · 잠금 상태를 관리합니다."
                        actions={
                            <>
                                <Button icon={icons.download}>내보내기</Button>
                                <Button variant="primary" icon={icons.add}>
                                    회원 등록
                                </Button>
                            </>
                        }
                    />
                </Variant>
                <Variant
                    name="Breadcrumb만 / 제목만"
                    source="common/ui/PageHeader.jsx (Breadcrumb)"
                    note="상세 · 작성 화면처럼 깊은 곳. crumbs를 비우면 제목만"
                    block
                    code={`<Breadcrumb crumbs={[{ title: "내 강의실", to: "/my" }, { title: "자료실", to: "/my/data" }, { title: "1주차 강의자료" }]} />
<PageHeader title="대시보드" />`}
                >
                    <Breadcrumb crumbs={[{ title: "내 강의실", to: "/sample" }, { title: "자료실", to: "/sample" }, { title: "1주차 강의자료" }]} />
                    <div style={{ marginTop: "20px" }}>
                        <PageHeader title="대시보드" />
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const SideNavGroup = () => {
    /* 메뉴 */
    const [currentMenu, setCurrentMenu] = useState("member");

    return (
        <>
            <GroupTitle>사이드 메뉴</GroupTitle>
            <Variants>
                <Variant
                    name="SideNav (그룹 접기 · 현재 화면)"
                    source="styles/nav.css · common/ui/SideNav.jsx"
                    note={"색은 --color-sidebar-* 토큰 (실제 menu/SideMenu와 같음). 배경 · 현재 메뉴 색은 옆의 테마를 따름.\n그룹 제목을 누르면 접힘. 현재 화면은 aria-current=\"page\" (강조 글자 + 왼쪽 선).\n다크 모드와 상관없이 항상 어두움"}
                    code={`
<SideNav
  groups={menuGroups}        // [{ key, title, items: [{ key, title, icon }] }]
  currentKey={currentMenuKey}
  onSelect={(item) => navigate(item.path)}
/>`}
                >
                    <div style={{ width: "240px", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                        <SideNav groups={NAV_GROUPS} currentKey={currentMenu} onSelect={(item) => setCurrentMenu(item.key)} ariaLabel="메뉴 (예시)" />
                    </div>
                </Variant>
                <Variant name="어떤 것을 쓸까" note="비슷해 보이는 내비게이션의 쓰임 구분">
                    <dl className="desc-list" style={{ "--desc-label-width": "120px", width: "100%" }}>
                        <dt>화면 이동</dt>
                        <dd>SideNav (앱 왼쪽) · PageHeader 브레드크럼</dd>
                        <dt>화면 안 구역 전환</dt>
                        <dd>Tabs (세로 탭 · 회색 탭 바 대신)</dd>
                        <dt>목록에서 하나 고르기</dt>
                        <dd>list-group (3단 메뉴 · CourseMain 세로 탭 대신)</dd>
                        <dt>값 고르기</dt>
                        <dd>아래 &quot;선택&quot; (ChoiceGroup · Switch)</dd>
                    </dl>
                </Variant>
            </Variants>
        </>
    );
};

const TabsGroup = () => {
    /* 탭 */
    const tabsId = useId();
    const pillsId = useId();
    const [tab, setTab] = useState("timetable");
    const [pill, setPill] = useState("choice");

    return (
        <>
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
        </>
    );
};

const PanelGroup = () => {
    return (
        <>
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
        </>
    );
};

const CardGroup = () => {

    /* 카드 · 목록 */
    const [selectedCourse, setSelectedCourse] = useState("fullstack");

    return (
        <>
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
  <span className="card-header"><span className="card-title">풀스택 28기</span><Badge tone="info">진행 중</Badge></span>
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
        </>
    );
};

const ListLayoutGroup = () => {
    const [top, setTop] = useState("시스템 관리");
    const [mid, setMid] = useState("회원 관리");

    return (
        <>
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
        </>
    );
};

const PopupGroup = () => {
    const toast = useToast();

    return (
        <>
            <GroupTitle>팝업 창 틀</GroupTitle>
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
        </>
    );
};

export const StandardLayoutCatalog = () => (
    <div>
        <p className={styles.standardIntro}>화면 머리 · 사이드 메뉴 · 탭 · 패널 · 카드 · 선택 목록 · 배치 · 팝업 창 틀. 스타일 원본: styles/nav.css · tabs.css · panel.css</p>
        <PageHeaderGroup />
        <SideNavGroup />
        <TabsGroup />
        <PanelGroup />
        <CardGroup />
        <ListLayoutGroup />
        <PopupGroup />
    </div>
);
