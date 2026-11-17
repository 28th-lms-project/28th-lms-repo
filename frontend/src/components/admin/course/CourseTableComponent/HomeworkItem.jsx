import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import HomeworkReply from "./HomeworkReply.jsx/HomeworkReply";
import ReplyForm from "./ReplyForm";
import HomeworkSubmitStatus from "./HomeworkSubmitStatus";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import {
  deleteHomework,
  getHomeworkReplies,
  updateHomework,
} from "../../../../api/admin/course/courseApi";
import { useParams } from "react-router-dom";
import { IconButton } from "../../../sample/input/IconButton";
import usePermission from "../../../../hooks/usePermission";
import {
  fetchMyPermission,
  selectPermissionStatus,
} from "../../../../store/slices/permissionSliceStore";

export default function HomeworkItem() {
  const [addReply, setAddReply] = useState(false);

  const { showHomework } = useSelector((store) => store.courses);
  const { courseId, homeworkId } = useParams();
  const dispatch = useDispatch();

  // 내 권한: 팝업은 MainLayout 밖이라 권한 조회가 자동으로 되지 않아, MainLayout 과 같은 방식으로 한 번 조회한다
  // (자식 HomeworkSubmitStatus 도 같은 store 의 권한을 쓴다)
  const permissionStatus = useSelector(selectPermissionStatus);
  useEffect(() => {
    if (permissionStatus === "idle") {
      dispatch(fetchMyPermission());
    }
  }, [dispatch, permissionStatus]);
  const { can } = usePermission();
  const canUpdateHomework = can("COURSE_HOMEWORK_UPDATE");
  const canDeleteHomework = can("COURSE_HOMEWORK_DELETE");
  const canCreateReply = can("COURSE_HOMEWORK_REPLY_CREATE");

  useEffect(() => {
    const controller = new AbortController();

    const options = { signal: controller.signal };
    dispatch(courseActions.startLoading());
    (async () => {
      try {
        const [replyList] = await Promise.all([
          getHomeworkReplies(courseId, homeworkId, options),
        ]);

        dispatch(courseActions.loadHomeworkReplies(replyList.homeworkReplies));
        dispatch(courseActions.finishLoading());
        console.log(replyList.homeworkReplies);
      } catch (error) {
        if (error.name !== "AbortError") {
          alert(error.message);
        }
      }
    })();
  }, []);
  const onClickRefrashReply = () => {
    const controller = new AbortController();

    const options = { signal: controller.signal };
    dispatch(courseActions.startLoading());
    (async () => {
      try {
        const [replyList] = await Promise.all([
          getHomeworkReplies(courseId, homeworkId, options),
        ]);

        dispatch(courseActions.loadHomeworkReplies(replyList.homeworkReplies));
        dispatch(courseActions.finishLoading());
        console.log(replyList.homeworkReplies);
      } catch (error) {
        if (error.name !== "AbortError") {
          alert(error.message);
        }
      }
    })();
  };
  const onClickAddReply = () => {
    setAddReply(!addReply);
  };
  // 댓글 등록 성공: 폼 닫고 목록 새로고침
  const onSuccessAddReply = () => {
    setAddReply(false);
    onClickRefrashReply();
  };
  // 제출마감일이 지났는지 (마감일 당일까지는 가능, 다음 날부터 마감)
  // 오늘 날짜를 로컬 기준 "YYYY-MM-DD" 로 만들어 문자열로 비교한다. (toISOString 은 UTC라 사용하지 않음)
  const today = new Date();
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isDeadlinePassed =
    Boolean(showHomework?.endDate) && todayText > showHomework.endDate;

  // 과제 수정 (그 자리에서 편집): 내용 · 제출마감일
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  // [수정]: 현재 값을 입력칸에 채우고 편집 모드로
  const onClickUpdateHomeworkContent = () => {
    setEditContent(showHomework?.content ?? "");
    setEditEndDate(showHomework?.endDate ?? "");
    setEditing(true);
  };

  const onClickCancelUpdate = () => {
    setEditing(false);
  };

  // [저장]: 수정 API 호출 → 성공하면 응답(수정된 과제)으로 화면 갱신
  const onClickSaveHomework = async () => {
    if (saving) {
      return;
    }
    if (!editEndDate) {
      alert("제출마감일을 선택해주세요.");
      return;
    }
    if (!editContent.trim()) {
      alert("과제 내용을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateHomework(courseId, homeworkId, {
        content: editContent,
        endDate: editEndDate,
      });
      dispatch(courseActions.showHomework(updated));
      setEditing(false);
    } catch (error) {
      // 입력값 검증 실패면 필드별 메시지를 함께 보여준다.
      const validationMessages = Object.values(error.validations ?? {}).flat();
      alert(
        validationMessages.length > 0
          ? validationMessages.join("\n")
          : error.message,
      );
    } finally {
      setSaving(false);
    }
  };

  // [삭제]: DEL_YN = 'Y' 로 표시 → 팝업을 닫고, 팝업을 연 강의 화면을 새로고침해 목록에서 빠지게 한다.
  const [deleting, setDeleting] = useState(false);
  const onClickDeleteHomework = async () => {
    if (deleting || !window.confirm("과제를 삭제하시겠습니까?")) {
      return;
    }
    setDeleting(true);
    try {
      await deleteHomework(courseId, homeworkId);
      alert("과제가 삭제되었습니다.");
      if (window.opener && !window.opener.closed) {
        window.opener.location.reload();
      }
      window.close();
    } catch (error) {
      alert(error.message);
      setDeleting(false);
    }
  };

  return (
    <Fragment key={showHomework?.Id}>
      <h3 style={{ marginLeft: "10px" }}>
        {showHomework?.subject} - (
        {editing ? (
          <input
            type="date"
            value={editEndDate}
            onChange={(e) => setEditEndDate(e.target.value)}
          />
        ) : (
          showHomework?.endDate
        )}{" "}
        제출마감)
      </h3>
      {/* 과제 [수정] [삭제]: 과제 수정 · 삭제 권한이 있을 때만 (강사) */}
      {editing ? (
        <>
          <button type="button" onClick={onClickSaveHomework} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
          <button type="button" onClick={onClickCancelUpdate} disabled={saving}>
            취소
          </button>
        </>
      ) : (
        // 제출마감일이 지나면 과제 [수정] 버튼을 보여주지 않는다. (프론트에서만 막음)
        !isDeadlinePassed && (
          <>
            {canUpdateHomework && (
              <button type="button" onClick={onClickUpdateHomeworkContent}>
                수정
              </button>
            )}
            {canDeleteHomework && (
              <button
                type="button"
                onClick={onClickDeleteHomework}
                disabled={deleting}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            )}
          </>
        )
      )}
      {/* 미제출 수강생 · 제출자 랜덤 뽑기 */}
      <HomeworkSubmitStatus />
      <div
        className="section"
        style={{
          flexDirection: "row",
          border: "0.3px solid #000",
          margin: "10px",
          padding: "10px",
        }}
      >
        <div
          style={{
            width: "65%",
            minWidth: "500px",
            minHeight: "300px",
            borderRight: "0.3px solid #000f",
          }}
        >
          {editing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="과제 내용을 입력하세요."
              style={{
                width: "100%",
                height: "100%",
                minHeight: "300px",
                resize: "vertical",
                padding: "5px",
                boxSizing: "border-box",
              }}
            />
          ) : (
            <div style={{ whiteSpace: "pre-wrap" }}>
              {showHomework?.content}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            width: "30%",
            minWidth: "200px",
            minHeight: "300px",
            marginRight: "10px",
            padding: "3px",
            flexDirection: "column",
          }}
        >
          <HomeworkReply
            onUpdated={onClickRefrashReply}
            deadlinePassed={isDeadlinePassed}
          />
          <div
            className="repliesFooter"
            style={{
              marginTop: "auto",
              paddingTop: "5px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            {/* 제출마감일이 지나면 댓글 작성 폼 · 버튼 대신 안내 문구를 보여준다. (프론트에서만 막음) */}
            {isDeadlinePassed && (
              <span style={{ fontSize: "12px", color: "#d93025" }}>
                과제 마감일이 지났습니다.
              </span>
            )}
            {!isDeadlinePassed && addReply && (
              <ReplyForm
                onCancel={onClickAddReply}
                onSuccess={onSuccessAddReply}
              />
            )}
            {!isDeadlinePassed && !addReply && (
              <>
                {/* 댓글 작성: 댓글 등록 권한이 있을 때만 (팝업 권한 조회는 위 useEffect 에서 함) */}
                {canCreateReply && (
                  <IconButton
                    style={{ marginRight: "5px" }}
                    onClick={onClickAddReply}
                  >
                    댓글 작성
                  </IconButton>
                )}
                <IconButton onClick={onClickRefrashReply} style={{}}>
                  댓글 새로고침
                </IconButton>
              </>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
}
