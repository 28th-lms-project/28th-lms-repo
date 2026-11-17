/**
 * 페이지 이동. 스타일은 styles/table.css (.pagination · .page-btn).
 * 공통 Paginator를 대신할 표준 (현재 페이지 강조색, 키보드 · 스크린 리더 지원).
 *
 * @param {object} props
 * @param {number} props.page          현재 페이지 (0부터, API page와 같음)
 * @param {number} props.totalPages
 * @param {(page: number) => void} props.onChange
 * @param {number} [props.groupSize=10] 한 번에 보이는 번호 수
 */
export default function Pagination({ page, totalPages, onChange, groupSize = 10 }) {
  if (totalPages <= 1) return null;

  const groupStart = Math.floor(page / groupSize) * groupSize;
  const groupEnd = Math.min(groupStart + groupSize, totalPages);
  const numbers = Array.from({ length: groupEnd - groupStart }, (_, i) => groupStart + i);

  const isFirst = page === 0;
  const isLast = page >= totalPages - 1;

  const go = (next) => {
    if (next !== page) onChange(Math.min(Math.max(next, 0), totalPages - 1));
  };

  return (
    <nav aria-label="페이지">
      <ul className="pagination">
        <li>
          <button type="button" className="page-btn" onClick={() => go(0)} disabled={isFirst} aria-label="첫 페이지">
            «
          </button>
        </li>
        <li>
          <button type="button" className="page-btn" onClick={() => go(page - 1)} disabled={isFirst} aria-label="이전 페이지">
            ‹
          </button>
        </li>
        {numbers.map((n) => (
          <li key={n}>
            <button
              type="button"
              className="page-btn"
              onClick={() => go(n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={`${n + 1}페이지`}
            >
              {n + 1}
            </button>
          </li>
        ))}
        <li>
          <button type="button" className="page-btn" onClick={() => go(page + 1)} disabled={isLast} aria-label="다음 페이지">
            ›
          </button>
        </li>
        <li>
          <button type="button" className="page-btn" onClick={() => go(totalPages - 1)} disabled={isLast} aria-label="마지막 페이지">
            »
          </button>
        </li>
      </ul>
    </nav>
  );
}
