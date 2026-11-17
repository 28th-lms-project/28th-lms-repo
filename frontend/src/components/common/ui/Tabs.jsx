/**
 * 탭 목록. 스타일은 styles/tabs.css. 선택 상태는 부모가 가진다 (쿼리 파라미터 탭도 value · onChange만 연결).
 * 키보드: ← → 로 이동하며 바로 선택, Home · End로 처음 · 끝.
 *
 *   const idBase = useId();
 *   <Tabs idBase={idBase} items={[{ id: "a", label: "시간표" }]} value={tab} onChange={setTab} ariaLabel="강의실 메뉴" />
 *   <TabPanel idBase={idBase} tabId={tab}>...</TabPanel>
 *
 * @param {object} props
 * @param {string} props.idBase   useId() 값 (탭 ↔ 패널 연결)
 * @param {{ id: string, label: React.ReactNode, count?: number, disabled?: boolean }[]} props.items
 * @param {string} props.value
 * @param {(id: string) => void} props.onChange
 * @param {"line"|"pills"} [props.variant="line"] line: 구역 전환, pills: 작은 묶음 전환
 * @param {string} props.ariaLabel
 */
export function Tabs({ idBase, items, value, onChange, variant = "line", ariaLabel, className = "" }) {
  const enabled = items.filter((item) => !item.disabled);

  const select = (id) => {
    onChange(id);
    document.getElementById(`${idBase}-tab-${id}`)?.focus();
  };

  const handleKeyDown = (event) => {
    const index = enabled.findIndex((item) => item.id === value);
    let next;
    if (event.key === "ArrowRight") next = enabled[(index + 1) % enabled.length];
    else if (event.key === "ArrowLeft") next = enabled[(index - 1 + enabled.length) % enabled.length];
    else if (event.key === "Home") next = enabled[0];
    else if (event.key === "End") next = enabled[enabled.length - 1];
    if (!next) return;
    event.preventDefault();
    select(next.id);
  };

  return (
    <div
      className={`tabs ${variant === "pills" ? "tabs-pills" : ""} ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            id={`${idBase}-tab-${item.id}`}
            type="button"
            role="tab"
            className="tab"
            aria-selected={selected}
            aria-controls={selected ? `${idBase}-panel-${item.id}` : undefined} // 그려진 패널(선택된 탭)만 가리킴
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
          >
            {item.label}
            {item.count !== undefined && <span className="tab-count">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 선택된 탭의 내용. tabId는 지금 선택된 탭 id.
 * @param {{ idBase: string, tabId: string, children: React.ReactNode }} props
 */
export function TabPanel({ idBase, tabId, className = "", children }) {
  return (
    <div
      id={`${idBase}-panel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`${idBase}-tab-${tabId}`}
      tabIndex={0}
      className={`tab-panel ${className}`.trim()}
    >
      {children}
    </div>
  );
}
