import { icons } from "../input/icons";
import Button from "./Button";
import SvgIcon from "./SvgIcon";

const PRESETS = {
  loading: { title: "불러오는 중...", icon: icons.progress, spin: true },
  empty: { title: "데이터가 없습니다." },
  error: { title: "불러오지 못했습니다.", icon: icons.error },
  denied: { title: "권한이 없습니다." },
  notFound: { title: "페이지를 찾을 수 없습니다.", code: "404" },
};

/**
 * 화면 · 목록 영역을 차지하는 상태 안내. 스타일은 styles/status.css.
 * 권한 확인 중 · 권한 없음 · 불러오기 실패 · 빈 목록을 모두 이것으로 쓴다.
 *
 * @param {object} props
 * @param {"loading"|"empty"|"error"|"denied"|"notFound"} props.type
 * @param {string} [props.title]    type별 기본 문구 대신
 * @param {string} [props.detail]   둘째 줄 (오류면 빨강, 줄바꿈 유지)
 * @param {() => void} [props.onRetry]  있으면 [다시 시도] 버튼 (주로 error)
 * @param {"md"|"sm"|"lg"} [props.size="md"] sm은 목록 · 표 안에서 테두리 없이 작게, lg는 화면 전체 (404 · 라우트 오류)
 * @param {string} [props.code]   큰 숫자 (lg에서 "404" · "500"). notFound는 기본 "404"
 * @param {React.ReactNode} [props.actions]  아래 버튼 묶음 (홈으로 · 뒤로)
 */
export default function StatusBox({ type, title, detail, onRetry, size = "md", code, actions, children }) {
  const preset = PRESETS[type] ?? {};
  const bigCode = code ?? preset.code;
  const classes = [
    "status-box",
    type === "error" ? "status-box-error" : "",
    size === "sm" ? "status-box-sm" : "",
    size === "lg" ? "status-box-lg" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      role={type === "error" ? "alert" : type === "loading" ? "status" : undefined}
      aria-live={type === "loading" ? "polite" : undefined}
    >
      {bigCode && <p className="status-box-code">{bigCode}</p>}
      {preset.icon && size !== "sm" && !bigCode && (
        <SvgIcon path={preset.icon} size={28} className={`status-box-icon ${preset.spin ? "spin" : ""}`.trim()} />
      )}
      <p className="status-box-title">{title ?? preset.title}</p>
      {detail && <p className="status-box-detail">{detail}</p>}
      {children}
      {onRetry && (
        <Button size="sm" icon={icons.refresh} onClick={onRetry}>
          다시 시도
        </Button>
      )}
      {actions && <div className="status-box-actions">{actions}</div>}
    </div>
  );
}
