import { useId } from "react";

/**
 * 패널: 화면의 주요 구역 (머리 · 본문 · 바닥). 스타일은 styles/panel.css.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.title]
 * @param {React.ReactNode} [props.subtitle]  제목 옆 회색 (건수 등)
 * @param {React.ReactNode} [props.badge]     제목 옆 배지
 * @param {React.ReactNode} [props.actions]   머리 오른쪽 버튼들
 * @param {React.ReactNode} [props.footer]    바닥 버튼들 (오른쪽 정렬)
 * @param {boolean} [props.flush]             본문 여백 없음 (표 · 목록을 가장자리까지)
 */
export default function Panel({ title, subtitle, badge, actions, footer, flush = false, className = "", children }) {
  const titleId = useId();

  return (
    <section className={`panel ${className}`.trim()} aria-labelledby={title ? titleId : undefined}>
      {(title || actions) && (
        <div className="panel-header">
          {title && (
            <h3 id={titleId} className="panel-title">
              {title}
              {subtitle && <span className="panel-subtitle">{subtitle}</span>}
              {badge}
            </h3>
          )}
          {actions && <div className="panel-actions">{actions}</div>}
        </div>
      )}
      <div className={`panel-body ${flush ? "panel-body-flush" : ""}`.trim()}>{children}</div>
      {footer && <div className="panel-footer">{footer}</div>}
    </section>
  );
}
