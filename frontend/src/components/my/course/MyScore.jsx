import { useEffect, useMemo, useState } from "react";
import Chart from "../../common/Chart.jsx";
import { getMyScoreList } from "../../../api/my/course/scoreApi.js";
import styles from "./MyScore.module.css";

function getScoreStatus(row) {
  if (row.score === null || row.score === undefined) {
    return {
      label: "미응시",
      className: styles.statusUnsubmitted,
    };
  }
  if (row.pendingCount > 0) {
    return {
      label: `채점 중 (${row.pendingCount}문항)`,
      className: styles.statusPending,
    };
  }
  return {
    label: "채점 완료",
    className: styles.statusDone,
  };
}

function formatPoint(value, totalPoint) {
  let total = 0;
  if (totalPoint !== null && totalPoint !== undefined) {
    total = totalPoint;
  }
  if (value === null || value === undefined) {
    return `- / ${total}점`;
  }
  return `${value} / ${total}점`;
}

function formatAveragePoint(averageScore, totalPoint) {
  if (averageScore === null || averageScore === undefined) {
    return "-";
  }
  return formatPoint(averageScore, totalPoint);
}

function toPercent(value, totalPoint) {
  if (value === null || value === undefined || !(totalPoint > 0)) {
    return null;
  }
  return Math.round((value / totalPoint) * 1000) / 10;
}

function hasScoreValue(value) {
  return value !== null && value !== undefined;
}

function formatTestType(testType) {
  if (testType) {
    return testType;
  }
  return "-";
}

function getRowClassName(index) {
  if (index % 2 === 0) {
    return styles.rowEven;
  }
  return styles.rowOdd;
}

export default function MyScore({ courseId }) {
  const [scores, setScores] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!courseId) {
      return;
    }
    const controller = new AbortController();

    getMyScoreList(courseId, { signal: controller.signal })
      .then((result) => {
        setScores(result ?? []);
        setStatus("loaded");
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        if (error.errorCode === "COURSE_NOT_AUTHORIZED") {
          setStatus("hidden");
          return;
        }
        setStatus("failed");
      });

    return () => {
      controller.abort();
    };
  }, [courseId]);

  const chartRows = useMemo(
    () =>
      scores.filter(
        (row) =>
          row.totalPoint > 0 &&
          (hasScoreValue(row.score) || hasScoreValue(row.averageScore)),
      ),
    [scores],
  );
  const categories = useMemo(
    () => chartRows.map((row) => row.setName),
    [chartRows],
  );
  const series = useMemo(
    () => [
      {
        name: "내 점수",
        data: chartRows.map((row) => toPercent(row.score, row.totalPoint)),
      },
      {
        name: "반 평균",
        data: chartRows.map((row) =>
          toPercent(row.averageScore, row.totalPoint),
        ),
      },
    ],
    [chartRows],
  );

  if (status === "hidden" || status === "loading") {
    return null;
  }
  if (status === "failed") {
    return (
      <section className={styles.section}>
        <h3 className={styles.title}>내 성적</h3>
        <p className={styles.notice}>성적을 불러오지 못했습니다.</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>내 성적</h3>
      {scores.length === 0 && (
        <p className={styles.notice}>공개된 시험이 없습니다.</p>
      )}
      {scores.length > 0 && (
        <div className={styles.layout}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>시험명</th>
                <th>유형</th>
                <th>내 점수</th>
                <th>반 평균</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((row, index) => {
                const scoreStatus = getScoreStatus(row);
                return (
                  <tr key={row.testSetId} className={getRowClassName(index)}>
                    <td>{row.setName}</td>
                    <td className={styles.cellCenter}>
                      {formatTestType(row.testType)}
                    </td>
                    <td className={styles.cellScore}>
                      {formatPoint(row.score, row.totalPoint)}
                    </td>
                    <td className={styles.cellScore}>
                      {formatAveragePoint(row.averageScore, row.totalPoint)}
                    </td>
                    <td className={styles.cellCenter}>
                      <span
                        className={`${styles.badge} ${scoreStatus.className}`}
                      >
                        {scoreStatus.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {chartRows.length > 0 && (
            <div className={styles.chartWrap}>
              <Chart
                type="bar"
                series={series}
                categories={categories}
                yText="점수(%)"
                unit="%"
              />
            </div>
          )}
          {chartRows.length === 0 && (
            <p className={styles.notice}>
              표시할 성적 데이터가 없어 차트를 표시할 수 없습니다.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
