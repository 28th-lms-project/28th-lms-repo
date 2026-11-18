import { useCallback, useEffect, useId, useState } from "react";
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
import usePermission from "../../../../hooks/usePermission";
import {
  fetchMyPermission,
  selectPermissionStatus,
} from "../../../../store/slices/permissionSliceStore";

import Badge from "../../../common/ui/Badge";
import Button from "../../../common/ui/Button";
import Callout from "../../../common/ui/Callout";
import Panel from "../../../common/ui/Panel";
import StatusBox from "../../../common/ui/StatusBox";
import { useConfirm, useToast } from "../../../common/ui/feedbackContext";
import { icons } from "../../../common/input/icons";
import styles from "./HomeworkItem.module.css";

/** 오류 토스트 문구: 입력값 검증 실패면 필드별 메시지를 함께 보여준다. */
const failText = (prefix, error) => {
  const validationMessages = Object.values(error?.validations ?? {}).flat();
  return validationMessages.length > 0
    ? `${prefix}\n${validationMessages.join("\n")}`
    : `${prefix} ${error?.message ?? ""}`.trim();
};

export default function HomeworkItem() {
  const { showHomework, homeworkReplies } = useSelector(
    (store) => store.courses,
  );
  const { courseId, homeworkId } = useParams();
  const dispatch = useDispatch();
  const toast = useToast();
  const confirm = useConfirm();

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

  // 댓글 목록을 불러오지 못했을 때의 오류 (댓글 패널 안에 StatusBox로 보여 줌)
  const [replyError, setReplyError] = useState(null);

  // 댓글 목록 조회 (처음 열 때 · [새로고침] · 등록 · 수정 · 삭제 뒤)
  const loadReplies = useCallback(
    (options) => {
      dispatch(courseActions.startLoading());
      (async () => {
        try {
          const [replyList] = await Promise.all([
            getHomeworkReplies(courseId, homeworkId, options),
          ]);
          dispatch(
            courseActions.loadHomeworkReplies(replyList.homeworkReplies),
          );
          dispatch(courseActions.finishLoading());
          setReplyError(null);
        } catch (error) {
          if (error.name !== "AbortError") {
            setReplyError(error);
          }
        }
      })();
    },
    [dispatch, courseId, homeworkId],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadReplies({ signal: controller.signal });
    return () => controller.abort();
  }, [loadReplies]);

  const onClickRefrashReply = () => {
    loadReplies();
  };
  // 댓글 등록 성공: 목록 새로고침
  const onSuccessAddReply = () => {
    toast.success("댓글을 등록했습니다.");
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
  // 고친 것이 있는지 ([저장] 켜기 · [취소] 확인)
  const dirty =
    editContent !== (showHomework?.content ?? "") ||
    editEndDate !== (showHomework?.endDate ?? "");
  // 마감일이 오늘보다 앞이면 날짜 칸 아래에 빨간 안내 문구를 보여주고 [저장]을 막는다
  // 지난 날짜로 저장하면 바로 마감되어 수정 · 삭제 · 댓글을 되돌릴 수 없기 때문
  // (달력의 min 은 직접 입력하면 우회되므로 여기서 한 번 더 검사. yyyy-MM-dd 는 문자열 비교 = 날짜 비교)
  const endDateError =
    editEndDate && editEndDate < todayText
      ? "오늘 이후의 날짜를 고르세요."
      : "";
  const endDateErrorId = useId();
  // [저장]을 못 누르는 이유 (없으면 저장 가능)
  let saveBlockedReason = "";
  if (!editEndDate) {
    saveBlockedReason = "제출 마감일을 고르세요.";
  } else if (endDateError) {
    saveBlockedReason = endDateError;
  } else if (!editContent.trim()) {
    saveBlockedReason = "과제 내용을 입력하세요.";
  } else if (!dirty) {
    saveBlockedReason = "바뀐 내용이 없습니다.";
  }

  // [수정]: 현재 값을 입력칸에 채우고 편집 모드로
  const onClickUpdateHomeworkContent = () => {
    setEditContent(showHomework?.content ?? "");
    setEditEndDate(showHomework?.endDate ?? "");
    setEditing(true);
  };

  // [취소]: 고친 것이 있으면 한 번 묻는다
  const onClickCancelUpdate = async () => {
    if (
      dirty &&
      !(await confirm({
        message: "고친 내용을 버릴까요?",
        confirmText: "버리기",
        danger: true,
      }))
    ) {
      return;
    }
    setEditing(false);
  };

  // [저장]: 수정 API 호출 → 성공하면 응답(수정된 과제)으로 화면 갱신
  const onClickSaveHomework = async () => {
    if (saving || saveBlockedReason) {
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
      toast.success("과제를 저장했습니다.");
    } catch (error) {
      toast.error(failText("과제를 저장하지 못했습니다.", error));
    } finally {
      setSaving(false);
    }
  };

  // [삭제]: DEL_YN = 'Y' 로 표시 → 팝업을 닫고, 팝업을 연 강의 화면을 새로고침해 목록에서 빠지게 한다.
  const [deleting, setDeleting] = useState(false);
  const onClickDeleteHomework = async () => {
    if (deleting) {
      return;
    }
    const ok = await confirm({
      title: "과제 삭제",
      message: `${showHomework?.subject ?? ""} 과제를 삭제할까요?`,
      confirmText: "삭제",
      danger: true,
    });
    if (!ok) {
      return;
    }
    setDeleting(true);
    try {
      await deleteHomework(courseId, homeworkId);
      // 창이 바로 닫히므로 성공 토스트는 띄우지 않는다
      if (window.opener && !window.opener.closed) {
        window.opener.location.reload();
      }
      window.close();
    } catch (error) {
      toast.error(failText("과제를 삭제하지 못했습니다.", error));
      setDeleting(false);
    }
  };

  const replyCount = (homeworkReplies ?? []).filter((reply) => reply?.id)
    .length;

  let headerActions = null;
  if (editing) {
    headerActions = (
      <>
        <Button onClick={onClickCancelUpdate} disabled={saving}>
          취소
        </Button>
        <span title={saveBlockedReason || undefined}>
          <Button
            variant="primary"
            loading={saving}
            disabled={Boolean(saveBlockedReason)}
            onClick={onClickSaveHomework}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
        </span>
      </>
    );
  } else if (!isDeadlinePassed) {
    // 제출마감일이 지나면 과제 [수정] · [삭제] 버튼을 보여주지 않는다. (프론트에서만 막음)
    headerActions = (
      <>
        {canUpdateHomework && (
          <Button icon={icons.edit} onClick={onClickUpdateHomeworkContent}>
            수정
          </Button>
        )}
        {canDeleteHomework && (
          <Button
            variant="danger"
            icon={icons.delete}
            loading={deleting}
            onClick={onClickDeleteHomework}
          >
            {deleting ? "삭제 중..." : "삭제"}
          </Button>
        )}
      </>
    );
  }

  let replyFooter = null;
  if (isDeadlinePassed) {
    // 제출마감일이 지나면 댓글 작성 폼 대신 안내 문구를 보여준다. (프론트에서만 막음)
    replyFooter = (
      <div className={styles.footerFill}>
        <Callout tone="warning">과제 마감일이 지났습니다.</Callout>
      </div>
    );
  } else if (canCreateReply) {
    // 댓글 작성: 댓글 등록 권한이 있을 때만 (팝업 권한 조회는 위 useEffect 에서 함)
    replyFooter = (
      <div className={styles.footerFill}>
        <ReplyForm onSuccess={onSuccessAddReply} />
      </div>
    );
  }

  return (
    <div className="popup-page">
      <header className="popup-header">
        <div>
          <h1 className="popup-title">{showHomework?.subject}</h1>
          <div className={`field-hint ${styles.meta}`}>
            제출 마감
            {editing ? (
              <input
                type="date"
                className={`form-control form-control-sm ${styles.dateInput}`}
                aria-label="제출 마감일"
                // 지난 날짜는 달력에서 고를 수 없게
                min={todayText}
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                aria-invalid={endDateError ? true : undefined}
                aria-describedby={endDateError ? endDateErrorId : undefined}
              />
            ) : (
              <>
                <span>{showHomework?.endDate}</span>
                {isDeadlinePassed && <Badge tone="danger">마감</Badge>}
              </>
            )}
          </div>
          {/* 지난 날짜를 고르면 날짜 줄 아래에 빨간 안내 (표준 field-error) */}
          {editing && endDateError && (
            <p id={endDateErrorId} className="field-error">
              {endDateError}
            </p>
          )}
        </div>
        {headerActions && <div className="popup-actions">{headerActions}</div>}
      </header>
      <main className="popup-body">
        <div className="form-stack">
          {/* 미제출 수강생 · 제출자 랜덤 뽑기 */}
          <HomeworkSubmitStatus />
          <div className={`layout-split ${styles.split}`}>
            <Panel title="과제 내용">
              {editing ? (
                <textarea
                  className={`form-control ${styles.content}`}
                  aria-label="과제 내용"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              ) : (
                <p className={styles.content}>{showHomework?.content}</p>
              )}
            </Panel>
            <Panel
              title="제출 (댓글)"
              subtitle={`${replyCount}건`}
              actions={
                <Button
                  size="sm"
                  icon={icons.refresh}
                  aria-label="댓글 새로고침"
                  onClick={onClickRefrashReply}
                />
              }
              footer={replyFooter}
            >
              {replyError ? (
                <StatusBox
                  type="error"
                  size="sm"
                  title="댓글을 불러오지 못했습니다."
                  detail={replyError.message}
                  onRetry={onClickRefrashReply}
                />
              ) : (
                <HomeworkReply
                  onUpdated={onClickRefrashReply}
                  deadlinePassed={isDeadlinePassed}
                />
              )}
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
