import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useBlocker } from "react-router-dom";

import PageContainer from "../../../common/PageContainer";
import { IconButton } from "../../../common/input/IconButton";
import { icons } from "../../../common/input/icons";
import { Confirm } from "../../../sample/Modal";
import usePermission from "../../../../hooks/usePermission";
import { refreshMyMenus } from "../../../../store/slices/menuSliceStore";
import { routes } from "../../../../router/MainRouterProvider";
import { getMenuUrlOptions } from "../../../../router/routeUtils";

import {
  createMenu,
  deleteMenu,
  getMenus,
  modifyMenu,
  modifyMenuOrder,
  moveMenu,
} from "../../../../api/admin/system/menu/menuApi";

import MenuColumn from "./MenuColumn";
import {
  createNewForm,
  EMPTY_FORM_ERRORS,
  findMenu,
  getChildMenus,
  getErrorMessage,
  getMenuUrlSelectOptions,
  getParentOptions,
  getProtectedMenuIds,
  getSelfAndAncestors,
  hasBottomMenu,
  hasErrors,
  isAbortError,
  isBlockedByAncestors,
  isFieldsDirty,
  isFormDirty,
  isParentChanged,
  LEVELS,
  menuToForm,
  MOVE_TITLE_USED_MESSAGE,
  toFormErrors,
  toMenuRequest,
  validateMenuForm,
  validateMove,
} from "./menuUtils";

import styles from "./Menu.module.css";

const EMPTY_SELECTION = { top: null, mid: null, btm: null };
const EMPTY_FORMS = { top: null, mid: null, btm: null };
const EMPTY_ERRORS = { top: EMPTY_FORM_ERRORS, mid: EMPTY_FORM_ERRORS, btm: EMPTY_FORM_ERRORS };

const UNSAVED_CHANGES_MESSAGE = "저장하지 않은 변경사항이 있습니다. 이동할까요?";
const MOVE_CONFIRM_MESSAGE =
  "메뉴를 옮기면 이 메뉴를 쓰는 접근 권한(ACTION)의 메뉴도 함께 바뀝니다. 옮길까요?";

/**
 * 메뉴 관리 화면. 설계: frontend/docs/design/menu-page-design.md 6장
 *
 * - 권한 조회 중: "권한 확인 중..."
 * - 권한 조회 실패: 안내 문구
 * - MENU_READ 없음: "권한이 없습니다."
 * - MENU_READ 있음: 화면 표시. 추가 MENU_CREATE, 저장 · 순서 변경 MENU_UPDATE, 삭제 MENU_DELETE
 */
export default function Menu() {
  const { can, isSuperAdmin, status } = usePermission();

  // idle: 비로그인(조회하지 않음) → 표시 없음
  let content = null;
  if (status === "loading") {
    content = <p className={styles.notice}>권한 확인 중...</p>;
  } else if (status === "failed") {
    content = (
      <p className={styles.notice}>
        권한 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.
      </p>
    );
  } else if (status === "loaded") {
    content = can("MENU_READ") ? (
      <MenuManagement
        isSuperAdmin={isSuperAdmin}
        canCreate={can("MENU_CREATE")}
        canUpdate={can("MENU_UPDATE")}
        canDelete={can("MENU_DELETE")}
      />
    ) : (
      <p className={styles.notice}>권한이 없습니다.</p>
    );
  }

  return <PageContainer>{content}</PageContainer>;
}

/**
 * 메뉴 목록 · 등록 · 수정 · 순서 변경 · 삭제
 * MENU_READ가 있을 때만 마운트되므로, 권한 없이 목록 API를 호출하지 않는다.
 */
function MenuManagement({ isSuperAdmin, canCreate, canUpdate, canDelete }) {
  const dispatch = useDispatch();

  // 첫 조회 상태 ("loading" | "loaded" | "failed")와 실패 메시지
  const [listStatus, setListStatus] = useState("loading");
  const [listError, setListError] = useState("");

  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);

  // 열별 선택 메뉴 ID / 상세 입력값 / 입력 오류
  const [selectedIds, setSelectedIds] = useState(EMPTY_SELECTION);
  const [forms, setForms] = useState(EMPTY_FORMS);
  const [formErrors, setFormErrors] = useState(EMPTY_ERRORS);

  // 저장 · 삭제 · 순서 변경 진행 중 (버튼 비활성)
  const [saving, setSaving] = useState(false);

  // 드래그 중인 메뉴 { level, id } / 놓을 위치로 표시할 메뉴 ID
  const [dragging, setDragging] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  // 확인 창 (삭제 · 저장하지 않은 변경)
  const confirmRef = useRef(null);
  const [confirmState, setConfirmState] = useState({ message: "", onOk: null, onCancel: null });

  // 조회 결과를 반영할 때 "지금 화면 상태"가 필요해서 최신 값을 ref로도 들고 있는다
  const latest = useRef({ menus, selectedIds, forms, formErrors });
  useEffect(() => {
    latest.current = { menus, selectedIds, forms, formErrors };
  });

  // 메뉴 URL 선택지 (라우트의 handle.menu)
  const routeOptions = useMemo(() => getMenuUrlOptions(routes), []);
  const routeUrls = useMemo(() => new Set(routeOptions.map((option) => option.url)), [routeOptions]);

  const protectedMenuIds = useMemo(() => getProtectedMenuIds(menus), [menus]);

  const parentIdOf = useCallback(
    (level) => (level === "top" ? null : level === "mid" ? selectedIds.top : selectedIds.mid),
    [selectedIds],
  );

  const isDirty = (level) => isFormDirty(forms[level], menus);
  const anyDirty = LEVELS.some((level) => isFormDirty(forms[level], menus));

  // ───────── 확인 창 ─────────

  const askConfirm = (message, onOk, onCancel) => {
    setConfirmState({ message, onOk, onCancel });
    confirmRef.current?.open();
  };

  /** level 열과 그 오른쪽 열에 저장하지 않은 변경이 있으면 확인 후 action 실행 */
  const runAfterDiscardConfirm = (level, action) => {
    const levels = LEVELS.slice(LEVELS.indexOf(level));
    if (levels.some((item) => isFormDirty(forms[item], menus))) {
      askConfirm(UNSAVED_CHANGES_MESSAGE, action);
    } else {
      action();
    }
  };

  // ───────── 조회 결과 반영 ─────────

  /**
   * 새 목록을 반영하고, 열 선택 · 상세를 새 목록에 맞춘다.
   * - 없어진 메뉴의 선택은 풀고, 상위 선택이 없으면 오른쪽 열도 비운다
   * - 변경이 없는 상세는 서버 값으로 바꾸고, 변경 중인 상세는 그대로 둔다
   * - select가 있으면 그 열에서 그 메뉴를 선택하고 상세를 서버 값으로 바꾼다 (배열이면 여러 열)
   * @param {{ roles?: object[], menus?: object[] }} data
   * @param {{ level: string, id: string } | { level: string, id: string }[]} [select]
   */
  const applyMenuList = useCallback((data, select) => {
    const nextMenus = data?.menus ?? [];
    const { menus: prevMenus, selectedIds: prevSelected, forms: prevForms, formErrors: prevErrors } =
      latest.current;

    const nextSelected = { ...prevSelected };
    const nextForms = { ...prevForms };
    const nextErrors = { ...prevErrors };

    const selects = select ? [].concat(select) : [];
    selects.forEach((item) => (nextSelected[item.level] = item.id));

    LEVELS.forEach((level, index) => {
      const parentLevel = LEVELS[index - 1];
      const parentSelected = index === 0 || nextSelected[parentLevel] !== null;

      if (!parentSelected) {
        nextSelected[level] = null;
        nextForms[level] = null;
        nextErrors[level] = EMPTY_FORM_ERRORS;
        return;
      }

      const selectedMenu = findMenu(nextMenus, nextSelected[level]);
      if (nextSelected[level] && !selectedMenu) {
        nextSelected[level] = null;
      }

      const form = nextForms[level];
      if (selects.some((item) => item.level === level) && selectedMenu) {
        nextForms[level] = menuToForm(selectedMenu);
        nextErrors[level] = EMPTY_FORM_ERRORS;
      } else if (form?.mode === "view") {
        if (!selectedMenu) {
          nextForms[level] = null;
          nextErrors[level] = EMPTY_FORM_ERRORS;
        } else if (!isFormDirty(form, prevMenus)) {
          nextForms[level] = menuToForm(selectedMenu);
        }
      }
    });

    if (data?.roles) setRoles(data.roles);
    setMenus(nextMenus);
    setSelectedIds(nextSelected);
    setForms(nextForms);
    setFormErrors(nextErrors);
    setListStatus("loaded");
    setListError("");
  }, []);

  /** 저장 · 삭제 등 이후의 재조회. 실패하면 알림만 하고 기존 목록 유지 */
  const reloadMenus = useCallback(
    async (select) => {
      try {
        applyMenuList(await getMenus(), select);
      } catch (error) {
        alert(getErrorMessage(error));
      }
    },
    [applyMenuList],
  );

  const failMenuList = useCallback((error) => {
    if (isAbortError(error)) return;
    setListStatus("failed");
    setListError(getErrorMessage(error));
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    getMenus({ signal: controller.signal })
      .then((data) => applyMenuList(data))
      .catch(failMenuList);

    return () => controller.abort();
  }, [applyMenuList, failMenuList]);

  // 첫 조회 실패 후 [다시 시도]
  const retryLoadMenus = async () => {
    setListStatus("loading");
    try {
      applyMenuList(await getMenus());
    } catch (error) {
      failMenuList(error);
    }
  };

  // ───────── 저장하지 않은 변경: 다른 화면 이동 · 새로고침 ─────────

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      anyDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  // 이동이 막히면 확인 창을 연다. 확인 창의 내용 · 동작은 아래 activeConfirm에서 blocker 기준으로 정한다
  const isNavigationBlocked = blocker.state === "blocked";
  useEffect(() => {
    if (isNavigationBlocked) {
      confirmRef.current?.open();
    }
  }, [isNavigationBlocked]);

  const activeConfirm = isNavigationBlocked
    ? {
        message: UNSAVED_CHANGES_MESSAGE,
        onOk: () => blocker.proceed?.(),
        onCancel: () => blocker.reset?.(),
      }
    : confirmState;

  useEffect(() => {
    if (!anyDirty) return undefined;

    // 문구는 브라우저가 정한다
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [anyDirty]);

  // ───────── 선택 · 추가 · 입력 · 취소 ─────────

  /** level 열의 선택 · 상세를 바꾸고, 오른쪽 열은 비운다 */
  const replaceColumn = (level, selectedId, form) => {
    const index = LEVELS.indexOf(level);
    const rightLevels = LEVELS.slice(index + 1);

    setSelectedIds((prev) => {
      const next = { ...prev, [level]: selectedId };
      rightLevels.forEach((right) => (next[right] = null));
      return next;
    });
    setForms((prev) => {
      const next = { ...prev, [level]: form };
      rightLevels.forEach((right) => (next[right] = null));
      return next;
    });
    setFormErrors((prev) => {
      const next = { ...prev, [level]: EMPTY_FORM_ERRORS };
      rightLevels.forEach((right) => (next[right] = EMPTY_FORM_ERRORS));
      return next;
    });
  };

  const handleSelect = (level, menuId) => {
    if (saving) return;
    if (selectedIds[level] === menuId && forms[level]?.mode === "view") return;

    const menu = findMenu(menus, menuId);
    if (!menu) return;
    runAfterDiscardConfirm(level, () => replaceColumn(level, menuId, menuToForm(menu)));
  };

  const handleAdd = (level) => {
    runAfterDiscardConfirm(level, () =>
      replaceColumn(level, null, createNewForm(selectedIds[level] ?? forms[level]?.prevId)),
    );
  };

  const handleChange = (level, patch) => {
    setForms((prev) => ({ ...prev, [level]: { ...prev[level], ...patch } }));

    // 고친 칸의 오류 메시지는 지운다 (다음 저장 때 다시 검사)
    setFormErrors((prev) => {
      const errors = { ...prev[level] };
      if ("title" in patch) errors.title = [];
      if ("menuUrl" in patch) errors.menuUrl = [];
      if ("parentId" in patch) errors.parentId = [];
      errors.etc = [];
      return { ...prev, [level]: errors };
    });
  };

  const handleCancel = (level) => {
    const form = forms[level];
    if (!form) return;

    if (form.mode === "new") {
      // 이전 선택으로 돌아간다 (그 사이 없어졌으면 상세를 비운다)
      const prevMenu = findMenu(menus, form.prevId);
      replaceColumn(level, prevMenu?.id ?? null, prevMenu ? menuToForm(prevMenu) : null);
      return;
    }

    const savedMenu = findMenu(menus, form.id);
    setForms((prev) => ({ ...prev, [level]: savedMenu ? menuToForm(savedMenu) : null }));
    setFormErrors((prev) => ({ ...prev, [level]: EMPTY_FORM_ERRORS }));
  };

  // ───────── 저장 ─────────

  const handleSave = async (level) => {
    const form = forms[level];
    if (!form || saving) return;

    // 상위 메뉴를 바꿨으면 저장 = 옮기기 (다른 칸은 잠겨 있음, 설계 6-6)
    if (isParentChanged(form, menus)) {
      handleMove(level, form);
      return;
    }

    const parentId = parentIdOf(level);
    const errors = validateMenuForm(form, level, getChildMenus(menus, parentId));
    setFormErrors((prev) => ({ ...prev, [level]: errors }));
    if (hasErrors(errors)) return;

    setSaving(true);
    let saved;
    try {
      const request = toMenuRequest(form, level);
      saved =
        form.mode === "new"
          ? await createMenu({ parentId, ...request })
          : await modifyMenu(form.id, { ...request, mdfyDt: form.mdfyDt });
    } catch (error) {
      await handleSaveError(level, form, error);
      setSaving(false);
      return;
    }

    try {
      const data = await getMenus();
      applyMenuList(data, { level, id: saved.id });
      dispatch(refreshMyMenus());

      // 사이드바는 소메뉴가 없는 그룹 · 섹션을 그리지 않으므로, 저장이 실패한 것처럼 보이지 않게 안내
      const needsBottomMenu = level !== "btm" && !hasBottomMenu(data?.menus ?? [], saved.id, level);
      alert(
        needsBottomMenu
          ? "저장되었습니다.\n소메뉴를 추가해야 사이드바에 표시됩니다."
          : "저장되었습니다.",
      );
    } catch (error) {
      alert(`저장되었지만 목록을 다시 불러오지 못했습니다.\n${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveError = async (level, form, error) => {
    const errors = toFormErrors(error);
    if (errors) {
      setFormErrors((prev) => ({ ...prev, [level]: errors }));
      return;
    }

    alert(getErrorMessage(error));

    if (error.errorCode === "MENU_OUTDATED") {
      // 다른 사용자가 먼저 저장함 → 같은 메뉴를 선택한 채 서버 값으로 바꾼다 (내 입력은 버려짐)
      await reloadMenus({ level, id: form.id });
    } else if (error.errorCode === "MENU_NOT_EXISTS") {
      // 메뉴(또는 상위 메뉴)가 삭제됨 → 목록을 다시 받아 선택을 정리한다
      await reloadMenus();
    }
    // MENU_SELF_LOCK 등: 입력값은 그대로 둔다 (사용자가 [취소]로 되돌림)
  };

  // ───────── 옮기기 (상위 메뉴 변경) ─────────

  const handleMove = (level, form) => {
    const errors = validateMove(form, menus);
    setFormErrors((prev) => ({ ...prev, [level]: errors }));
    if (hasErrors(errors)) return;

    // 옮긴 뒤 왼쪽 열 선택이 새 위치로 바뀌므로, 왼쪽 열의 저장하지 않은 변경은 사라진다
    const leftDirty = LEVELS.slice(0, LEVELS.indexOf(level)).some((item) =>
      isFormDirty(forms[item], menus),
    );
    const message = leftDirty
      ? `${MOVE_CONFIRM_MESSAGE} 다른 열의 저장하지 않은 변경사항은 사라집니다.`
      : MOVE_CONFIRM_MESSAGE;

    askConfirm(message, async () => {
      setSaving(true);
      try {
        const data = await moveMenu(form.id, form.parentId, form.mdfyDt);
        // 옮긴 메뉴가 보이도록 대메뉴부터 옮긴 메뉴까지 새 경로로 선택
        const path = getSelfAndAncestors(data?.menus ?? [], form.id).reverse();
        applyMenuList(
          data,
          path.map((menu, index) => ({ level: LEVELS[index], id: menu.id })),
        );
        dispatch(refreshMyMenus());
        alert("메뉴를 옮겼습니다.");
      } catch (error) {
        await handleMoveError(level, form, error);
      } finally {
        setSaving(false);
      }
    });
  };

  const handleMoveError = async (level, form, error) => {
    if (error.errorCode === "MENU_TITLE_USED") {
      setFormErrors((prev) => ({
        ...prev,
        [level]: { ...EMPTY_FORM_ERRORS, parentId: [MOVE_TITLE_USED_MESSAGE] },
      }));
      return;
    }

    alert(getErrorMessage(error));

    if (error.errorCode === "MENU_OUTDATED") {
      await reloadMenus({ level, id: form.id });
    } else if (error.errorCode === "MENU_NOT_EXISTS") {
      await reloadMenus();
    }
    // MENU_SELF_LOCK · MENU_MOVE_INVALID: 선택은 그대로 둔다 (사용자가 [취소]로 되돌림)
  };

  // ───────── 삭제 ─────────

  const handleDelete = (level) => {
    const form = forms[level];
    const menu = findMenu(menus, form?.id);
    if (!menu || saving) return;

    askConfirm(`'${menu.title}' 메뉴를 삭제하시겠습니까?`, async () => {
      setSaving(true);
      try {
        await deleteMenu(menu.id);
        await reloadMenus();
        dispatch(refreshMyMenus());
        alert("삭제되었습니다.");
      } catch (error) {
        alert(getErrorMessage(error));
        if (error.errorCode === "MENU_NOT_EXISTS") {
          await reloadMenus();
        }
      } finally {
        setSaving(false);
      }
    });
  };

  // ───────── 순서 변경 (HTML5 Drag and Drop, 같은 열 안에서만) ─────────

  const canDrag = canUpdate && !saving && listStatus === "loaded";

  const clearDrag = () => {
    setDragging(null);
    setDropTargetId(null);
  };

  const handleDragStart = (event, level, menuId) => {
    setDragging({ level, id: menuId });
    event.dataTransfer.effectAllowed = "move";
    // Firefox는 setData가 있어야 드래그가 시작됨
    event.dataTransfer.setData("text/plain", menuId);
  };

  const handleDragOver = (event, level, menuId) => {
    // 다른 열에는 놓을 수 없음 (preventDefault를 호출하지 않으면 drop 안 됨)
    if (!dragging || dragging.level !== level) {
      if (dropTargetId !== null) setDropTargetId(null);
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropTargetId !== menuId) setDropTargetId(menuId);
  };

  const handleDrop = async (event, level, targetId) => {
    event.preventDefault();

    const from = dragging;
    clearDrag();
    if (!from || from.level !== level || from.id === targetId) return;

    const parentId = parentIdOf(level);
    const ids = getChildMenus(menus, parentId).map((menu) => menu.id);
    const fromIndex = ids.indexOf(from.id);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, from.id);

    setSaving(true);
    try {
      applyMenuList(await modifyMenuOrder(parentId, ids));
      dispatch(refreshMyMenus());
    } catch (error) {
      alert(getErrorMessage(error));
      if (error.errorCode === "MENU_ORDER_OUTDATED" || error.errorCode === "MENU_NOT_EXISTS") {
        await reloadMenus();
      }
    } finally {
      setSaving(false);
    }
  };

  // ───────── 화면 ─────────

  if (listStatus === "loading") {
    return <p className={styles.notice}>목록을 불러오는 중입니다...</p>;
  }

  if (listStatus === "failed") {
    return (
      <div className={styles.notice}>
        <p className={styles.listErrorTitle}>목록을 불러오지 못했습니다.</p>
        {listError && <p className={styles.listErrorMessage}>{listError}</p>}
        <IconButton icon={icons.refresh} iconSize={16} onClick={retryLoadMenus}>
          다시 시도
        </IconButton>
      </div>
    );
  }

  return (
    <>
      <div className={styles.menuPage}>
        {LEVELS.map((level, index) => {
          const parentId = parentIdOf(level);
          const active = index === 0 || parentId !== null;
          const form = forms[level];
          const editable = form?.mode === "new" ? canCreate : canUpdate;

          // 상위 메뉴를 바꾸는 중이면 옮길 위치 기준으로 미리 보여 준다
          const effectiveParentId = form?.mode === "view" ? form.parentId : parentId;
          const blockedRoleIds = new Set(
            form
              ? roles
                  .map((role) => role.roleId)
                  .filter((roleId) => isBlockedByAncestors(menus, effectiveParentId, roleId))
              : [],
          );

          return (
            <MenuColumn
              key={level}
              level={level}
              active={active}
              items={active ? getChildMenus(menus, parentId) : []}
              selectedId={selectedIds[level]}
              form={form}
              errors={formErrors[level]}
              dirty={isDirty(level)}
              fieldsDirty={isFieldsDirty(form, menus)}
              parentChanged={isParentChanged(form, menus)}
              parentOptions={canUpdate ? getParentOptions(menus, level) : []}
              roles={roles}
              blockedRoleIds={blockedRoleIds}
              showSelfLockNotice={
                !isSuperAdmin && form?.mode === "view" && protectedMenuIds.has(form.id)
              }
              urlOptions={
                level === "btm" && form ? getMenuUrlSelectOptions(routeOptions, menus, form) : []
              }
              routeUrls={routeUrls}
              editable={editable}
              canCreate={canCreate}
              canDelete={canDelete}
              canDrag={canDrag}
              saving={saving}
              dragging={dragging}
              dropTargetId={dropTargetId}
              onSelect={handleSelect}
              onAdd={handleAdd}
              onChange={handleChange}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={clearDrag}
            />
          );
        })}
      </div>

      <Confirm
        ref={confirmRef}
        title="확인"
        content={<p className={styles.confirmMessage}>{activeConfirm.message}</p>}
        positiveButtonText="확인"
        negativeButtonText="취소"
        onClickPositive={() => activeConfirm.onOk?.()}
        onClickNegative={() => activeConfirm.onCancel?.()}
      />
    </>
  );
}
