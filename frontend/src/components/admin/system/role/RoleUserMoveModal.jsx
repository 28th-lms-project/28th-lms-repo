import { useEffect, useId, useState } from "react";

import Modal from "../../../common/ui/Modal";
import Field from "../../../common/ui/Field";
import SelectBox from "../../../common/ui/SelectBox";
import Callout from "../../../common/ui/Callout";
import StatusBox from "../../../common/ui/StatusBox";
import Button from "../../../common/ui/Button";
import { useToast } from "../../../common/ui/feedbackContext";

import { deleteRole, getRoleUsers, moveRoleUsers } from "../../../../api/admin/system/role/roleApi";

import {
  formatRole,
  getErrorMessage,
  isAbortError,
  STUDENT_ROLE_ID,
  SUPER_ADMIN_ROLE_ID,
} from "./roleUtils";

/**
 * 역할 사용 회원 이동 모달
 * 삭제하려는 역할(role)을 사용 중인 회원을 다른 역할로 옮긴 뒤 역할을 삭제합니다.
 * 표준: frontend/docs/ui-style-guide.md 6장 "화면별 표준 대응" › RoleUserMoveModal (Modal + list-boxed + SelectBox + Callout)
 *
 * @param {{ roleId: string, roleDisplayName: string }} role 삭제할 역할
 * @param {{ roleId: string, roleDisplayName: string }[]} roles 전체 역할 (이동 대상 선택지)
 * @param {boolean} canReadUsers 회원 목록 표시 권한 (ROLE_USER_READ)
 * @param {boolean} canMoveUsers [이동 후 삭제] 표시 권한 (ROLE_USER_MOVE)
 * @param {() => void} onClose 취소
 * @param {() => void} onCompleted 이동 · 삭제 처리 후 (모달 닫기 + 목록 재조회)
 */
export default function RoleUserMoveModal({
  role,
  roles,
  canReadUsers,
  canMoveUsers,
  onClose,
  onCompleted,
}) {
  const toast = useToast();
  const selectId = useId();

  // null: 조회 중
  const [users, setUsers] = useState(null);
  const [usersError, setUsersError] = useState(false);
  const [replaceRoleId, setReplaceRoleId] = useState(STUDENT_ROLE_ID);
  const [loading, setLoading] = useState(false);

  // 이동 대상: 삭제할 역할 자신과 SUPER_ADMIN 제외
  const targetOptions = roles
    .filter((item) => item.roleId !== role.roleId && item.roleId !== SUPER_ADMIN_ROLE_ID)
    .map((item) => ({ value: item.roleId, label: `${item.roleId} (${item.roleDisplayName})` }));

  useEffect(() => {
    // 회원 목록 권한이 없으면 조회하지 않음 (목록 없이 이동만 가능)
    if (!canReadUsers) return;

    const controller = new AbortController();

    // 회원이 0명이면(그 사이 다른 사용자가 처리함) 바로 삭제 재시도
    const deleteOnly = async () => {
      setLoading(true);
      try {
        await deleteRole(role.roleId);
        toast.success("역할을 삭제했습니다.");
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
      onCompleted();
    };

    getRoleUsers(role.roleId, { signal: controller.signal })
      .then((userList) => {
        if (!userList || userList.length === 0) {
          deleteOnly();
          return;
        }
        setUsers(userList);
      })
      .catch((error) => {
        if (isAbortError(error)) return;

        if (error.errorCode === "ROLE_NOT_EXISTS") {
          toast.error("이미 삭제된 역할입니다.");
          onCompleted();
          return;
        }

        // 목록을 못 불러와도 이동은 할 수 있도록 모달 유지
        toast.error(getErrorMessage(error));
        setUsers([]);
        setUsersError(true);
      });

    return () => controller.abort();
    // 모달은 열릴 때 한 번만 조회 (role이 바뀌면 새로 마운트됨)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.roleId, canReadUsers]);

  const handleMoveAndDelete = async () => {
    setLoading(true);

    let movedCount;
    try {
      ({ movedCount } = await moveRoleUsers(role.roleId, replaceRoleId));
    } catch (error) {
      // 이동 실패: 모달 유지
      toast.error(getErrorMessage(error));
      setLoading(false);
      return;
    }

    const targetName =
      roles.find((item) => item.roleId === replaceRoleId)?.roleDisplayName ?? replaceRoleId;

    try {
      await deleteRole(role.roleId);
      toast.success(`${movedCount}명을 ${targetName} 역할로 이동하고 역할을 삭제했습니다.`);
    } catch (error) {
      if (error.errorCode === "ROLE_IN_USE") {
        // 요청한 본인이 이 역할인 경우 (본인은 이동되지 않음)
        toast.error(
          `${movedCount}명을 ${targetName} 역할로 이동했습니다.\n본인의 역할은 변경할 수 없어 삭제하지 못했습니다.`,
        );
      } else {
        toast.error(
          `${movedCount}명을 ${targetName} 역할로 이동했지만 역할을 삭제하지 못했습니다.\n${getErrorMessage(error)}`,
        );
      }
    }

    onCompleted();
  };

  let usersContent;
  if (!canReadUsers) {
    usersContent = <p>{formatRole(role)} 역할을 사용 중인 회원이 있습니다.</p>;
  } else if (users === null) {
    usersContent = <StatusBox type="loading" size="sm" title="회원 목록을 불러오는 중..." />;
  } else if (usersError) {
    usersContent = (
      <StatusBox
        type="error"
        size="sm"
        title={`${formatRole(role)} 역할을 사용 중인 회원 목록을 불러오지 못했습니다.`}
      />
    );
  } else {
    usersContent = (
      <div>
        <p className="field-hint">
          {formatRole(role)} 역할을 사용 중인 회원 {users.length}명
        </p>
        <ul className="list-boxed" style={{ "--list-max-height": "160px" }}>
          {users.map((user) => (
            <li key={user.id}>
              {user.id} ({user.name})
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="역할 사용 회원 이동"
      size="md"
      dismissible={!loading}
      footer={
        <>
          <Button disabled={loading} onClick={onClose}>
            취소
          </Button>
          {canMoveUsers && (
            <Button
              variant="danger-solid"
              loading={loading}
              disabled={(canReadUsers && users === null) || !replaceRoleId}
              onClick={handleMoveAndDelete}
            >
              {loading ? "이동 중..." : "이동 후 삭제"}
            </Button>
          )}
        </>
      }
    >
      <div className="form-stack">
        {usersContent}

        <Field label="이동할 역할" htmlFor={selectId}>
          <SelectBox
            inputId={selectId}
            options={targetOptions}
            value={targetOptions.find((option) => option.value === replaceRoleId) ?? null}
            onChange={(option) => setReplaceRoleId(option?.value ?? "")}
            isDisabled={loading}
            placeholder="역할을 고르세요."
          />
        </Field>

        <Callout tone="warning">회원을 이동한 뒤 역할을 삭제합니다.</Callout>
      </div>
    </Modal>
  );
}
