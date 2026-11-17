import { useState } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Field from "../../common/ui/Field.jsx";
import Badge from "../../common/ui/Badge.jsx";
import { useToast } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons.js";
import SelectBox from "../../common/ui/SelectBox.jsx";
import FilePicker, { FileList } from "../../common/ui/FilePicker.jsx";
import ChoiceGroup from "../../common/ui/ChoiceGroup.jsx";
import Switch from "../../common/ui/Switch.jsx";
import ListEditor from "../../common/ui/ListEditor.jsx";
import { newListItem } from "../../common/ui/listEditorItem.js";

/*
 * 표준 UI: 버튼 · 입력 · 검색 셀렉트 · 선택 · 날짜 · 파일 · 반복 입력 행.
 * 스타일 원본은 src/styles/*.css의 전역 클래스, React 컴포넌트는 common/ui/. 가이드: frontend/docs/ui-style-guide.md 8장
 */

const MEMO_MAX = 200;

/* ───── 예시 데이터 ───── */
const STUDENTS = Array.from({ length: 23 }, (_, i) => ({
    id: `stu${String(i + 1).padStart(2, "0")}`,
    name: ["홍길동", "김철수", "이영희", "박민수", "최지우", "정해인", "윤아름"][i % 7],
    course: ["풀스택 개발자", "데이터 분석"][i % 2],
    state: i % 9 === 3 ? "수료" : "수강 중",
}));

const TUTORS = [
    { value: "t1", label: "김강사 (Java)" },
    { value: "t2", label: "이강사 (Spring)" },
    { value: "t3", label: "박강사 (React)" },
    { value: "t4", label: "최강사 (SQL)", isDisabled: true },
];

const STUDENT_OPTIONS = STUDENTS.slice(0, 8).map((s) => ({ value: s.id, label: `${s.name} (${s.id})` }));

const COUNSEL_TYPES = [
    { value: "study", label: "학습" },
    { value: "career", label: "진로" },
    { value: "life", label: "생활" },
    { value: "etc", label: "기타" },
    { value: "closed", label: "마감", disabled: true },
];

const GRADES = [
    { value: "Y", label: "정답" },
    { value: "N", label: "오답" },
    { value: "H", label: "부분 정답" },
    { value: "R", label: "재채점" },
];

const ATTACHMENTS = [
    { key: "a1", name: "1주차_강의자료.pdf", size: 2_411_520, href: "#" },
    { key: "a2", name: "실습_예제코드.zip", size: 845_312, href: "#" },
];

const ButtonGroup = () => {
    const [saving, setSaving] = useState(false);

    const fakeSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 1500);
    };

    return (
        <>
            <GroupTitle>버튼</GroupTitle>
            <Variants>
                <Variant
                    name="variant"
                    source="styles/button.css · common/ui/Button.jsx"
                    note="primary는 화면의 주 동작 하나만. danger-solid는 삭제를 확정하는 모달 버튼에만"
                    code={`
<Button>취소</Button>
<Button variant="primary">저장</Button>
<Button variant="danger">삭제</Button>
<Button variant="danger-solid">삭제 확정</Button>
<Button variant="text">자세히</Button>

// 컴포넌트 없이
<button type="button" className="btn btn-primary">저장</button>`}
                >
                    <Button>취소</Button>
                    <Button variant="primary">저장</Button>
                    <Button variant="danger">삭제</Button>
                    <Button variant="danger-solid">삭제 확정</Button>
                    <Button variant="text">자세히</Button>
                </Variant>
                <Variant
                    name="size · 아이콘"
                    source="common/ui/Button.jsx"
                    note={"sm(30px)은 표 행 안처럼 좁은 곳. 아이콘만 있는 버튼은 aria-label 필수.\n아이콘은 무언가를 여는 버튼(추가 · 등록)과 수정 · 삭제 · 새로고침에만. 폼 제출(저장 · 등록) 버튼에는 붙이지 않음"}
                    code={`
<Button icon={icons.add}>추가</Button>
<Button size="sm" icon={icons.edit}>수정</Button>
<Button icon={icons.refresh} aria-label="새로고침" />
<Button size="sm" variant="danger" icon={icons.delete} aria-label="삭제" />`}
                >
                    <Button icon={icons.add}>추가</Button>
                    <Button variant="primary">저장</Button>
                    <Button size="sm" icon={icons.edit}>수정</Button>
                    <Button size="sm" variant="primary">저장</Button>
                    <Button icon={icons.refresh} aria-label="새로고침" title="새로고침" />
                    <Button size="sm" variant="danger" icon={icons.delete} aria-label="삭제" title="삭제" />
                </Variant>
                <Variant
                    name="상태: 비활성 · 저장 중"
                    source="common/ui/Button.jsx"
                    note="loading이면 돌아가는 아이콘 + 비활성. 문구는 직접 바꿈"
                    code={`
<Button variant="primary" loading={saving} onClick={save}>
  {saving ? "저장 중..." : "저장"}
</Button>
<Button disabled>비활성</Button>`}
                >
                    <Button variant="primary" loading={saving} onClick={fakeSave}>
                        {saving ? "저장 중..." : "저장 (눌러 보기)"}
                    </Button>
                    <Button disabled>비활성</Button>
                    <Button variant="primary" disabled>비활성</Button>
                </Variant>
                <Variant
                    name="전체 폭 · 버튼 묶음"
                    source="styles/button.css"
                    note="btn-group: 간격 8px, btn-group-end: 오른쪽 정렬 (모달 바닥 · 폼 끝)"
                    block
                    code={`
<Button variant="primary" block>로그인</Button>

<div className="btn-group btn-group-end">
  <Button>취소</Button>
  <Button variant="primary">등록</Button>
</div>`}
                >
                    <Button variant="primary" block>로그인</Button>
                    <div className="btn-group btn-group-end" style={{ marginTop: "12px" }}>
                        <Button>취소</Button>
                        <Button variant="primary">등록</Button>
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const FormGroup = () => {
    const [memo, setMemo] = useState("");
    const [userId, setUserId] = useState("홍길동");
    const userIdError = /[^a-z0-9]/i.test(userId) ? "아이디는 영문과 숫자만 쓸 수 있습니다." : "";

    return (
        <>
            <GroupTitle>입력 · 폼</GroupTitle>
            <Variants>
                <Variant
                    name="필드 (라벨 · 필수 · 힌트 · 오류)"
                    source="styles/form.css · common/ui/Field.jsx"
                    note={"오류가 있으면 힌트 대신 오류만. 입력의 id를 htmlFor와 같게 하면 aria-invalid · aria-describedby는 Field가 자동으로 붙임.\ninput-range · input-group 안처럼 입력이 Field 바로 아래에 없으면 직접 붙임"}
                    block
                    code={`
<Field label="아이디" htmlFor="userId" required
       hint="영문 · 숫자 4~20자" error={userIdError}>
  <input id="userId" className="form-control"
         value={userId} onChange={...} />
</Field>`}
                >
                    <div className="form-stack">
                        <Field label="아이디" htmlFor="std-user-id" required hint="영문 · 숫자 4~20자" error={userIdError}>
                            <input
                                id="std-user-id"
                                className="form-control"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                            />
                        </Field>
                        <Field label="이메일" htmlFor="std-email" hint="비밀번호 찾기에 씁니다.">
                            <input id="std-email" type="email" className="form-control" placeholder="name@example.com" />
                        </Field>
                    </div>
                </Variant>
                <Variant
                    name="셀렉트 · textarea (글자 수) · 비활성 · 읽기 전용"
                    source="styles/form.css"
                    block
                    code={`
<select className="form-control">...</select>

<Field label="상담 내용" htmlFor="memo"
       count={{ current: memo.length, max: 200 }}>
  <textarea id="memo" className="form-control" maxLength={200} />
</Field>

<input className="form-control" disabled />
<input className="form-control" readOnly />`}
                >
                    <div className="form-stack">
                        <Field label="과목" htmlFor="std-subject">
                            <select id="std-subject" className="form-control" defaultValue="">
                                <option value="" disabled>고르세요</option>
                                <option>Java</option>
                                <option>Spring</option>
                            </select>
                        </Field>
                        <Field label="상담 내용" htmlFor="std-memo" count={{ current: memo.length, max: MEMO_MAX }}>
                            <textarea
                                id="std-memo"
                                className="form-control"
                                maxLength={MEMO_MAX}
                                value={memo}
                                placeholder="상담 내용을 입력하세요."
                                onChange={(e) => setMemo(e.target.value)}
                            />
                        </Field>
                        <div className="form-row">
                            <Field label="비활성" htmlFor="std-disabled">
                                <input id="std-disabled" className="form-control" value="수정 불가" disabled readOnly />
                            </Field>
                            <Field label="읽기 전용" htmlFor="std-readonly">
                                <input id="std-readonly" className="form-control" value="2026-11-16" readOnly />
                            </Field>
                        </div>
                    </div>
                </Variant>
                <Variant
                    name="접두어 입력 · 작은 크기 · 코드 입력"
                    source="styles/form.css"
                    note={"접두어는 <label htmlFor>: 접두어를 눌러도 입력 칸으로 포커스가 감.\nform-control-sm(30px)은 표 안 · 툴바처럼 좁은 곳. form-control-mono는 코드 · ID"}
                    block
                    code={`
<div className="input-group">
  <label className="input-group-text" htmlFor="role-id">ROLE_</label>
  <input id="role-id" className="form-control form-control-mono" />
</div>
<input className="form-control form-control-sm" />`}
                >
                    <div className="form-stack">
                        <Field label="역할 ID" htmlFor="std-role">
                            <div className="input-group">
                                <label className="input-group-text" htmlFor="std-role">ROLE_</label>
                                <input id="std-role" className="form-control form-control-mono" placeholder="STUDENT" />
                            </div>
                        </Field>
                        <div className="form-row">
                            <input className="form-control form-control-sm" placeholder="작은 입력" aria-label="작은 입력" />
                            <Button size="sm">확인</Button>
                        </div>
                    </div>
                </Variant>
                <Variant
                    name="체크박스 · 라디오"
                    source="styles/form.css"
                    note="네이티브 input + accent-color(강조색). 키보드 · 스크린 리더가 그대로 동작"
                    block
                    code={`
<div className="form-check-group">
  <label className="form-check">
    <input type="checkbox" /> 학생
  </label>
</div>`}
                >
                    <div className="form-stack">
                        <div className="form-check-group">
                            <label className="form-check"><input type="checkbox" defaultChecked /> 학생</label>
                            <label className="form-check"><input type="checkbox" /> 강사</label>
                            <label className="form-check"><input type="checkbox" disabled /> 비활성</label>
                        </div>
                        <div className="form-check-group" role="radiogroup" aria-label="문제 유형">
                            <label className="form-check"><input type="radio" name="std-qtype" defaultChecked /> 객관식</label>
                            <label className="form-check"><input type="radio" name="std-qtype" /> 주관식</label>
                            <label className="form-check"><input type="radio" name="std-qtype" /> O/X</label>
                        </div>
                    </div>
                </Variant>
            </Variants>
            <Variants wide>
                <Variant
                    name="한 줄 폼 (검색 툴바)"
                    source="styles/form.css"
                    note="form-row: 필드가 한 줄에 놓이고 좁으면 줄바꿈. 필드는 위(라벨)에 맞춤, 옆 버튼은 라벨 높이만큼 내려 입력 칸과 같은 줄"
                    block
                    code={`
<div className="form-row">
  <Field label="검색 조건" htmlFor="type"><select id="type" className="form-control">...</select></Field>
  <Field label="검색어" htmlFor="q"><input id="q" className="form-control" /></Field>
  <div className="btn-group">
    <Button variant="primary">검색</Button>
    <Button>초기화</Button>
  </div>
</div>`}
                >
                    <div className="form-row">
                        <Field label="검색 조건" htmlFor="std-search-type">
                            <select id="std-search-type" className="form-control">
                                <option>이름</option>
                                <option>아이디</option>
                            </select>
                        </Field>
                        <Field label="검색어" htmlFor="std-search-q">
                            <input id="std-search-q" type="search" className="form-control" placeholder="검색어를 입력하세요" />
                        </Field>
                        <div className="btn-group">
                            <Button variant="primary">검색</Button>
                            <Button>초기화</Button>
                        </div>
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const SelectGroup = () => {
    /* 셀렉트 */
    const [tutor, setTutor] = useState(null);
    const [students, setStudents] = useState(STUDENT_OPTIONS.slice(0, 2));
    const [tutorTouched, setTutorTouched] = useState(false);
    const tutorError = tutorTouched && !tutor ? "강사를 고르세요." : "";

    return (
        <>
            <GroupTitle>검색 셀렉트 (react-select)</GroupTitle>
            <Variants>
                <Variant
                    name="SelectBox: 하나 (검색 · 지우기)"
                    source="common/ui/SelectBox.jsx · selectStyles.js"
                    note={"react-select에 표준 모양(36px · 테두리 · 포커스 · 다크 모드)을 입힌 것. 강사 · 과목 선택처럼 목록이 길 때.\n짧은 목록이면 <select className=\"form-control\">. 고를 수 없는 항목은 isDisabled"}
                    code={`
<Field label="담당 강사" htmlFor="tutor" required error={error}>
  <SelectBox inputId="tutor" options={tutors} value={tutor} onChange={setTutor}
             isClearable />
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
        </>
    );
};

const ChoiceGroupDemo = () => {
    const toast = useToast();

    /* 선택 */
    const [counselType, setCounselType] = useState("study");
    const [filters, setFilters] = useState(["study", "career"]);
    const [period, setPeriod] = useState("week");
    const [grade, setGrade] = useState("Y");
    const [onlyMine, setOnlyMine] = useState(false);
    const [notify, setNotify] = useState(true);

    return (
        <>
            <GroupTitle>선택 (pill · 세그먼트 · 켜고 끄는 버튼 · 스위치)</GroupTitle>
            <Variants>
                <Variant
                    name="ChoiceGroup: 하나 고르기 (pill)"
                    source="styles/choice.css · common/ui/ChoiceGroup.jsx"
                    note={"MyCounsel 상담 유형(.typeGroup)의 표준. 진짜 radio라서 방향키로 이동.\n고를 수 없는 항목은 disabled"}
                    code={`
<ChoiceGroup
  name="counsel-type"
  legend="상담 유형"
  options={[{ value: "study", label: "학습" }, ...]}
  value={type}
  onChange={setType}
/>`}
                >
                    <ChoiceGroup name="std-counsel-type" legend="상담 유형" options={COUNSEL_TYPES} value={counselType} onChange={setCounselType} />
                </Variant>
                <Variant
                    name="ChoiceGroup multiple: 여러 개 (필터)"
                    note="체크박스. value는 배열"
                    code={`<ChoiceGroup multiple name="filter" legend="분류" options={options} value={filters} onChange={setFilters} />`}
                >
                    <div className="form-stack" style={{ gap: "8px" }}>
                        <ChoiceGroup
                            multiple
                            name="std-filter"
                            legend="분류 필터"
                            options={COUNSEL_TYPES.slice(0, 4)}
                            value={filters}
                            onChange={setFilters}
                        />
                        <span className="field-hint">선택: {filters.length ? filters.join(", ") : "없음"}</span>
                    </div>
                </Variant>
                <Variant
                    name='variant="segmented": 붙은 전환'
                    note="보기 방식 · 기간처럼 항상 하나가 골라져 있는 2~4개"
                    code={`<ChoiceGroup variant="segmented" name="period" legend="기간" options={...} value={period} onChange={setPeriod} />`}
                >
                    <ChoiceGroup
                        variant="segmented"
                        name="std-period"
                        legend="기간"
                        options={[
                            { value: "day", label: "일" },
                            { value: "week", label: "주" },
                            { value: "month", label: "월" },
                        ]}
                        value={period}
                        onChange={setPeriod}
                    />
                </Variant>
                <Variant
                    name='켜고 끄는 버튼 (aria-pressed)'
                    source="styles/button.css"
                    note={"ExamGradeModal 선택형 채점 버튼의 표준. 눌린 버튼은 강조 배경.\n결과 색(정답 초록 · 오답 빨강)은 버튼이 아니라 Badge로"}
                    code={`<Button aria-pressed={grade === "Y"} onClick={() => setGrade("Y")}>정답</Button>`}
                >
                    <div className="form-stack" style={{ gap: "8px" }}>
                        <div className="btn-group" role="group" aria-label="채점">
                            {GRADES.map((g) => (
                                <Button key={g.value} size="sm" aria-pressed={grade === g.value} onClick={() => setGrade(g.value)}>
                                    {g.label}
                                </Button>
                            ))}
                        </div>
                        <span>
                            결과:{" "}
                            <Badge tone={{ Y: "success", N: "danger", H: "info", R: "warning" }[grade]}>
                                {GRADES.find((g) => g.value === grade).label}
                            </Badge>
                        </span>
                    </div>
                </Variant>
                <Variant
                    name="Switch: 바로 적용되는 설정"
                    source="styles/choice.css · common/ui/Switch.jsx"
                    note="누르는 즉시 적용될 때만. 저장 버튼을 눌러야 하는 값은 체크박스(.form-check)"
                    code={`<Switch checked={onlyMine} onChange={setOnlyMine}>내 과정만 보기</Switch>`}
                >
                    <div className="form-stack" style={{ gap: "10px" }}>
                        <Switch checked={onlyMine} onChange={setOnlyMine}>
                            내 과정만 보기
                        </Switch>
                        <Switch
                            checked={notify}
                            onChange={(v) => {
                                setNotify(v);
                                toast.success(v ? "알림을 켰습니다." : "알림을 껐습니다.");
                            }}
                        >
                            새 과제 알림
                        </Switch>
                        <Switch checked disabled onChange={() => {}}>
                            필수 알림 (변경 불가)
                        </Switch>
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const DateGroup = () => {

    /* 날짜 범위 */
    const [startDate, setStartDate] = useState("2026-03-02");
    const [endDate, setEndDate] = useState("2026-02-27");
    const rangeError = startDate && endDate && startDate > endDate ? "종료일이 시작일보다 빠릅니다." : "";

    return (
        <>
            <GroupTitle>날짜 · 숫자 · 기간 · 검색</GroupTitle>
            <Variants>
                <Variant
                    name="type별 입력"
                    source="styles/form.css (.form-control)"
                    note={"date · time · number · search 모두 .form-control 하나로 (CourseAdd · HomeworkSubmitStatus의 스타일 없는 입력 대신).\n달력 아이콘 색은 다크 모드를 따름"}
                    code={`<input type="date" className="form-control" />
<input type="number" className="form-control" min={0} max={100} />`}
                >
                    <div className="form-row" style={{ width: "100%" }}>
                        <Field label="시작일" htmlFor="std-date">
                            <input id="std-date" type="date" className="form-control" defaultValue="2026-03-02" />
                        </Field>
                        <Field label="시간" htmlFor="std-time">
                            <input id="std-time" type="time" className="form-control" defaultValue="09:00" />
                        </Field>
                        <Field label="배점" htmlFor="std-number" hint="0~100">
                            <input id="std-number" type="number" className="form-control" min={0} max={100} defaultValue={10} />
                        </Field>
                        <Field label="검색" htmlFor="std-search">
                            <input id="std-search" type="search" className="form-control" placeholder="과정명" />
                        </Field>
                    </div>
                </Variant>
                <Variant
                    name="기간 (input-range)"
                    source="styles/choice.css"
                    note="시작 ~ 끝. 오류는 Field error로 (예시: 종료일이 더 빠름)"
                    code={`
<Field label="수강 기간" htmlFor="period-start" required error={rangeError}>
  <div className="input-range">
    <input id="period-start" type="date" className="form-control"
           aria-invalid={!!rangeError} aria-describedby="period-start-msg" ... />
    <span className="input-range-sep">~</span>
    <input type="date" className="form-control" aria-label="종료일" ... />
  </div>
</Field>`}
                >
                    <div style={{ width: "100%" }}>
                        <Field label="수강 기간" htmlFor="std-range-start" required error={rangeError} hint="시작일과 종료일을 고르세요.">
                            <div className="input-range">
                                <input
                                    id="std-range-start"
                                    type="date"
                                    className="form-control"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    aria-invalid={!!rangeError}
                                    aria-describedby="std-range-start-msg"
                                />
                                <span className="input-range-sep">~</span>
                                <input
                                    type="date"
                                    className="form-control"
                                    aria-label="종료일"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    aria-invalid={!!rangeError}
                                />
                            </div>
                        </Field>
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const FileGroup = () => {
    /* 파일 */
    const [single, setSingle] = useState(null);
    const [files, setFiles] = useState([]);

    const addFiles = (picked) => {
        setFiles((prev) => [
            ...prev,
            ...picked.map((f) => ({ key: `${f.name}-${f.size}-${f.lastModified}`, name: f.name, size: f.size })),
        ]);
    };

    return (
        <>
            <GroupTitle>파일</GroupTitle>
            <Variants>
                <Variant
                    name="FilePicker: 하나"
                    source="styles/choice.css · common/ui/FilePicker.jsx"
                    note={"MyTimetable 파일 선택 상자 · common FileField의 표준. 숨긴 input + 버튼 모양 label.\nTab으로 오면 버튼에 포커스 테두리"}
                    code={`<FilePicker accept=".xlsx" onSelect={([file]) => setFile(file)} fileName={file?.name} />`}
                >
                    <FilePicker accept=".xlsx,.csv" label="시간표 파일" onSelect={([file]) => setSingle(file ?? null)} fileName={single?.name} />
                </Variant>
                <Variant
                    name="여러 개 + FileList (지우기)"
                    note="고른 파일은 칩으로. 이름이 길면 말줄임"
                    code={`
<FilePicker multiple onSelect={addFiles} />
<FileList files={files} onRemove={(f) => setFiles(files.filter((x) => x.key !== f.key))} />`}
                >
                    <div className="form-stack" style={{ gap: "8px", width: "100%" }}>
                        <FilePicker multiple label="첨부 추가" onSelect={addFiles} />
                        <FileList files={files} onRemove={(f) => setFiles((prev) => prev.filter((x) => x.key !== f.key))} />
                        {files.length === 0 && <span className="field-hint">첨부한 파일이 없습니다.</span>}
                    </div>
                </Variant>
                <Variant
                    name="첨부 내려받기 (FileList, href)"
                    note="MyCourseData 첨부 칩의 표준. 지우기 없이 링크만"
                    code={`<FileList files={[{ key, name, size, href }]} />`}
                >
                    <FileList files={ATTACHMENTS} />
                </Variant>
            </Variants>
        </>
    );
};

const ListEditorGroup = () => {
    const [demoOptions, setDemoOptions] = useState(() => [newListItem("매우 만족"), newListItem("만족"), newListItem("보통")]);

    return (
        <>
            <GroupTitle>반복 입력 행</GroupTitle>
            <Variants>
                <Variant
                    name="ListEditor: 반복 입력 행"
                    source="styles/content.css · common/ui/ListEditor.jsx"
                    note={"Survey 보기 입력(입력 + 삭제 · 추가 버튼)의 표준. 줄에서 Enter → 아래에 새 줄, 빈 줄에서 Backspace → 그 줄 지움.\nmin · max로 줄 수 제한. 새 줄은 newListItem()"}
                    code={`
import { newListItem } from "../common/ui/listEditorItem";

const [options, setOptions] = useState([newListItem(), newListItem()]);
<ListEditor label="보기" items={options} onChange={setOptions} min={2} max={6} addLabel="보기 추가" />`}
                >
                    <div style={{ width: "100%" }}>
                        <ListEditor label="보기" items={demoOptions} onChange={setDemoOptions} min={2} max={6} addLabel="보기 추가" placeholder="보기 내용" />
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

export const StandardInputCatalog = () => (
    <div>
        <p className={styles.standardIntro}>버튼 · 입력 · 검색 셀렉트 · 선택 · 날짜 · 파일 · 반복 입력 행. 스타일 원본: styles/button.css · form.css · choice.css · content.css(list-editor), common/ui/selectStyles.js</p>
        <ButtonGroup />
        <FormGroup />
        <SelectGroup />
        <ChoiceGroupDemo />
        <DateGroup />
        <FileGroup />
        <ListEditorGroup />
    </div>
);
