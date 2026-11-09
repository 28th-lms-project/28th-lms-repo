import { useCallback, useEffect, useMemo, useState } from "react";

import PageContainer from "../../../common/PageContainer";
import { IconButton } from "../../../common/input/IconButton";
import { icons } from "../../../common/input/icons";

import {
    createRole,
    deleteRole,
    getRoles,
    modifyRole,
    modifyRoleOrder,
} from "../../../../api/admin/system/role/roleApi";

import RoleUserMoveModal from "./RoleUserMoveModal";
import {
    EMPTY_CREATE_ERRORS,
    formatRole,
    getErrorMessage,
    hasErrors,
    isAbortError,
    isProtectedRole,
    normalizeRoleIdSuffix,
    ROLE_ID_PREFIX,
    validateNewRole,
} from "./roleUtils";

import styles from "./Role.module.css";

// roleIdSuffix: "ROLE_" 뒤의 값 (요청 시 접두어를 붙임)
const INITIAL_NEW_ROLE = { roleIdSuffix: "", roleDisplayName: "" };

// 한글 입력(IME) 조합 중 Enter는 무시
const isEnterKey = (event) => event.key === "Enter" && !event.nativeEvent.isComposing;

export default function Role() {
    // 서버 목록 / 화면 순서 (드래그로 바뀜)
    const [roles, setRoles] = useState([]);
    const [orderedRoles, setOrderedRoles] = useState([]);

    // 첫 조회 상태 ("loading" | "loaded" | "failed")와 실패 메시지
    const [listStatus, setListStatus] = useState("loading");
    const [listError, setListError] = useState("");

    // 생성 폼
    const [newRole, setNewRole] = useState(INITIAL_NEW_ROLE);
    const [createErrors, setCreateErrors] = useState(EMPTY_CREATE_ERRORS);

    // 이름 수정
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [editingName, setEditingName] = useState("");

    // 드래그 중인 역할 / 놓을 위치로 표시할 역할
    const [draggingRoleId, setDraggingRoleId] = useState(null);
    const [dropTargetRoleId, setDropTargetRoleId] = useState(null);

    // 회원 이동 모달 대상 역할 (null이면 닫힘)
    const [moveTarget, setMoveTarget] = useState(null);

    const [loading, setLoading] = useState(false);

    const isOrderChanged = useMemo(
        () =>
            orderedRoles.length !== roles.length ||
            orderedRoles.some((role, index) => role.roleId !== roles[index].roleId),
        [orderedRoles, roles]
    );

    const applyRoleList = useCallback((roleList) => {
        setRoles(roleList);
        setOrderedRoles(roleList);
        setListStatus("loaded");
        setListError("");
    }, []);

    // 조회 실패를 표 안에 표시 (첫 조회 · 다시 시도)
    const failRoleList = useCallback((error) => {
        if (isAbortError(error)) return;
        setListStatus("failed");
        setListError(getErrorMessage(error));
    }, []);

    // 생성 · 삭제 등 이후의 재조회 (화면 순서도 서버 목록으로 초기화). 실패하면 기존 목록 유지
    const loadRoles = useCallback(async () => {
        try {
            const { roleList } = await getRoles();
            applyRoleList(roleList ?? []);
        } catch (error) {
            alert(getErrorMessage(error));
        }
    }, [applyRoleList]);

    // 첫 조회 실패 후 [다시 시도]
    const retryLoadRoles = async () => {
        setListStatus("loading");
        try {
            const { roleList } = await getRoles();
            applyRoleList(roleList ?? []);
        } catch (error) {
            failRoleList(error);
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        getRoles({ signal: controller.signal })
            .then(({ roleList }) => applyRoleList(roleList ?? []))
            .catch(failRoleList);

        return () => controller.abort();
    }, [applyRoleList, failRoleList]);

    // 저장하지 않은 순서 변경이 있으면 버려도 되는지 확인
    const confirmDiscardOrder = () =>
        !isOrderChanged ||
        window.confirm("저장하지 않은 순서 변경이 사라집니다. 계속하시겠습니까?");

    // ───────── 생성 ─────────

    // 입력칸을 고치면 그 칸의 검증 메시지를 지움 (다음 [추가] 때 다시 검사)
    const clearCreateError = (field) => {
        setCreateErrors((prev) => (prev[field]?.length ? { ...prev, [field]: [] } : prev));
    };

    const changeNewRoleId = (value) => {
        setNewRole((prev) => ({ ...prev, roleIdSuffix: normalizeRoleIdSuffix(value) }));
        clearCreateError("roleId");
    };

    const changeNewRoleName = (value) => {
        setNewRole((prev) => ({ ...prev, roleDisplayName: value }));
        clearCreateError("roleDisplayName");
    };

    const handleCreate = async () => {
        const errors = validateNewRole(newRole);
        setCreateErrors(errors);
        if (hasErrors(errors)) return;

        if (!confirmDiscardOrder()) return;

        setLoading(true);
        try {
            await createRole({
                roleId: `${ROLE_ID_PREFIX}${newRole.roleIdSuffix}`,
                roleDisplayName: newRole.roleDisplayName.trim(),
            });

            setNewRole(INITIAL_NEW_ROLE);
            alert("역할이 추가되었습니다.");
            await loadRoles();
        } catch (error) {
            if (error.errorCode === "GLOBAL_INVALID_PARAMETER" && error.validations) {
                setCreateErrors({ ...EMPTY_CREATE_ERRORS, ...error.validations });
            } else if (error.errorCode === "ROLE_ID_USED") {
                setCreateErrors({ ...EMPTY_CREATE_ERRORS, roleId: [error.message] });
            } else {
                alert(getErrorMessage(error));
            }
        } finally {
            setLoading(false);
        }
    };

    // ───────── 이름 변경 ─────────

    const startEdit = (role) => {
        setEditingRoleId(role.roleId);
        setEditingName(role.roleDisplayName);
    };

    const cancelEdit = () => {
        setEditingRoleId(null);
        setEditingName("");
    };

    const saveEdit = async (role) => {
        const name = editingName.trim();

        // 바뀌지 않았으면 요청하지 않음
        if (name === role.roleDisplayName) {
            cancelEdit();
            return;
        }

        if (!confirmDiscardOrder()) return;

        setLoading(true);
        try {
            await modifyRole(role.roleId, name);
            cancelEdit();
            await loadRoles();
        } catch (error) {
            if (error.errorCode === "ROLE_NOT_EXISTS") {
                alert("이미 삭제된 역할입니다.");
                cancelEdit();
                await loadRoles();
            } else {
                alert(getErrorMessage(error));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditKeyDown = (event, role) => {
        if (isEnterKey(event)) {
            event.preventDefault();
            saveEdit(role);
        } else if (event.key === "Escape") {
            cancelEdit();
        }
    };

    // ───────── 순서 변경 (HTML5 Drag and Drop) ─────────

    const isDraggable = (role) =>
        !loading && !isProtectedRole(role.roleId) && role.roleId !== editingRoleId;

    const clearDrag = () => {
        setDraggingRoleId(null);
        setDropTargetRoleId(null);
    };

    const handleDragStart = (event, role) => {
        setDraggingRoleId(role.roleId);
        event.dataTransfer.effectAllowed = "move";
        // Firefox는 setData가 있어야 드래그가 시작됨
        event.dataTransfer.setData("text/plain", role.roleId);
    };

    const handleDragOver = (event, role) => {
        // 보호 역할 행에는 놓을 수 없음 (preventDefault를 호출하지 않으면 drop 안 됨)
        if (!draggingRoleId || isProtectedRole(role.roleId)) {
            if (dropTargetRoleId !== null) setDropTargetRoleId(null);
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        if (dropTargetRoleId !== role.roleId) setDropTargetRoleId(role.roleId);
    };

    const handleDrop = (event, targetRole) => {
        event.preventDefault();

        const fromRoleId = draggingRoleId;
        clearDrag();
        if (!fromRoleId || isProtectedRole(targetRole.roleId)) return;

        setOrderedRoles((prev) => {
            const from = prev.findIndex((role) => role.roleId === fromRoleId);
            const to = prev.findIndex((role) => role.roleId === targetRole.roleId);
            if (from < 0 || to < 0 || from === to) return prev;

            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    };

    // 놓을 위치 표시: 아래로 끌면 대상 행 아래, 위로 끌면 대상 행 위
    const getDropPositionClass = (role, index) => {
        if (role.roleId !== dropTargetRoleId || role.roleId === draggingRoleId) return "";

        const fromIndex = orderedRoles.findIndex((item) => item.roleId === draggingRoleId);
        return fromIndex < index ? styles.dropBelow : styles.dropAbove;
    };

    const handleSaveOrder = async () => {
        setLoading(true);
        try {
            const { roleList } = await modifyRoleOrder(orderedRoles.map((role) => role.roleId));
            applyRoleList(roleList ?? []);
            alert("순서가 저장되었습니다.");
        } catch (error) {
            if (error.errorCode === "ROLE_ORDER_OUTDATED") {
                alert("다른 사용자가 역할을 변경했습니다. 목록을 다시 불러옵니다.");
                await loadRoles();
            } else if (error.errorCode === "ROLE_ORDER_INVALID") {
                alert(error.message);
                setOrderedRoles(roles);
            } else {
                alert(getErrorMessage(error));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetOrder = () => {
        setOrderedRoles(roles);
    };

    // ───────── 삭제 ─────────

    const handleDelete = async (role) => {
        if (!window.confirm(`${formatRole(role)} 역할을 삭제하시겠습니까?`)) return;
        if (!confirmDiscardOrder()) return;

        setLoading(true);
        try {
            await deleteRole(role.roleId);
            alert("역할이 삭제되었습니다.");
            await loadRoles();
        } catch (error) {
            if (error.errorCode === "ROLE_IN_USE") {
                setMoveTarget(role);
            } else {
                alert(getErrorMessage(error));
            }
        } finally {
            setLoading(false);
        }
    };

    // 모달에서 이동 · 삭제를 마친 뒤 (성공 · 일부 실패 모두)
    const handleMoveCompleted = async () => {
        setMoveTarget(null);
        await loadRoles();
    };

    // ───────── 화면 ─────────

    return (
        <PageContainer>
            <div className={styles.rolePage}>
                {/* 생성 폼 */}
                <div className={styles.createForm}>
                    <div className={styles.field}>
                        <label htmlFor="newRoleId" className={styles.label}>
                            역할 ID
                        </label>
                        <div className={styles.prefixInput}>
                            {/* 접두어 클릭 시 입력칸 포커스 */}
                            <label htmlFor="newRoleId" className={styles.prefix}>
                                {ROLE_ID_PREFIX}
                            </label>
                            <input
                                id="newRoleId"
                                type="text"
                                className={styles.input}
                                placeholder="TUTOR"
                                value={newRole.roleIdSuffix}
                                onChange={(e) => changeNewRoleId(e.target.value)}
                                onKeyDown={(e) => isEnterKey(e) && handleCreate()}
                                disabled={loading}
                                autoComplete="off"
                            />
                        </div>
                        {createErrors.roleId?.map((message) => (
                            <p key={message} className={styles.errorMessage}>
                                {message}
                            </p>
                        ))}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="newRoleName" className={styles.label}>
                            역할 이름
                        </label>
                        <input
                            id="newRoleName"
                            type="text"
                            className={styles.input}
                            placeholder="역할 이름을 입력하세요"
                            value={newRole.roleDisplayName}
                            onChange={(e) => changeNewRoleName(e.target.value)}
                            onKeyDown={(e) => isEnterKey(e) && handleCreate()}
                            disabled={loading}
                        />
                        {createErrors.roleDisplayName?.map((message) => (
                            <p key={message} className={styles.errorMessage}>
                                {message}
                            </p>
                        ))}
                    </div>

                    <div className={styles.createButton}>
                        <IconButton icon={icons.add} iconSize={16} disabled={loading} onClick={handleCreate}>
                            추가
                        </IconButton>
                    </div>
                </div>

                {/* 순서의 의미 안내 (RoleAssignPolicy: 자기보다 아래 순위 역할의 회원만 변경 가능) */}
                <p className={styles.hint}>
                    순위가 높은 역할의 관리자만 더 낮은 순위 역할의 회원을 변경할 수 있습니다.
                </p>

                {/* 역할 목록 */}
                <div className={styles.tableWrapper}>
                    <table className={styles.roleTable}>
                        <colgroup>
                            <col className={styles.colHandle} />
                            <col className={styles.colRank} />
                            <col className={styles.colId} />
                            <col />
                            <col className={styles.colActions} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th aria-label="이동" />
                                <th>순위</th>
                                <th>역할 ID</th>
                                <th>역할 이름</th>
                                <th aria-label="관리" />
                            </tr>
                        </thead>
                        <tbody>
                            {listStatus === "loading" && (
                                <tr>
                                    <td colSpan={5} className={styles.empty}>
                                        목록을 불러오는 중입니다...
                                    </td>
                                </tr>
                            )}

                            {listStatus === "failed" && (
                                <tr>
                                    <td colSpan={5} className={styles.empty}>
                                        <p className={styles.listErrorTitle}>목록을 불러오지 못했습니다.</p>
                                        {listError && <p className={styles.listErrorMessage}>{listError}</p>}
                                        <IconButton icon={icons.refresh} iconSize={16} onClick={retryLoadRoles}>
                                            다시 시도
                                        </IconButton>
                                    </td>
                                </tr>
                            )}

                            {listStatus === "loaded" && orderedRoles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className={styles.empty}>
                                        역할이 없습니다.
                                    </td>
                                </tr>
                            )}

                            {orderedRoles.map((role, index) => {
                                const isProtected = isProtectedRole(role.roleId);
                                const isEditing = role.roleId === editingRoleId;
                                const draggable = isDraggable(role);

                                const rowClassName = [
                                    styles.row,
                                    isProtected ? styles.protectedRow : "",
                                    draggable ? styles.draggableRow : "",
                                    role.roleId === draggingRoleId ? styles.dragging : "",
                                    getDropPositionClass(role, index),
                                ]
                                    .filter(Boolean)
                                    .join(" ");

                                return (
                                    <tr
                                        key={role.roleId}
                                        className={rowClassName}
                                        draggable={draggable}
                                        onDragStart={(e) => handleDragStart(e, role)}
                                        onDragOver={(e) => handleDragOver(e, role)}
                                        onDrop={(e) => handleDrop(e, role)}
                                        onDragEnd={clearDrag}
                                    >
                                        <td className={styles.handle}>
                                            <span
                                                title={
                                                    isProtected
                                                        ? "순서를 변경할 수 없는 역할입니다."
                                                        : "끌어서 순서를 변경합니다."
                                                }
                                            >
                                                ≡
                                            </span>
                                        </td>
                                        <td className={styles.rank}>{index + 1}</td>
                                        <td className={styles.roleId}>{role.roleId}</td>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className={styles.input}
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onKeyDown={(e) => handleEditKeyDown(e, role)}
                                                    disabled={loading}
                                                    autoFocus
                                                />
                                            ) : (
                                                role.roleDisplayName
                                            )}
                                        </td>
                                        <td className={styles.actions}>
                                            {isEditing ? (
                                                <>
                                                    <IconButton
                                                        icon={icons.ok}
                                                        iconSize={16}
                                                        disabled={loading}
                                                        onClick={() => saveEdit(role)}
                                                    >
                                                        저장
                                                    </IconButton>
                                                    <IconButton
                                                        icon={icons.close}
                                                        iconSize={16}
                                                        disabled={loading}
                                                        onClick={cancelEdit}
                                                    >
                                                        취소
                                                    </IconButton>
                                                </>
                                            ) : (
                                                <>
                                                    <IconButton
                                                        icon={icons.edit}
                                                        iconSize={16}
                                                        disabled={loading}
                                                        onClick={() => startEdit(role)}
                                                    >
                                                        수정
                                                    </IconButton>
                                                    {!isProtected && (
                                                        <IconButton
                                                            icon={icons.delete}
                                                            iconSize={16}
                                                            disabled={loading}
                                                            onClick={() => handleDelete(role)}
                                                        >
                                                            삭제
                                                        </IconButton>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* 순서 변경 시에만 표시 */}
                {isOrderChanged && (
                    <div className={styles.orderBar}>
                        <span>순서가 변경되었습니다.</span>
                        <div className={styles.orderButtons}>
                            <IconButton
                                icon={icons.refresh}
                                iconSize={16}
                                disabled={loading}
                                onClick={handleResetOrder}
                            >
                                순서 되돌리기
                            </IconButton>
                            <IconButton
                                icon={icons.ok}
                                iconSize={16}
                                disabled={loading}
                                onClick={handleSaveOrder}
                            >
                                순서 저장
                            </IconButton>
                        </div>
                    </div>
                )}
            </div>

            {moveTarget && (
                <RoleUserMoveModal
                    role={moveTarget}
                    roles={roles}
                    onClose={() => setMoveTarget(null)}
                    onCompleted={handleMoveCompleted}
                />
            )}
        </PageContainer>
    );
}
