import { useState } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Field from "../../common/ui/Field.jsx";
import Badge from "../../common/ui/Badge.jsx";
import PageHeader, { Breadcrumb } from "../../common/ui/PageHeader.jsx";
import SideNav from "../../common/ui/SideNav.jsx";
import ChoiceGroup from "../../common/ui/ChoiceGroup.jsx";
import Switch from "../../common/ui/Switch.jsx";
import FilePicker, { FileList } from "../../common/ui/FilePicker.jsx";
import Progress from "../../common/ui/Progress.jsx";
import { useToast } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons.js";

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

export const StandardNavCatalog = () => {
    const toast = useToast();

    /* 메뉴 */
    const [currentMenu, setCurrentMenu] = useState("member");

    /* 선택 */
    const [counselType, setCounselType] = useState("study");
    const [filters, setFilters] = useState(["study", "career"]);
    const [period, setPeriod] = useState("week");
    const [grade, setGrade] = useState("Y");
    const [onlyMine, setOnlyMine] = useState(false);
    const [notify, setNotify] = useState(true);

    /* 날짜 범위 */
    const [startDate, setStartDate] = useState("2026-03-02");
    const [endDate, setEndDate] = useState("2026-02-27");
    const rangeError = startDate && endDate && startDate > endDate ? "종료일이 시작일보다 빠릅니다." : "";

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
        <div>
            <p className={styles.standardIntro}>
                화면 머리 · 사이드 메뉴 · 선택 입력 · 날짜 · 파일 · 진행 막대. 스타일 원본: styles/nav.css · choice.css · button.css(aria-pressed) · status.css(progress)
            </p>

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

            <GroupTitle>사이드 메뉴</GroupTitle>
            <Variants>
                <Variant
                    name="SideNav (그룹 접기 · 현재 화면)"
                    source="styles/nav.css · common/ui/SideNav.jsx"
                    note={"기존 menu/SideMenu 색(#212529 · 현재 #ff5252)을 토큰(--color-sidebar-*)으로.\n그룹 제목을 누르면 접힘. 현재 화면은 aria-current=\"page\" (빨간 글자 + 왼쪽 선).\n다크 모드와 상관없이 항상 어두움"}
                    code={`
<SideNav
  groups={menuGroups}        // [{ key, title, items: [{ key, title, icon }] }]
  currentKey={currentMenuKey}
  onSelect={(item) => navigate(item.path)}
/>`}
                >
                    <div style={{ width: "240px", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
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

            <GroupTitle>날짜 · 숫자 · 검색 · 범위</GroupTitle>
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
                        <Field label="배점" htmlFor="std-number" hint="0 ~ 100">
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

            <GroupTitle>진행 막대</GroupTitle>
            <Variants>
                <Variant
                    name="Progress"
                    source="styles/status.css · common/ui/Progress.jsx"
                    note={"진도율 · 제출률 · 지난 기간 (CourseItem의 진행 계산을 보여 줄 곳).\ntone: 기본 강조색 · success(완료) · warning · danger(마감 임박)"}
                    code={`<Progress label="진도율" value={42} showValue />
<Progress label="제출률" value={18} max={20} tone="success" showValue />`}
                >
                    <div className="form-stack" style={{ gap: "10px", width: "100%" }}>
                        <Progress label="진도율" value={42} showValue />
                        <Progress label="제출률" value={18} max={20} tone="success" showValue />
                        <Progress label="과제 기간" value={88} tone="warning" showValue />
                        <Progress label="마감 임박" value={97} tone="danger" showValue />
                        <Progress label="작게" value={60} size="sm" />
                    </div>
                </Variant>
                <Variant name="카드 안에서" note="과정 카드 · 수치 카드 아래">
                    <div className="card" style={{ width: "100%" }}>
                        <div className="card-header">
                            <strong className="card-title">풀스택 개발자 과정</strong>
                            <Badge tone="primary">진행 중</Badge>
                        </div>
                        <p className="card-meta">2026-03-02 ~ 2026-08-28 · 120일 중 52일</p>
                        <Progress label="과정 진행" value={52} max={120} showValue />
                    </div>
                </Variant>
            </Variants>
        </div>
    );
};
