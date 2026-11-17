import { useState } from "react";
import Select from "react-select";
import styles from "./Catalog.module.css";
import { Variant, Variants } from "./CatalogParts.jsx";
import { Grid } from "../Grid.jsx";
import { IconButton } from "../input/IconButton.jsx";
import { FileField } from "../input/Input.jsx";
import { icons } from "../input/icons.js";

/*
 * admin/course · test · survey 화면의 현재 모양 (비교용). 원본의 인라인 스타일 · 클래스를 그대로 옮김.
 * 표준으로 만든 모양은 표준 탭 "화면 예시"에 있다.
 */

const QUESTION_HEADER = [
    { id: "no", title: "번호" },
    { id: "question", title: "문제" },
    { id: "answerType", title: "유형" },
    { id: "pointAlloc", title: "배점" },
];
const QUESTIONS = [
    ["Java의 기본형이 아닌 것은?", "객관식-단항", 5],
    ["JVM이 하는 일을 설명하세요.", "주관식", 10],
    ["String은 불변 객체이다.", "O/X", 5],
    ["배열을 뒤집는 메서드를 작성하세요.", "코드작성", 20],
];
const toContent = (rows, prefix) =>
    rows.map((row, r) => [r + 1, ...row].map((value, c) => ({ id: `${prefix}-${r}-${QUESTION_HEADER[c].id}`, value })));

const TEST_ANSWER_TYPES = [
    { id: "ANSWER_SELECT", name: "객관식-단항" },
    { id: "ANSWER_MULTIPLE", name: "객관식-다항" },
    { id: "ANSWER_CHECK", name: "O/X" },
    { id: "ANSWER_WRITE", name: "주관식" },
    { id: "ANSWER_CODE", name: "코드작성" },
];
const NO_CHOICE_TYPES = ["ANSWER_WRITE", "ANSWER_CODE", "ANSWER_CHECK"];

const COURSE_TABS = ["수강생", "접속시간", "시간표", "과제", "시험", "면접일정", "교육자료", "설문", "상담목록"];
const SURVEY_SUBJECTS = ["수강", "Java", "Spring", "React", "SQL"];
const SURVEY_TYPES = [
    { value: "radio", label: "radio" },
    { value: "checkBox", label: "checkBox" },
    { value: "text", label: "text" },
];

export const CourseLegacyCatalog = () => {
    const [tab, setTab] = useState(0);
    const [left, setLeft] = useState(QUESTIONS.slice(1));
    const [right, setRight] = useState(QUESTIONS.slice(0, 1));
    const [subject, setSubject] = useState("수강");
    const [group, setGroup] = useState("pre");
    const [answerType, setAnswerType] = useState("");
    const [answerCnt, setAnswerCnt] = useState(4);
    const noChoices = NO_CHOICE_TYPES.includes(answerType);

    const clickRow = (event, from, setFrom, setTo) => {
        const cell = event.target.closest("li[data-row-index]");
        if (!cell) return;
        const index = Number(cell.dataset.rowIndex);
        const row = from[index];
        if (!row) return;
        setFrom(from.filter((_, i) => i !== index));
        setTo((prev) => [...prev, row]);
    };

    return (
        <div>
            <p className={styles.note}>
                admin/course · test · survey 화면의 지금 모양입니다. 표준으로 바꾼 모양은 표준 탭 &quot;화면 예시&quot;에 있습니다.
            </p>
            <Variants wide>
                <Variant
                    name="과정 상세 머리 + 탭 (IconButton 9개)"
                    source="admin/course/list/CourseItem.jsx"
                    note={"제목 h3 + 기간 span + 진행률 글자 + 강사 이름. 탭은 IconButton에 className=\"active\"를 주지만 전역 .active가 없어 선택 표시가 안 보임 (pageList 클래스도 정의 없음)"}
                    block
                >
                    <div className="section" style={{ padding: "1rem" }}>
                        <h3>풀스택 개발자 과정 28기</h3>
                        <span>2026-06-01 ~ 2026-11-30</span>
                        <div>92% 진행중 </div>
                        <div>김강사</div>
                        <ul className="pageList" style={{ padding: 0 }}>
                            {COURSE_TABS.map((label, index) => (
                                <li key={label} style={{ display: "inline-block" }}>
                                    <IconButton className={index === tab ? "active" : undefined} onClick={() => setTab(index)}>
                                        {label}
                                    </IconButton>
                                </li>
                            ))}
                        </ul>
                        <div>[{COURSE_TABS[tab]}] 내용</div>
                    </div>
                </Variant>

                <Variant
                    name="과정 등록 폼 (h3 라벨 + 스타일 없는 입력)"
                    source="admin/course/add/CourseAdd.jsx"
                    note="라벨 대신 h3, 입력은 브라우저 기본 모양, 강사 · 수강생은 react-select 기본 테마, 시간표는 sample FileField"
                    block
                >
                    <div className="section" style={{ padding: "1rem" }}>
                        <div className="section-content">
                            <h3>과정 명</h3>
                            <input type="text" placeholder="과정 명" />
                            <h3>과정 정보</h3>
                            <input type="text" placeholder="과정 기수" />
                            <div className={styles.selectWrap}>
                                <Select options={[{ value: "t1", label: "김강사" }]} placeholder="강사 선택" />
                            </div>
                            <h3>과정 일정</h3>
                            <input type="date" />
                            <input type="date" />
                            <h3>수강생</h3>
                            <div className={styles.selectWrapWide}>
                                <Select options={[{ value: "s1", label: "홍길동" }]} isMulti placeholder="수강생 선택" />
                            </div>
                            <h3>시간표</h3>
                            <div>
                                <FileField id="legacy-course-file" name="file" multiple preview labelText="시간표 파일을 업로드 하세요" />
                            </div>
                            <div>
                                <IconButton color="#666" icon={icons.add}>
                                    등록
                                </IconButton>
                                <IconButton color="#666" icon={icons.close}>
                                    취소
                                </IconButton>
                            </div>
                        </div>
                    </div>
                </Variant>

                <Variant
                    name="시험 문제 고르기 (Grid 두 개, 행을 누르면 옮겨짐)"
                    source="admin/course/CourseTableComponent/ExamQuestionPicker.jsx"
                    note="2열 grid 안에 h4 + Grid. 누르면 바로 옮겨져서 실수로 누르면 되돌리기 어렵고, 어느 쪽으로 가는지 표시가 없음. 키보드로는 옮길 수 없음"
                    block
                >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
                        <div onClick={(e) => clickRow(e, left, setLeft, setRight)}>
                            <h4>Java 문제 ({left.length})</h4>
                            <Grid header={QUESTION_HEADER} content={toContent(left, "l")} columnStyle="60px 1fr 100px 70px" />
                        </div>
                        <div onClick={(e) => clickRow(e, right, setRight, setLeft)}>
                            <h4>선택된 문제 ({right.length})</h4>
                            <Grid header={QUESTION_HEADER} content={toContent(right, "r")} columnStyle="60px 1fr 100px 70px" />
                        </div>
                    </div>
                </Variant>

                <Variant
                    name="문제 은행: 문제 추가 폼 (AddTest · UpdateTest)"
                    source="admin/test/test/AddTest.jsx · UpdateTest.jsx · AddTest.module.css"
                    note={"[문제 추가]를 누르면 취소 · 등록 버튼 아래에 폼이 열림. 수정(UpdateTest)도 같은 모양에 값만 채워짐.\n유형 라디오의 label이 입력과 연결되지 않아 글자를 눌러도 안 골라짐. 문제 · 부연 문제는 라벨 없이 placeholder만.\n정답 번호 · 보기 개수를 숫자 칸으로 따로 넣고, 보기 칸은 개수만큼 보임. 오류는 서버 응답(#b42318 글자)으로만 표시"}
                    block
                >
                    <IconButton icon={icons.close}>취소</IconButton>
                    <IconButton icon={icons.edit}>등록</IconButton>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "80%" }}>
                        <div style={{ display: "flex", flexDirection: "row", flexWrap: "nowrap", gap: "1rem", width: "100%" }}>
                            {TEST_ANSWER_TYPES.map((type) => (
                                <div key={type.id}>
                                    <input
                                        type="radio"
                                        name="legacy-answer-type"
                                        value={type.id}
                                        checked={answerType === type.id}
                                        onChange={() => setAnswerType(type.id)}
                                    />
                                    <label>{type.name}</label>
                                </div>
                            ))}
                        </div>
                        <textarea style={{ width: "80%" }} placeholder="문제 내용"></textarea>
                        <textarea placeholder="부연 문제"></textarea>
                        {(answerType === "ANSWER_WRITE" || answerType === "ANSWER_CODE") && <p>수강생이 작성한 답변은 제출 후 강사가 채점합니다.</p>}
                        {answerType === "ANSWER_CHECK" && (
                            <fieldset>
                                <legend>정답</legend>
                                {["O", "X"].map((option) => (
                                    <label key={option}>
                                        <input type="radio" name="legacy-ox" value={option} />
                                        {option}
                                    </label>
                                ))}
                            </fieldset>
                        )}
                        {answerType === "ANSWER_MULTIPLE" && (
                            <fieldset>
                                <legend>정답 (2개 이상 선택)</legend>
                                {[1, 2, 3, 4, 5]
                                    .filter((num) => num <= Number(answerCnt))
                                    .map((num) => (
                                        <label key={num}>
                                            <input type="checkbox" value={String(num)} />
                                            {num}번 보기
                                        </label>
                                    ))}
                            </fieldset>
                        )}
                        <div hidden={noChoices || answerType === "ANSWER_MULTIPLE"}>
                            <input type="number" min="1" max={answerCnt} placeholder={`정답은 1~${answerCnt}사이의 값을 입력하세요`} />
                        </div>
                        <div>
                            <label>배점</label>
                            <input type="number" min="1" max="4" placeholder="배점 (1~4)" defaultValue={4} />
                        </div>
                        <div hidden={noChoices}>
                            <label>보기</label>
                            <input type="number" min={answerType === "ANSWER_MULTIPLE" ? "2" : "1"} max="5" value={answerCnt} onChange={(e) => setAnswerCnt(e.target.value)} />개
                        </div>
                        {[1, 2, 3, 4, 5].map((num, index) => (
                            <div key={num} hidden={noChoices || index >= Number(answerCnt)}>
                                <input type="text" placeholder={`보기 ${num}`} />
                            </div>
                        ))}
                    </div>
                </Variant>

                <Variant
                    name="과제 상세 (인라인 스타일 65% | 30%)"
                    source="admin/course/CourseTableComponent/HomeworkItem.jsx · HomeworkSubmitStatus.jsx"
                    note="제목 h3 + 스타일 없는 수정 · 삭제 버튼, 제출 현황 13px, 본문 | 댓글을 0.3px 검정 테두리로 나눔. 마감 안내는 12px #d93025"
                    block
                >
                    <h3 style={{ marginLeft: "10px" }}>1주차 과제: 배열 뒤집기 - (2026-11-20 제출마감)</h3>
                    <button type="button">수정</button>
                    <button type="button">삭제</button>
                    <div style={{ margin: "5px 10px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "5px" }}>
                        <div>
                            <strong>2명 과제 미제출</strong>: 박민수, 정해인
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <input type="number" min={1} placeholder="명수" style={{ width: "70px", padding: "3px 5px" }} />
                            <IconButton>제출자 랜덤 뽑기</IconButton>
                        </div>
                    </div>
                    <div className="section" style={{ flexDirection: "row", border: "0.3px solid #000", margin: "10px", padding: "10px" }}>
                        <div style={{ width: "65%", minWidth: "300px", minHeight: "200px", borderRight: "0.3px solid #000f" }}>
                            <div style={{ whiteSpace: "pre-wrap" }}>{"정수 배열을 받아 순서를 뒤집은 새 배열을 돌려주는 메서드를 작성하세요."}</div>
                        </div>
                        <div style={{ display: "flex", width: "30%", minWidth: "200px", minHeight: "200px", marginRight: "10px", padding: "3px", flexDirection: "column" }}>
                            <div style={{ fontSize: "12px" }}>
                                <div>홍길동 : github.com/hong/week1 제출합니다.</div>
                                <div>등록일 : 2026-11-15</div>
                            </div>
                            <div style={{ marginTop: "auto", paddingTop: "5px", display: "flex", justifyContent: "flex-end" }}>
                                <IconButton style={{ marginRight: "5px" }}>댓글 작성</IconButton>
                                <IconButton>댓글 새로고침</IconButton>
                            </div>
                        </div>
                    </div>
                </Variant>

                <Variant
                    name="설문 편집 (회색 탭 바 + 인라인 입력 + 미리보기)"
                    source="admin/survey/survey/Survey.jsx · Survey.module.css"
                    note="과목 탭 · 사전/사후 탭은 li에 active 클래스, 문항은 입력 30% + 삭제 버튼, 보기마다 입력 + 삭제, 미리보기는 스타일 없음 (surveyPreview 클래스 정의 없음)"
                    block
                >
                    <div className={styles.legacySurveyContainer}>
                        <ul className={styles.legacySurveyHeader}>
                            {SURVEY_SUBJECTS.map((s) => (
                                <li key={s} className={subject === s ? styles.legacySurveyActive : undefined} onClick={() => setSubject(s)}>
                                    {s}
                                </li>
                            ))}
                        </ul>
                        <div className={styles.legacySurveyBody}>
                            <div className={styles.legacySurveyList}>
                                <ul>
                                    <li className={group === "pre" ? styles.legacySurveyActive : undefined} onClick={() => setGroup("pre")}>
                                        사전 설문
                                    </li>
                                    <li className={group === "post" ? styles.legacySurveyActive : undefined} onClick={() => setGroup("post")}>
                                        사후 설문
                                    </li>
                                </ul>
                            </div>
                            <div className={styles.legacySurvey}>
                                <div>추가</div>
                                <div className={styles.legacySurveyForm}>
                                    <div>
                                        <input type="text" className={styles.legacySurveyInput} defaultValue="강의 내용에 얼마나 만족하나요?" />
                                        <IconButton>삭제</IconButton>
                                    </div>
                                    <div>
                                        <label>설문 종류</label>
                                        <div style={{ width: "30%" }}>
                                            <Select options={SURVEY_TYPES} defaultValue={SURVEY_TYPES[0]} isSearchable />
                                        </div>
                                    </div>
                                    <div>
                                        {["매우 만족", "만족"].map((v) => (
                                            <span key={v}>
                                                <input type="text" defaultValue={v} className={styles.legacySurveyInput} />
                                                <IconButton>삭제</IconButton>
                                            </span>
                                        ))}
                                        <IconButton> 추가 </IconButton>
                                    </div>
                                </div>
                                <div>
                                    미리보기
                                    <div>
                                        <label>
                                            <input name="legacy-preview" type="radio" />
                                            매우 만족
                                        </label>
                                        <label>
                                            <input name="legacy-preview" type="radio" />
                                            만족
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Variant>
            </Variants>
        </div>
    );
};
