import { icons } from "../input/icons";
import SvgIcon from "./SvgIcon";

const VARIANT_CLASS = {
  secondary: "",
  primary: "btn-primary",
  danger: "btn-danger",
  "danger-solid": "btn-danger-solid",
  text: "btn-text",
};

/**
 * 버튼. 스타일은 styles/button.css의 전역 클래스 (raw <button className="btn btn-primary">와 같은 모양).
 *
 * @param {object} props
 * @param {"secondary"|"primary"|"danger"|"danger-solid"|"text"} [props.variant="secondary"]
 *   primary는 화면의 주 동작 하나, danger-solid는 삭제를 확정하는 모달 버튼에만
 * @param {"md"|"sm"} [props.size="md"]  md 36px, sm 30px (표 행 안 등)
 * @param {boolean} [props.block]        전체 폭
 * @param {string}  [props.icon]         icons.js의 path (예: icons.add)
 * @param {boolean} [props.loading]      true면 돌아가는 아이콘 + 비활성 (문구는 "저장 중..."처럼 직접 바꿈)
 * icon이 icons.refresh(새로고침 · 다시 시도)면 올렸을 때 아이콘이 한 바퀴 돈다 (btn-icon-rotate, 다른 아이콘도 className으로 붙일 수 있음).
 * 아이콘만 있는 버튼은 aria-label을 꼭 넘긴다. 나머지 props(onClick, type, aria-*, title …)는 <button>에 그대로 전달.
 */
export default function Button({
  variant = "secondary",
  size = "md",
  block = false,
  icon,
  loading = false,
  type = "button",
  disabled = false,
  className = "",
  children,
  ...rest
}) {
  const iconOnly = !children && (icon || loading);
  const classes = [
    "btn",
    VARIANT_CLASS[variant] ?? "",
    size === "sm" ? "btn-sm" : "",
    block ? "btn-block" : "",
    iconOnly ? "btn-icon" : "",
    !loading && icon === icons.refresh ? "btn-icon-rotate" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "sm" ? 14 : 16;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <SvgIcon path={icons.progress} size={iconSize} className="spin" />
      ) : (
        icon && <SvgIcon path={icon} size={iconSize} />
      )}
      {children}
    </button>
  );
}
