import PageContainer from '../common/PageContainer';
import { Chart } from "./Chart.jsx";
import { PollList } from "./Poll.jsx";
import { chartData } from "../../assets/mocks/chart.json.js";
import { pollData } from "../../assets/mocks/poll.json.js";
import { Grid } from "./Grid.jsx";
import { gridData } from "../../assets/mocks/grid.json.js";
import { useRef, useState } from "react";
import { Alert, Confirm } from "./Modal.jsx";
import { Button, FileField } from "./input/Input.jsx";
import { Paginator } from "./Paginator.jsx";
import { title } from "../../utils/window.js";
import { Section } from "../Section.jsx";
import { IconButton } from "./input/IconButton.jsx";
import { icons } from "./input/icons.js";
import catalogStyles from "./catalog/Catalog.module.css";
import { TokenCatalog } from "./catalog/TokenCatalog.jsx";
import { ButtonCatalog } from "./catalog/ButtonCatalog.jsx";
import { FormCatalog } from "./catalog/FormCatalog.jsx";
import { ListCatalog } from "./catalog/ListCatalog.jsx";
import { NavigationCatalog } from "./catalog/NavigationCatalog.jsx";
import { FeedbackCatalog } from "./catalog/FeedbackCatalog.jsx";
import { LayoutCatalog } from "./catalog/LayoutCatalog.jsx";
import { OverlayCatalog } from "./catalog/OverlayCatalog.jsx";
import { StandardCatalog } from "./catalog/StandardCatalog.jsx";

/*
 * UI 카탈로그: 프론트엔드 전체 화면에서 쓰는 UI를 현재 모양 그대로 모은 것.
 * 공통 스타일(index.css) · 디자인 시스템을 정하기 위한 비교용. 가이드: frontend/docs/ui-style-guide.md
 */
/** 표준 UI (디자인 시스템): 새 화면은 이것을 쓴다 */
const STANDARD = [
    { id: "standard-ui", title: "표준 UI (버튼 · 입력 · 배지 · 상태 상자)", Component: StandardCatalog },
];

/** 통일 전 현재 UI (비교용) */
const CATALOG = [
    { id: "catalog-tokens", title: "토큰 (색 · 글자 · 모서리 · 높이)", Component: TokenCatalog },
    { id: "catalog-buttons", title: "버튼", Component: ButtonCatalog },
    { id: "catalog-forms", title: "입력 · 폼", Component: FormCatalog },
    { id: "catalog-lists", title: "리스트 · 표", Component: ListCatalog },
    { id: "catalog-navigation", title: "내비게이션 (브레드크럼 · 탭 · 메뉴 · 페이지)", Component: NavigationCatalog },
    { id: "catalog-feedback", title: "피드백 (배지 · 안내 · 오류 · 토스트)", Component: FeedbackCatalog },
    { id: "catalog-layout", title: "레이아웃 (패널 · 카드 · 배치)", Component: LayoutCatalog },
    { id: "catalog-overlays", title: "오버레이 (모달 · 팝업)", Component: OverlayCatalog },
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

const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const SampleDashboard = () => {
    title("DashBoard!");

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
            <nav className={catalogStyles.toc} aria-label="샘플 목차">
                <span className={catalogStyles.tocGroup}>표준</span>
                {STANDARD.map(({ id, title }) => (
                    <button key={id} type="button" onClick={() => scrollTo(id)}>
                        {title.split(" (")[0]}
                    </button>
                ))}
                <span className={catalogStyles.tocGroup}>통일 전 (현재)</span>
                {CATALOG.map(({ id, title }) => (
                    <button key={id} type="button" onClick={() => scrollTo(id)}>
                        {title.split(" (")[0]}
                    </button>
                ))}
                <span className={catalogStyles.tocGroup}>기존 샘플</span>
                {LEGACY.map(({ id, title }) => (
                    <button key={id} type="button" onClick={() => scrollTo(id)}>
                        {title}
                    </button>
                ))}
            </nav>

            {[...STANDARD, ...CATALOG].map(({ id, title, Component }) => (
                <div key={id} id={id} className={catalogStyles.anchor}>
                    <Section title={title}>
                        <Component />
                    </Section>
                </div>
            ))}

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
        </PageContainer>
    );
};
export default SampleDashboard;