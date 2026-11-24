import { useCallback, useEffect, useMemo, useState } from "react";
import Chart from "../../common/Chart.jsx";
import {
  getMyCourseRank,
  getMyScoreDetail,
  getMyScoreList,
  getStudentCourseRank,
  getStudentScoreDetail,
  getStudentScoreList,
} from "../../../api/my/course/scoreApi.js";
import {
  canOpenResult,
  formatAveragePoint,
  formatPoint,
  formatRank,
  formatTestType,
  getScoreStatus,
  hasScoreValue,
  toPercent,
} from "../../../utils/scoreFormat.js";
import StatusBox from "../../common/ui/StatusBox.jsx";
import Badge from "../../common/ui/Badge.jsx";
import Panel from "../../common/ui/Panel.jsx";
import Button from "../../common/ui/Button.jsx";
import StatCard from "../../common/ui/StatCard.jsx";
import ScoreDetailModal from "../../admin/course/CourseTableComponent/ScoreDetailModal.jsx";
import styles from "./MyScore.module.css";

const STATUS_TONE = {
  unsubmitted: "neutral",
  pending: "warning",
  done: "success",
};

/**
 * 내 성적 (학생 화면).
 * student 를 넘기면 강사 · 관리자가 그 학생이 보는 화면을 그대로 본다 (성적 탭에서 학생 이름 클릭)
 *
 * @param courseId 과정 ID
 * @param student { courseStudentId, name } 강사가 볼 학생 (없으면 로그인한 학생 본인)
 */
export default function MyScore({ courseId, student }) {
  const courseStudentId = student?.courseStudentId;
  const [scores, setScores] = useState([]);
  const [status, setStatus] = useState("loading");
  // 과정 전체 석차 (없으면 null)
  const [courseRank, setCourseRank] = useState(null);
  // 상세 결과를 연 시험 ID
  const [detailTestSetId, setDetailTestSetId] = useState(null);

  const loadDetail = useCallback(
    (options) =>
      courseStudentId
        ? getStudentScoreDetail(
            courseId,
            courseStudentId,
            detailTestSetId,
            options,
          )
        : getMyScoreDetail(courseId, detailTestSetId, options),
    [courseId, courseStudentId, detailTestSetId],
  );

  useEffect(() => {
    if (!courseId) {
      return;
    }
    const controller = new AbortController();
    const options = { signal: controller.signal };

    // 석차는 부가 정보: 실패해도 성적표는 보여준다
    (courseStudentId
      ? getStudentCourseRank(courseId, courseStudentId, options)
      : getMyCourseRank(courseId, options)
    )
      .then((result) => setCourseRank(result ?? null))
      .catch(() => setCourseRank(null));

    (courseStudentId
      ? getStudentScoreList(courseId, courseStudentId, options)
      : getMyScoreList(courseId, options)
    )
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
  }, [courseId, courseStudentId]);

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
        title={
          courseStudentId
            ? "이 과정의 성적을 조회할 권한이 없습니다."
            : "이 과정의 수강생만 성적을 볼 수 있습니다."
        }
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
    <div className="form-stack">
      <div className={styles.rankRow}>
        <StatCard
          label="과정 전체 석차"
          value={courseRank ? courseRank.rankNo : "-"}
          unit={courseRank ? `등 / ${courseRank.rankTotal}명` : undefined}
          hint="채점이 끝난 응시 시험의 100점 환산 평균 기준"
        />
        <StatCard
          label="100점 환산 평균"
          value={courseRank ? courseRank.averagePercent : "-"}
          unit={courseRank ? "점" : undefined}
          hint={
            courseRank
              ? `시험 ${courseRank.testCount}개 반영`
              : "채점이 끝난 시험이 없습니다."
          }
        />
      </div>
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
                  <th>석차</th>
                  <th>상태</th>
                  <th>결과</th>
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
                      <td className="col-num">
                        {formatRank(row.rankNo, row.rankTotal)}
                      </td>
                      <td className="col-center">
                        <Badge tone={STATUS_TONE[scoreStatus.key]}>
                          {scoreStatus.label}
                        </Badge>
                      </td>
                      <td className="col-center">
                        {/* 채점 완료 + 시험 마감 뒤에만 결과(정답 · 내 답안) 공개 */}
                        {canOpenResult(row) ? (
                          <Button
                            size="sm"
                            variant="text"
                            onClick={() => setDetailTestSetId(row.testSetId)}
                            aria-label={`${row.setName} 결과 보기`}
                          >
                            결과 보기
                          </Button>
                        ) : (
                          <span
                            className="field-hint"
                            title={
                              hasScoreValue(row.score) && row.pendingCount === 0
                                ? "시험이 마감되면 결과를 볼 수 있습니다."
                                : undefined
                            }
                          >
                            {hasScoreValue(row.score) && row.pendingCount === 0
                              ? "마감 후 공개"
                              : "-"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="반 평균 비교">
          {chartRows.length > 0 && (
            <Chart
              type="bar"
              series={series}
              categories={categories}
              yText="점수(%)"
              unit="%"
            />
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
      {detailTestSetId && (
        <ScoreDetailModal
          load={loadDetail}
          answerLabel={student ? `${student.name} 답안` : "내 답안"}
          onClose={() => setDetailTestSetId(null)}
        />
      )}
    </div>
  );
}
