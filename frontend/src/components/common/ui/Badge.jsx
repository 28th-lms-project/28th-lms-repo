/**
 * 상태 배지. 스타일은 styles/badge.css.
 * 의미가 같은 화면 색은 tone 하나로 맞춘다:
 *  정상 · 정답 · 상 → success / 잠김 · 오답 → danger / 중 · 진행 중 · 부분 정답 → info / 하 · 채점 중 · 주의 → warning / 미진단 → neutral
 *  primary(강조색)는 상태가 아니라 선택 · 역할 표시(강사 · 내 글)에만. 수준(상 · 중 · 하)에는 danger를 쓰지 않음
 *
 * @param {{ tone?: "neutral"|"primary"|"success"|"danger"|"warning"|"info", className?: string, children: React.ReactNode }} props
 */
export default function Badge({ tone = "neutral", className = "", children }) {
  const toneClass = tone === "neutral" ? "" : `badge-${tone}`;
  return <span className={["badge", toneClass, className].filter(Boolean).join(" ")}>{children}</span>;
}
