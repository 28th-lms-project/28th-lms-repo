import { useId, useState } from "react";

/**
 * 두 목록 사이 옮기기 (시험 문제 고르기 · 과정 수강생 고르기). 스타일은 styles/content.css (.transfer).
 * 왼쪽 = 고를 수 있는 것, 오른쪽 = 고른 것. 체크한 뒤 가운데 버튼으로 옮기고, 두 번 누르면 바로 옮긴다.
 * 고른 것(selectedKeys)만 부모가 들고 있고, 체크 상태는 이 컴포넌트 안에만 있다.
 *
 * @param {object} props
 * @param {object[]} props.items                       전체 목록
 * @param {string[]} props.selectedKeys                고른 것의 key (오른쪽, 이 순서대로 보임)
 * @param {(keys: string[]) => void} props.onChange
 * @param {string|((item) => string)} [props.rowKey="id"]
 * @param {(item) => React.ReactNode} props.renderItem 한 줄 내용
 * @param {(item, query: string) => boolean} [props.filter]  있으면 왼쪽 위에 검색 칸
 * @param {string} [props.leftTitle="선택 가능"]
 * @param {string} [props.rightTitle="선택됨"]
 * @param {React.ReactNode} [props.rightSummary]       오른쪽 머리 옆 요약 (총 배점 등)
 * @param {"danger"|"success"} [props.leftTone]       왼쪽 목록 색 (권한 미허용 = danger: 붉은 머리 · 흐린 글자)
 * @param {"danger"|"success"} [props.rightTone]      오른쪽 목록 색 (허용 = success: 초록 머리)
 * @param {string|number} [props.height=280]           목록 높이 (넘으면 스크롤)
 */
export default function TransferList({
  items,
  selectedKeys,
  onChange,
  rowKey = "id",
  renderItem,
  filter,
  leftTitle = "선택 가능",
  rightTitle = "선택됨",
  rightSummary,
  leftTone,
  rightTone,
  height = 280,
}) {
  const baseId = useId();
  const [checked, setChecked] = useState([]);
  const [query, setQuery] = useState("");

  const getKey = (item) => (typeof rowKey === "function" ? rowKey(item) : item[rowKey]);
  const byKey = new Map(items.map((item) => [getKey(item), item]));

  const right = selectedKeys.map((key) => byKey.get(key)).filter(Boolean);
  const leftAll = items.filter((item) => !selectedKeys.includes(getKey(item)));
  const left = filter && query.trim() ? leftAll.filter((item) => filter(item, query.trim())) : leftAll;

  const checkedIn = (list) => list.map(getKey).filter((key) => checked.includes(key));
  const leftChecked = checkedIn(left);
  const rightChecked = checkedIn(right);

  const toggle = (key) => setChecked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const add = (keys) => {
    if (!keys.length) return;
    onChange([...selectedKeys, ...keys]);
    setChecked((prev) => prev.filter((k) => !keys.includes(k)));
  };
  const remove = (keys) => {
    if (!keys.length) return;
    onChange(selectedKeys.filter((k) => !keys.includes(k)));
    setChecked((prev) => prev.filter((k) => !keys.includes(k)));
  };

  const renderList = (side, list, title, count, extra) => {
    const listChecked = side === "left" ? leftChecked : rightChecked;
    const allChecked = list.length > 0 && listChecked.length === list.length;
    const titleId = `${baseId}-${side}`;
    const tone = side === "left" ? leftTone : rightTone;
    return (
      <section className={`transfer-list${tone ? ` transfer-list-${tone}` : ""}`} aria-labelledby={titleId}>
        <header className="transfer-head">
          <label className="form-check">
            <input
              type="checkbox"
              aria-label={`${title} 모두 체크`}
              checked={allChecked}
              disabled={list.length === 0}
              ref={(el) => {
                if (el) el.indeterminate = listChecked.length > 0 && !allChecked;
              }}
              onChange={() =>
                setChecked((prev) =>
                  allChecked ? prev.filter((k) => !list.map(getKey).includes(k)) : [...new Set([...prev, ...list.map(getKey)])],
                )
              }
            />
          </label>
          <strong id={titleId} className="transfer-title">
            {title}
          </strong>
          <span className="transfer-count">
            {listChecked.length > 0 ? `${listChecked.length} / ` : ""}
            {count}
          </span>
          {extra}
        </header>
        {side === "left" && filter && (
          <div className="transfer-search">
            <input
              type="search"
              className="form-control form-control-sm"
              placeholder="검색"
              aria-label={`${title} 검색`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
        <ul className="transfer-items" style={{ height }}>
          {list.length === 0 && (
            <li className="transfer-empty">{side === "left" ? (query ? "검색 결과가 없습니다." : "모두 골랐습니다.") : "고른 항목이 없습니다."}</li>
          )}
          {list.map((item) => {
            const key = getKey(item);
            return (
              <li key={key}>
                <label
                  className="transfer-item"
                  onDoubleClick={() => (side === "left" ? add([key]) : remove([key]))}
                  title="두 번 누르면 바로 옮깁니다"
                >
                  <input type="checkbox" checked={checked.includes(key)} onChange={() => toggle(key)} />
                  <span className="transfer-item-body">{renderItem(item)}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className="transfer">
      {renderList("left", left, leftTitle, leftAll.length)}
      <div className="transfer-actions">
        <button
          type="button"
          className="btn btn-sm"
          disabled={!leftChecked.length}
          onClick={() => add(leftChecked)}
          aria-label={`체크한 ${leftChecked.length}개 ${rightTitle}(으)로 옮기기`}
        >
          추가 →
        </button>
        <button
          type="button"
          className="btn btn-sm"
          disabled={!rightChecked.length}
          onClick={() => remove(rightChecked)}
          aria-label={`체크한 ${rightChecked.length}개 빼기`}
        >
          ← 빼기
        </button>
      </div>
      {renderList("right", right, rightTitle, right.length, rightSummary && <span className="transfer-summary">{rightSummary}</span>)}
    </div>
  );
}
