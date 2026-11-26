/**
 * 수치 카드 (평균 점수 · 출석률 등). 스타일은 styles/panel.css (.card.stat-card).
 *
 * @param {object} props
 * @param {string} props.label
 * @param {React.ReactNode} props.value
 * @param {string} [props.unit]            값 뒤 단위 (점, %, 명)
 * @param {string} [props.hint]            아래 회색 설명
 * @param {"up"|"down"} [props.trend]      hint를 초록(up) · 빨강(down)으로
 */
export default function StatCard({ label, value, unit, hint, trend }) {
  const trendClass = trend === "up" ? "stat-up" : trend === "down" ? "stat-down" : "";

  return (
    <div className="card stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </span>
      {hint && <span className={`stat-hint ${trendClass}`.trim()}>{hint}</span>}
    </div>
  );
}
