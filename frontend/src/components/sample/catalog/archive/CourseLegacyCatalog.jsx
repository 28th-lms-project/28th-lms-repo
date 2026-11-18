/* 기록용: 샘플 "표준화 전 (기록)" 탭의 카탈로그. 표준화 전 모습을 남긴 것이라 새 예시를 더하지 않음 (표준 예시는 catalog/의 Standard*). */
import { Fragment, useState } from "react";
import Select from "react-select";
import styles from "../Catalog.module.css";
// 원본 화면이 className="section"(전역)을 써서, 그 모양을 내려고 옛 Section의 CSS를 직접 불러옴
import "../../../archive/Section.css";
import { Variant, Variants } from "../CatalogParts.jsx";
import { Grid } from "../../../archive/sample/Grid.jsx";
import { IconButton } from "../../../archive/sample/input/IconButton.jsx";
import { FileField } from "../../../archive/sample/input/Input.jsx";
import { icons } from "../../../archive/sample/input/icons.js";
import { PollItem } from "../../../archive/sample/Poll.jsx";

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
    { value: "radio", label: "단일 선택" },
    { value: "checkBox", label: "다중 선택" },
    { value: "text", label: "직접 입력" },
];
const SURVEY_QUESTIONS = [
    {
        id: "q1",
        subject: "강의 내용에 얼마나 만족하나요?",
        type: "radio",
        surveyDataList: [
            { id: "q1-1", data: "매우 만족" },
            { id: "q1-2", data: "만족" },
            { id: "q1-3", data: "보통" },
        ],
    },
    {
        id: "q2",
        subject: "도움이 된 수업을 모두 고르세요.",
        type: "checkBox",
        surveyDataList: [
            { id: "q2-1", data: "실습" },
            { id: "q2-2", data: "이론" },
        ],
    },
    { id: "q3", subject: "하고 싶은 말을 적어 주세요.", type: "text", surveyDataList: [] },
];

// Survey.jsx의 toPollItem 그대로 (미리보기는 sample PollItem)
const toPollItem = (survey, index) => {
    const pollType = survey.type === "checkBox" ? "checkbox" : survey.type;
    const answers =
        pollType === "text"
            ? [{ id: `${survey.id}-text`, name: survey.id, title: "", value: "" }]
            : survey.surveyDataList.map((data) => ({ id: data.id, name: survey.id, title: data.data, value: data.data }));
    return { id: survey.id, number: index + 1, title: survey.subject, type: pollType, required: false, answers };
};

const COURSE_SURVEY_HEADER = [
    { id: "no", title: "번호" },
    { id: "title", title: "설문 명" },
    { id: "surveySubject", title: "과목 명" },
    { id: "surveyType", title: "설문 유형" },
    { id: "count", title: "항목 수" },
    { id: "participation", title: "참여 수" },
    { id: "result", title: "결과" },
    { id: "delete", title: "삭제" },
];
const COURSE_SURVEYS = [
    { id: 1, title: "28기 Java 사전 설문", surveySubject: "Java", surveyType: "사전 설문", count: 3, answerCount: 12, studentCount: 20 },
    { id: 2, title: "28기 Java 사후 설문", surveySubject: "Java", surveyType: "사후 설문", count: 3, answerCount: 0, studentCount: 20 },
];
const courseSurveyContent = COURSE_SURVEYS.map((survey, index) => {
    const values = {
        no: index + 1,
        title: <div>{survey.title}</div>,
        surveySubject: survey.surveySubject,
        surveyType: survey.surveyType,
        count: survey.count,
        participation: `${survey.answerCount} / ${survey.studentCount}`,
        result: <div>결과보기</div>,
        delete: <div>삭제</div>,
    };
    return COURSE_SURVEY_HEADER.map((col) => ({ id: `cs-${survey.id}-${col.id}`, value: values[col.id] }));
});
// CourseSurveyForm의 toGroupOptions 그대로 (과목 × 사전/사후)
const COURSE_SURVEY_GROUPS = ["Java", "Spring", "React"].flatMap((name) =>
    [
        { value: "pre", label: "사전 설문" },
        { value: "post", label: "사후 설문" },
    ].map((g) => ({ value: `${name}_${g.value}`, label: `${name} ${g.label}`, subjectName: name, typeLabel: g.label })),
);
const RESPONDENTS = [
    { id: "s1", name: "홍길동" },
    { id: "s2", name: "김영희" },
    { id: "s3", name: "박민수" },
];
// 학생별 답변: 문항 id → 고른 보기 id 목록 또는 글자
const RESPONDENT_ANSWERS = {
    s1: { q1: ["q1-1"], q2: ["q2-1", "q2-2"], q3: "실습 시간이 더 있었으면 좋겠습니다." },
    s2: { q1: ["q1-2"], q2: ["q2-1"], q3: "" },
    s3: { q1: ["q1-3"], q2: ["q2-2"], q3: "좋았습니다." },
};

export const CourseLegacyCatalog = () => {
    const [tab, setTab] = useState(0);
    const [left, setLeft] = useState(QUESTIONS.slice(1));
    const [right, setRight] = useState(QUESTIONS.slice(0, 1));
    const [subject, setSubject] = useState("수강");
    const [group, setGroup] = useState("pre");
    const [surveyQuestions, setSurveyQuestions] = useState(SURVEY_QUESTIONS);
    const [surveyAdding, setSurveyAdding] = useState(false);
    const [surveyGroup, setSurveyGroup] = useState(null);
    const [surveySubject, setSurveySubject] = useState("");
    const [respondent, setRespondent] = useState("s1");
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
                    note={"제목 h3 + 기간 span + 진행률 글자 + 강사 이름. 탭은 IconButton에 className=\"active\"를 주지만 전역 .active가 없어 선택 표시가 안 보임 (pageList 클래스도 정의 없음).\n'설문' 탭은 이제 자리표시 글자 대신 과정 설문 목록(CourseSurvey, 아래 예시)을 보여 줌"}
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
                    name="설문 편집 (회색 탭 바 + 문항별 인라인 입력 + PollItem 미리보기)"
                    source="admin/survey/survey/Survey.jsx · Survey.module.css"
                    note={"과목 탭은 고른 li만 흰 배경. 사전/사후 탭은 원본 CSS의 &.active가 ul에 붙어 있어 골라도 표시가 없음.\n[추가] IconButton 아래 문항마다: 질문 입력(30%) + 삭제, '설문 종류' 라벨 + react-select(단일 선택 · 다중 선택 · 직접 입력, 30%), 보기 입력(각 30%) + 삭제를 이어 붙이고 끝에 추가 (직접 입력이면 보기 줄이 사라짐).\n그 아래 '미리보기' 글자 + sample PollItem(번호. 질문 + 라디오 · 체크박스 · 텍스트). 문항 사이 구분선 · 간격이 없고, 글자를 칠 때마다 서버에 바로 저장되며 저장 표시가 없음. 슈퍼 관리자가 아니면 회색 테두리 상자 안내(권한 없음)만 보임"}
                    block
                >
                    <div className={styles.legacySurveyContainer}>
                        <div className={styles.legacySurveyHeader}>
                            <ul className={styles.legacySurveyCourseList}>
                                {SURVEY_SUBJECTS.map((s) => (
                                    <li key={s} className={subject === s ? styles.legacySurveyActive : undefined} onClick={() => setSubject(s)}>
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
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
                                <ul>
                                    <IconButton>추가</IconButton>
                                    {surveyQuestions.map((survey, index) => (
                                        <div key={survey.id}>
                                            <li>
                                                <div className={styles.legacySurveyForm}>
                                                    <div>
                                                        <input type="text" className={styles.legacySurveySubject} defaultValue={survey.subject} />
                                                        <IconButton>삭제</IconButton>
                                                    </div>
                                                    <div>
                                                        <label>설문 종류</label>
                                                        <Select
                                                            className={styles.legacySurveyType}
                                                            options={SURVEY_TYPES}
                                                            defaultValue={SURVEY_TYPES.find((option) => option.value === survey.type)}
                                                            isSearchable
                                                            onChange={(option) =>
                                                                setSurveyQuestions((prev) =>
                                                                    prev.map((q) => (q.id === survey.id ? { ...q, type: option.value } : q)),
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    {survey.type !== "text" && (
                                                        <div>
                                                            {survey.surveyDataList.map((data) => (
                                                                <Fragment key={data.id}>
                                                                    <input type="text" defaultValue={data.data} className={styles.legacySurveyData} />
                                                                    <IconButton>삭제</IconButton>
                                                                </Fragment>
                                                            ))}
                                                            <IconButton> 추가 </IconButton>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={styles.legacySurveyPreview}>
                                                    미리보기
                                                    <ul>
                                                        <PollItem
                                                            key={`${survey.id}-${survey.type}-${survey.surveyDataList.length}`}
                                                            item={toPollItem(survey, index)}
                                                        />
                                                    </ul>
                                                </div>
                                            </li>
                                        </div>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </Variant>

                <Variant
                    name="과정 설문 목록 + 추가 폼 (CourseSurvey · CourseSurveyForm)"
                    source="admin/course/CourseTableComponent/CourseSurvey.jsx · CourseSurveyForm.jsx · CourseSurveyForm.module.css"
                    note={"과정 상세의 '설문' 탭. [설문 추가] IconButton을 누르면 버튼이 [취소]로 바뀌고 버튼과 표 사이에 폼이 열림.\n폼은 라벨 없이 placeholder만 있는 전체 폭 입력 4줄(설문 제목 · 설문 항목 react-select · 과목 명 · 설문 유형 읽기 전용 회색)과 오른쪽 [등록]. 항목을 고르면 과목 명 · 유형이 채워짐. 오류는 alert.\n표는 Grid 8열. 설문 명 · 결과보기 · 삭제는 그냥 글자(div onClick)라 누를 수 있는지 보이지 않음. 설문 명은 응답 팝업, 결과보기는 결과 팝업(1620×1080 새 창)을 열고, 삭제는 confirm"}
                    block
                >
                    <IconButton icon={surveyAdding ? icons.close : icons.add} onClick={() => setSurveyAdding((prev) => !prev)}>
                        {surveyAdding ? "취소" : "설문 추가"}
                    </IconButton>
                    {surveyAdding && (
                        <div className={styles.legacyCourseSurveyForm}>
                            <input type="text" className={styles.legacyCourseSurveyInput} placeholder="설문 제목" />
                            <Select
                                options={COURSE_SURVEY_GROUPS}
                                value={surveyGroup}
                                onChange={(option) => {
                                    setSurveyGroup(option);
                                    setSurveySubject(option.subjectName);
                                }}
                                placeholder="설문 항목을 선택하세요."
                                isSearchable
                            />
                            <input
                                type="text"
                                className={styles.legacyCourseSurveyInput}
                                value={surveySubject}
                                onChange={(e) => setSurveySubject(e.target.value)}
                                placeholder="과목 명"
                            />
                            <input
                                type="text"
                                className={`${styles.legacyCourseSurveyInput} ${styles.legacyCourseSurveyReadOnly}`}
                                value={surveyGroup ? surveyGroup.typeLabel : ""}
                                placeholder="설문 유형"
                                readOnly
                            />
                            <div className={styles.legacyCourseSurveyButtons}>
                                <IconButton>등록</IconButton>
                            </div>
                        </div>
                    )}
                    <Grid header={COURSE_SURVEY_HEADER} content={courseSurveyContent} columnStyle="80px 5fr 120px 120px 80px 100px 90px 70px" />
                </Variant>

                <Variant
                    name="설문 응답 팝업 (CourseSurveyAns)"
                    source="admin/course/CourseTableComponent/CourseSurveyAns.jsx · CourseSurveyAns.module.css"
                    note={"레이아웃 · 메뉴 가드 밖의 새 창(/survey/answer/...). h2 제목 + '과목 · 유형' 글자 + 번호 목록(ol)에 문항 글자와 브라우저 기본 라디오 · 체크박스 · 텍스트 입력. 보기 라벨 사이 간격 · 문항 구분이 없음.\n맨 아래 [저장] IconButton. 빠진 문항 · 이미 참여 · 제출 완료는 모두 alert, 제출하면 창이 닫힘. 불러오는 동안은 '불러오는 중...' 글자만"}
                    block
                >
                    <div className={styles.legacyCourseSurveyAns}>
                        <h2>28기 Java 사전 설문</h2>
                        <p>Java · 사전 설문</p>
                        <ol>
                            {SURVEY_QUESTIONS.map((question) => (
                                <li key={question.id}>
                                    <div>{question.subject}</div>
                                    {question.type === "text" ? (
                                        <input type="text" name={`legacy-ans-${question.id}`} />
                                    ) : (
                                        <div>
                                            {question.surveyDataList.map((data) => (
                                                <label key={data.id}>
                                                    <input
                                                        type={question.type === "checkBox" ? "checkbox" : "radio"}
                                                        name={`legacy-ans-${question.id}`}
                                                        value={data.id}
                                                    />
                                                    {data.data}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ol>
                        <div>
                            <IconButton>저장</IconButton>
                        </div>
                    </div>
                </Variant>

                <Variant
                    name="설문 결과 (CourseSurveyResult)"
                    source="admin/course/CourseTableComponent/CourseSurveyResult.jsx · CourseSurveyAns.module.css"
                    note={"응답 팝업과 같은 새 창 모양(/survey/result/...). h2 제목 + '과목 · 유형 · 응답 N명' 글자, 그 아래 flex(gap 24px)로 응답한 학생 이름 목록 | 문항 번호 목록.\n고른 학생은 굵은 글씨만 다르고, 이름이 링크 · 버튼처럼 보이지 않음. 답변은 disabled 라디오 · 체크박스와 readOnly 텍스트 입력으로 보여 줌. 집계(보기별 수 · 비율)는 없고 한 학생씩만 볼 수 있음. 응답이 없으면 '아직 응답한 학생이 없습니다.' 글자"}
                    block
                >
                    <div className={styles.legacyCourseSurveyAns}>
                        <h2>28기 Java 사전 설문</h2>
                        <p>Java · 사전 설문 · 응답 {RESPONDENTS.length}명</p>
                        <div style={{ display: "flex", gap: "24px" }}>
                            <ul>
                                {RESPONDENTS.map((student) => (
                                    <li
                                        key={student.id}
                                        style={{ cursor: "pointer", fontWeight: student.id === respondent ? "bold" : "normal" }}
                                        onClick={() => setRespondent(student.id)}
                                    >
                                        {student.name}
                                    </li>
                                ))}
                            </ul>
                            <ol>
                                {SURVEY_QUESTIONS.map((question) => {
                                    const answer = RESPONDENT_ANSWERS[respondent][question.id];
                                    return (
                                        <li key={question.id}>
                                            <div>{question.subject}</div>
                                            {question.type === "text" ? (
                                                <input type="text" value={answer} readOnly />
                                            ) : (
                                                <div>
                                                    {question.surveyDataList.map((data) => (
                                                        <label key={data.id}>
                                                            <input
                                                                type={question.type === "checkBox" ? "checkbox" : "radio"}
                                                                checked={answer.includes(data.id)}
                                                                disabled
                                                                readOnly
                                                            />
                                                            {data.data}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    </div>
                </Variant>
            </Variants>
        </div>
    );
};
