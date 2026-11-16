import styles from "./Catalog.module.css";
import { GroupTitle } from "./CatalogParts.jsx";

/*
 * 현재 화면들에서 쓰는 색 · 글자 크기 · 모서리 · 컨트롤 높이 (2026-11 기준 집계).
 * 공통 토큰(CSS 변수)을 정할 때 후보로 쓴다. 숫자는 대략적인 사용 횟수.
 */
const colorGroups = [
    {
        title: "회색 (텍스트 · 테두리 · 배경)",
        colors: [
            ["#212529", "제목 · 사이드바 배경"],
            ["#222", "본문 진한 글자 ×12"],
            ["#333", "기본 글자 ×32"],
            ["#495057", "라벨 · 보조 버튼 ×22"],
            ["#555", "표 머리글 ×9"],
            ["#666", "아이콘 · 보조 글자 ×26"],
            ["#777", "힌트 ×12"],
            ["#888", "힌트 ×9"],
            ["#999", "빈 상태 ×8"],
            ["#adb5bd", "placeholder ×14"],
            ["#ccc", "테두리 ×35"],
            ["#ced4da", "테두리 ×25"],
            ["#ddd", "테두리 ×12"],
            ["#e5e5e5", "구분선 ×25"],
            ["#e4e4e4", "구분선 ×5"],
            ["#eee", "구분선 ×9"],
            ["#e9e9e9", "body 배경"],
            ["#f2f2f2", "disabled 배경 ×7"],
            ["#f7f7f7", "머리글 · 줄무늬 ×11"],
            ["#f8f9fa", "패널 머리 ×3"],
            ["#fafafa", "hover ×5"],
            ["#fff", "카드 배경 ×78"],
        ],
    },
    {
        title: "파랑 (강조 · 링크 · 선택)",
        colors: [
            ["#3b5bdb", "검색 버튼"],
            ["#3f6fb5", "상담 화면 강조 ×11"],
            ["#4a7fd8", "드래그 · 선택 표시 ×5"],
            ["#6b9cf6", "on/off 스위치"],
            ["rgb(86 151 255)", "Button positive"],
            ["#1c7ed6", "링크"],
            ["#1a73e8", "댓글 링크"],
            ["#1a5fb4", "첨부 파일 칩"],
            ["#0969da", "부분 정답"],
            ["#24518b", "텍스트 버튼"],
            ["#eef3fd", "선택 행 배경"],
            ["#f3f7ff", "안내 바 배경"],
            ["#bfd4fa", "시간표 머리글"],
        ],
    },
    {
        title: "빨강 (오류 · 위험)",
        colors: [
            ["#c62828", "오류 문구 ×6"],
            ["#dc3545", "오류 문구 ×4"],
            ["#d64545", "오류 상세 ×4"],
            ["#b42318", "오류 · 하 등급 ×3"],
            ["#e03131", "위험 버튼 · 잠김"],
            ["#d1242f", "오답"],
            ["#d93025", "마감 안내"],
            ["#ff5252", "사이드바 현재 메뉴"],
            ["rgb(232 107 123)", "Button negative"],
            ["#fff5f5", "위험 배경"],
            ["#ffc9c9", "위험 테두리"],
        ],
    },
    {
        title: "초록 (성공 · 정상)",
        colors: [
            ["#2b8a3e", "등록 버튼 · 정상"],
            ["#1a7f37", "정답"],
            ["#1e7b34", "상 등급"],
            ["#0f5132", "성공 문구"],
            ["#d1e7dd", "성공 배경"],
            ["#ebfbee", "정상 배지 배경"],
            ["#e3f6d0", "오늘 행"],
        ],
    },
    {
        title: "노랑 · 갈색 (경고 · 주의)",
        colors: [
            ["#8a6100", "중 등급 · 의견 상자"],
            ["#9a6700", "채점 중"],
            ["#7a5b00", "경고 문구"],
            ["#d68a00", "경고 아이콘"],
            ["#d8a800", "주의 테두리"],
            ["#fff8e6", "경고 배경"],
            ["#fffbea", "주의 배경"],
        ],
    },
];

const fontSizes = [
    ["22px", "화면 제목 (PageContainer)"],
    ["1.25rem (20px)", "폼 카드 제목"],
    ["18px", "큰 모달 제목 · 정보 카드 제목"],
    ["16px", "섹션 카드 제목 · 오류 화면 메시지"],
    ["15px", "문제 제목 · 확인 모달 문구"],
    ["14px", "본문 · 표 (ExamSetTable)"],
    ["13px", "가장 많이 씀 (×36): 표 · 입력 · 버튼 (admin/system, my/course)"],
    ["0.9rem (14.4px)", "입력 · 버튼 (member · login · my/info)"],
    ["0.875rem (14px)", "라벨 · 상세 목록"],
    ["0.85rem (13.6px)", "보조 버튼 · 사이드바 링크"],
    ["12px", "힌트 · 오류 · 건수 (×22)"],
    ["0.75rem (12px)", "배지 · 사이드바 소제목"],
    ["11px", "글자 수 · 태그 · 시간표"],
];

const radii = [
    ["3px", "Access 버튼 ×2"],
    ["4px", "대부분 (×59)"],
    ["5px", "IconButton · Button"],
    ["6px", "툴바 · 패널 · 토스트 ×7"],
    ["7px", "Input 컴포넌트 (TextField 등)"],
    ["8px", "확인 모달 · 큰 모달"],
    ["10px", "Alert · 태그 칩"],
    ["12px", "배지 (pill)"],
    ["14px", "pill 라디오"],
];

const heights = [29, 30, 34, 35, 36, 37, 38, 40, 43.5, 48];
const heightUses = {
    29: "AccessRole 버튼",
    30: "작은 버튼",
    34: "보조 버튼 · my/course 입력",
    35: "Role · Access 입력",
    36: "검색 툴바 · 셀렉트 (×10)",
    37: "AccessRole 셀렉트",
    38: "폼 입력 · 제출 버튼 (×8)",
    40: "표 머리글",
    43.5: "Id · Password 컴포넌트",
    48: "표 행 · 컬럼 머리",
};

/* ───── 표준 토큰 (index.css :root) ───── */
const STANDARD_COLORS = [
    {
        title: "글자",
        tokens: ["--color-text", "--color-text-secondary", "--color-text-muted", "--color-text-placeholder", "--color-text-disabled", "--color-text-inverse"],
    },
    {
        title: "배경 · 테두리",
        tokens: ["--color-bg-page", "--color-bg-surface", "--color-bg-subtle", "--color-bg-hover", "--color-bg-disabled", "--color-border", "--color-border-light", "--color-border-strong"],
    },
    {
        title: "강조 (테마로 바뀜)",
        tokens: ["--color-primary", "--color-primary-hover", "--color-primary-light", "--color-primary-border", "--color-link", "--color-focus"],
    },
    {
        title: "상태",
        tokens: [
            "--color-success", "--color-success-bg", "--color-success-border",
            "--color-danger", "--color-danger-bg", "--color-danger-border",
            "--color-warning", "--color-warning-bg", "--color-warning-border",
            "--color-info", "--color-info-bg", "--color-info-border",
        ],
    },
    {
        title: "사이드바 · 오버레이",
        tokens: ["--color-sidebar-bg", "--color-sidebar-text", "--color-sidebar-muted", "--color-sidebar-active", "--color-overlay", "--color-toast-bg"],
    },
];

const STANDARD_FONT_SIZES = [
    ["--font-size-xs", "글자 수 · 태그"],
    ["--font-size-sm", "힌트 · 오류 문구 · 배지 · 건수"],
    ["--font-size-md", "표 · 입력 · 버튼"],
    ["--font-size-base", "본문 · 상세 내용"],
    ["--font-size-lg", "카드 · 섹션 제목"],
    ["--font-size-xl", "모달 제목"],
    ["--font-size-2xl", "화면 제목"],
];

const STANDARD_SIZES = [
    ["--radius", "기본: 입력 · 버튼 · 표 · 작은 상자", "radius"],
    ["--radius-lg", "큰 상자: 패널 · 툴바 · 모달 · 토스트", "radius"],
    ["--radius-pill", "배지 · 칩 · pill 라디오", "radius"],
    ["--control-height-sm", "표 행 안 버튼 등 좁은 곳", "height"],
    ["--control-height-md", "입력 · 셀렉트 · 버튼 기본", "height"],
    ["--table-header-height", "표 머리글", "height"],
    ["--table-row-height", "표 행", "height"],
];

const STANDARD_SHADOWS = [
    ["--shadow-sm", "패널"],
    ["--shadow-md", "토스트"],
    ["--shadow-lg", "모달"],
];

/** index.css에 선언된 실제 값을 읽는다 (문서 · 코드가 어긋나지 않도록 값을 여기 적지 않음) */
const readToken = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "(없음)";

const StandardTokens = () => (
    <div>
        <p className={styles.hint12} style={{ marginBottom: "12px" }}>
            index.css의 :root에 선언된 토큰입니다. 새 코드는 hex 대신 var(--토큰)을 씁니다. 팔레트(--gray-*, --indigo-* 등)는 화면 코드에서 직접 쓰지 않습니다.
        </p>
        {STANDARD_COLORS.map((group) => (
            <div key={group.title} style={{ marginBottom: "16px" }}>
                <p className={styles.hint12} style={{ marginBottom: "8px" }}>
                    {group.title}
                </p>
                <div className={styles.swatches}>
                    {group.tokens.map((name) => (
                        <div key={name} className={styles.swatch}>
                            <span className={styles.swatchChip} style={{ background: `var(${name})` }} />
                            <span className={styles.swatchText}>
                                <code>{name.replace("--color-", "")}</code>
                                <span>{readToken(name)}</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        ))}

        <table className={styles.tokenTable} style={{ marginBottom: "16px" }}>
            <thead>
                <tr>
                    <th style={{ width: "200px" }}>글자 크기</th>
                    <th style={{ width: "80px" }}>값</th>
                    <th>보기</th>
                    <th>용도</th>
                </tr>
            </thead>
            <tbody>
                {STANDARD_FONT_SIZES.map(([name, use]) => (
                    <tr key={name}>
                        <td><code>{name}</code></td>
                        <td>{readToken(name)}</td>
                        <td style={{ fontSize: `var(${name})` }}>가나다 Aa 123</td>
                        <td>{use}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <table className={styles.tokenTable} style={{ marginBottom: "16px" }}>
            <thead>
                <tr>
                    <th style={{ width: "200px" }}>모서리 · 높이</th>
                    <th style={{ width: "80px" }}>값</th>
                    <th>보기</th>
                    <th>용도</th>
                </tr>
            </thead>
            <tbody>
                {STANDARD_SIZES.map(([name, use, kind]) => (
                    <tr key={name}>
                        <td><code>{name}</code></td>
                        <td>{readToken(name)}</td>
                        <td>
                            <span
                                className={styles.radiusBox}
                                style={
                                    kind === "radius"
                                        ? { display: "inline-block", width: 64, height: 32, borderRadius: `var(${name})` }
                                        : { display: "inline-block", width: 64, height: `var(${name})`, borderRadius: "var(--radius)" }
                                }
                            />
                        </td>
                        <td>{use}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <table className={styles.tokenTable}>
            <thead>
                <tr>
                    <th style={{ width: "200px" }}>그림자</th>
                    <th>보기</th>
                    <th>용도</th>
                </tr>
            </thead>
            <tbody>
                {STANDARD_SHADOWS.map(([name, use]) => (
                    <tr key={name}>
                        <td><code>{name}</code></td>
                        <td>
                            <span
                                style={{
                                    display: "inline-block",
                                    width: 64,
                                    height: 32,
                                    margin: "8px",
                                    background: "#fff",
                                    borderRadius: "var(--radius-lg)",
                                    boxShadow: `var(${name})`,
                                }}
                            />
                        </td>
                        <td>{use}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const TokenCatalog = () => (
    <div>
        <GroupTitle>표준 토큰 (index.css)</GroupTitle>
        <StandardTokens />

        <GroupTitle>참고: 통일 전 현재 값 — 색상</GroupTitle>
        {colorGroups.map((group) => (
            <div key={group.title} style={{ marginBottom: "16px" }}>
                <p className={styles.hint12} style={{ marginBottom: "8px" }}>
                    {group.title}
                </p>
                <div className={styles.swatches}>
                    {group.colors.map(([hex, use]) => (
                        <div key={hex} className={styles.swatch}>
                            <span className={styles.swatchChip} style={{ backgroundColor: hex }} />
                            <span className={styles.swatchText}>
                                <code>{hex}</code>
                                <span>{use}</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        ))}

        <GroupTitle>참고: 통일 전 현재 값 — 글자 크기</GroupTitle>
        <p className={styles.hint12} style={{ marginBottom: "8px" }}>
            px 계열(admin/system, my/course)과 rem 계열(member, login, my/info, 사이드바)이 섞여 있습니다.
            통일 전 기본 글꼴: &quot;Roboto Mono&quot;, &quot;Noto Sans KR&quot; (글꼴 파일을 불러오지 않았음) → 지금은 Pretendard (--font-sans)
        </p>
        <table className={styles.tokenTable}>
            <thead>
                <tr>
                    <th style={{ width: "160px" }}>크기</th>
                    <th>보기</th>
                    <th>쓰는 곳</th>
                </tr>
            </thead>
            <tbody>
                {fontSizes.map(([size, use]) => (
                    <tr key={size}>
                        <td>
                            <code>{size}</code>
                        </td>
                        <td style={{ fontSize: size.split(" ")[0] }}>가나다 Aa 123</td>
                        <td>{use}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <GroupTitle>참고: 통일 전 현재 값 — 모서리 (border-radius)</GroupTitle>
        <div className={styles.swatches}>
            {radii.map(([radius, use]) => (
                <div key={radius} className={styles.swatch}>
                    <span className={styles.radiusBox} style={{ borderRadius: radius, width: 48 }} />
                    <span className={styles.swatchText}>
                        <code>{radius}</code>
                        <span>{use}</span>
                    </span>
                </div>
            ))}
        </div>

        <GroupTitle>참고: 통일 전 현재 값 — 컨트롤 높이 (입력 · 버튼 · 행)</GroupTitle>
        <div className={styles.swatches}>
            {heights.map((h) => (
                <div key={h} className={styles.swatch}>
                    <span className={styles.heightBox} style={{ height: h, width: 48 }} />
                    <span className={styles.swatchText}>
                        <code>{h}px</code>
                        <span>{heightUses[h]}</span>
                    </span>
                </div>
            ))}
        </div>

        <GroupTitle>참고: 통일 전 현재 값 — 포커스 · 비활성</GroupTitle>
        <table className={styles.tokenTable}>
            <tbody>
                <tr>
                    <th style={{ width: "160px" }}>포커스 테두리</th>
                    <td>
                        <code>#495057</code> member · login · my/info / <code>#888</code> role · menu · access /{" "}
                        <code>#3f6fb5</code> 상담
                    </td>
                </tr>
                <tr>
                    <th>비활성 입력</th>
                    <td>
                        배경 <code>#f2f2f2</code>, 글자 <code>#aaa</code>, 테두리 <code>#ddd</code>,
                        cursor not-allowed
                    </td>
                </tr>
                <tr>
                    <th>비활성 버튼</th>
                    <td>
                        opacity <code>0.5</code> ~ <code>0.6</code>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
);
