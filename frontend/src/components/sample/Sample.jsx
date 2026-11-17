import PageContainer from '../common/PageContainer';
import { Chart } from "./Chart.jsx";
import { PollList } from "./Poll.jsx";
import { chartData } from "../../assets/mocks/chart.json.js";
import { pollData } from "../../assets/mocks/poll.json.js";
import { Grid } from "./Grid.jsx";
import { gridData } from "../../assets/mocks/grid.json.js";
import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Confirm } from "./Modal.jsx";
import { Button, FileField } from "./input/Input.jsx";
import { Paginator } from "./Paginator.jsx";
import { title } from "../../utils/window.js";
import { Section } from "../Section.jsx";
import { IconButton } from "./input/IconButton.jsx";
import { icons } from "./input/icons.js";
import catalogStyles from "./catalog/Catalog.module.css";
import { LegacyTokenCatalog, TokenCatalog } from "./catalog/TokenCatalog.jsx";
import { ButtonCatalog } from "./catalog/ButtonCatalog.jsx";
import { FormCatalog } from "./catalog/FormCatalog.jsx";
import { ListCatalog } from "./catalog/ListCatalog.jsx";
import { NavigationCatalog } from "./catalog/NavigationCatalog.jsx";
import { FeedbackCatalog } from "./catalog/FeedbackCatalog.jsx";
import { LayoutCatalog } from "./catalog/LayoutCatalog.jsx";
import { OverlayCatalog } from "./catalog/OverlayCatalog.jsx";
import { CourseLegacyCatalog } from "./catalog/CourseLegacyCatalog.jsx";
import { StandardInputCatalog } from "./catalog/StandardInputCatalog.jsx";
import { StandardFeedbackCatalog } from "./catalog/StandardFeedbackCatalog.jsx";
import { StandardDataCatalog } from "./catalog/StandardDataCatalog.jsx";
import { StandardLayoutCatalog } from "./catalog/StandardLayoutCatalog.jsx";
import { StandardContentCatalog } from "./catalog/StandardContentCatalog.jsx";
import { StandardScreenCatalog } from "./catalog/StandardScreenCatalog.jsx";
import { PartHeader } from "./catalog/CatalogParts.jsx";
import UiButton from "../common/ui/Button.jsx";
import { Tabs, TabPanel } from "../common/ui/Tabs.jsx";

/*
 * 디자인 시스템 페이지
 * - 표준: 새 화면이 쓰는 UI (토큰 · 공통 클래스 · common/ui). 다크 모드를 따른다.
 * - 통일 전: 프론트엔드 화면들의 현재 모양 그대로 (비교용). 다크 모드에서도 밝게 고정.
 * 가이드: frontend/docs/ui-style-guide.md
 */
/**
 * 표준 UI (디자인 시스템): 새 화면은 이것을 쓴다. 부품의 역할로 묶음 (가이드 1장).
 * 기초 → 동작 · 입력 → 표시 · 상태 → 데이터 → 배치 · 탐색 → 내용 → 화면 예시
 */
const STANDARD = [
    { id: "standard-foundation", label: "기초", title: "기초 (토큰 · 테마)", Component: TokenCatalog },
    { id: "standard-input", label: "동작 · 입력", title: "동작 · 입력 (버튼 · 입력 · 폼 · 검색 셀렉트 · 선택 · 날짜 · 숫자 · 기간 · 검색 · 파일 · 반복 입력 행)", Component: StandardInputCatalog },
    { id: "standard-feedback", label: "표시 · 상태", title: "표시 · 상태 (배지 · 태그 · 안내 상자 · 상태 상자 · 진행 막대 · 토스트 · 확인 창 · 모달)", Component: StandardFeedbackCatalog },
    { id: "standard-data", label: "데이터", title: "데이터 (표 · 페이지 이동 · 표 확장 · 두 목록 사이 옮기기)", Component: StandardDataCatalog },
    { id: "standard-layout", label: "배치 · 탐색", title: "배치 · 탐색 (화면 머리 · 브레드크럼 · 사이드 메뉴 · 탭 · 패널 · 카드 · 선택 목록 · 3단 배치 · 팝업 창 틀)", Component: StandardLayoutCatalog },
    { id: "standard-content", label: "내용", title: "내용 (시험 문제 · 댓글 · 키-값 목록 · 타임라인 · 인용 · 세로 키-값 · 상자 목록)", Component: StandardContentCatalog },
    { id: "standard-screen", label: "화면 예시", title: "화면 예시 (목록 | 상세 · 상세 · 대시보드 · 오류 · 과정 · 시험 · 시험 응시 · 문제 은행 · 과제 · 강의실 · 설문 · 시스템 관리 · 로그인 · 상담)", Component: StandardScreenCatalog },
];

/** 통일 전 현재 UI (비교용) */
const CATALOG = [
    { id: "catalog-legacy-tokens", title: "토큰 (통일 전 값: 색 · 글자 크기 · 모서리 · 높이 · 포커스)", Component: LegacyTokenCatalog },
    { id: "catalog-buttons", title: "버튼", Component: ButtonCatalog },
    { id: "catalog-forms", title: "입력 · 폼", Component: FormCatalog },
    { id: "catalog-lists", title: "리스트 · 표", Component: ListCatalog },
    { id: "catalog-navigation", title: "내비게이션 (브레드크럼 · 탭 · 메뉴 · 페이지)", Component: NavigationCatalog },
    { id: "catalog-feedback", title: "피드백 (배지 · 안내 · 오류 · 토스트)", Component: FeedbackCatalog },
    { id: "catalog-layout", title: "레이아웃 (패널 · 카드 · 배치)", Component: LayoutCatalog },
    { id: "catalog-overlays", title: "오버레이 (모달 · 팝업)", Component: OverlayCatalog },
    { id: "catalog-course", title: "과정 · 시험 · 문제 은행 · 과제 · 설문 화면 (admin/course · test · survey)", Component: CourseLegacyCatalog },
];

/** 원래 있던 샘플 섹션 (sample/ 컴포넌트 사용) */
const LEGACY = [
    { id: "sample-buttons", title: "Buttons" },
    { id: "sample-modals", title: "Modals" },
    { id: "sample-file", title: "FileInput" },
    { id: "sample-grids", title: "Grids" },
    { id: "sample-paginator", title: "Paginator" },
    { id: "sample-chart", title: "Chart" },
    { id: "sample-poll", title: "Poll" },
];

/** 구역 탭. 선택은 주소(?part=)에 남아서 새로고침 · 링크 공유해도 그대로 */
const PART_TABS = [
    { id: "standard", label: "표준" },
    { id: "legacy", label: "통일 전 (현재)" },
    { id: "old", label: "기존 샘플" },
];

/** 탭별 목차 */
const TOC = {
    standard: STANDARD.map(({ id, label }) => ({ id, label })),
    legacy: CATALOG.map(({ id, title }) => ({ id, label: title.split(" (")[0] })),
    old: LEGACY.map(({ id, title }) => ({ id, label: title })),
};

/** 섹션 위쪽이 고정 목차(toc)에 가리지 않게 목차 높이 + 여유만큼 띄워서 이동 */
const SCROLL_GAP = 16;
const scrollToSection = (id, tocEl) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.style.scrollMarginTop = `${(tocEl?.offsetHeight ?? 0) + SCROLL_GAP}px`;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
};

/*
 * 다크 모드 (샘플 페이지에서만): <html data-color-scheme="dark">를 이 페이지에 있는 동안만 붙인다.
 * 페이지를 떠나면 지워서 다른 화면은 항상 밝은 모드. 선택은 이 브라우저에만 기억.
 */
const SCHEME_KEY = "sample-color-scheme";

const readScheme = () => {
    try {
        return localStorage.getItem(SCHEME_KEY) === "dark" ? "dark" : "light";
    } catch {
        return "light";
    }
};

const applyScheme = (scheme) => {
    if (scheme === "dark") document.documentElement.dataset.colorScheme = "dark";
    else delete document.documentElement.dataset.colorScheme;
};


const SampleDashboard = () => {
    title("DashBoard!");

    // 첫 렌더 전에 속성을 붙여야 토큰 값 표시(TokenCatalog)가 맞음
    const [scheme, setScheme] = useState(() => {
        const saved = readScheme();
        applyScheme(saved);
        return saved;
    });

    useEffect(() => {
        applyScheme(scheme);
        return () => applyScheme("light");
    }, [scheme]);

    const toggleScheme = () => {
        const next = scheme === "dark" ? "light" : "dark";
        applyScheme(next); // 다시 그리기 전에 적용 (토큰 값 표시)
        try {
            localStorage.setItem(SCHEME_KEY, next);
        } catch {
            /* 저장 못 해도 지금 화면에는 적용됨 */
        }
        setScheme(next);
    };


    /* 구역 탭 */
    const tabsId = useId();
    const tocRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const part = TOC[searchParams.get("part")] ? searchParams.get("part") : "standard";
    const tocItems = TOC[part];
    const changePart = (next) => {
        setSearchParams(next === "standard" ? {} : { part: next }, { replace: true });
    };

    const [activePage, setActivePage] = useState(0);

    const normalGridRef = useRef();
    const gridRef = useRef();
    const checkedGridRef = useRef();
    const editableGridRef = useRef();

    const fileRef = useRef();
    const alertRef = useRef();
    const alertRef2 = useRef();
    const confirmRef = useRef();
    const confirmRef2 = useRef();

    const [content, setContent] = useState(gridData.content);
    const changeContentHandler = (rowIndex, index, newText) => {
        setContent((prevContent) => {
            const newContent = [...prevContent];
            newContent[rowIndex][index].value = newText;
            return newContent;
        });
    };
    return (
        <PageContainer>
            <div ref={tocRef} className={catalogStyles.toc}>
                <div className={catalogStyles.tocRow}>
                    <Tabs idBase={tabsId} items={PART_TABS} value={part} onChange={changePart} ariaLabel="샘플 구역" className={catalogStyles.partTabs} />
                    <span className={catalogStyles.tocEnd}>
                        <UiButton size="sm" aria-pressed={scheme === "dark"} onClick={toggleScheme}>
                            {scheme === "dark" ? "☀ 밝은 모드" : "☾ 다크 모드"}
                        </UiButton>
                    </span>
                </div>
                <nav className={catalogStyles.tocRow} aria-label="이 구역 목차">
                    {tocItems.map(({ id, label }) => (
                        <button key={id} type="button" className={catalogStyles.tocLink} onClick={() => scrollToSection(id, tocRef.current)}>
                            {label}
                        </button>
                    ))}
                </nav>
            </div>

            <TabPanel idBase={tabsId} tabId={part}>
            {/* 표준: 토큰을 쓰므로 다크 모드를 따름 */}
            {part === "standard" && (
            <div className={catalogStyles.themed}>
                <PartHeader id="part-standard" part="PART 1" title="표준" tone="standard">
                    {"새 화면은 이 구역의 토큰 · 공통 클래스(src/styles) · 컴포넌트(common/ui)를 씁니다.\n다크 모드를 지원합니다."}
                </PartHeader>
                {STANDARD.map(({ id, title, Component }) => (
                    <div key={id} id={id} className={catalogStyles.anchor}>
                        <Section title={title}>
                            <Component />
                        </Section>
                    </div>
                ))}
            </div>
            )}

            {/* 통일 전 · 기존 샘플: hex를 직접 써서 다크 모드에서도 밝게 고정 */}
            {part === "legacy" && (
            <div data-color-scheme="light">
            <PartHeader id="part-legacy" part="PART 2" title="통일 전 (현재)" tone="legacy">
                {"지금 각 화면에 흩어져 있는 UI를 모양 그대로 모은 비교용입니다. 새 코드에서 따라 쓰지 마세요.\n색을 직접 적어서(토큰 미사용) 다크 모드에서도 밝게 보입니다."}
            </PartHeader>
            {CATALOG.map(({ id, title, Component }) => (
                <div key={id} id={id} className={catalogStyles.anchor}>
                    <Section title={title}>
                        <Component />
                    </Section>
                </div>
            ))}
            </div>
            )}

            {part === "old" && (
            <div data-color-scheme="light">
            <PartHeader id="part-old" part="PART 3" title="기존 샘플" tone="old">
                {"처음부터 있던 sample/ 컴포넌트 예시 (IconButton · Alert/Confirm · Grid · Paginator · Chart · Poll).\n일부 화면이 아직 이 컴포넌트를 씁니다."}
            </PartHeader>
            <div>
                <div id="sample-buttons" className={catalogStyles.anchor} />
                <Section title="Sample Buttons">
                    <IconButton color="#666" icon={icons.add}>
                        추가
                    </IconButton>
                    <IconButton color="#666" icon={icons.edit}>
                        수정
                    </IconButton>
                    <IconButton color="#666" icon={icons.close}>
                        닫기
                    </IconButton>
                    <IconButton color="#666" icon={icons.setting}>
                        설정
                    </IconButton>
                    <IconButton color="#666" icon={icons.fullStar}>
                        즐겨찾기(완료)
                    </IconButton>
                    <IconButton color="#666" icon={icons.star}>
                        즐겨찾기(미완료)
                    </IconButton>
                    <IconButton color="#666" icon={icons.login}>
                        로그인
                    </IconButton>
                    <IconButton color="#666" icon={icons.logout}>
                        로그아웃
                    </IconButton>
                    <IconButton color="#666" icon={icons.download}>
                        다운로드
                    </IconButton>
                    <IconButton color="#666" icon={icons.downloadDone}>
                        다운로드 완료
                    </IconButton>
                    <IconButton
                        color="#666"
                        alwaysIconRotate={true}
                        icon={icons.progress}
                    >
                        진행중
                    </IconButton>
                    <IconButton color="#666" icon={icons.delete}>
                        삭제
                    </IconButton>
                    <IconButton color="#666" hoverIconRotate={true} icon={icons.refresh}>
                        새로고침
                    </IconButton>
                    <IconButton color="#666" icon={icons.sort}>
                        정렬
                    </IconButton>
                    <IconButton
                        color="#666"
                        backgroundColor="transparent"
                        icon={icons.add}
                    >
                        추가
                    </IconButton>
                    <IconButton color="#666" icon={icons.add} />

                    <IconButton color="#666">아이콘 없는 버튼</IconButton>
                </Section>

                <div id="sample-modals" className={catalogStyles.anchor} />
                <Section title="Sample Modals">
                    <Alert
                        ref={alertRef}
                        title="Test Modal!"
                        content="hahahahah ahahahahahaha ahahahahah"
                    />
                    <Alert
                        ref={alertRef2}
                        title="Test Modal!"
                        draggable={true}
                        content="hahahahah ahahahahahaha ahahahahah"
                    >
                        <ul>
                            <li>Test 1</li>
                            <li>Test 2</li>
                        </ul>
                    </Alert>
                    <Confirm
                        ref={confirmRef}
                        title="Test Modal!"
                        content="hahahahah ahahahahahaha ahahahahah"
                        positiveButtonText="확인"
                        negativeButtonText="취소"
                        onClickPositive={() => {
                            alert("OK!");
                        }}
                        onClickNegative={() => {
                            alert("Cancel");
                        }}
                    />
                    <Confirm
                        ref={confirmRef2}
                        title="Test Modal!"
                        draggable={true}
                        content="hahahahah ahahahahahaha ahahahahah"
                    >
                        asdfdsfssdf
                    </Confirm>
                    <Button
                        text="Open Modal"
                        onClick={() => {
                            alertRef.current.open();
                        }}
                    />
                    <Button
                        text="Open Modal2"
                        onClick={() => {
                            alertRef2.current.open();
                        }}
                    />
                    <Button
                        text="Open Confirm"
                        onClick={() => {
                            confirmRef.current.open();
                        }}
                    />
                    <Button
                        text="Open Confirm2"
                        onClick={() => {
                            confirmRef2.current.open();
                        }}
                    />
                </Section>

                <div id="sample-file" className={catalogStyles.anchor} />
                <Section title="Sample FileInput">
                    <div>
                        <FileField
                            preview={true}
                            ref={fileRef}
                            id="fileField"
                            multiple={true}
                            name="file"
                            labelText="첨부파일"
                        />
                    </div>
                </Section>

                <div id="sample-grids" className={catalogStyles.anchor} />
                <Section title="Sample Grids">
                    <Grid
                        ref={editableGridRef}
                        title="Editable Test Grid"
                        checkable={true}
                        checkValue="id"
                        columnStyle={gridData.columnStyle}
                        header={gridData.header}
                        content={content}
                        footer={<div>abcd</div>}
                        style={{
                            margin: "10px 0px",
                        }}
                        editable={true}
                        clickableColumn={{
                            0: (value) => {
                                alert(value);
                            },
                            1: (value) => {
                                alert(value);
                            },
                        }}
                        onChange={changeContentHandler}
                    />

                    <Grid
                        ref={checkedGridRef}
                        title="Editable + Checkable Test Grid"
                        checkable={true}
                        checkValue="id"
                        header={gridData.header}
                        content={content}
                        style={{
                            margin: "10px 0px",
                        }}
                        editable={true}
                        clickableColumn={{
                            0: (value) => {
                                alert(value);
                            },
                        }}
                        onChange={changeContentHandler}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            checkedGridRef.current.allCheck();
                        }}
                    >
                        Check All
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const items = checkedGridRef.current.getChecked();
                            console.log(items);
                        }}
                    >
                        Get Checked Items
                    </button>

                    <Grid
                        ref={gridRef}
                        title="Clickable Test Grid"
                        columnStyle={gridData.columnStyle}
                        header={gridData.header}
                        content={content}
                        style={{
                            margin: "20px 0px",
                        }}
                        clickableColumn={{
                            0: (value) => {
                                alert(value);
                            },
                        }}
                        onChange={changeContentHandler}
                    />

                    <Grid
                        ref={normalGridRef}
                        title="Test Grid"
                        header={gridData.header}
                        content={content}
                        style={{
                            margin: "10px 0px",
                        }}
                    />
                </Section>

                <div id="sample-paginator" className={catalogStyles.anchor} />
                <Section title="Sample Paginator">
                    <Paginator
                        id="grid-paginator"
                        start={parseInt(activePage / 10) * 10}
                        countPerPageGroup={10}
                        activePage={activePage}
                        setActivePage={setActivePage}
                        totalPageCount={101}
                    />
                </Section>

                <div id="sample-chart" className={catalogStyles.anchor} />
                <Section title="Sample Chart">
                    <Chart
                        type="bar"
                        height={350}
                        categories={chartData.categories}
                        series={chartData.series}
                    />
                </Section>

                <Section title="Sample Chart">
                    <Chart
                        type="line"
                        height={350}
                        categories={chartData.categories}
                        series={chartData.series}
                    />
                </Section>

                <div id="sample-poll" className={catalogStyles.anchor} />
                <Section title="Sample Poll">
                    <PollList
                        title={pollData.title}
                        description={pollData.description}
                        pollItemList={pollData.pollItemList}
                    />
                </Section>
            </div>
            </div>
            )}
            </TabPanel>
        </PageContainer>
    );
};
export default SampleDashboard;