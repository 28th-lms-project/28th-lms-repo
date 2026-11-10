import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { IconButton } from "../../../common/input/IconButton";
import { icons } from "../../../common/input/icons";

import { deleteRole, getRoleUsers, moveRoleUsers } from "../../../../api/admin/system/role/roleApi";

import {
    formatRole,
    getErrorMessage,
    isAbortError,
    STUDENT_ROLE_ID,
    SUPER_ADMIN_ROLE_ID,
} from "./roleUtils";

import styles from "./Role.module.css";

/**
 * 역할 사용 회원 이동 모달
 * 삭제하려는 역할(role)을 사용 중인 회원을 다른 역할로 옮긴 뒤 역할을 삭제합니다.
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
    // null: 조회 중
    const [users, setUsers] = useState(null);
    const [usersError, setUsersError] = useState(false);
    const [replaceRoleId, setReplaceRoleId] = useState(STUDENT_ROLE_ID);
    const [loading, setLoading] = useState(false);

    // 이동 대상: 삭제할 역할 자신과 SUPER_ADMIN 제외
    const targetRoles = roles.filter(
        (item) => item.roleId !== role.roleId && item.roleId !== SUPER_ADMIN_ROLE_ID
    );

    useEffect(() => {
        // 회원 목록 권한이 없으면 조회하지 않음 (목록 없이 이동만 가능)
        if (!canReadUsers) return;

        const controller = new AbortController();

        // 회원이 0명이면(그 사이 다른 사용자가 처리함) 바로 삭제 재시도
        const deleteOnly = async () => {
            setLoading(true);
            try {
                await deleteRole(role.roleId);
                alert("역할이 삭제되었습니다.");
            } catch (error) {
                alert(getErrorMessage(error));
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
                    alert("이미 삭제된 역할입니다.");
                    onCompleted();
                    return;
                }

                // 목록을 못 불러와도 이동은 할 수 있도록 모달 유지
                alert(getErrorMessage(error));
                setUsers([]);
                setUsersError(true);
            });

        return () => controller.abort();
        // 모달은 열릴 때 한 번만 조회 (role이 바뀌면 새로 마운트됨)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role.roleId, canReadUsers]);

    // Esc로 닫기 (요청 중에는 무시)
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape" && !loading) onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [loading, onClose]);

    const handleMoveAndDelete = async () => {
        setLoading(true);

        let movedCount;
        try {
            ({ movedCount } = await moveRoleUsers(role.roleId, replaceRoleId));
        } catch (error) {
            // 이동 실패: 모달 유지
            alert(getErrorMessage(error));
            setLoading(false);
            return;
        }

        const targetName =
            roles.find((item) => item.roleId === replaceRoleId)?.roleDisplayName ?? replaceRoleId;

        try {
            await deleteRole(role.roleId);
            alert(`${movedCount}명을 ${targetName} 역할로 이동하고 역할을 삭제했습니다.`);
        } catch (error) {
            if (error.errorCode === "ROLE_IN_USE") {
                // 요청한 본인이 이 역할인 경우 (본인은 이동되지 않음)
                alert(
                    `${movedCount}명을 ${targetName} 역할로 이동했습니다.\n본인의 역할은 변경할 수 없어 삭제하지 못했습니다.`
                );
            } else {
                alert(
                    `${movedCount}명을 ${targetName} 역할로 이동했지만 역할을 삭제하지 못했습니다.\n${getErrorMessage(error)}`
                );
            }
        }

        onCompleted();
    };

    return createPortal(
        <div
            className={styles.modalOverlay}
            onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
        >
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="roleUserMoveTitle">
                <h3 id="roleUserMoveTitle" className={styles.modalTitle}>
                    역할 사용 회원 이동
                </h3>

                <div className={styles.modalContent}>
                    {!canReadUsers ? (
                        <p>{formatRole(role)} 역할을 사용 중인 회원이 있습니다.</p>
                    ) : users === null ? (
                        <p>회원 목록을 불러오는 중입니다...</p>
                    ) : usersError ? (
                        <p>{formatRole(role)} 역할을 사용 중인 회원 목록을 불러오지 못했습니다.</p>
                    ) : (
                        <>
                            <p>
                                {formatRole(role)} 역할을 사용 중인 회원 {users.length}명
                            </p>
                            <ul className={styles.userList}>
                                {users.map((user) => (
                                    <li key={user.id}>
                                        {user.id} ({user.name})
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    <div className={styles.modalField}>
                        <label htmlFor="replaceRoleId" className={styles.label}>
                            이동할 역할
                        </label>
                        <select
                            id="replaceRoleId"
                            className={styles.select}
                            value={replaceRoleId}
                            onChange={(e) => setReplaceRoleId(e.target.value)}
                            disabled={loading}
                        >
                            {targetRoles.map((item) => (
                                <option key={item.roleId} value={item.roleId}>
                                    {item.roleId} ({item.roleDisplayName})
                                </option>
                            ))}
                        </select>
                    </div>

                    <p className={styles.modalNotice}>회원을 이동한 뒤 역할을 삭제합니다.</p>
                </div>

                <div className={styles.modalButtons}>
                    <IconButton icon={icons.close} iconSize={16} disabled={loading} onClick={onClose}>
                        취소
                    </IconButton>
                    {canMoveUsers && (
                        <IconButton
                            icon={icons.ok}
                            iconSize={16}
                            disabled={loading || (canReadUsers && users === null) || !replaceRoleId}
                            onClick={handleMoveAndDelete}
                        >
                            이동 후 삭제
                        </IconButton>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
