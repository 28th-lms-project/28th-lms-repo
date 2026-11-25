import { useParams } from "react-router-dom";
import usePermission from "../../../../hooks/usePermission.js";
import styles from "./CourseScore.module.css";
import { useCallback, useEffect, useState } from "react";
import {
  getCourseScoreList,
  getStudentScoreDetail,
} from "../../../../api/my/course/scoreApi.js";
import {
  getScoreStatus,
  formatTestType,
  hasScoreValue,
} from "../../../../utils/scoreFormat.js";
import StatusBox from "../../../common/ui/StatusBox.jsx";
import Panel from "../../../common/ui/Panel.jsx";
import Badge from "../../../common/ui/Badge.jsx";
import MyScore from "../../../my/course/MyScore.jsx";
import Button from "../../../common/ui/Button.jsx";
import Modal from "../../../common/ui/Modal.jsx";
import ScoreDetailModal from "./ScoreDetailModal.jsx";
import { displayName } from "../../../../utils/displayName.js";

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

/** 응시한 시험 점수는 버튼: 누르면 상세 성적 (문항별 결과) */
function ScoreCell({ row, onOpen, ariaLabel }) {
  if (!row) {
    return <span className={styles.muted}>-</span>;
  }
  const scoreStatus = getScoreStatus(row);
  if (scoreStatus.key === "unsubmitted") {
    return <span className={styles.muted}>-</span>;
  }
  return (
    <Button
      variant="text"
      size="sm"
      onClick={onOpen}
      aria-label={ariaLabel}
      title="상세 성적 보기"
    >
      {row.score}
      {scoreStatus.key === "pending" && (
        <Badge tone="warning" className={styles.badgeGap}>
          {scoreStatus.label}
        </Badge>
      )}
    </Button>
  );
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
  // 상세 성적 대상 { courseStudentId, userName, testSetId }
  const [detailTarget, setDetailTarget] = useState(null);
  // 학생 성적 화면(학생이 보는 내 성적)을 연 학생 { courseStudentId, name }
  const [pageStudent, setPageStudent] = useState(null);

  const loadDetail = useCallback(
    (options) =>
      getStudentScoreDetail(
        courseId,
        detailTarget.courseStudentId,
        detailTarget.testSetId,
        options,
      ),
    [courseId, detailTarget],
  );

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
              <th>
                <div>과정 석차</div>
                <div className={styles.subHeader}>100점 환산 평균</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.courseStudentId}>
                <td className={styles.studentCol}>
                  {/* 이름을 누르면 그 학생이 보는 내 성적 화면 */}
                  <Button
                    variant="text"
                    size="sm"
                    title="학생 성적 화면 보기"
                    onClick={() =>
                      setPageStudent({
                        courseStudentId: student.courseStudentId,
                        name: displayName(student.userName, student.nameSuffix),
                      })
                    }
                  >
                    {displayName(student.userName, student.nameSuffix)}
                  </Button>
                </td>
                {testSets.map((test) => {
                  const row = student.scoreList.find(
                    (score) => score.testSetId === test.testSetId,
                  );
                  return (
                    <td key={test.testSetId} className="col-num">
                      <ScoreCell
                        row={row}
                        ariaLabel={`${displayName(student.userName, student.nameSuffix)} ${test.setName} 상세 성적`}
                        onOpen={() =>
                          setDetailTarget({
                            courseStudentId: student.courseStudentId,
                            userName: displayName(
                              student.userName,
                              student.nameSuffix,
                            ),
                            testSetId: test.testSetId,
                          })
                        }
                      />
                    </td>
                  );
                })}
                <td className="col-num">
                  {student.courseRank ? (
                    <>
                      {student.courseRank.rankNo}등 / {student.courseRank.rankTotal}명
                      <div className={styles.subHeader}>
                        {student.courseRank.averagePercent}점
                      </div>
                    </>
                  ) : (
                    <span className={styles.muted}>-</span>
                  )}
                </td>
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
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      {pageStudent && (
        <Modal
          open
          size="lg"
          className="modal-wide"
          closeOnBackdrop
          onClose={() => setPageStudent(null)}
          title={`${pageStudent.name} 학생의 성적`}
          summary="학생이 보는 내 성적 화면"
          footer={<Button onClick={() => setPageStudent(null)}>닫기</Button>}
        >
          <MyScore courseId={courseId} student={pageStudent} />
        </Modal>
      )}
      {detailTarget && (
        <ScoreDetailModal
          load={loadDetail}
          answerLabel={`${detailTarget.userName} 답안`}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </Panel>
  );
}
