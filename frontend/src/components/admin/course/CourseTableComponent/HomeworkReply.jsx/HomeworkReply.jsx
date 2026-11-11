import { Fragment, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { selectUser } from "../../../../../store/slices/loginSliceStore";
import {
  deleteHomeworkReply,
  updateHomeworkReply,
} from "../../../../../api/admin/course/courseApi";
import { decodeToken, getToken } from "../../../../../utils/tokenStorage";
import { IconButton } from "../../../../sample/input/IconButton";

/** 다른 사람 댓글도 삭제할 수 있는 역할 */
const REPLY_MANAGER_ROLES = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_TUTOR"];

/** http:// 또는 https:// 로 시작하는 주소 (공백 전까지) */
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

/**
 * 댓글 내용 속 URL을 클릭 가능한 링크로 바꾼다.
 * - http/https 주소만 링크로 만들어 javascript: 같은 주소는 링크가 되지 않는다.
 * - 링크를 눌러도 댓글이 접히지 않도록 클릭 이벤트 전파를 막는다.
 */
const linkify = (text) =>
  text.split(URL_PATTERN).map((part, index) =>
    // split 에 캡처 그룹을 쓰면 홀수 번째 요소가 URL
    index % 2 === 1 ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{ color: "#1a73e8", wordBreak: "break-all" }}
      >
        {part}
      </a>
    ) : (
      part
    ),
  );

/**
 * 과제 댓글 목록
 * @param {Function} onUpdated 댓글 수정 성공 시 호출 (목록 새로고침)
 * @param {boolean} deadlinePassed 제출마감일이 지났으면 true → [수정] 버튼 숨김
 */
export default function HomeworkReply({
  onUpdated = () => {},
  deadlinePassed = false,
}) {
  const { homeworkReplies } = useSelector((store) => store.courses);
  // 로그인 사용자 ID (토큰의 sub). 본인 댓글에만 [수정] 버튼을 보여준다.
  const loginUserId = useSelector(selectUser)?.id;
  const { courseId, homeworkId } = useParams();
  const [openId, setOpenId] = useState(null);

  // 수정 중인 댓글
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const onClickReply = (id) => {
    // 수정 중에는 댓글이 접히지 않게 한다.
    if (editId) {
      return;
    }
    setOpenId((prev) => (prev === id ? null : id));
  };

  const onClickEditReply = (reply) => {
    setEditId(reply.id);
    setEditContent(reply.content ?? "");
  };

  const onClickCancelEdit = () => {
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

  // [삭제]: DEL_YN = 'Y' 로 표시 → 목록 새로고침
  const [deletingId, setDeletingId] = useState(null);
  const onClickDeleteReply = async (replyId) => {
    if (deletingId || !window.confirm("댓글을 삭제하시겠습니까?")) {
      return;
    }
    setDeletingId(replyId);
    try {
      await deleteHomeworkReply(courseId, homeworkId, replyId);
      setOpenId(null);
      onUpdated();
    } catch (error) {
      alert(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const onClickSaveReply = async () => {
    if (saving) {
      return;
    }
    if (!editContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      await updateHomeworkReply(courseId, homeworkId, editId, {
        content: editContent,
      });
      setEditId(null);
      onUpdated();
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

  return (
    <Fragment>
      <div>
        {homeworkReplies &&
          homeworkReplies
            // id 가 없는 항목(빈 댓글)은 그리지 않는다.
            .filter((homework) => homework?.id)
            .map((homework) => {
              return (
                <div
                  key={homework.id}
                  style={{ fontSize: "12px", width: "100%", cursor: "pointer" }}
                  onClick={() => onClickReply(homework.id)}
                >
                  {homework.writer?.name}
                  <div
                    style={{
                      fontSize: "10px",
                      borderBottom: "0.1px solid #333 ",
                    }}
                  >
                    <div>등록일 : {homework.crtDt}</div>
                    <div>수정일 : {homework.mdfyDt}</div>
                    {openId === homework.id &&
                      (editId === homework.id ? (
                        // 수정 모드: 클릭해도 댓글이 접히지 않도록 이벤트 전파를 막는다.
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: "default", padding: "3px 0" }}
                        >
                          <textarea
                            rows={3}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            style={{
                              width: "100%",
                              resize: "none",
                              fontSize: "12px",
                              padding: "5px",
                              boxSizing: "border-box",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "5px",
                            }}
                          >
                            <IconButton
                              onClick={onClickSaveReply}
                              disabled={saving}
                            >
                              {saving ? "저장 중..." : "저장"}
                            </IconButton>
                            <IconButton
                              onClick={onClickCancelEdit}
                              disabled={saving}
                            >
                              취소
                            </IconButton>
                          </div>
                        </div>
                      ) : (
                        <>
                          {homework.content && (
                            <div
                              style={{
                                fontSize: "10px",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {linkify(homework.content)}
                            </div>
                          )}
                          {/* 제출마감일 전까지만 버튼을 보여준다.
                              [수정]: 작성자 본인만 / [삭제]: 작성자 본인 + 관리자 · 강사 */}
                          {!deadlinePassed &&
                            (isWriter(homework) || canDeleteOthers) && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: "5px",
                                  padding: "3px 0",
                                }}
                              >
                                {isWriter(homework) && (
                                  <IconButton
                                    onClick={() => onClickEditReply(homework)}
                                  >
                                    수정
                                  </IconButton>
                                )}
                                <IconButton
                                  onClick={() => onClickDeleteReply(homework.id)}
                                  disabled={deletingId === homework.id}
                                >
                                  {deletingId === homework.id
                                    ? "삭제 중..."
                                    : "삭제"}
                                </IconButton>
                              </div>
                            )}
                        </>
                      ))}
                  </div>
                </div>
              );
            })}
      </div>
    </Fragment>
  );
}
