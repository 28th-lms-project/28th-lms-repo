import { useRef, useState } from "react";
import Select from "react-select";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import {
    Checkbox,
    FileField,
    Id,
    NativeSelect,
    Password,
    Radio,
    Textarea,
    TextField,
} from "../../common/input/Input.jsx";
import { IconButton } from "../../common/input/IconButton.jsx";
import { icons } from "../../common/input/icons.js";

const COUNSEL_TYPES = ["학습", "진로", "생활", "기타"];
const SELECT_OPTIONS = [
    { value: "java", label: "Java" },
    { value: "spring", label: "Spring" },
    { value: "react", label: "React" },
    { value: "sql", label: "SQL" },
];
const MAX_LENGTH = 200;

export const FormCatalog = () => {
    const idRef = useRef();
    const pwRef = useRef();
    const textRef = useRef();
    const fileRef = useRef();
    const [counselType, setCounselType] = useState("학습");
    const [memo, setMemo] = useState("");
    const [fileName, setFileName] = useState("");
    const [radio, setRadio] = useState("A");

    return (
        <div>
            <GroupTitle>공통 컴포넌트 (common/input/Input.jsx)</GroupTitle>
            <Variants>
                <Variant name="Id · Password" source="common/input/Input.jsx" note="Id는 한글 입력을 막음. 높이 43.5px, radius 7px">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                        <Id ref={idRef} id="catalog-id" label="아이디" />
                        <Password ref={pwRef} id="catalog-pw" label="비밀번호" />
                    </div>
                </Variant>
                <Variant name="TextField (떠 있는 라벨)" source="common/input/Input.jsx" note="labelText가 입력 위쪽에 겹쳐 표시됨">
                    <TextField ref={textRef} id="catalog-text" name="title" labelText="제목" />
                </Variant>
                <Variant name="NativeSelect · Textarea" source="common/input/Input.jsx" note="스타일 클래스(.select, .textarea)가 정의되어 있지 않아 브라우저 기본 모양">
                    <NativeSelect
                        id="catalog-native-select"
                        labelText="과목"
                        withDefault
                        options={SELECT_OPTIONS.map((o) => ({ id: o.value, value: o.value, text: o.label }))}
                    />
                    <Textarea id="catalog-textarea" labelText="내용" placeholder="내용을 입력하세요." />
                </Variant>
                <Variant name="Checkbox (checked · onoff)" source="common/input/Input.jsx" note="styleType으로 아이콘형 / 스위치형">
                    <div className={styles.checkRow}>
                        <Checkbox id="catalog-cb-1" labelText="학생" checked />
                        <Checkbox id="catalog-cb-2" labelText="강사" />
                        <span className={styles.disabledCheck}>
                            <Checkbox id="catalog-cb-3" labelText="비활성" disabled />
                        </span>
                    </div>
                    <div className={styles.checkRow}>
                        <Checkbox id="catalog-cb-4" labelText="사용" styleType="onoff" checked />
                        <Checkbox id="catalog-cb-5" labelText="펼침" styleType="onoff" />
                    </div>
                </Variant>
                <Variant name="Radio" source="common/input/Input.jsx" note="controlled로 쓰려면 checked를 상태로 넘긴다">
                    {["A", "B"].map((v) => (
                        <Radio
                            key={v}
                            id={`catalog-radio-${v}`}
                            name="catalog-radio"
                            value={v}
                            labelText={`선택 ${v}`}
                            checked={radio === v}
                            onChange={(e) => setRadio(e.target ? e.target.value : e.value)}
                        />
                    ))}
                </Variant>
                <Variant name="FileField (미리보기 없음)" source="admin/course/add/CourseAdd.jsx" note="미리보기 버전은 아래 'Sample FileInput' 섹션">
                    <FileField ref={fileRef} id="catalog-file" name="file" labelText="첨부파일" />
                </Variant>
            </Variants>

            <GroupTitle>검색 툴바</GroupTitle>
            <Variants wide>
                <Variant
                    name="셀렉트 + 검색어 + 검색 · 초기화 / 오른쪽 등록"
                    source="admin/system/member/MemberManagement.jsx"
                    note="Enter로 검색 (한글 조합 중 isComposing은 무시)"
                >
                    <div className={styles.toolbar}>
                        <div className={styles.toolbarLeft}>
                            <select className={styles.selectMember} defaultValue="name">
                                <option value="name">이름</option>
                                <option value="id">아이디</option>
                            </select>
                            <input className={styles.inputMember} placeholder="검색어를 입력하세요" />
                            <button type="button" className={styles.btnSearch}>검색</button>
                            <button type="button" className={styles.btnReset}>초기화</button>
                        </div>
                        <button type="button" className={styles.btnCreate}>+ 회원 등록</button>
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>폼 필드</GroupTitle>
            <Variants>
                <Variant
                    name="라벨 위 필드 (38px) + 폼 카드"
                    source="login/Login.jsx · my/info/MyInfoForm.jsx · MyPasswordForm.jsx · member/MemberCreateModal.jsx"
                >
                    <form className={styles.formCard} onSubmit={(e) => e.preventDefault()}>
                        <h3 className={styles.formCardTitle}>비밀번호 변경</h3>
                        <label className={styles.field}>
                            <span>현재 비밀번호</span>
                            <input type="password" placeholder="현재 비밀번호" />
                        </label>
                        <label className={styles.field}>
                            <span>새 비밀번호</span>
                            <input type="password" placeholder="8자 이상" />
                            <p className={styles.errorRem}>비밀번호가 일치하지 않습니다.</p>
                        </label>
                        <button type="submit" className={styles.btnSubmit}>변경</button>
                    </form>
                </Variant>
                <Variant
                    name="연쇄 셀렉트 (대 > 중 > 소) + 읽기 전용 코드"
                    source="admin/system/access/Access.jsx (.accessSelect · .codeView)"
                >
                    <div className={styles.cascade}>
                        <select defaultValue="1">
                            <option value="1">시스템 관리</option>
                        </select>
                        <select defaultValue="">
                            <option value="">중메뉴 선택</option>
                            <option>회원 관리</option>
                        </select>
                        <select disabled>
                            <option>소메뉴 선택</option>
                        </select>
                    </div>
                    <div className={styles.codeView}>
                        <span className={styles.codeLabel}>권한 코드</span>
                        <span className={styles.codeValue}>MEMBER_READ</span>
                    </div>
                </Variant>
                <Variant
                    name="줄바꿈 인라인 폼 (34px)"
                    source="my/course/MyInterview.jsx (.registerForm)"
                    note="select · datetime-local · text"
                >
                    <div className={styles.registerForm}>
                        <div className={styles.inlineField}>
                            <label htmlFor="catalog-iv-student">수강생</label>
                            <select id="catalog-iv-student">
                                <option>홍길동</option>
                            </select>
                        </div>
                        <div className={styles.inlineField}>
                            <label htmlFor="catalog-iv-date">면접 일시</label>
                            <input id="catalog-iv-date" type="datetime-local" />
                        </div>
                        <div className={styles.inlineField}>
                            <label htmlFor="catalog-iv-company">회사</label>
                            <input id="catalog-iv-company" type="text" placeholder="회사 이름" />
                        </div>
                        <div className={styles.formButtons}>
                            <IconButton icon={icons.add} iconSize={16}>등록</IconButton>
                        </div>
                    </div>
                </Variant>
                <Variant name="날짜 · 숫자 · 검색 입력 (스타일 없음)" source="admin/course/add/CourseAdd.jsx · HomeworkSubmitStatus.jsx · MyCourseData.jsx">
                    <input type="date" /> ~ <input type="date" />
                    <input type="number" defaultValue={100} style={{ width: "70px", padding: "3px 5px" }} />
                    <input type="search" placeholder="제목 검색" />
                </Variant>
            </Variants>

            <GroupTitle>텍스트 영역</GroupTitle>
            <Variants>
                <Variant name="글자 수 표시 textarea" source="my/course/MyCounsel.jsx (.textarea · .counter)">
                    <div className={styles.textareaWrap}>
                        <textarea
                            className={styles.textarea}
                            maxLength={MAX_LENGTH}
                            value={memo}
                            placeholder="상담 내용을 입력하세요."
                            onChange={(e) => setMemo(e.target.value)}
                        />
                        <span className={styles.counter}>
                            {memo.length} / {MAX_LENGTH}
                        </span>
                    </div>
                </Variant>
                <Variant name="인라인 스타일 textarea (radius 7px)" source="admin/course/CourseTableComponent/HomeworkForm.jsx">
                    <textarea className={styles.textareaInline} placeholder="과제 설명" />
                </Variant>
                <Variant name="코드 답안 textarea" source="ExamTakeModal.jsx · ExamQuestionViewModal.jsx">
                    <textarea className={styles.textareaCode} defaultValue={"public static void main(String[] args) {\n}"} />
                </Variant>
            </Variants>

            <GroupTitle>선택 (라디오 · 체크박스 · 셀렉트)</GroupTitle>
            <Variants>
                <Variant name="pill 라디오" source="my/course/MyCounsel.jsx (.typeGroup)">
                    <div className={styles.pillGroup} role="radiogroup" aria-label="상담 유형">
                        {COUNSEL_TYPES.map((t) => (
                            <label
                                key={t}
                                className={`${styles.pillOption} ${counselType === t ? styles.pillSelected : ""}`}
                            >
                                <input
                                    type="radio"
                                    name="catalog-counsel-type"
                                    value={t}
                                    checked={counselType === t}
                                    onChange={() => setCounselType(t)}
                                />
                                {t}
                            </label>
                        ))}
                    </div>
                </Variant>
                <Variant name="기본 라디오 · 체크박스 + fieldset" source="admin/test/test/AddTest.jsx · admin/survey/survey/Survey.jsx">
                    <div className={styles.nativeGroup}>
                        <label><input type="radio" name="catalog-qtype" defaultChecked /> 객관식</label>
                        <label><input type="radio" name="catalog-qtype" /> 주관식</label>
                        <label><input type="radio" name="catalog-qtype" /> O/X</label>
                    </div>
                    <fieldset className={styles.fieldset}>
                        <legend>정답</legend>
                        <div className={styles.nativeGroup}>
                            <label><input type="checkbox" defaultChecked /> 1번</label>
                            <label><input type="checkbox" /> 2번</label>
                            <label><input type="checkbox" /> 3번</label>
                        </div>
                    </fieldset>
                </Variant>
                <Variant name="잠긴 정답 표시" source="ExamQuestionViewModal.jsx (accentColor)">
                    <div className={styles.nativeGroup}>
                        <label style={{ color: "#1a7f37", fontWeight: "bold" }}>
                            <input type="radio" checked readOnly style={{ accentColor: "#1a7f37" }} /> 정답 보기
                        </label>
                        <label>
                            <input type="radio" disabled /> 다른 보기
                        </label>
                    </div>
                </Variant>
                <Variant name="react-select (단일 · 다중)" source="admin/course/selector/CourseTutorSelect.jsx · CourseStudentSelect.jsx" note="기본 테마 그대로, 감싸는 div로 폭 지정">
                    <div className={styles.selectWrap}>
                        <Select options={SELECT_OPTIONS} isSearchable placeholder="강사 선택" />
                    </div>
                    <div className={styles.selectWrapWide}>
                        <Select options={SELECT_OPTIONS} isMulti placeholder="수강생 선택" />
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>파일</GroupTitle>
            <Variants>
                <Variant name="파일 선택 상자" source="my/course/MyTimetable.jsx (.uploadArea)">
                    <div className={styles.uploadArea}>
                        <label className={styles.fileButton}>
                            파일 선택
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                            />
                        </label>
                        <span className={styles.fileName}>{fileName || "선택된 파일 없음"}</span>
                    </div>
                </Variant>
            </Variants>
        </div>
    );
};
