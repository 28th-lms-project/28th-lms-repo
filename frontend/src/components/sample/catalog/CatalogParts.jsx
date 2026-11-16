import styles from "./Catalog.module.css";

/**
 * 카탈로그 한 칸: 이름 + 원본 위치 + (설명) + 실제 모양.
 * @param {{ name: string, source?: string, note?: string, block?: boolean, children: React.ReactNode }} props
 *  - source: 이 모양을 쓰는 원본 파일 (src/components 기준). 여러 곳이면 " · "로 구분
 *  - block: 본문을 flex 대신 block으로 (표 · 넓은 레이아웃)
 */
export const Variant = ({ name, source, note, block = false, children }) => (
    <div className={styles.variant}>
        <div className={styles.variantHead}>
            <strong>{name}</strong>
            {source && <code>{source}</code>}
        </div>
        {note && <p className={styles.variantNote}>{note}</p>}
        <div className={`${styles.variantBody} ${block ? styles.variantBodyBlock : ""}`}>
            {children}
        </div>
    </div>
);

/** 카탈로그 칸 묶음. wide면 한 줄에 하나씩. */
export const Variants = ({ wide = false, children }) => (
    <div className={wide ? styles.variantsWide : styles.variants}>{children}</div>
);

/** 섹션 안의 소제목 */
export const GroupTitle = ({ children }) => <h4 className={styles.groupTitle}>{children}</h4>;
