import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  changeRole,
  deleteMember,
  getMember,
} from "../../../../api/admin/system/member/memberApi.js";
import { selectUser } from "../../../../store/slices/loginSliceStore.js";
import usePermission from "../../../../hooks/usePermission.js";
import Panel from "../../../common/ui/Panel.jsx";
import Badge from "../../../common/ui/Badge.jsx";
import Button from "../../../common/ui/Button.jsx";
import StatusBox from "../../../common/ui/StatusBox.jsx";
import { useConfirm, useToast } from "../../../common/ui/feedbackContext.js";
import styles from "./MemberDetail.module.css";
import MemberFormModal from "./MemberFormModal.jsx";
import MemberPasswordResetModal from "./MemberPasswordResetModal.jsx";

const orDash = (value) => {
  if (value) {
    return value;
  }
  return "-";
};

export default function MemberDetail({ memberId, roles = [], onChanged }) {
  const [loadError, setLoadError] = useState(null);
  const [member, setMember] = useState(null);
  const [openedModal, setOpenedModal] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const loginUser = useSelector(selectUser);
  const { can } = usePermission();

  const fetchDetail = useCallback(
    (signal) => {
      getMember(memberId, { signal })
        .then((result) => {
          setMember(result);
          setSelectedRoleId(result.baseRole);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            setLoadError(error);
          }
        });
    },
    [memberId],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchDetail(controller.signal);
    return () => controller.abort();
  }, [fetchDetail]);

  if (loadError) {
    return (
      <StatusBox
        type="error"
        title="회원 정보를 불러오지 못했습니다."
        detail={loadError.message}
      />
    );
  }
  if (member === null) {
    return <StatusBox type="loading" />;
  }

  const isSelf = loginUser?.id === member.id;
  // roles 는 내가 지정할 수 있는 역할만 담고 있다 (getAssignableRoles).
  // 회원의 현재 역할이 그 안에 있을 때만 변경 가능 (예: 다른 최고 관리자는 변경 불가)
  const canChangeRole =
    !isSelf &&
    can("MEMBER_CHANGE_ROLE") &&
    roles.some((role) => role.roleId === member.baseRole);

  const canUpdate = !isSelf && can("MEMBER_UPDATE");
  const canResetPassword = !isSelf && can("MEMBER_RESET_PASSWORD");
  const canDelete = !isSelf && can("MEMBER_DELETE");
  const hasActionButtons = canUpdate || canResetPassword || canDelete;

  // 삭제 핸들러
  const onClickDeleteHandler = async () => {
    if (submitting) {
      return;
    }

    const ok = await confirm({
      title: "회원 삭제",
      message: `'${member.name}(${member.id})' 회원을 삭제할까요?`,
      confirmText: "삭제",
      danger: true,
    });
    if (!ok) {
      return;
    }

    setSubmitting(true);
    try {
      await deleteMember(member.id);
      toast.success("회원 삭제가 완료되었습니다.");
      if (onChanged) {
        onChanged();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 역할 변경 핸들러
  const onClickChangeRoleHandler = async () => {
    if (submitting) {
      return;
    }
    if (selectedRoleId === member.baseRole) {
      return;
    }
    const nextRole = roles.find((role) => role.roleId === selectedRoleId);
    const ok = await confirm({
      title: "역할 변경",
      message: `${member.name}(${member.id}) 회원의 역할을 '${nextRole?.roleDisplayName}'(으)로 변경할까요?`,
      confirmText: "변경",
    });
    if (!ok) {
      return;
    }

    setSubmitting(true);
    try {
      const updated = await changeRole(member.id, selectedRoleId);
      toast.success("역할 변경이 완료되었습니다.");
      setMember(updated);
      setSelectedRoleId(updated.baseRole);
      if (onChanged) {
        onChanged();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  let statusBadge = <Badge tone="success">정상</Badge>;
  if (member.loginBlockDate) {
    statusBadge = <Badge tone="danger">계정 잠김</Badge>;
  }

  // 삭제는 btn-start 로 왼쪽에 따로 (실수로 누르지 않게)
  let footer = null;
  if (hasActionButtons) {
    footer = (
      <>
        {canDelete && (
          <Button
            variant="danger"
            className="btn-start"
            onClick={onClickDeleteHandler}
            disabled={submitting}
          >
            회원 삭제
          </Button>
        )}
        {canResetPassword && (
          <Button
            onClick={() => setOpenedModal("password")}
            disabled={submitting}
          >
            비밀번호 초기화
          </Button>
        )}
        {canUpdate && (
          <Button onClick={() => setOpenedModal("edit")} disabled={submitting}>
            정보 수정
          </Button>
        )}
      </>
    );
  }

  return (
    <>
      <Panel title={member.name} badge={statusBadge} footer={footer} flush>
        <dl className={`desc-list ${styles.detail}`}>
          <dt>아이디</dt>
          <dd>{member.id}</dd>
          <dt>역할</dt>
          <dd>
            {canChangeRole && (
              <div className={styles.roleRow}>
                <select
                  className="form-control form-control-sm"
                  aria-label="바꿀 역할"
                  value={selectedRoleId}
                  onChange={(event) => setSelectedRoleId(event.target.value)}
                  disabled={submitting}
                >
                  {roles.map((role) => (
                    <option key={role.roleId} value={role.roleId}>
                      {role.roleDisplayName}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={onClickChangeRoleHandler}
                  disabled={submitting || selectedRoleId === member.baseRole}
                >
                  역할 변경
                </Button>
              </div>
            )}
            {!canChangeRole && member.roleName}
          </dd>

          <dt>GitHub</dt>
          <dd>
            {member.githubUrl && (
              <a
                className={styles.link}
                href={member.githubUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                {member.githubUrl}
              </a>
            )}
            {!member.githubUrl && "-"}
          </dd>

          <dt>등록일</dt>
          <dd>{member.createDate}</dd>

          <dt>수정일</dt>
          <dd>{orDash(member.modifyDate)}</dd>

          <dt>비밀번호 변경일</dt>
          <dd>{orDash(member.pwdChangeDate)}</dd>

          <dt>로그인 실패</dt>
          <dd>{member.loginFailCount}회</dd>

          <dt>잠금 시각</dt>
          <dd>{orDash(member.loginBlockDate)}</dd>
        </dl>
      </Panel>

      {openedModal === "edit" && (
        <MemberFormModal
          member={member}
          onClose={() => setOpenedModal(null)}
          onCompleted={(updated) => {
            setMember(updated);
            setOpenedModal(null);
            if (onChanged) {
              onChanged();
            }
          }}
        />
      )}

      {openedModal === "password" && (
        <MemberPasswordResetModal
          member={member}
          onClose={() => setOpenedModal(null)}
          onCompleted={() => {
            setOpenedModal(null);
            fetchDetail();
            if (onChanged) {
              onChanged();
            }
          }}
        />
      )}
    </>
  );
}
