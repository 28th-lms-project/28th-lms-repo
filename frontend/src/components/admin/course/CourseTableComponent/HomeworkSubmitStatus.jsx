import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getCourseStudents } from "../../../../api/admin/course/courseApi";
import usePermission from "../../../../hooks/usePermission";

import Button from "../../../common/ui/Button";
import { useToast } from "../../../common/ui/feedbackContext";
import styles from "./HomeworkSubmitStatus.module.css";

/** 배열을 섞은 새 배열 (Fisher-Yates) */
const shuffle = (list) => {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * 과제 제출 현황
 * - 제출 = 해당 과제에 댓글을 단 수강생, 미제출 = 댓글을 달지 않은 수강생
 * - 미제출: "n명 미제출 · 이름, 이름..."
 * - 랜덤 뽑기: 입력한 명수만큼 제출한 수강생 이름을 랜덤으로 보여준다.
 */
export default function HomeworkSubmitStatus() {
  const { homeworkReplies } = useSelector((store) => store.courses);
  const { courseId } = useParams();
  const toast = useToast();

  // 팝업은 별도 창이라 store 에 수강생 목록이 없어서 여기서 직접 불러온다.
  const [students, setStudents] = useState([]);
  const [pickCount, setPickCount] = useState("");
  const [pickedNames, setPickedNames] = useState([]);
  // 명수 입력 오류 (버튼 옆에 표시)
  const [pickError, setPickError] = useState("");
  // 수강생 목록 조회 권한(COURSE_STUDENT_READ)이 없으면(수강생 역할) 제출 현황을 숨긴다
  const [forbidden, setForbidden] = useState(false);

  // 내 권한 (팝업의 권한 조회는 부모 HomeworkItem 이 한다)
  const { can } = usePermission();
  // 제출자 랜덤 뽑기: 과제를 관리하는 사람(강사)에게만. 과제 수정 권한 기준
  const canPickRandom = can("COURSE_HOMEWORK_UPDATE");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const result = await getCourseStudents(courseId, {
          signal: controller.signal,
        });
        setStudents(result ?? []);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }
        // 403: 권한 없는 역할(수강생)은 알림 없이 숨김. 그 외 오류는 알림
        if (error.httpStatusCode === 403) {
          setForbidden(true);
          return;
        }
        toast.error(
          `수강생 목록을 불러오지 못했습니다. ${error.message ?? ""}`.trim(),
        );
      }
    })();
    return () => {
      controller.abort();
    };
  }, [courseId, toast]);

  // 댓글 작성자 ID (빈 댓글 제외). 강사 · 관리자 댓글은 수강생 목록에 없으므로 자연히 빠진다.
  const replyWriterIds = new Set(
    (homeworkReplies ?? [])
      .filter((reply) => reply?.id)
      .map((reply) => reply.courseStudentId),
  );
  const submittedStudents = students.filter((student) =>
    replyWriterIds.has(student.id),
  );
  const notSubmittedStudents = students.filter(
    (student) => !replyWriterIds.has(student.id),
  );

  const onClickPickRandom = () => {
    const count = Number(pickCount);
    if (!Number.isInteger(count) || count < 1) {
      setPickError("1 이상의 명수를 입력하세요.");
      return;
    }
    if (count > submittedStudents.length) {
      setPickError(
        `제출한 수강생은 ${submittedStudents.length}명입니다. ${submittedStudents.length}명 이하로 입력하세요.`,
      );
      return;
    }
    setPickError("");
    setPickedNames(
      shuffle(submittedStudents)
        .slice(0, count)
        .map((student) => student.name),
    );
  };

  if (forbidden) {
    return null;
  }

  return (
    <div className="toolbar">
      <span>
        <strong>{notSubmittedStudents.length}명 미제출</strong>
        {notSubmittedStudents.length > 0 && (
          <span className="field-hint">
            {" "}
            · {notSubmittedStudents.map((student) => student.name).join(", ")}
          </span>
        )}
      </span>

      {canPickRandom && (
        <div className={`btn-group toolbar-end ${styles.pickRow}`}>
          <input
            type="number"
            className={`form-control form-control-sm ${styles.countInput}`}
            min={1}
            max={submittedStudents.length}
            aria-label="뽑을 인원"
            aria-invalid={Boolean(pickError)}
            value={pickCount}
            onChange={(e) => setPickCount(e.target.value)}
            placeholder="명수"
          />
          <Button size="sm" onClick={onClickPickRandom}>
            제출자 랜덤 뽑기
          </Button>
          {pickError && (
            <span className="field-error" role="alert">
              {pickError}
            </span>
          )}
          {pickedNames.map((name) => (
            <span key={name} className="tag">
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
