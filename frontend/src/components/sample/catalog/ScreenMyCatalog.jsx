import { useState } from "react";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Badge from "../../common/ui/Badge.jsx";
import Field from "../../common/ui/Field.jsx";
import Panel from "../../common/ui/Panel.jsx";
import Callout from "../../common/ui/Callout.jsx";
import ChoiceGroup from "../../common/ui/ChoiceGroup.jsx";
import StatCard from "../../common/ui/StatCard.jsx";
import { useConfirm, useToast } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons.js";

/*
 * 표준 UI 화면 예시: 로그인 · 비밀번호 다시 확인 (login · my/info MyPassword) · 상담 기록 (my/course MyCounsel).
 * 가이드: frontend/docs/ui-style-guide.md 8장 "화면 예시"
 */

/* ───── 로그인 · 비밀번호 다시 확인 ───── */
const AuthScreen = () => {
    const [kind, setKind] = useState("login");
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const isLogin = kind === "login";

    const submit = (event) => {
        event.preventDefault();
        if ((isLogin && !id.trim()) || !password) {
            setError(isLogin ? "아이디와 비밀번호를 입력하세요." : "비밀번호를 입력하세요.");
            return;
        }
        setLoading(true);
        setError("");
        setTimeout(() => {
            setLoading(false);
            setPassword("");
            setError(isLogin ? "아이디 또는 비밀번호가 맞지 않습니다. (5회 틀리면 잠김, 남은 횟수 3회)" : "비밀번호가 맞지 않습니다.");
        }, 700);
    };

    const switchKind = (next) => {
        setKind(next);
        setId("");
        setPassword("");
        setError("");
    };

    return (
        <Variant
            name="로그인 · 비밀번호 다시 확인 (가운데 카드)"
            source="auth-page · auth-card · Field · Callout(danger) · Button(block · loading)"
            note={
                "Login · MyPassword(내 정보 · 상담 기록에 들어가기 전 비밀번호 확인)를 같은 틀로. 사이드바 없이 가운데 카드 하나.\n" +
                "오류는 칸마다가 아니라 카드 위 Callout 하나 (어느 칸이 틀렸는지 알려 주지 않음). 틀리면 비밀번호 칸만 비우고 아이디는 남김.\n" +
                "버튼은 전체 폭 + 확인 중 loading. 비밀번호 확인은 누구의 화면인지 알 수 있게 설명 한 줄 + 돌아가기 링크"
            }
            block
        >
            <div className="form-stack" style={{ width: "100%" }}>
                <ChoiceGroup
                    variant="segmented"
                    name="std-auth-kind"
                    legend="예시 화면"
                    options={[
                        { value: "login", label: "로그인" },
                        { value: "reauth", label: "비밀번호 다시 확인" },
                    ]}
                    value={kind}
                    onChange={switchKind}
                />
                <div className="auth-page" style={{ minHeight: "auto", borderRadius: "var(--radius-lg)" }}>
                    <form className="auth-card" onSubmit={submit} noValidate>
                        <h2 className="auth-title">{isLogin ? "LMS 로그인" : "비밀번호 확인"}</h2>
                        {!isLogin && <p className="auth-description">개인 정보를 보려면 비밀번호를 한 번 더 입력하세요.</p>}
                        {error && (
                            <Callout tone="danger" icon={null}>
                                {error}
                            </Callout>
                        )}
                        <div className="form-stack">
                            {isLogin && (
                                <Field label="아이디" htmlFor="std-auth-id">
                                    <input id="std-auth-id" className="form-control" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} />
                                </Field>
                            )}
                            <Field label="비밀번호" htmlFor="std-auth-pw">
                                <input
                                    id="std-auth-pw"
                                    type="password"
                                    className="form-control"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </Field>
                        </div>
                        <Button type="submit" variant="primary" block loading={loading}>
                            {loading ? (isLogin ? "로그인 중..." : "확인 중...") : isLogin ? "로그인" : "확인"}
                        </Button>
                        <p className="auth-footer">{isLogin ? "비밀번호를 잊었으면 관리자에게 초기화를 요청하세요." : <a href="#std-auth-kind">이전 화면으로</a>}</p>
                    </form>
                </div>
            </div>
        </Variant>
    );
};

/* ───── 상담 기록 (MyCounsel) ───── */
/** 역량 수준: 같은 뜻 = 같은 색 (상 success · 중 info · 하 warning · 미진단 기본) */
const LEVELS = [
    { value: "H", label: "상", tone: "success" },
    { value: "M", label: "중", tone: "info" },
    { value: "L", label: "하", tone: "warning" },
    { value: "", label: "미진단", tone: undefined },
];
const levelOf = (v) => LEVELS.find((l) => l.value === v) ?? LEVELS[3];
const STAGES = [
    { id: "start", label: "시작" },
    { id: "mid", label: "중간" },
    { id: "end", label: "수료" },
];
const COUNSEL_TYPES = [
    { value: "학습", label: "학습" },
    { value: "진로", label: "진로" },
    { value: "취업", label: "취업" },
    { value: "기타", label: "기타" },
];
const NOTE_MAX = 4000;

const CounselScreen = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const [hasBase, setHasBase] = useState(false);
    const [levels, setLevels] = useState({ start: { level: "M", note: "자바 기본 문법은 익숙함." }, mid: { level: "", note: "" }, end: { level: "", note: "" } });
    const [editingLevels, setEditingLevels] = useState(false);
    const [draft, setDraft] = useState(levels);
    const [records, setRecords] = useState([{ id: 1, date: "2026-10-12", type: "학습", text: "스트림 API가 어렵다고 함. 추가 예제 안내." }]);
    const [type, setType] = useState("학습");
    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const locked = !hasBase;

    const dirty = JSON.stringify(draft) !== JSON.stringify(levels);
    const cancelLevels = async () => {
        if (dirty && !(await confirm({ message: "고친 내용을 버릴까요?", confirmText: "버리기", danger: true }))) return;
        setEditingLevels(false);
    };
    const saveLevels = () => {
        setLevels(draft);
        setEditingLevels(false);
        toast.success("역량 진단을 저장했습니다.");
    };

    const addRecord = async (event) => {
        event.preventDefault();
        if (!text.trim()) return setError("상담 내용을 입력하세요.");
        if (!(await confirm({ title: "상담 내용 등록", message: "등록한 상담 내용은 고치거나 지울 수 없습니다. 등록할까요?", confirmText: "등록" }))) return;
        setRecords((prev) => [{ id: prev.length + 1, date: "2026-11-16", type, text: text.trim() }, ...prev]);
        setText("");
        setError("");
        toast.success("상담 내용을 등록했습니다.");
    };

    return (
        <Variant
            name="상담 기록 (기본 정보 먼저 · 구역별 수정 · 수준 배지 · 고칠 수 없는 기록)"
            source="Callout(actions) · desc-list · Panel(actions) · Badge · StatCard · ChoiceGroup · Field(count) · timeline"
            note={
                "MyCounsel(비밀번호 확인 → 수강생 상세: 기본 정보 · 역량 진단 3단계 · 성적 · 상담 내용 · 종합 의견)를 표준으로.\n" +
                "기본 정보가 없으면 맨 위 Callout + [기본 정보 등록], 아래 구역은 잠금(수정 버튼 비활성 + 이유). 구역마다 Panel 머리의 [수정] → [취소] [저장] (보기 ↔ 수정 규칙).\n" +
                "수준 배지: 상 초록 · 중 파랑 · 하 노랑 · 미진단 회색. 상담 내용은 등록 전에 '고칠 수 없음'을 확인하고, 최신이 위인 timeline"
            }
            block
        >
            <div className="form-stack" style={{ width: "100%" }}>
                {locked && (
                    <Callout
                        tone="warning"
                        title="기본 정보가 없습니다"
                        actions={
                            <Button size="sm" variant="primary" onClick={() => setHasBase(true)}>
                                기본 정보 등록
                            </Button>
                        }
                    >
                        성별 · 연락처를 먼저 등록해야 역량 진단과 상담 내용을 쓸 수 있습니다.
                    </Callout>
                )}
                <Panel title="홍길동" subtitle="풀스택 개발자 과정 28기" badge={hasBase ? undefined : <Badge tone="warning">기본 정보 없음</Badge>}>
                    <dl className="desc-list" style={{ "--desc-label-width": "80px" }}>
                        <dt>기간</dt>
                        <dd>2026-06-01 ~ 2026-11-30</dd>
                        <dt>성별</dt>
                        <dd>{hasBase ? "남" : "-"}</dd>
                        <dt>연락처</dt>
                        <dd>{hasBase ? "010-1234-5678" : "-"}</dd>
                    </dl>
                </Panel>

                <Panel
                    title="역량 수준 진단"
                    actions={
                        editingLevels ? (
                            <>
                                <Button size="sm" onClick={cancelLevels}>
                                    취소
                                </Button>
                                <Button size="sm" variant="primary" onClick={saveLevels} disabled={!dirty}>
                                    저장
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="sm"
                                icon={icons.edit}
                                disabled={locked}
                                title={locked ? "기본 정보를 먼저 등록하세요" : undefined}
                                onClick={() => {
                                    setDraft(levels);
                                    setEditingLevels(true);
                                }}
                            >
                                수정
                            </Button>
                        )
                    }
                >
                    <div className="card-grid">
                        {STAGES.map((s) => {
                            const value = (editingLevels ? draft : levels)[s.id];
                            const level = levelOf(value.level);
                            return (
                                <div key={s.id} className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">{s.label}</h3>
                                        {!editingLevels && <Badge tone={level.tone}>{level.label}</Badge>}
                                    </div>
                                    {editingLevels ? (
                                        <div className="form-stack" style={{ gap: "8px" }}>
                                            <ChoiceGroup
                                                variant="segmented"
                                                name={`std-level-${s.id}`}
                                                legend={`${s.label} 수준`}
                                                options={LEVELS.map((l) => ({ value: l.value, label: l.label }))}
                                                value={value.level}
                                                onChange={(lv) => setDraft({ ...draft, [s.id]: { ...value, level: lv } })}
                                            />
                                            <textarea
                                                className="form-control"
                                                rows={2}
                                                aria-label={`${s.label} 진단 내용`}
                                                value={value.note}
                                                onChange={(e) => setDraft({ ...draft, [s.id]: { ...value, note: e.target.value } })}
                                            />
                                        </div>
                                    ) : (
                                        <p className={`card-body${value.note ? "" : " field-hint"}`}>{value.note || "아직 진단하지 않았습니다."}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Panel>

                <div className="layout-split" style={{ "--layout-aside-width": "220px" }}>
                    <Panel title="상담 내용" subtitle={`${records.length}건`}>
                        <form className="form-stack" onSubmit={addRecord} noValidate>
                            <Field group label="상담 유형">
                                <ChoiceGroup name="std-counsel-type2" options={COUNSEL_TYPES} value={type} onChange={setType} />
                            </Field>
                            <Field
                                label="내용"
                                htmlFor="std-counsel-text"
                                error={error}
                                hint={locked ? "기본 정보를 먼저 등록하세요." : "등록한 뒤에는 고치거나 지울 수 없습니다."}
                                count={{ current: text.length, max: NOTE_MAX }}
                            >
                                <textarea
                                    id="std-counsel-text"
                                    className="form-control"
                                    rows={3}
                                    maxLength={NOTE_MAX}
                                    disabled={locked}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                />
                            </Field>
                            <div>
                                <Button type="submit" variant="primary" disabled={locked}>
                                    상담 내용 등록
                                </Button>
                            </div>
                        </form>
                        <ol className="timeline" style={{ marginTop: "16px" }}>
                            {records.map((r) => (
                                <li key={r.id} className="timeline-item">
                                    <div className="timeline-meta">
                                        {r.date} <span className="tag">{r.type}</span>
                                    </div>
                                    <p className="timeline-body">{r.text}</p>
                                </li>
                            ))}
                        </ol>
                    </Panel>
                    <StatCard label="시험 평균" value="82" unit="점" hint="5회 응시" />
                </div>
            </div>
        </Variant>
    );
};

export const ScreenMyCatalog = () => (
    <>
        <GroupTitle>화면 예시: 로그인 · 내 정보 · 상담</GroupTitle>
        <Variants wide>
            <AuthScreen />
            <CounselScreen />
        </Variants>
    </>
);
