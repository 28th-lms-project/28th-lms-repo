import { useCallback, useEffect, useMemo, useState } from "react";

import PageHeader from "../../../common/ui/PageHeader";
import StatusBox from "../../../common/ui/StatusBox";
import Panel from "../../../common/ui/Panel";
import Field from "../../../common/ui/Field";
import Table from "../../../common/ui/Table";
import Callout from "../../../common/ui/Callout";
import Button from "../../../common/ui/Button";
import { useConfirm, useToast } from "../../../common/ui/feedbackContext";
import { icons } from "../../../common/input/icons";
import usePermission from "../../../../hooks/usePermission";
import useBreadcrumbs from "../../../../hooks/useBreadcrumbs";

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

// roleIdSuffix: "ROLE_" 뒤의 값 (요청 시 접두어를 붙임)
const INITIAL_NEW_ROLE = { roleIdSuffix: "", roleDisplayName: "" };

// 한글 입력(IME) 조합 중 Enter는 무시
const isEnterKey = (event) => event.key === "Enter" && !event.nativeEvent.isComposing;

/**
 * 권한 관리 화면. 내 권한에 따라 표시 여부를 정한다 (실제 차단은 서버가 함).
 * 표준: frontend/docs/ui-style-guide.md 6장 "화면별 표준 대응" › Role (부품)
 *
 * - 권한 조회 중 · 실패 · ROLE_READ 없음: StatusBox
 * - ROLE_READ 있음: 목록 표시. 등록 · 수정 · 삭제 · 순서 변경은 SUPER_ADMIN만
 */
export default function Role() {
  const { can, isSuperAdmin, status } = usePermission();
  const crumbs = useBreadcrumbs();

  // idle: 비로그인(조회하지 않음) → 표시 없음
  let content = null;
  if (status === "loading") {
    content = <StatusBox type="loading" title="권한 확인 중..." />;
  } else if (status === "failed") {
    content = (
      <StatusBox
        type="error"
        title="권한 정보를 불러오지 못했습니다."
        detail="새로고침 후 다시 시도해 주세요."
      />
    );
  } else if (status === "loaded") {
    content = can("ROLE_READ") ? (
      <RoleManagement
        isSuperAdmin={isSuperAdmin}
        canReadUsers={can("ROLE_USER_READ")}
        canMoveUsers={can("ROLE_USER_MOVE")}
      />
    ) : (
      <StatusBox type="denied" />
    );
  }

  return (
    <>
      <PageHeader
        crumbs={crumbs}
        title={crumbs.at(-1)?.title ?? "권한 관리"}
        // 순서의 의미 (RoleAssignPolicy: 자기보다 아래 순위 역할의 회원만 변경 가능)
        description="순위가 높은 역할의 관리자만 더 낮은 순위 역할의 회원을 변경할 수 있습니다."
      />
      {content}
    </>
  );
}

/**
 * 역할 목록 · 등록 · 이름 변경 · 순서 변경 · 삭제
 * ROLE_READ가 있을 때만 마운트되므로, 권한 없이 목록 API를 호출하지 않는다.
 */
function RoleManagement({ isSuperAdmin, canReadUsers, canMoveUsers }) {
  const toast = useToast();
  const confirm = useConfirm();

  // 서버 목록 / 화면 순서 (손잡이로 바뀜)
  const [roles, setRoles] = useState([]);
  const [orderedRoles, setOrderedRoles] = useState([]);

  // 첫 조회 상태 ("loading" | "loaded" | "failed")와 실패 메시지
  const [listStatus, setListStatus] = useState("loading");
  const [listError, setListError] = useState("");

  // 등록 폼
  const [newRole, setNewRole] = useState(INITIAL_NEW_ROLE);
  const [createErrors, setCreateErrors] = useState(EMPTY_CREATE_ERRORS);

  // 이름 수정
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editingName, setEditingName] = useState("");

  // 회원 이동 모달 대상 역할 (null이면 닫힘)
  const [moveTarget, setMoveTarget] = useState(null);

  const [loading, setLoading] = useState(false);

  const isOrderChanged = useMemo(
    () =>
      orderedRoles.length !== roles.length ||
      orderedRoles.some((role, index) => role.roleId !== roles[index].roleId),
    [orderedRoles, roles],
  );

  const applyRoleList = useCallback((roleList) => {
    setRoles(roleList);
    setOrderedRoles(roleList);
    setListStatus("loaded");
    setListError("");
  }, []);

  // 첫 조회 · 다시 시도 실패
  const failRoleList = useCallback((error) => {
    if (isAbortError(error)) return;
    setListStatus("failed");
    setListError(getErrorMessage(error));
  }, []);

  // 등록 · 삭제 등 이후의 재조회 (화면 순서도 서버 목록으로 초기화). 실패하면 기존 목록 유지
  const loadRoles = useCallback(async () => {
    try {
      const { roleList } = await getRoles();
      applyRoleList(roleList ?? []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [applyRoleList, toast]);

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
  const confirmDiscardOrder = async () =>
    !isOrderChanged ||
    confirm({ message: "저장하지 않은 순서 변경이 사라집니다. 계속할까요?", confirmText: "계속" });

  // ───────── 등록 ─────────

  // 입력칸을 고치면 그 칸의 검증 메시지를 지움 (다음 [등록] 때 다시 검사)
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

    if (!(await confirmDiscardOrder())) return;

    setLoading(true);
    try {
      await createRole({
        roleId: `${ROLE_ID_PREFIX}${newRole.roleIdSuffix}`,
        roleDisplayName: newRole.roleDisplayName.trim(),
      });

      setNewRole(INITIAL_NEW_ROLE);
      // 새 역할은 MENU_ROLE · ROLE_ACTION이 비어 있어 대시보드만 볼 수 있다 (메뉴 설계 8장)
      toast.success(
        "역할을 등록했습니다.\n새 역할은 메뉴와 권한이 비어 있습니다. 메뉴 관리와 권한별 접근 권한 관리에서 허용해 주세요.",
        { duration: 6000 },
      );
      await loadRoles();
    } catch (error) {
      if (error.errorCode === "GLOBAL_INVALID_PARAMETER" && error.validations) {
        setCreateErrors({ ...EMPTY_CREATE_ERRORS, ...error.validations });
      } else if (error.errorCode === "ROLE_ID_USED") {
        setCreateErrors({ ...EMPTY_CREATE_ERRORS, roleId: [error.message] });
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKeyDown = (event) => {
    if (isEnterKey(event)) handleCreate();
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

    if (!(await confirmDiscardOrder())) return;

    setLoading(true);
    try {
      await modifyRole(role.roleId, name);
      cancelEdit();
      await loadRoles();
    } catch (error) {
      if (error.errorCode === "ROLE_NOT_EXISTS") {
        toast.error("이미 삭제된 역할입니다.");
        cancelEdit();
        await loadRoles();
      } else {
        toast.error(getErrorMessage(error));
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

  // ───────── 순서 변경 (손잡이 끌기 · ↑ ↓ 키, [순서 저장]으로 한 번에) ─────────

  // 이름을 수정하는 동안에는 손잡이를 숨긴다 (수정 중인 행만 막으면 보호 역할의 "고정"과 헷갈림)
  const canReorder = isSuperAdmin && !loading && editingRoleId === null;

  const handleReorder = (fromIndex, toIndex) => {
    setOrderedRoles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleSaveOrder = async () => {
    setLoading(true);
    try {
      const { roleList } = await modifyRoleOrder(orderedRoles.map((role) => role.roleId));
      applyRoleList(roleList ?? []);
      toast.success("순서를 저장했습니다.");
    } catch (error) {
      if (error.errorCode === "ROLE_ORDER_OUTDATED") {
        toast.error("다른 사용자가 역할을 변경했습니다. 목록을 다시 불러옵니다.");
        await loadRoles();
      } else if (error.errorCode === "ROLE_ORDER_INVALID") {
        toast.error(error.message);
        setOrderedRoles(roles);
      } else {
        toast.error(getErrorMessage(error));
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
    const ok = await confirm({
      title: "역할 삭제",
      message: `${formatRole(role)} 역할을 삭제할까요?`,
      confirmText: "삭제",
      danger: true,
    });
    if (!ok) return;
    if (!(await confirmDiscardOrder())) return;

    setLoading(true);
    try {
      await deleteRole(role.roleId);
      toast.success("역할을 삭제했습니다.");
      await loadRoles();
    } catch (error) {
      if (error.errorCode === "ROLE_IN_USE") {
        setMoveTarget(role);
      } else {
        toast.error(getErrorMessage(error));
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

  const columns = [
    {
      key: "rank",
      title: "순위",
      width: "64px",
      align: "num",
      render: (_, index) => index + 1,
    },
    { key: "roleId", title: "역할 ID", width: "30%", mono: true },
    {
      key: "roleDisplayName",
      title: "역할 이름",
      render: (role) =>
        role.roleId === editingRoleId ? (
          <input
            type="text"
            className="cell-input"
            aria-label={`${role.roleId} 역할 이름`}
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={(e) => handleEditKeyDown(e, role)}
            disabled={loading}
            autoFocus
          />
        ) : (
          role.roleDisplayName
        ),
    },
    // 관리 칸은 SUPER_ADMIN에게만
    ...(isSuperAdmin
      ? [
          {
            key: "actions",
            // 머리글은 비워 두고, 스크린 리더에만 칸 이름을 읽힘
            title: <span className="visually-hidden">작업</span>,
            width: "170px",
            align: "actions",
            render: (role) =>
              role.roleId === editingRoleId ? (
                <div className="btn-group btn-group-end">
                  <Button size="sm" disabled={loading} onClick={cancelEdit}>
                    취소
                  </Button>
                  <Button size="sm" variant="primary" disabled={loading} onClick={() => saveEdit(role)}>
                    저장
                  </Button>
                </div>
              ) : (
                <div className="btn-group btn-group-end">
                  <Button
                    size="sm"
                    icon={icons.edit}
                    disabled={loading || editingRoleId !== null}
                    onClick={() => startEdit(role)}
                  >
                    수정
                  </Button>
                  {!isProtectedRole(role.roleId) && (
                    <Button
                      size="sm"
                      variant="danger"
                      icon={icons.delete}
                      disabled={loading || editingRoleId !== null}
                      onClick={() => handleDelete(role)}
                    >
                      삭제
                    </Button>
                  )}
                </div>
              ),
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="form-stack">
        {/* 등록 폼 (SUPER_ADMIN 전용) */}
        {isSuperAdmin && (
          <Panel title="역할 등록">
            <div className="form-row">
              <Field
                label="역할 ID"
                htmlFor="newRoleId"
                required
                error={createErrors.roleId?.join("\n")}
              >
                <div className="input-group">
                  {/* 접두어를 눌러도 입력 칸에 포커스 */}
                  <label className="input-group-text" htmlFor="newRoleId">
                    {ROLE_ID_PREFIX}
                  </label>
                  <input
                    id="newRoleId"
                    type="text"
                    className="form-control form-control-mono"
                    placeholder="TUTOR"
                    value={newRole.roleIdSuffix}
                    onChange={(e) => changeNewRoleId(e.target.value)}
                    onKeyDown={handleCreateKeyDown}
                    disabled={loading}
                    autoComplete="off"
                    aria-invalid={createErrors.roleId?.length > 0}
                    aria-describedby="newRoleId-msg"
                  />
                </div>
              </Field>

              <Field
                label="역할 이름"
                htmlFor="newRoleName"
                required
                error={createErrors.roleDisplayName?.join("\n")}
              >
                <input
                  id="newRoleName"
                  type="text"
                  className="form-control"
                  placeholder="역할 이름을 입력하세요"
                  value={newRole.roleDisplayName}
                  onChange={(e) => changeNewRoleName(e.target.value)}
                  onKeyDown={handleCreateKeyDown}
                  disabled={loading}
                />
              </Field>

              <Button variant="primary" disabled={loading} onClick={handleCreate}>
                등록
              </Button>
            </div>
          </Panel>
        )}

        {/* 순서 변경 시에만 표시 (SUPER_ADMIN 전용) */}
        {isSuperAdmin && isOrderChanged && (
          <Callout
            tone="info"
            actions={
              <>
                <Button size="sm" disabled={loading} onClick={handleResetOrder}>
                  되돌리기
                </Button>
                <Button size="sm" variant="primary" loading={loading} onClick={handleSaveOrder}>
                  {loading ? "저장 중..." : "순서 저장"}
                </Button>
              </>
            }
          >
            순서가 변경되었습니다.
          </Callout>
        )}

        {/* 역할 목록 */}
        {listStatus === "failed" ? (
          <StatusBox
            type="error"
            title="목록을 불러오지 못했습니다."
            detail={listError}
            onRetry={retryLoadRoles}
          />
        ) : (
          <Table
            ariaLabel="역할 목록"
            columns={columns}
            rows={orderedRoles}
            rowKey="roleId"
            loading={listStatus === "loading"}
            emptyText="역할이 없습니다."
            onReorder={canReorder ? handleReorder : undefined}
            isRowLocked={(role) => isProtectedRole(role.roleId)}
            isRowMuted={(role) => isProtectedRole(role.roleId)}
          />
        )}
      </div>

      {moveTarget && (
        <RoleUserMoveModal
          role={moveTarget}
          roles={roles}
          onClose={() => setMoveTarget(null)}
          canReadUsers={canReadUsers}
          canMoveUsers={canMoveUsers}
          onCompleted={handleMoveCompleted}
        />
      )}
    </>
  );
}
