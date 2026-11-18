import { useEffect, useMemo, useState } from "react";
import Chart from "../../common/Chart.jsx";
import { getMyScoreList } from "../../../api/my/course/scoreApi.js";
import {
  formatAveragePoint,
  formatPoint,
  formatTestType,
  getScoreStatus,
  hasScoreValue,
  toPercent,
} from "../../../utils/scoreFormat.js";
import StatusBox from "../../common/ui/StatusBox.jsx";
import Badge from "../../common/ui/Badge.jsx";
import Panel from "../../common/ui/Panel.jsx";
import styles from "./MyScore.module.css";

const STATUS_TONE = {
  unsubmitted: "neutral",
  pending: "warning",
  done: "success",
};

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
    return <StatusBox type="error" title="성적을 불러오지 못했습니다." />;
  }
  if (scores.length === 0) {
    return <StatusBox type="empty" title="공개된 시험이 없습니다." />;
  }

  return (
    <div className={`layout-split ${styles.layout}`}>
      <Panel title="내 성적" flush>
        <div className="table-wrap">
          <table className="table table-striped">
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
              {scores.map((row) => {
                const scoreStatus = getScoreStatus(row);
                return (
                  <tr key={row.testSetId}>
                    <td>{row.setName}</td>
                    <td className="col-center">
                      {formatTestType(row.testType)}
                    </td>
                    <td className="col-num">
                      {formatPoint(row.score, row.totalPoint)}
                    </td>
                    <td className="col-num">
                      {formatAveragePoint(row.averageScore, row.totalPoint)}
                    </td>
                    <td className="col-center">
                      <Badge tone={STATUS_TONE[scoreStatus.key]}>
                        {scoreStatus.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="반 평균 비교">
        {/* 차트(apexcharts) 글자색이 고정이라 다크 모드에서도 밝은 섬으로 보여 줌 */}
        {chartRows.length > 0 && (
          <div data-color-scheme="light" className={styles.chart}>
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
          <StatusBox
            type="empty"
            size="sm"
            title="표시할 성적 데이터가 없어 차트를 표시할 수 없습니다."
          />
        )}
      </Panel>
    </div>
  );
}
