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
        <>
            <div>
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

                <Section title="Sample Poll">
                    <PollList
                        title={pollData.title}
                        description={pollData.description}
                        pollItemList={pollData.pollItemList}
                    />
                </Section>
            </div>
        </>
    );
};
export default SampleDashboard;
