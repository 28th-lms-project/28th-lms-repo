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

/**
 * 학생이 시험 상세 결과(본인 답 · 정답)를 볼 수 있는지 (서버 ScoreServiceImpl.readMyScoreDetail 과 같은 기준)
 * 응시했고, 강사가 채점 완료를 확정한 시험 (SHOW_YN = "C")
 */
export function canOpenResult(row) {
  return hasScoreValue(row.score) && row.pendingCount === 0 && row.showYn === "C";
}

/** 석차 "3등 / 20명" (채점 중 · 미응시면 "-") */
export function formatRank(rankNo, rankTotal) {
  if (rankNo === null || rankNo === undefined || !(rankTotal > 0)) {
    return "-";
  }
  return `${rankNo}등 / ${rankTotal}명`;
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
