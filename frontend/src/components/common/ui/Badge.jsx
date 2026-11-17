/**
 * 상태 배지. 스타일은 styles/badge.css.
 * 의미가 같은 화면 색은 tone 하나로 맞춘다:
 *  정상 · 정답 · 상 → success / 잠김 · 오답 · 하 → danger / 중 · 채점 중 → warning / 부분 정답 → info / 미진단 → neutral
 *
 * @param {{ tone?: "neutral"|"primary"|"success"|"danger"|"warning"|"info", className?: string, children: React.ReactNode }} props
 */
export default function Badge({ tone = "neutral", className = "", children }) {
  const toneClass = tone === "neutral" ? "" : `badge-${tone}`;
  return <span className={["badge", toneClass, className].filter(Boolean).join(" ")}>{children}</span>;
}
