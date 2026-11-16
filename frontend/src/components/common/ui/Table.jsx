import StatusBox from "./StatusBox";

const ALIGN_CLASS = { num: "col-num", center: "col-center", actions: "col-actions" };
const SORT_ICON = { ascending: "▲", descending: "▼" };

/**
 * 표. 스타일은 styles/table.css (raw <table className="table">과 같은 모양).
 * 공통 Grid를 대신할 표준 표. 칸 내용은 render로 자유롭게 (버튼 · 배지 등).
 *
 * @param {object} props
 * @param {{
 *   key: string, title: React.ReactNode, width?: string|number,
 *   align?: "left"|"num"|"center"|"actions", mono?: boolean, ellipsis?: boolean,
 *   sortable?: boolean, render?: (row, index) => React.ReactNode
 * }[]} props.columns                  render가 없으면 row[key]
 * @param {object[]} props.rows
 * @param {string|((row) => string)} [props.rowKey="id"]
 * @param {string} [props.selectedKey]  선택 행 (배경 + 왼쪽 강조선)
 * @param {(row) => void} [props.onRowClick] 있으면 행 클릭 · Enter로 선택
 * @param {(row) => boolean} [props.isRowMuted]  흐리게 (미사용 · 보호 행)
 * @param {{ key: string, direction: "asc"|"desc" }} [props.sort]
 * @param {(sort) => void} [props.onSortChange] sortable 머리글을 누르면 다음 정렬을 넘김 (데이터 정렬은 호출한 쪽)
 * @param {boolean} [props.loading]
 * @param {string} [props.emptyText="데이터가 없습니다."]
 * @param {"md"|"sm"} [props.size="md"]
 * @param {boolean} [props.striped]
 * @param {number|string} [props.maxHeight] 넘으면 표 안에서 스크롤 + 머리글 고정
 * @param {string} props.ariaLabel    표 이름 (스크린 리더)
 */
export default function Table({
  columns,
  rows,
  rowKey = "id",
  selectedKey,
  onRowClick,
  isRowMuted,
  sort,
  onSortChange,
  loading = false,
  emptyText = "데이터가 없습니다.",
  size = "md",
  striped = false,
  maxHeight,
  ariaLabel,
  className = "",
}) {
  const getKey = (row) => (typeof rowKey === "function" ? rowKey(row) : row[rowKey]);

  const tableClass = [
    "table",
    "table-hover",
    striped ? "table-striped" : "",
    size === "sm" ? "table-sm" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const nextSort = (key) => {
    if (sort?.key !== key) return { key, direction: "asc" };
    return { key, direction: sort.direction === "asc" ? "desc" : "asc" };
  };

  const handleRowKeyDown = (event, row) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(row);
    }
  };

  const showStatus = loading || rows.length === 0;

  return (
    <div
      className={`table-wrap ${maxHeight ? "table-wrap-scroll" : ""} ${className}`.trim()}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className={tableClass} aria-label={ariaLabel} aria-busy={loading || undefined}>
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} style={col.width ? { width: col.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((col) => {
              const ariaSort =
                sort?.key === col.key ? (sort.direction === "asc" ? "ascending" : "descending") : undefined;
              return (
                <th key={col.key} scope="col" className={ALIGN_CLASS[col.align] ?? ""} aria-sort={ariaSort}>
                  {col.sortable && onSortChange ? (
                    <button type="button" className="table-sort" onClick={() => onSortChange(nextSort(col.key))}>
                      {col.title}
                      <span className="table-sort-icon" aria-hidden="true">
                        {SORT_ICON[ariaSort] ?? "↕"}
                      </span>
                    </button>
                  ) : (
                    col.title
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {showStatus ? (
            <tr className="table-empty">
              <td colSpan={columns.length}>
                <StatusBox type={loading ? "loading" : "empty"} size="sm" title={loading ? undefined : emptyText} />
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const key = getKey(row);
              const selected = selectedKey !== undefined && key === selectedKey;
              const rowClass = [
                onRowClick ? "is-clickable" : "",
                selected ? "is-selected" : "",
                isRowMuted?.(row) ? "is-muted" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <tr
                  key={key}
                  className={rowClass || undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (event) => handleRowKeyDown(event, row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-current={selected || undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={
                        [ALIGN_CLASS[col.align], col.mono ? "cell-mono" : "", col.ellipsis ? "cell-ellipsis" : ""]
                          .filter(Boolean)
                          .join(" ") || undefined
                      }
                      title={col.ellipsis && typeof row[col.key] === "string" ? row[col.key] : undefined}
                    >
                      {col.render ? col.render(row, index) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
