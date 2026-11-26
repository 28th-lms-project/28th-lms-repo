import { icons } from "../input/icons";
import SvgIcon from "./SvgIcon";

const DEFAULT_ICON = { success: icons.ok, warning: icons.error, danger: icons.error };

/**
 * 안내 상자: 경고 · 변경 알림 · 도움말처럼 화면 안에 머무는 안내. 스타일은 styles/panel.css (.callout).
 * 잠깐 보였다 사라지는 결과 알림은 토스트, 화면을 쓸 수 없는 상태는 StatusBox.
 *
 * @param {object} props
 * @param {"info"|"success"|"warning"|"danger"|"neutral"} [props.tone="info"]
 * @param {React.ReactNode} [props.title]
 * @param {string|null} [props.icon]  icons.js path. 기본은 tone별 (info · neutral은 없음), null이면 숨김
 * @param {React.ReactNode} [props.actions]  오른쪽 버튼 (변경 저장 · 되돌리기 등)
 */
export default function Callout({ tone = "info", title, icon, actions, children }) {
  const iconPath = icon === undefined ? DEFAULT_ICON[tone] : icon;
  const toneClass = tone === "neutral" ? "" : `callout-${tone}`;

  return (
    <div className={`callout ${toneClass}`.trim()} role={tone === "danger" || tone === "warning" ? "alert" : undefined}>
      {iconPath && <SvgIcon path={iconPath} size={18} />}
      <div className="callout-content">
        {title && <strong className="callout-title">{title}</strong>}
        {children}
      </div>
      {actions && <div className="btn-group">{actions}</div>}
    </div>
  );
}
