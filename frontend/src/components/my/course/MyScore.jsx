import { useEffect, useMemo, useState } from "react";
import Chart from "../../common/Chart.jsx";
import { getMyScoreList } from "../../../api/my/course/scoreApi.js";
import styles from "./MyScore.module.css";
import {
  formatAveragePoint,
  formatPoint,
  formatTestType,
  getScoreStatus,
  hasScoreValue,
  toPercent,
} from "../../../utils/scoreFormat.js";
import StatusBox from "../../common/ui/StatusBox.jsx";

const STATUS_CLASS = {
  unsubmitted: styles.statusUnsubmitted,
  pending: styles.statusPending,
  done: styles.statusDone,
};

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

  if (status === "hidden") {
    return (
      <StatusBox
        type="denied"
        title="이 과정의 수강생만 성적을 볼 수 있습니다."
      />
    );
  }
  if (status === "loading") {
    return <StatusBox type="loading" />;
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
                        className={`${styles.badge} ${STATUS_CLASS[scoreStatus.key]}`}
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
