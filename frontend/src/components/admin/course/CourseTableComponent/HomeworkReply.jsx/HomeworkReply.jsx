import { useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { selectUser } from "../../../../../store/slices/loginSliceStore";
import {
  deleteHomeworkReply,
  updateHomeworkReply,
} from "../../../../../api/admin/course/courseApi";
import { decodeToken, getToken } from "../../../../../utils/tokenStorage";

import Badge from "../../../../common/ui/Badge";
import Button from "../../../../common/ui/Button";
import Comment from "../../../../common/ui/Comment";
import StatusBox from "../../../../common/ui/StatusBox";
import { useConfirm, useToast } from "../../../../common/ui/feedbackContext";
import styles from "./HomeworkReply.module.css";

/** 다른 사람 댓글도 삭제할 수 있는 역할 */
const REPLY_MANAGER_ROLES = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_TUTOR"];

/** http:// 또는 https:// 로 시작하는 주소 (공백 전까지) */
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
/** 주소가 들어 있는지 (g 플래그 없이 검사) */
const HAS_URL = /https?:\/\/[^\s]+/;

/**
 * 댓글 내용 속 URL을 클릭 가능한 링크로 바꾼다.
 * - http/https 주소만 링크로 만들어 javascript: 같은 주소는 링크가 되지 않는다.
 * - 주소가 없으면 글자 그대로 돌려준다 (Comment 가 긴 글을 접을 수 있도록)
 */
const linkify = (text) =>
  HAS_URL.test(text)
    ? text.split(URL_PATTERN).map((part, index) =>
        // split 에 캡처 그룹을 쓰면 홀수 번째 요소가 URL
        index % 2 === 1 ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            {part}
          </a>
        ) : (
          part
        ),
      )
    : text;

/** "2026-11-16 14:20:33" → "2026-11-16 14:20" */
const toTimeText = (value) => (value ? String(value).slice(0, 16) : "");

/** 오류 토스트 문구: 입력값 검증 실패면 필드별 메시지를 함께 보여준다. */
const failText = (prefix, error) => {
  const validationMessages = Object.values(error?.validations ?? {}).flat();
  return validationMessages.length > 0
    ? `${prefix}\n${validationMessages.join("\n")}`
    : `${prefix} ${error?.message ?? ""}`.trim();
};

/**
 * 과제 댓글 목록
 * @param {Function} onUpdated 댓글 수정 · 삭제 성공 시 호출 (목록 새로고침)
 * @param {boolean} deadlinePassed 제출마감일이 지났으면 true → [수정] · [삭제] 버튼 숨김
 */
export default function HomeworkReply({
  onUpdated = () => {},
  deadlinePassed = false,
}) {
  const { homeworkReplies } = useSelector((store) => store.courses);
  // 로그인 사용자 ID (토큰의 sub). 본인 댓글에만 [수정] 버튼을 보여준다.
  const loginUserId = useSelector(selectUser)?.id;
  const { courseId, homeworkId } = useParams();
  const toast = useToast();
  const confirm = useConfirm();

  // 수정 중인 댓글
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // id 가 없는 항목(빈 댓글)은 그리지 않는다.
  const replies = (homeworkReplies ?? []).filter((reply) => reply?.id);

  const onClickEditReply = (reply) => {
    setEditId(reply.id);
    setEditContent(reply.content ?? "");
  };

  // [취소]: 고친 것이 있으면 한 번 묻는다
  const onClickCancelEdit = async () => {
    const original = replies.find((reply) => reply.id === editId)?.content;
    if (
      editContent !== (original ?? "") &&
      !(await confirm({
        message: "고친 내용을 버릴까요?",
        confirmText: "버리기",
        danger: true,
      }))
    ) {
      return;
    }
    setEditId(null);
  };

  // 작성자 본인인지
  const isWriter = (reply) =>
    Boolean(loginUserId) && reply.courseStudentId === loginUserId;

  // 관리자 · 강사는 다른 사람 댓글도 삭제할 수 있다. (역할은 토큰의 roles 기준)
  // 강사는 자기 강의 팝업만 열 수 있고, 다른 강의 강사인지는 서버에서 한 번 더 검사한다.
  const tokenRoles = decodeToken(getToken())?.roles ?? [];
  const canDeleteOthers = tokenRoles.some((role) =>
    REPLY_MANAGER_ROLES.includes(role),
  );

  // [삭제]: 확인 → DEL_YN = 'Y' 로 표시 → 목록 새로고침
  const [deletingId, setDeletingId] = useState(null);
  const onClickDeleteReply = async (reply) => {
    if (deletingId) {
      return;
    }
    const ok = await confirm({
      title: "댓글 삭제",
      message: `${reply.writer?.name ?? ""}님의 댓글을 삭제할까요?`,
      confirmText: "삭제",
      danger: true,
    });
    if (!ok) {
      return;
    }
    setDeletingId(reply.id);
    try {
      await deleteHomeworkReply(courseId, homeworkId, reply.id);
      toast.success("댓글을 삭제했습니다.");
      onUpdated();
    } catch (error) {
      toast.error(failText("댓글을 삭제하지 못했습니다.", error));
    } finally {
      setDeletingId(null);
    }
  };

  const onClickSaveReply = async () => {
    if (saving || !editContent.trim()) {
      return;
    }

    setSaving(true);
    try {
      await updateHomeworkReply(courseId, homeworkId, editId, {
        content: editContent,
      });
      setEditId(null);
      toast.success("댓글을 저장했습니다.");
      onUpdated();
    } catch (error) {
      toast.error(failText("댓글을 저장하지 못했습니다.", error));
    } finally {
      setSaving(false);
    }
  };

  if (replies.length === 0) {
    return (
      <StatusBox type="empty" size="sm" title="아직 제출한 댓글이 없습니다." />
    );
  }

  return (
    <ul className="comment-list">
      {replies.map((reply) => {
        const mine = isWriter(reply);
        const edited = Boolean(reply.mdfyDt) && reply.mdfyDt !== reply.crtDt;
        // 제출마감일 전까지만 버튼을 보여준다.
        // [수정]: 작성자 본인만 / [삭제]: 작성자 본인 + 관리자 · 강사
        const canEdit = !deadlinePassed && mine;
        const canDelete = !deadlinePassed && (mine || canDeleteOthers);

        if (editId === reply.id) {
          return (
            <li key={reply.id} className="comment">
              <div className="comment-head">
                <span className="comment-author">{reply.writer?.name}</span>
                <Badge tone="warning">수정 중</Badge>
              </div>
              <textarea
                className="form-control"
                rows={3}
                aria-label="댓글 수정"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div className="comment-actions">
                <Button
                  size="sm"
                  variant="text"
                  onClick={onClickCancelEdit}
                  disabled={saving}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  loading={saving}
                  disabled={!editContent.trim()}
                  onClick={onClickSaveReply}
                >
                  {saving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </li>
          );
        }

        return (
          <Comment
            key={reply.id}
            author={reply.writer?.name}
            badge={mine ? <Badge>내 글</Badge> : undefined}
            time={`${toTimeText(reply.crtDt)}${edited ? " (수정됨)" : ""}`}
            body={linkify(reply.content ?? "")}
            actions={
              (canEdit || canDelete) && (
                <>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="text"
                      onClick={() => onClickEditReply(reply)}
                      disabled={Boolean(editId)}
                    >
                      수정
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="text"
                      loading={deletingId === reply.id}
                      onClick={() => onClickDeleteReply(reply)}
                    >
                      {deletingId === reply.id ? "삭제 중..." : "삭제"}
                    </Button>
                  )}
                </>
              )
            }
          />
        );
      })}
    </ul>
  );
}
