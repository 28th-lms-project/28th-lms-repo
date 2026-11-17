/**
 * 진행 막대 (진도율 · 제출률 · 남은 기간). 스타일은 styles/status.css.
 *
 * @param {object} props
 * @param {number} props.value          0 ~ max
 * @param {number} [props.max=100]
 * @param {string} props.label          스크린 리더용 이름 ("진도율")
 * @param {"primary"|"success"|"warning"|"danger"} [props.tone="primary"]
 * @param {boolean} [props.showValue]   오른쪽에 % 표시
 * @param {"md"|"sm"} [props.size="md"]
 */
export default function Progress({ value, max = 100, label, tone = "primary", showValue = false, size = "md" }) {
  const percent = max > 0 ? Math.round(Math.min(100, Math.max(0, (value / max) * 100))) : 0;
  const classes = ["progress", tone !== "primary" && `progress-${tone}`, size === "sm" && "progress-sm"].filter(Boolean).join(" ");

  const bar = (
    <div
      className={classes}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      style={{ "--progress": `${percent}%` }}
    >
      <span />
    </div>
  );

  if (!showValue) return bar;
  return (
    <div className="progress-row">
      {bar}
      <span className="progress-value">{percent}%</span>
    </div>
  );
}
