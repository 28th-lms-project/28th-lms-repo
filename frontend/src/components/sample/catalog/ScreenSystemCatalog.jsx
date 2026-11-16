import { useState } from "react";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Badge from "../../common/ui/Badge.jsx";
import Field from "../../common/ui/Field.jsx";
import Panel from "../../common/ui/Panel.jsx";
import Callout from "../../common/ui/Callout.jsx";
import Table from "../../common/ui/Table.jsx";
import Switch from "../../common/ui/Switch.jsx";
import TransferList from "../../common/ui/TransferList.jsx";
import { useConfirm, useToast } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons.js";

/*
 * 표준 UI 화면 예시: 시스템 관리 (admin/system access · access-role · code).
 * 가이드: frontend/docs/ui-style-guide.md 8장 "화면 예시"
 */

/* 대 · 중 · 소 메뉴 (연쇄 선택용) */
const MENUS = {
    "시스템 관리": { "회원 관리": ["회원 목록", "회원 등록"], "역할 관리": ["역할 목록"], "코드 관리": ["공통 코드"] },
    "과정 관리": { "과정 목록": ["과정 상세", "과정 등록"], "시험 관리": ["문제 은행", "시험 만들기"] },
    "내 강의실": { "시간표": ["오늘 시간표"], 자료실: ["자료 목록"] },
};
/** 도메인별 권한 (서버 GET /action-codes 의 domainList 모양: 권한마다 설명이 있음) */
const ACTION_DOMAINS = [
    { domain: "MEMBER", actions: [["READ", "회원 조회"], ["CREATE", "회원 등록"], ["UPDATE", "회원 수정"], ["DELETE", "회원 삭제"]] },
    { domain: "ROLE", actions: [["READ", "역할 조회"], ["UPDATE", "역할 수정"]] },
    { domain: "EXAM", actions: [["READ", "시험 조회"], ["CREATE", "시험 만들기"], ["GRADE", "채점"]] },
    { domain: "COURSE", actions: [["READ", "과정 조회"], ["CREATE", "과정 등록"]] },
].map((d) => ({ ...d, actions: d.actions.map(([action, description]) => ({ code: `${d.domain}_${action}`, action, description })) }));
const domainOfCode = (code) => ACTION_DOMAINS.find((d) => d.actions.some((a) => a.code === code))?.domain ?? "";

/** 대 → 중 → 소. 위를 고르기 전에는 아래가 비활성, 위를 바꾸면 아래는 비움 */
const MenuCascade = ({ idBase, value, onChange, disabled = false, compact = false }) => {
    const mids = value.top ? Object.keys(MENUS[value.top]) : [];
    const lows = value.top && value.mid ? MENUS[value.top][value.mid] : [];
    const cls = `form-control${compact ? " form-control-sm" : ""}`;
    return (
        <div className="input-range" role="group" aria-label="메뉴 위치">
            <select id={`${idBase}-top`} className={cls} value={value.top} disabled={disabled} onChange={(e) => onChange({ top: e.target.value, mid: "", low: "" })} aria-label="대메뉴">
                <option value="">대메뉴 전체</option>
                {Object.keys(MENUS).map((m) => (
                    <option key={m}>{m}</option>
                ))}
            </select>
            <span className="input-range-sep">›</span>
            <select className={cls} value={value.mid} disabled={disabled || !value.top} onChange={(e) => onChange({ ...value, mid: e.target.value, low: "" })} aria-label="중메뉴">
                <option value="">{value.top ? "중메뉴 전체" : "대메뉴를 먼저"}</option>
                {mids.map((m) => (
                    <option key={m}>{m}</option>
                ))}
            </select>
            <span className="input-range-sep">›</span>
            <select className={cls} value={value.low} disabled={disabled || !value.mid} onChange={(e) => onChange({ ...value, low: e.target.value })} aria-label="소메뉴">
                <option value="">{value.mid ? "소메뉴 전체" : "중메뉴를 먼저"}</option>
                {lows.map((m) => (
                    <option key={m}>{m}</option>
                ))}
            </select>
        </div>
    );
};

const matchMenu = (row, f) => (!f.top || row.top === f.top) && (!f.mid || row.mid === f.mid) && (!f.low || row.low === f.low);
const EMPTY_MENU = { top: "", mid: "", low: "" };

const INITIAL_ACCESS = [
    { id: 1, code: "MEMBER_READ", name: "회원 조회", top: "시스템 관리", mid: "회원 관리", low: "회원 목록" },
    { id: 2, code: "MEMBER_CREATE", name: "회원 등록", top: "시스템 관리", mid: "회원 관리", low: "회원 등록" },
    { id: 3, code: "ROLE_UPDATE", name: "역할 수정", top: "시스템 관리", mid: "역할 관리", low: "역할 목록" },
    { id: 4, code: "EXAM_CREATE", name: "시험 만들기", top: "과정 관리", mid: "시험 관리", low: "시험 만들기" },
    { id: 5, code: "COURSE_READ", name: "과정 조회", top: "과정 관리", mid: "과정 목록", low: "과정 상세" },
];

/* ───── 권한 코드 관리 (Access) ───── */
const AccessScreen = () => {
    const toast = useToast();
    const [rows, setRows] = useState(INITIAL_ACCESS);
    const [editingId, setEditingId] = useState(null);
    const [menu, setMenu] = useState(EMPTY_MENU);
    const [domain, setDomain] = useState("");
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [nameEdited, setNameEdited] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const editing = editingId != null;
    const actions = ACTION_DOMAINS.find((d) => d.domain === domain)?.actions ?? [];
    const isTaken = (c) => rows.some((r) => r.code === c && r.id !== editingId);
    const taken = isTaken(code);

    const changeDomain = (next) => {
        setDomain(next);
        setCode("");
        if (!nameEdited) setName("");
    };
    // 권한을 고르면 이름을 설명으로 채움 (직접 고친 뒤에는 그대로)
    const changeCode = (next) => {
        setCode(next);
        if (!nameEdited) setName(actions.find((a) => a.code === next)?.description ?? "");
    };

    const errors = submitted
        ? {
              menu: !menu.low ? "소메뉴까지 고르세요." : "",
              code: !code ? "도메인과 권한을 고르세요." : taken ? "이미 등록된 권한 코드입니다." : "",
              name: !name.trim() ? "권한 이름을 입력하세요." : "",
          }
        : {};

    const reset = () => {
        setEditingId(null);
        setMenu(EMPTY_MENU);
        setDomain("");
        setCode("");
        setName("");
        setNameEdited(false);
        setSubmitted(false);
    };

    const startEdit = (row) => {
        setEditingId(row.id);
        setMenu({ top: row.top, mid: row.mid, low: row.low });
        setDomain(domainOfCode(row.code));
        setCode(row.code);
        setName(row.name);
        setNameEdited(true);
        setSubmitted(false);
    };

    const submit = (event) => {
        event.preventDefault();
        setSubmitted(true);
        if (!menu.low || !code || taken || !name.trim()) return;
        if (editing) {
            setRows((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...menu, name: name.trim() } : r)));
            toast.success("수정했습니다. (예시)");
        } else {
            setRows((prev) => [...prev, { id: Math.max(...prev.map((r) => r.id)) + 1, code, name: name.trim(), ...menu }]);
            toast.success(`${code}를 추가했습니다. (예시)`);
        }
        reset();
    };

    const columns = [
        { key: "id", title: "ID", width: "56px", align: "num" },
        { key: "code", title: "권한 코드", width: "22%", mono: true },
        { key: "name", title: "이름" },
        { key: "menu", title: "메뉴 위치", render: (r) => `${r.top} › ${r.mid} › ${r.low}` },
        {
            key: "actions",
            title: "작업",
            width: "84px",
            align: "actions",
            render: (r) => (
                <Button size="sm" variant="text" onClick={() => startEdit(r)} disabled={editingId === r.id}>
                    수정
                </Button>
            ),
        },
    ];

    return (
        <Variant
            name="권한 코드 관리: 연쇄 선택 + 같은 폼으로 추가 · 수정"
            source="Panel · Field · input-range(메뉴 select 셋) · form-row(도메인 · 권한 · 이름) · Table · Badge"
            note={
                "Access(대 · 중 · 소 select + 도메인 · 권한 select + 이름 + [추가] / 표의 [수정]을 누르면 위 폼이 수정 모드)를 표준으로.\n" +
                "도메인 · 권한은 원래 화면처럼 서버가 준 목록에서 고름 (권한마다 '설명 (동작)', 등록된 것은 비활성 · 등록됨). 고르면 이름을 설명으로 채움. 결과 코드는 따로 상자 대신 권한 칸 힌트로.\n" +
                "연쇄 선택: 위를 고르기 전에는 아래가 비활성(안내 문구), 위를 바꾸면 아래는 비움.\n" +
                "수정 모드: 폼 제목 · 배지 · 버튼 문구가 바뀌고, 바꿀 수 없는 값(권한 코드)은 잠금 + 이유 힌트. 수정 중인 행은 표에서 선택 표시"
            }
            block
        >
            <div className="form-stack" style={{ width: "100%" }}>
                <form onSubmit={submit} noValidate>
                    <Panel
                        title={editing ? "권한 코드 수정" : "권한 코드 추가"}
                        badge={editing ? <Badge tone="warning">수정 중</Badge> : undefined}
                        footer={
                            <>
                                {editing && <Button onClick={reset}>취소</Button>}
                                <Button type="submit" variant="primary" icon={editing ? undefined : icons.add}>
                                    {editing ? "수정 반영" : "추가"}
                                </Button>
                            </>
                        }
                    >
                        <div className="form-stack">
                            <Field label="메뉴 위치" htmlFor="std-access-menu-top" required error={errors.menu}>
                                <MenuCascade idBase="std-access-menu" value={menu} onChange={setMenu} />
                            </Field>
                            <div className="form-row">
                                <Field label="도메인" htmlFor="std-access-domain" required error={errors.code && !domain ? errors.code : ""} hint={editing ? "수정할 때는 바꿀 수 없습니다." : undefined}>
                                    <select
                                        id="std-access-domain"
                                        className="form-control"
                                        value={domain}
                                        disabled={editing}
                                        onChange={(e) => changeDomain(e.target.value)}
                                        aria-describedby="std-access-domain-msg"
                                    >
                                        <option value="">도메인 선택</option>
                                        {ACTION_DOMAINS.map((d) => (
                                            <option key={d.domain}>{d.domain}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field
                                    label="권한"
                                    htmlFor="std-access-code"
                                    required
                                    error={errors.code && domain ? errors.code : ""}
                                    hint={code ? `권한 코드: ${code}` : domain ? "등록된 권한은 고를 수 없습니다." : "도메인을 먼저 고르세요."}
                                >
                                    <select
                                        id="std-access-code"
                                        className="form-control"
                                        value={code}
                                        disabled={editing || !domain}
                                        onChange={(e) => changeCode(e.target.value)}
                                        aria-invalid={!!errors.code && !!domain}
                                        aria-describedby="std-access-code-msg"
                                    >
                                        <option value="">{domain ? "권한 선택" : "도메인을 먼저"}</option>
                                        {actions.map((a) => (
                                            <option key={a.code} value={a.code} disabled={isTaken(a.code)}>
                                                {`${a.description} (${a.action})${isTaken(a.code) ? " · 등록됨" : ""}`}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="권한 이름" htmlFor="std-access-name" required error={errors.name} hint="권한을 고르면 설명으로 채워짐 (고칠 수 있음)">
                                    <input
                                        id="std-access-name"
                                        className="form-control"
                                        placeholder="예: 회원 조회"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            setNameEdited(true);
                                        }}
                                        aria-invalid={!!errors.name}
                                        aria-describedby="std-access-name-msg"
                                    />
                                </Field>
                            </div>
                        </div>
                    </Panel>
                </form>
                <Table columns={columns} rows={rows} selectedKey={editingId ?? undefined} size="sm" ariaLabel="권한 코드 목록 (예시)" />
            </div>
        </Variant>
    );
};

/* ───── 역할별 권한 (AccessRole) ───── */
const ROLES = [
    { id: "ROLE_ADMIN", name: "관리자" },
    { id: "ROLE_TUTOR", name: "강사" },
    { id: "ROLE_STUDENT", name: "학생" },
];
const SAVED_GRANTS = {
    ROLE_ADMIN: [1, 2, 3, 4, 5],
    ROLE_TUTOR: [4, 5],
    ROLE_STUDENT: [5],
};

const AccessRoleScreen = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const [saved, setSaved] = useState(SAVED_GRANTS);
    const [role, setRole] = useState("ROLE_TUTOR");
    const [draft, setDraft] = useState(SAVED_GRANTS.ROLE_TUTOR.map(String));
    const [filter, setFilter] = useState(EMPTY_MENU);

    const savedKeys = saved[role].map(String);
    const added = draft.filter((k) => !savedKeys.includes(k)).length;
    const removed = savedKeys.filter((k) => !draft.includes(k)).length;
    const dirty = added + removed > 0;
    const items = INITIAL_ACCESS.filter((r) => matchMenu(r, filter) || draft.includes(String(r.id)));

    const selectRole = async (next) => {
        if (next === role) return;
        if (dirty && !(await confirm({ message: "저장하지 않은 변경이 있습니다. 버리고 다른 역할로 갈까요?", confirmText: "버리고 이동", danger: true }))) return;
        setRole(next);
        setDraft(saved[next].map(String));
    };

    const save = () => {
        setSaved((prev) => ({ ...prev, [role]: draft.map(Number) }));
        toast.success("권한을 저장했습니다. (예시)");
    };

    return (
        <Variant
            name="역할별 권한: 역할 목록 | 두 목록 옮기기 + 저장 전 변경 표시"
            source="layout-split · list-group · TransferList · Callout(actions) · 연쇄 선택(필터)"
            note={
                "AccessRole(역할 목록 | 허용 목록 | 미허용 목록, 각 목록에 필터, 누르면 바로 옮겨지고 [저장]으로 반영)을 표준으로.\n" +
                "옮기기는 TransferList(체크 후 옮기기 · 두 번 눌러 바로). 메뉴 필터는 위에 하나만 두고 미허용 후보를 좁힘 (허용 목록은 늘 전부 보임).\n" +
                "양쪽 뜻이 반대라 색으로 구분: 미허용 = 붉은 머리 + 흐린 글자(leftTone=danger), 허용 = 초록 머리(rightTone=success).\n옮긴 것은 바로 저장하지 않고 '저장하지 않은 변경 +n · -n' 안내 + [되돌리기] [저장]. 변경이 있는데 다른 역할을 고르면 확인"
            }
            block
        >
            <div className="layout-split layout-split-start" style={{ "--layout-aside-width": "200px", width: "100%" }}>
                <Panel title="역할" flush>
                    <ul className="list-group">
                        {ROLES.map((r) => (
                            <li key={r.id}>
                                <button type="button" className="list-item" aria-current={role === r.id || undefined} onClick={() => selectRole(r.id)}>
                                    {r.name}
                                    <span className="list-item-end">
                                        <Badge>{saved[r.id].length}</Badge>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </Panel>
                <div className="form-stack">
                    <div className="toolbar">
                        <MenuCascade idBase="std-access-role-filter" value={filter} onChange={setFilter} compact />
                        {(filter.top || filter.mid) && (
                            <Button size="sm" variant="text" onClick={() => setFilter(EMPTY_MENU)}>
                                필터 지우기
                            </Button>
                        )}
                    </div>
                    {dirty && (
                        <Callout
                            tone="warning"
                            actions={
                                <>
                                    <Button size="sm" onClick={() => setDraft(savedKeys)}>
                                        되돌리기
                                    </Button>
                                    <Button size="sm" variant="primary" onClick={save}>
                                        저장
                                    </Button>
                                </>
                            }
                        >
                            저장하지 않은 변경: 허용 +{added} · 해제 -{removed}
                        </Callout>
                    )}
                    <TransferList
                        items={items}
                        selectedKeys={draft}
                        onChange={setDraft}
                        rowKey={(r) => String(r.id)}
                        renderItem={(r) => (
                            <span>
                                <code>{r.code}</code> {r.name}
                            </span>
                        )}
                        leftTitle="미허용"
                        leftTone="danger"
                        rightTone="success"
                        rightTitle={`허용 (${ROLES.find((r) => r.id === role).name})`}
                        height={200}
                    />
                </div>
            </div>
        </Variant>
    );
};

/* ───── 공통 코드 (Code): 패널 하나가 보기 · 수정 · 추가 ───── */
const INITIAL_CODES = {
    TEST_ANSWER_TYPE: [
        { id: "ANSWER_SELECT", name: "객관식-단항", order: 1, used: true, crtDt: "2026-03-02", mdfDt: "2026-09-14" },
        { id: "ANSWER_CHECK", name: "O/X", order: 2, used: true, crtDt: "2026-03-02", mdfDt: "2026-03-02" },
        { id: "ANSWER_ESSAY", name: "서술형 (안 씀)", order: 3, used: false, crtDt: "2026-03-02", mdfDt: "2026-10-01" },
    ],
    TEST_SUBJECT: [
        { id: "JAVA", name: "JAVA", order: 1, used: true, crtDt: "2026-03-02", mdfDt: "2026-03-02" },
        { id: "DATABASE", name: "DB", order: 2, used: true, crtDt: "2026-03-02", mdfDt: "2026-03-02" },
    ],
};
const GROUP_NAMES = { TEST_ANSWER_TYPE: "시험 문제 유형", TEST_SUBJECT: "시험 과목" };
const EMPTY_CODE = { id: "", name: "", order: "", used: true };

const CodeScreen = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const [codes, setCodes] = useState(INITIAL_CODES);
    const [group, setGroup] = useState("TEST_ANSWER_TYPE");
    const [selectedId, setSelectedId] = useState("ANSWER_SELECT");
    const [mode, setMode] = useState("view"); // view | edit | add
    const [draft, setDraft] = useState(EMPTY_CODE);
    const [submitted, setSubmitted] = useState(false);

    const list = codes[group];
    const selected = list.find((c) => c.id === selectedId);
    const original = mode === "edit" ? selected : EMPTY_CODE;
    const dirty = mode !== "view" && ["id", "name", "order", "used"].some((k) => String(draft[k]) !== String(original?.[k] ?? ""));
    const errors = submitted
        ? {
              id: mode === "add" && !/^[A-Z][A-Z0-9_]*$/.test(draft.id) ? "영문 대문자 · 숫자 · 밑줄로 쓰세요." : mode === "add" && list.some((c) => c.id === draft.id) ? "이미 있는 코드입니다." : "",
              name: !draft.name.trim() ? "이름을 입력하세요." : "",
          }
        : {};

    const leaveIfClean = async () => !dirty || (await confirm({ message: "고친 내용을 버릴까요?", confirmText: "버리기", danger: true }));

    const open = async (nextMode, next) => {
        if (!(await leaveIfClean())) return false;
        setMode(nextMode);
        setSubmitted(false);
        setDraft(nextMode === "add" ? { ...EMPTY_CODE, order: String(list.length + 1) } : next ? { ...next, order: String(next.order) } : EMPTY_CODE);
        return true;
    };

    const select = async (nextGroup, id) => {
        if (!(await open("view"))) return;
        setGroup(nextGroup);
        setSelectedId(id);
    };

    const save = (event) => {
        event.preventDefault();
        setSubmitted(true);
        const bad = !draft.name.trim() || (mode === "add" && (!/^[A-Z][A-Z0-9_]*$/.test(draft.id) || list.some((c) => c.id === draft.id)));
        if (bad) return;
        const item = { ...draft, name: draft.name.trim(), order: Number(draft.order) || list.length + 1, crtDt: selected?.crtDt ?? "2026-11-16", mdfDt: "2026-11-16" };
        setCodes((prev) => ({
            ...prev,
            [group]: mode === "add" ? [...prev[group], { ...item, crtDt: "2026-11-16" }] : prev[group].map((c) => (c.id === selectedId ? item : c)),
        }));
        setSelectedId(item.id);
        setMode("view");
        setSubmitted(false);
        toast.success(mode === "add" ? "코드를 추가했습니다. (예시)" : "저장했습니다. (예시)");
    };

    const columns = [
        { key: "id", title: "코드", mono: true },
        { key: "name", title: "이름" },
        { key: "order", title: "순서", width: "56px", align: "num" },
    ];

    const footer =
        mode === "view" ? (
            <Button icon={icons.edit} onClick={() => open("edit", selected)} disabled={!selected}>
                수정
            </Button>
        ) : (
            <>
                <Button onClick={() => open("view")}>취소</Button>
                <Button type="submit" variant="primary" disabled={!dirty}>
                    {mode === "add" ? "추가" : "저장"}
                </Button>
            </>
        );

    return (
        <Variant
            name="공통 코드: 그룹 | 코드 표 | 상세 패널 (보기 · 수정 · 추가)"
            source="layout-3col · list-group · Table(선택 행 · 흐린 행) · Panel · Field · Switch · desc-list"
            note={
                "Code(대 · 중 · 소 분류마다 표 + 그 아래 폼, 폼이 보기 · 수정 · 추가로 바뀜)를 표준으로.\n" +
                "상세 패널 하나가 세 상태: 보기(desc-list + [수정]) · 수정(입력 + [취소] [저장]) · 추가(빈 입력, 코드도 입력). 머리의 [추가]는 언제나 같은 자리.\n" +
                "추가 뒤에는 코드(ID)를 못 바꿈. 고친 채로 다른 행 · [취소]를 누르면 확인. 안 쓰는 코드는 표에서 흐리게"
            }
            block
        >
            <form onSubmit={save} noValidate style={{ width: "100%" }}>
                <div className="layout-3col">
                    <Panel title="코드 그룹" flush>
                        <ul className="list-group">
                            {Object.keys(codes).map((g) => (
                                <li key={g}>
                                    <button type="button" className="list-item" aria-current={group === g || undefined} onClick={() => select(g, codes[g][0]?.id)}>
                                        {GROUP_NAMES[g]}
                                        <span className="list-item-end">
                                            <Badge>{codes[g].length}</Badge>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                    <Panel
                        title={GROUP_NAMES[group]}
                        subtitle={`${list.length}건`}
                        flush
                        actions={
                            <Button size="sm" icon={icons.add} onClick={() => open("add")} disabled={mode === "add"}>
                                추가
                            </Button>
                        }
                    >
                        <Table
                            columns={columns}
                            rows={list}
                            selectedKey={mode === "add" ? undefined : selectedId}
                            onRowClick={(r) => select(group, r.id)}
                            isRowMuted={(r) => !r.used}
                            size="sm"
                            ariaLabel={`${GROUP_NAMES[group]} 코드 (예시)`}
                        />
                    </Panel>
                    <Panel
                        title={mode === "add" ? "새 코드" : selected?.name ?? "코드"}
                        badge={mode === "view" ? (selected?.used ? <Badge tone="success">사용</Badge> : <Badge>안 씀</Badge>) : <Badge tone="warning">{mode === "add" ? "추가 중" : "수정 중"}</Badge>}
                        footer={footer}
                    >
                        {mode === "view" ? (
                            selected && (
                                <dl className="desc-list" style={{ "--desc-label-width": "64px" }}>
                                    <dt>코드</dt>
                                    <dd className="cell-mono">{selected.id}</dd>
                                    <dt>상위</dt>
                                    <dd>{GROUP_NAMES[group]}</dd>
                                    <dt>순서</dt>
                                    <dd>{selected.order}</dd>
                                    <dt>등록</dt>
                                    <dd>{selected.crtDt}</dd>
                                    <dt>수정</dt>
                                    <dd>{selected.mdfDt}</dd>
                                </dl>
                            )
                        ) : (
                            <div className="form-stack">
                                <Field label="코드" htmlFor="std-code-id" required={mode === "add"} error={errors.id} hint={mode === "edit" ? "추가한 뒤에는 바꿀 수 없습니다." : "영문 대문자 · 숫자 · 밑줄"}>
                                    <input
                                        id="std-code-id"
                                        className="form-control form-control-mono"
                                        value={draft.id}
                                        readOnly={mode === "edit"}
                                        onChange={(e) => setDraft({ ...draft, id: e.target.value.toUpperCase() })}
                                        aria-invalid={!!errors.id}
                                        aria-describedby="std-code-id-msg"
                                    />
                                </Field>
                                <Field label="이름" htmlFor="std-code-name" required error={errors.name}>
                                    <input
                                        id="std-code-name"
                                        className="form-control"
                                        value={draft.name}
                                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                        aria-invalid={!!errors.name}
                                        aria-describedby="std-code-name-msg"
                                    />
                                </Field>
                                <Field label="순서" htmlFor="std-code-order">
                                    <input id="std-code-order" type="number" min={1} className="form-control" style={{ width: "96px" }} value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} />
                                </Field>
                                <Switch checked={draft.used} onChange={(used) => setDraft({ ...draft, used })}>
                                    사용
                                </Switch>
                            </div>
                        )}
                    </Panel>
                </div>
            </form>
        </Variant>
    );
};

export const ScreenSystemCatalog = () => (
    <>
        <GroupTitle>화면 예시: 시스템 관리 (권한 · 코드)</GroupTitle>
        <Variants wide>
            <AccessScreen />
            <AccessRoleScreen />
            <CodeScreen />
        </Variants>
    </>
);
