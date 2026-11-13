import { useEffect, useMemo, useState } from "react";
import Chart from "../../common/Chart.jsx";
import { getMyScoreList } from "../../../api/my/course/scoreApi.js";

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
        setScores(result);
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
    () => scores.filter((row) => row.score != null && row.totalPoint > 0),
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
        data: chartRows.map((row) =>
          Math.round((row.score / row.totalPoint) * 100),
        ),
      },
    ],
    [chartRows],
  );

  if (status === "hidden" || status === "loading") {
    return null;
  }
  if (status === "failed") {
    return <div>성적을 불러오지 못했습니다.</div>;
  }

  return (
    <section>
      <h3>내 성적</h3>
      {/* 표: 시험명 · 유형 · 점수(score / totalPoint) · 상태(getScoreStatus) */}
      <Chart
        type="bar"
        series={series}
        categories={categories}
        yText="점수(%)"
        unit="%"
      />
    </section>
  );
}
