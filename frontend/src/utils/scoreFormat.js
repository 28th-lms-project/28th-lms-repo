/**
 * 성적 상태 -> { key: "unsubmitted" | "pending" | "done", label }
 */
export function getScoreStatus(row) {
  if (row.score === null || row.score === undefined) {
    return { key: "unsubmitted", label: "미응시" };
  }
  if (row.pendingCount > 0) {
    return { key: "pending", label: `채점 중 (${row.pendingCount}문항)` };
  }
  return { key: "done", label: "채점 완료" };
}

export function formatPoint(value, totalPoint) {
  let total = 0;
  if (totalPoint !== null && totalPoint !== undefined) {
    total = totalPoint;
  }
  if (value === null || value === undefined) {
    return `- / ${total}점`;
  }
  return `${value} / ${total}점`;
}

export function formatAveragePoint(averageScore, totalPoint) {
  if (averageScore === null || averageScore === undefined) {
    return "-";
  }
  return formatPoint(averageScore, totalPoint);
}

export function toPercent(value, totalPoint) {
  if (value === null || value === undefined || !(totalPoint > 0)) {
    return null;
  }
  return Math.round((value / totalPoint) * 1000) / 10;
}

export function hasScoreValue(value) {
  return value !== null && value !== undefined;
}

export function formatTestType(testType) {
  if (testType) {
    return testType;
  }
  return "-";
}
