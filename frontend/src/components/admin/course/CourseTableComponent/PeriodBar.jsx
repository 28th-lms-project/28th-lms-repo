const NORMAL_COLOR = "#2da44e";
const WARNING_COLOR = "#d1242f";
const PROGRESS_COLOR = "#d0d7de";

const wrapperStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  width: "100%",
};

const labelStyle = {
  flexShrink: 0,
  width: "80px",
  fontSize: "13px",
  color: "#333",
};

const trackStyle = {
  position: "relative",
  flex: 1,
  minWidth: "60px",
  height: "12px",
  backgroundColor: "#eee",
  borderRadius: "6px",
  overflow: "hidden",
};

const fillStyle = {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
};

/** 0 ~ 100 으로 자르고, 숫자가 아니면 0 */
const clampRate = (rate) => Math.min(100, Math.max(0, Number(rate) || 0));

/**
 * 전체 기간 기준 가로 막대.
 * 막대 전체 = 과정 전체 기간, 연회색 = 진행률(어제까지), 초록 / 빨강 = 출석률.
 *
 * @param label 막대 왼쪽 이름 (없으면 생략)
 * @param progressRate 진행률 (%)
 * @param attendanceRate 출석률 (%, 전체 기간 기준). 없으면 진행률만 그린다
 * @param warning true면 빨간색 (진행된 기간 대비 출석 80% 미만 — 서버가 계산)
 */
export default function PeriodBar({
  label,
  progressRate,
  attendanceRate,
  warning = false,
}) {
  const hasAttendance = attendanceRate !== null && attendanceRate !== undefined;
  const progress = clampRate(progressRate);
  const attendance = clampRate(attendanceRate);
  const color = warning ? WARNING_COLOR : NORMAL_COLOR;

  return (
    <div style={wrapperStyle}>
      {label && <span style={labelStyle}>{label}</span>}
      <div style={trackStyle}>
        <div
          style={{
            ...fillStyle,
            width: `${progress}%`,
            backgroundColor: hasAttendance ? PROGRESS_COLOR : NORMAL_COLOR,
          }}
        />
        {hasAttendance && (
          <div
            style={{
              ...fillStyle,
              width: `${attendance}%`,
              backgroundColor: color,
            }}
          />
        )}
      </div>
      <span
        style={{
          flexShrink: 0,
          width: hasAttendance ? "110px" : "50px",
          fontSize: "13px",
          textAlign: "right",
          color: warning ? WARNING_COLOR : "#333",
        }}
      >
        {hasAttendance
          ? `${attendance.toFixed(1)}% / ${progress.toFixed(1)}%`
          : `${progress.toFixed(1)}%`}
      </span>
    </div>
  );
}
