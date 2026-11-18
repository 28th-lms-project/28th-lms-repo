import styles from "./Catalog.module.css";
import { GroupTitle } from "./CatalogParts.jsx";

/* ───── 표준 토큰 (index.css :root) ───── */
const STANDARD_COLORS = [
    {
        title: "글자",
        tokens: ["--color-text", "--color-text-secondary", "--color-text-muted", "--color-text-placeholder", "--color-text-disabled", "--color-text-inverse"],
    },
    {
        title: "배경 · 테두리",
        tokens: ["--color-bg-page", "--color-bg-surface", "--color-bg-subtle", "--color-bg-hover", "--color-bg-disabled", "--color-bg-raised", "--color-border", "--color-border-light", "--color-border-strong"],
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
        title: "사이드바 (테마 brand를 따름)",
        tokens: [
            "--color-sidebar-bg", "--color-sidebar-text", "--color-sidebar-text-secondary", "--color-sidebar-muted",
            "--color-sidebar-subtle", "--color-sidebar-active", "--color-sidebar-active-bg",
        ],
    },
    {
        title: "오버레이",
        tokens: ["--color-overlay", "--color-toast-bg"],
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
        <p className={styles.note} style={{ marginBottom: "12px" }}>
            index.css의 :root에 선언된 토큰입니다. 새 코드는 hex 대신 var(--토큰)을 씁니다. 팔레트(--gray-*, --indigo-* 등)는 화면 코드에서 직접 쓰지 않습니다.
        </p>
        {STANDARD_COLORS.map((group) => (
            <div key={group.title} style={{ marginBottom: "16px" }}>
                <p className={styles.note} style={{ marginBottom: "8px" }}>
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


/** 표준 탭 첫 섹션 "기초": 토큰. 강조색은 인디고 · 테마(사이드바)는 네이비로 확정 (고르는 기능 없음) */
export const TokenCatalog = () => {
    return (
        <div>
            <p className={styles.standardIntro}>
                앞으로 새 화면은 표준 탭의 클래스 · 컴포넌트를 씁니다. &quot;표준화 전 (기록)&quot; · &quot;기존 샘플&quot; 탭은 기록용입니다.
                {"\n"}스타일 원본: src/styles/*.css (index.css가 불러옴) · React: src/components/common/ui/ · 가이드: frontend/docs/ui-style-guide.md
            </p>
            <GroupTitle>표준 토큰 (index.css)</GroupTitle>
            <StandardTokens />
            <p className={styles.note}>강조색(primary)은 인디고, 테마(사이드바 색)는 네이비로 확정했습니다 (2026-11-17). 바꿀 때는 index.css의 --primary-* · --brand-* 값만 고칩니다.</p>
        </div>
    );
};
