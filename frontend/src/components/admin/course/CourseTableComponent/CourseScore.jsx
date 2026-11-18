import { useParams } from "react-router-dom";
import usePermission from "../../../../hooks/usePermission.js";
import styles from "./CourseScore.module.css";
import { useEffect, useState } from "react";
import { getCourseScoreList } from "../../../../api/my/course/scoreApi.js";
import {
  getScoreStatus,
  formatTestType,
  hasScoreValue,
} from "../../../../utils/scoreFormat.js";
import StatusBox from "../../../common/ui/StatusBox.jsx";
import Panel from "../../../common/ui/Panel.jsx";
import Badge from "../../../common/ui/Badge.jsx";
import MyScore from "../../../my/course/MyScore.jsx";

export default function CourseScore() {
  const { id } = useParams();
  const { can, status } = usePermission();

  // 권한 조회 전 || 권한 조회 중 : 아무것도 그리지 않음
  if (status === "idle" || status === "loading") {
    return null;
  }

  // 권한 조회 자체가 실패 (서버 오류 등)
  if (status === "failed") {
    return (
      <StatusBox
        type="error"
        title="권한 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요."
      />
    );
  }

  // 과정 성적 권한이 없으면 (수강생 등) 내 성적 표시
  if (!can("SCORE_READ_COURSE")) {
    return <MyScore courseId={id} />;
  }

  return <CourseScoreContent courseId={id} />;
}

function ScoreCell({ row }) {
  if (!row) {
    return <span className={styles.muted}>-</span>;
  }
  const scoreStatus = getScoreStatus(row);
  if (scoreStatus.key === "unsubmitted") {
    return <span className={styles.muted}>-</span>;
  }
  if (scoreStatus.key === "pending") {
    return (
      <>
        {row.score}
        <Badge tone="warning" className={styles.badgeGap}>
          {scoreStatus.label}
        </Badge>
      </>
    );
  }
  return <>{row.score}</>;
}

function AverageCell({ value }) {
  if (!hasScoreValue(value)) {
    return <span className={styles.muted}>-</span>;
  }
  return <>{value}</>;
}

function CourseScoreContent({ courseId }) {
  const [students, setStudents] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const result = await getCourseScoreList(courseId, {
          signal: controller.signal,
        });
        setStudents(result ?? []);
        setStatus("loaded");
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }
        if (error.errorCode === "COURSE_NOT_AUTHORIZED") {
          setStatus("denied");
          return;
        }
        setStatus("failed");
      }
    };
    load();

    return () => {
      controller.abort();
    };
  }, [courseId]);

  if (status === "loading") {
    return <StatusBox type="loading" />;
  }
  if (status === "denied") {
    return (
      <StatusBox
        type="denied"
        title="이 과정의 성적을 조회할 권한이 없습니다."
      />
    );
  }
  if (status === "failed") {
    return <StatusBox type="error" title="성적을 불러오지 못했습니다." />;
  }
  if (students.length === 0) {
    return (
      <StatusBox
        type="empty"
        title="수강생이나 시험이 없어 표시할 성적이 없습니다."
      />
    );
  }
  const testSets = students[0].scoreList ?? [];

  return (
    <Panel title="과정 성적" flush className={styles.section}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className={styles.studentCol}>수강생</th>
              {testSets.map((test) => (
                <th key={test.testSetId}>
                  <div>{test.setName}</div>
                  <div className={styles.subHeader}>
                    {formatTestType(test.testType)} · {test.totalPoint}점
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.courseStudentId}>
                <td className={styles.studentCol}>{student.userName}</td>
                {testSets.map((test) => {
                  const row = student.scoreList.find(
                    (score) => score.testSetId === test.testSetId,
                  );
                  return (
                    <td key={test.testSetId} className="col-num">
                      <ScoreCell row={row} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.averageRow}>
              <td className={styles.studentCol}>반 평균</td>
              {testSets.map((test) => (
                <td key={test.testSetId} className="col-num">
                  <AverageCell value={test.averageScore} />
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </Panel>
  );
}
