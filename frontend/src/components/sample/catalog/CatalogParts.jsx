import styles from "./Catalog.module.css";

/**
 * 카탈로그 한 칸: 이름 + 원본 위치 + (설명) + 실제 모양.
 * @param {{ name: string, source?: string, note?: string, block?: boolean, children: React.ReactNode }} props
 *  - source: 이 모양을 쓰는 원본 파일 (src/components 기준). 여러 곳이면 " · "로 구분
 *  - block: 본문을 flex 대신 block으로 (표 · 넓은 레이아웃)
 *  - code: 사용 예 코드 (표준 섹션)
 */
export const Variant = ({ name, source, note, block = false, code, children }) => (
    <div className={styles.variant}>
        <div className={styles.variantHead}>
            <strong>{name}</strong>
            {source && <code>{source}</code>}
        </div>
        {note && <p className={styles.variantNote}>{note}</p>}
        <div className={`${styles.variantBody} ${block ? styles.variantBodyBlock : ""}`}>
            {children}
        </div>
        {code && <pre className={styles.codeSample}>{code.trim()}</pre>}
    </div>
);

/** 카탈로그 칸 묶음. wide면 한 줄에 하나씩. */
export const Variants = ({ wide = false, children }) => (
    <div className={wide ? styles.variantsWide : styles.variants}>{children}</div>
);

const PART_TONE = { standard: styles.partStandard, legacy: styles.partLegacy, old: styles.partOld };

/**
 * 샘플 페이지의 큰 구역 머리 (표준 / 통일 전 / 기존 샘플).
 * @param {{ id: string, part: string, title: string, tone: "standard"|"legacy"|"old", children: React.ReactNode }} props
 *  - children: 구역 설명 (한두 줄)
 */
export const PartHeader = ({ id, part, title, tone, children }) => (
    <header id={id} className={`${styles.partHeader} ${PART_TONE[tone] ?? ""} ${styles.anchor}`}>
        <span className={styles.partLabel}>{part}</span>
        <h2 className={styles.partTitle}>{title}</h2>
        <p className={styles.partDesc}>{children}</p>
    </header>
);

/** 섹션 안의 소제목 */
export const GroupTitle = ({ children }) => <h4 className={styles.groupTitle}>{children}</h4>;
