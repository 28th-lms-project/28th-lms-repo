import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { IconButton } from "../../../sample/input/IconButton";
import { getCourseStudents } from "../../../../api/admin/course/courseApi";

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
 * - 미제출: "n명 과제 미제출: 이름, 이름..."
 * - 랜덤 뽑기: 입력한 명수만큼 제출한 수강생 이름을 랜덤으로 보여준다.
 */
export default function HomeworkSubmitStatus() {
  const { homeworkReplies } = useSelector((store) => store.courses);
  const { courseId } = useParams();

  // 팝업은 별도 창이라 store 에 수강생 목록이 없어서 여기서 직접 불러온다.
  const [students, setStudents] = useState([]);
  const [pickCount, setPickCount] = useState("");
  const [pickedNames, setPickedNames] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const result = await getCourseStudents(courseId, {
          signal: controller.signal,
        });
        setStudents(result ?? []);
      } catch (error) {
        if (error.name !== "AbortError") {
          alert(error.message);
        }
      }
    })();
    return () => {
      controller.abort();
    };
  }, [courseId]);

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
      alert("1 이상의 명수를 입력해주세요.");
      return;
    }
    if (count > submittedStudents.length) {
      alert(
        `제출한 수강생은 ${submittedStudents.length}명입니다. ${submittedStudents.length}명 이하로 입력해주세요.`,
      );
      return;
    }
    setPickedNames(
      shuffle(submittedStudents)
        .slice(0, count)
        .map((student) => student.name),
    );
  };

  return (
    <div
      style={{
        margin: "5px 10px",
        fontSize: "13px",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
      }}
    >
      <div>
        <strong>{notSubmittedStudents.length}명 과제 미제출</strong>
        {notSubmittedStudents.length > 0 &&
          `: ${notSubmittedStudents.map((student) => student.name).join(", ")}`}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <input
          type="number"
          min={1}
          max={submittedStudents.length}
          value={pickCount}
          onChange={(e) => setPickCount(e.target.value)}
          placeholder="명수"
          style={{ width: "70px", padding: "3px 5px" }}
        />
        <IconButton onClick={onClickPickRandom}>제출자 랜덤 뽑기</IconButton>
        {pickedNames.length > 0 && <span>{pickedNames.join(", ")}</span>}
      </div>
    </div>
  );
}
