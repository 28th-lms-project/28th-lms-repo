import { useState } from "react";
import StatusBox from "./StatusBox";

const ALIGN_CLASS = { num: "col-num", center: "col-center", actions: "col-actions" };
const SORT_ICON = { ascending: "▲", descending: "▼" };
const STATUS_CLASS = { added: "is-added", modified: "is-modified", deleted: "is-deleted" };
const STATUS_LABEL = { added: "추가됨", modified: "수정됨", deleted: "삭제 예정" };

const join = (...classes) => classes.filter(Boolean).join(" ") || undefined;

/**
 * 표. 스타일은 styles/table.css (raw <table className="table">과 같은 모양).
 * 공통 Grid를 대신할 표준 표. 칸 내용은 render로 자유롭게 (버튼 · 배지 · 입력 칸).
 *
 * @param {object} props
 * @param {{
 *   key: string, title: React.ReactNode, width?: string|number,
 *   align?: "left"|"num"|"center"|"actions", mono?: boolean, ellipsis?: boolean,
 *   sortable?: boolean, className?: string, render?: (row, index) => React.ReactNode
 * }[]} props.columns                  render가 없으면 row[key]. className은 머리글 · 칸 모두에 (col-highlight 등)
 * @param {object[]} props.rows
 * @param {string|((row) => string)} [props.rowKey="id"]
 * @param {string} [props.selectedKey]  선택 행 (배경 + 왼쪽 강조선)
 * @param {(row) => void} [props.onRowClick] 있으면 행 클릭 · Enter로 선택
 * @param {(row) => boolean} [props.isRowMuted]  흐리게 (미사용 · 보호 행)
 * @param {(row) => string|undefined} [props.rowClassName]  행에 붙일 클래스 (is-break 등)
 * @param {{ key: string, direction: "asc"|"desc" }} [props.sort]
 * @param {(sort) => void} [props.onSortChange] sortable 머리글을 누르면 다음 정렬을 넘김 (데이터 정렬은 호출한 쪽)
 *
 * 체크 선택 (Grid checkable 대신)
 * @param {string[]} [props.checkedKeys]          있으면 맨 앞에 체크박스 칸 + 머리글 전체 선택
 * @param {(keys: string[]) => void} [props.onCheckedChange]
 * @param {(row) => boolean} [props.isRowCheckable]  false면 그 행은 체크박스 비활성
 *
 * 변경 상태 (편집 표: 추가 · 수정 · 삭제 예정)
 * @param {(row) => "added"|"modified"|"deleted"|undefined} [props.rowStatus]
 *
 * 순서 바꾸기 (끌어 놓기 · 손잡이에서 ↑ ↓)
 * @param {(fromIndex: number, toIndex: number) => void} [props.onReorder]  있으면 맨 앞에 손잡이 칸
 * @param {(row) => boolean} [props.isRowLocked]  옮길 수 없는 행 (보호 행). 그 자리로 놓는 것도 막음
 *
 * @param {boolean} [props.loading]
 * @param {string} [props.emptyText="데이터가 없습니다."]
 * @param {"md"|"sm"} [props.size="md"]
 * @param {boolean} [props.striped]
 * @param {boolean} [props.bordered]   세로 칸선 (시간표처럼 칸이 많은 표)
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
  rowClassName,
  sort,
  onSortChange,
  checkedKeys,
  onCheckedChange,
  isRowCheckable,
  rowStatus,
  onReorder,
  isRowLocked,
  loading = false,
  emptyText = "데이터가 없습니다.",
  size = "md",
  striped = false,
  bordered = false,
  maxHeight,
  ariaLabel,
  className = "",
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const getKey = (row) => (typeof rowKey === "function" ? rowKey(row) : row[rowKey]);
  const checkable = Array.isArray(checkedKeys) && !!onCheckedChange;
  const reorderable = !!onReorder;
  const locked = (row) => !!isRowLocked?.(row);

  const tableClass = join(
    "table",
    "table-hover",
    striped && "table-striped",
    bordered && "table-bordered",
    size === "sm" && "table-sm",
  );

  const nextSort = (key) => {
    if (sort?.key !== key) return { key, direction: "asc" };
    return { key, direction: sort.direction === "asc" ? "desc" : "asc" };
  };

  const handleRowKeyDown = (event, row) => {
    if (event.target !== event.currentTarget) return; // 칸 안 입력 · 버튼의 Enter는 그대로
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(row);
    }
  };

  /* ───── 체크 선택 ───── */
  const checkableRows = checkable ? rows.filter((row) => isRowCheckable?.(row) ?? true) : [];
  const checkedCount = checkableRows.filter((row) => checkedKeys.includes(getKey(row))).length;
  const allChecked = checkableRows.length > 0 && checkedCount === checkableRows.length;

  const toggleAll = () => {
    const pageKeys = checkableRows.map(getKey);
    onCheckedChange(
      allChecked
        ? checkedKeys.filter((k) => !pageKeys.includes(k))
        : [...checkedKeys, ...pageKeys.filter((k) => !checkedKeys.includes(k))],
    );
  };

  const toggleRow = (key) => {
    onCheckedChange(checkedKeys.includes(key) ? checkedKeys.filter((k) => k !== key) : [...checkedKeys, key]);
  };

  /* ───── 순서 바꾸기 ───── */
  const canDropAt = (index) => index !== null && !locked(rows[index]);

  const move = (from, to) => {
    if (from === to || to < 0 || to >= rows.length) return;
    if (locked(rows[from]) || locked(rows[to])) return;
    onReorder(from, to);
  };

  const endDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleHandleKeyDown = (event, index) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const to = index + (event.key === "ArrowUp" ? -1 : 1);
    const tbody = event.currentTarget.closest("tbody");
    move(index, to);
    // 옮긴 뒤에도 같은 행의 손잡이에 포커스 (다시 그린 다음)
    requestAnimationFrame(() => {
      tbody?.querySelectorAll(".col-handle > *")[to]?.focus();
    });
  };

  const leadColumns = (reorderable ? 1 : 0) + (checkable ? 1 : 0);
  const showStatus = loading || rows.length === 0;

  return (
    <div
      className={join("table-wrap", maxHeight && "table-wrap-scroll", className)}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className={tableClass} aria-label={ariaLabel} aria-busy={loading || undefined}>
        <colgroup>
          {reorderable && <col style={{ width: 40 }} />}
          {checkable && <col style={{ width: 44 }} />}
          {columns.map((col) => (
            <col key={col.key} style={col.width ? { width: col.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {reorderable && (
              <th scope="col" className="col-handle">
                <span className="visually-hidden">순서</span>
              </th>
            )}
            {checkable && (
              <th scope="col" className="col-check">
                <input
                  type="checkbox"
                  aria-label="이 페이지 전체 선택"
                  checked={allChecked}
                  disabled={checkableRows.length === 0}
                  ref={(el) => {
                    if (el) el.indeterminate = checkedCount > 0 && !allChecked;
                  }}
                  onChange={toggleAll}
                />
              </th>
            )}
            {columns.map((col) => {
              const ariaSort =
                sort?.key === col.key ? (sort.direction === "asc" ? "ascending" : "descending") : undefined;
              return (
                <th key={col.key} scope="col" className={join(ALIGN_CLASS[col.align], col.className)} aria-sort={ariaSort}>
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
              <td colSpan={columns.length + leadColumns}>
                <StatusBox type={loading ? "loading" : "empty"} size="sm" title={loading ? undefined : emptyText} />
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const key = getKey(row);
              const selected = selectedKey !== undefined && key === selectedKey;
              const status = rowStatus?.(row);
              const rowLocked = reorderable && locked(row);
              const dropTarget = dragIndex !== null && overIndex === index && dragIndex !== index && canDropAt(index);

              return (
                <tr
                  key={key}
                  className={join(
                    onRowClick && "is-clickable",
                    selected && "is-selected",
                    isRowMuted?.(row) && "is-muted",
                    STATUS_CLASS[status],
                    dragIndex === index && "is-dragging",
                    dropTarget && (dragIndex < index ? "is-drop-after" : "is-drop-before"),
                    rowClassName?.(row),
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (event) => handleRowKeyDown(event, row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-current={selected || undefined}
                  draggable={reorderable && !rowLocked ? true : undefined}
                  onDragStart={
                    reorderable && !rowLocked
                      ? (event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", String(index));
                          setDragIndex(index);
                        }
                      : undefined
                  }
                  onDragOver={
                    reorderable
                      ? (event) => {
                          if (dragIndex === null || !canDropAt(index)) return;
                          event.preventDefault();
                          if (overIndex !== index) setOverIndex(index);
                        }
                      : undefined
                  }
                  onDrop={
                    reorderable
                      ? (event) => {
                          event.preventDefault();
                          if (dragIndex !== null) move(dragIndex, index);
                          endDrag();
                        }
                      : undefined
                  }
                  onDragEnd={reorderable ? endDrag : undefined}
                >
                  {reorderable && (
                    <td className="col-handle">
                      {rowLocked ? (
                        <span className="table-lock" title="옮길 수 없는 행">고정</span>
                      ) : (
                        <button
                          type="button"
                          className="table-handle"
                          aria-label={`순서 바꾸기 (${index + 1}번째, ↑ ↓ 키로 이동)`}
                          onKeyDown={(event) => handleHandleKeyDown(event, index)}
                          onClick={(event) => event.stopPropagation()}
                        >
                          ⠿
                        </button>
                      )}
                    </td>
                  )}
                  {checkable && (
                    <td className="col-check" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`${key} 선택`}
                        checked={checkedKeys.includes(key)}
                        disabled={!(isRowCheckable?.(row) ?? true)}
                        onChange={() => toggleRow(key)}
                      />
                    </td>
                  )}
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.key}
                      className={join(
                        ALIGN_CLASS[col.align],
                        col.mono && "cell-mono",
                        col.ellipsis && "cell-ellipsis",
                        col.className,
                      )}
                      title={col.ellipsis && typeof row[col.key] === "string" ? row[col.key] : undefined}
                    >
                      {colIndex === 0 && status && <span className="visually-hidden">{STATUS_LABEL[status]}: </span>}
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
