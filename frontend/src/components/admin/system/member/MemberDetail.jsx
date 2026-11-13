import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  changeRole,
  deleteMember,
  getMember,
} from "../../../../api/admin/system/member/memberApi.js";
import { selectUser } from "../../../../store/slices/loginSliceStore.js";
import styles from "./MemberDetail.module.css";
import usePermission from "../../../../hooks/usePermission.js";
import MemberFormModal from "./MemberFormModal.jsx";
import MemberPasswordResetModal from "./MemberPasswordResetModal.jsx";

const orDash = (value) => {
  if (value) {
    return value;
  }
  return "-";
};

export default function MemberDetail({ memberId, roles = [], onChanged }) {
  const [member, setMember] = useState(null);
  const [openedModal, setOpenedModal] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
            alert(error.message);
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

  if (member === null) {
    return null;
  }

  const isSelf = loginUser?.id === member.id;
  const assignableRoles = roles.filter(
    (role) => role.roleId !== "ROLE_SUPER_ADMIN",
  );
  const canChangeRole =
    !isSelf &&
    can("MEMBER_CHANGE_ROLE") &&
    member.baseRole !== "ROLE_SUPER_ADMIN" &&
    assignableRoles.length > 0;

  const canUpdate = !isSelf && can("MEMBER_UPDATE");
  const canResetPassword = !isSelf && can("MEMBER_RESET_PASSWORD");
  const canDelete = !isSelf && can("MEMBER_DELETE");
  const hasActionButtons = canUpdate || canResetPassword || canDelete;

  // 삭제 핸들러
  const onClickDeleteHandler = async () => {
    if (submitting) {
      return;
    }

    if (
      !window.confirm(`'${member.name}(${member.id})' 회원을 정말 삭제하시겠습니까?`)
    ) {
      return;
    }

    setSubmitting(true);
    try {
      await deleteMember(member.id);
      alert("회원이 삭제되었습니다.");
      if (onChanged) {
        onChanged();
      }
    } catch (error) {
      alert(error.message);
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
      alert("현재 역할과 동일합니다.");
      return;
    }
    if (!window.confirm("회원의 역할을 변경하시겠습니까?")) {
      return;
    }

    setSubmitting(true);
    try {
      const updated = await changeRole(member.id, selectedRoleId);
      alert("역할이 변경되었습니다.");
      setMember(updated);
      setSelectedRoleId(updated.baseRole);
      if (onChanged) {
        onChanged();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  let statusBadge = <span className={styles.badgeNormal}>정상</span>;
  if (member.loginBlockDate) {
    statusBadge = <span className={styles.badgeLocked}>계정 잠김</span>;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>회원 상세</h3>
        {statusBadge}
      </div>

      <dl className={styles.detailList}>
        <div>
          <dt>아이디</dt>
          <dd>{member.id}</dd>
        </div>
        <div>
          <dt>이름</dt>
          <dd>{member.name}</dd>
        </div>
        <div>
          <dt>역할</dt>
          <dd>
            {canChangeRole && (
              <div className={styles.roleWrap}>
                <select
                  className={styles.roleSelect}
                  value={selectedRoleId}
                  onChange={(event) => setSelectedRoleId(event.target.value)}
                  disabled={submitting}
                >
                  {assignableRoles.map((role) => (
                    <option key={role.roleId} value={role.roleId}>
                      {role.roleDisplayName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.btnRoleChange}
                  onClick={onClickChangeRoleHandler}
                  disabled={submitting || selectedRoleId === member.baseRole}
                >
                  역할 변경
                </button>
              </div>
            )}
            {!canChangeRole && member.roleName}
          </dd>
        </div>
        <div>
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
        </div>
        <div>
          <dt>등록일</dt>
          <dd>{member.createDate}</dd>
        </div>
        <div>
          <dt>수정일</dt>
          <dd>{orDash(member.modifyDate)}</dd>
        </div>
        <div>
          <dt>비밀번호 변경일</dt>
          <dd>{orDash(member.pwdChangeDate)}</dd>
        </div>
        <div>
          <dt>로그인 실패</dt>
          <dd>{member.loginFailCount}회</dd>
        </div>
        <div>
          <dt>잠금 시각</dt>
          <dd>{orDash(member.loginBlockDate)}</dd>
        </div>
      </dl>

      {hasActionButtons && (
        <div className={styles.buttonGroup}>
          {canUpdate && (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setOpenedModal("edit")}
              disabled={submitting}
            >
              정보 수정
            </button>
          )}
          {canResetPassword && (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setOpenedModal("password")}
              disabled={submitting}
            >
              비밀번호 초기화
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className={styles.btnDanger}
              onClick={onClickDeleteHandler}
              disabled={submitting}
            >
              회원 삭제
            </button>
          )}
        </div>
      )}

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
    </div>
  );
}
