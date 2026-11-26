import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useBlocker } from "react-router-dom";

import PageHeader from "../../../common/ui/PageHeader";
import StatusBox from "../../../common/ui/StatusBox";
import Callout from "../../../common/ui/Callout";
import Button from "../../../common/ui/Button";
import { useConfirm, useToast } from "../../../common/ui/feedbackContext";
import usePermission from "../../../../hooks/usePermission";
import useBreadcrumbs from "../../../../hooks/useBreadcrumbs";
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

const EMPTY_SELECTION = { top: null, mid: null, btm: null };
const EMPTY_FORMS = { top: null, mid: null, btm: null };
const EMPTY_ERRORS = { top: EMPTY_FORM_ERRORS, mid: EMPTY_FORM_ERRORS, btm: EMPTY_FORM_ERRORS };
const NOT_EDITING = { top: false, mid: false, btm: false };

const UNSAVED_CHANGES_MESSAGE = "저장하지 않은 변경사항이 있습니다. 이동할까요?";
const MOVE_CONFIRM_MESSAGE =
  "메뉴를 옮기면 이 메뉴를 쓰는 접근 권한(ACTION)의 메뉴도 함께 바뀝니다. 옮길까요?";

/** 순서 초안의 키 (대메뉴는 상위 메뉴가 null) */
const ROOT_KEY = "ROOT";
const orderKeyOf = (parentId) => parentId ?? ROOT_KEY;
const parentIdOfKey = (key) => (key === ROOT_KEY ? null : key);
const sameIds = (a, b) => a.length === b.length && a.every((id, index) => id === b[index]);

/**
 * 메뉴 관리 화면. 설계: frontend/docs/design/menu-page-design.md 6장
 * 표준: frontend/docs/ui-style-guide.md 8장 "화면 예시" › 메뉴 관리
 *
 * - 권한 조회 중 · 실패 · MENU_READ 없음: StatusBox
 * - MENU_READ 있음: 화면 표시. 추가 MENU_CREATE, 수정 · 순서 변경 · 옮기기 MENU_UPDATE, 삭제 MENU_DELETE
 */
export default function Menu() {
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
    content = can("MENU_READ") ? (
      <MenuManagement
        isSuperAdmin={isSuperAdmin}
        canCreate={can("MENU_CREATE")}
        canUpdate={can("MENU_UPDATE")}
        canDelete={can("MENU_DELETE")}
      />
    ) : (
      <StatusBox type="denied" />
    );
  }

  return (
    <>
      <PageHeader
        crumbs={crumbs}
        title={crumbs.at(-1)?.title ?? "메뉴 관리"}
        description="사이드바 메뉴의 구조 · 순서와 메뉴마다 볼 수 있는 역할을 관리합니다."
      />
      {content}
    </>
  );
}

/**
 * 메뉴 목록 · 등록 · 수정 · 순서 변경 · 옮기기 · 삭제
 * MENU_READ가 있을 때만 마운트되므로, 권한 없이 목록 API를 호출하지 않는다.
 */
function MenuManagement({ isSuperAdmin, canCreate, canUpdate, canDelete }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const confirm = useConfirm();

  // 첫 조회 상태 ("loading" | "loaded" | "failed")와 실패 메시지
  const [listStatus, setListStatus] = useState("loading");
  const [listError, setListError] = useState("");

  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);

  // 열별 선택 메뉴 ID / 상세 입력값 / 입력 오류 / 수정 중인지 (보기 ↔ 수정)
  const [selectedIds, setSelectedIds] = useState(EMPTY_SELECTION);
  const [forms, setForms] = useState(EMPTY_FORMS);
  const [formErrors, setFormErrors] = useState(EMPTY_ERRORS);
  const [editing, setEditing] = useState(NOT_EDITING);

  // 저장하지 않은 순서 { 상위 메뉴 키: 메뉴 ID 목록 }. [순서 저장]으로 한 번에 저장 (바뀐 열만 들어 있음)
  const [orderDraft, setOrderDraft] = useState({});

  // 저장 · 삭제 · 순서 저장 진행 중 (버튼 비활성)
  const [saving, setSaving] = useState(false);

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

  const isEditing = (level) => editing[level] || forms[level]?.mode === "new";
  const anyEditing = LEVELS.some((level) => isEditing(level));
  const orderChanged = Object.keys(orderDraft).length > 0;
  const anyDirty = orderChanged || LEVELS.some((level) => isFormDirty(forms[level], menus));

  // ───────── 확인 창 ─────────

  /** level 열과 그 오른쪽 열에 저장하지 않은 변경이 있으면 확인 후 action 실행 */
  const runAfterDiscardConfirm = async (level, action) => {
    const levels = LEVELS.slice(LEVELS.indexOf(level));
    if (levels.some((item) => isFormDirty(forms[item], menus))) {
      if (!(await confirm({ message: UNSAVED_CHANGES_MESSAGE, confirmText: "이동" }))) return;
    }
    action();
  };

  // ───────── 조회 결과 반영 ─────────

  /**
   * 새 목록을 반영하고, 열 선택 · 상세를 새 목록에 맞춘다.
   * - 없어진 메뉴의 선택은 풀고, 상위 선택이 없으면 오른쪽 열도 비운다
   * - 변경이 없는 상세는 서버 값으로 바꾸고, 변경 중인 상세는 그대로 둔다
   * - select가 있으면 그 열에서 그 메뉴를 선택하고 상세를 서버 값(보기)으로 바꾼다 (배열이면 여러 열)
   * - 저장하지 않은 순서는 버린다 (서버 목록이 기준)
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
    const stopEditing = {};

    const selects = select ? [].concat(select) : [];
    selects.forEach((item) => (nextSelected[item.level] = item.id));

    LEVELS.forEach((level, index) => {
      const parentLevel = LEVELS[index - 1];
      const parentSelected = index === 0 || nextSelected[parentLevel] !== null;

      if (!parentSelected) {
        nextSelected[level] = null;
        nextForms[level] = null;
        nextErrors[level] = EMPTY_FORM_ERRORS;
        stopEditing[level] = false;
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
        stopEditing[level] = false;
      } else if (form?.mode === "view") {
        if (!selectedMenu) {
          nextForms[level] = null;
          nextErrors[level] = EMPTY_FORM_ERRORS;
          stopEditing[level] = false;
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
    setEditing((prev) => ({ ...prev, ...stopEditing }));
    setOrderDraft({});
    setListStatus("loaded");
    setListError("");
  }, []);

  /** 저장 · 삭제 등 이후의 재조회. 실패하면 알림만 하고 기존 목록 유지 */
  const reloadMenus = useCallback(
    async (select) => {
      try {
        applyMenuList(await getMenus(), select);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [applyMenuList, toast],
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

  // 이동이 막히면 확인 창을 연다. blocker는 렌더마다 바뀌므로 ref로 최신 값을 쓴다
  const blockerRef = useRef(blocker);
  useEffect(() => {
    blockerRef.current = blocker;
  });

  const isNavigationBlocked = blocker.state === "blocked";
  useEffect(() => {
    if (!isNavigationBlocked) return;
    confirm({ message: UNSAVED_CHANGES_MESSAGE, confirmText: "이동" }).then((ok) =>
      ok ? blockerRef.current.proceed?.() : blockerRef.current.reset?.(),
    );
  }, [isNavigationBlocked, confirm]);

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

  // ───────── 선택 · 추가 · 수정 · 입력 · 취소 ─────────

  /** level 열의 선택 · 상세를 바꾸고(보기 상태), 오른쪽 열은 비운다 */
  const replaceColumn = (level, selectedId, form) => {
    const index = LEVELS.indexOf(level);
    const levels = LEVELS.slice(index);
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
      const next = { ...prev };
      levels.forEach((item) => (next[item] = EMPTY_FORM_ERRORS));
      return next;
    });
    setEditing((prev) => {
      const next = { ...prev };
      levels.forEach((item) => (next[item] = false));
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

  /** 보기 → 수정 */
  const handleEdit = (level) => {
    setEditing((prev) => ({ ...prev, [level]: true }));
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

    // 수정 → 보기, 입력값은 마지막 저장 값으로
    const savedMenu = findMenu(menus, form.id);
    setForms((prev) => ({ ...prev, [level]: savedMenu ? menuToForm(savedMenu) : null }));
    setFormErrors((prev) => ({ ...prev, [level]: EMPTY_FORM_ERRORS }));
    setEditing((prev) => ({ ...prev, [level]: false }));
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
      const done = form.mode === "new" ? "등록했습니다." : "저장했습니다.";
      const needsBottomMenu = level !== "btm" && !hasBottomMenu(data?.menus ?? [], saved.id, level);
      toast.success(needsBottomMenu ? `${done}\n소메뉴를 추가해야 사이드바에 표시됩니다.` : done);
    } catch (error) {
      toast.error(`저장했지만 목록을 다시 불러오지 못했습니다.\n${getErrorMessage(error)}`);
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

    toast.error(getErrorMessage(error));

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

  const handleMove = async (level, form) => {
    const errors = validateMove(form, menus);
    setFormErrors((prev) => ({ ...prev, [level]: errors }));
    if (hasErrors(errors)) return;

    // 옮긴 뒤 왼쪽 열 선택이 새 위치로 바뀌므로, 왼쪽 열의 저장하지 않은 변경은 사라진다
    const leftDirty = LEVELS.slice(0, LEVELS.indexOf(level)).some((item) =>
      isFormDirty(forms[item], menus),
    );
    const ok = await confirm({
      title: "메뉴 옮기기",
      message: leftDirty
        ? `${MOVE_CONFIRM_MESSAGE}\n다른 열의 저장하지 않은 변경사항은 사라집니다.`
        : MOVE_CONFIRM_MESSAGE,
      confirmText: "옮기기",
    });
    if (!ok) return;

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
      toast.success("메뉴를 옮겼습니다.");
    } catch (error) {
      await handleMoveError(level, form, error);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveError = async (level, form, error) => {
    if (error.errorCode === "MENU_TITLE_USED") {
      setFormErrors((prev) => ({
        ...prev,
        [level]: { ...EMPTY_FORM_ERRORS, parentId: [MOVE_TITLE_USED_MESSAGE] },
      }));
      return;
    }

    toast.error(getErrorMessage(error));

    if (error.errorCode === "MENU_OUTDATED") {
      await reloadMenus({ level, id: form.id });
    } else if (error.errorCode === "MENU_NOT_EXISTS") {
      await reloadMenus();
    }
    // MENU_SELF_LOCK · MENU_MOVE_INVALID: 선택은 그대로 둔다 (사용자가 [취소]로 되돌림)
  };

  // ───────── 삭제 ─────────

  const handleDelete = async (level) => {
    const form = forms[level];
    const menu = findMenu(menus, form?.id);
    if (!menu || saving) return;

    const ok = await confirm({
      title: "메뉴 삭제",
      message: `'${menu.title}' 메뉴를 삭제할까요?`,
      confirmText: "삭제",
      danger: true,
    });
    if (!ok) return;

    setSaving(true);
    try {
      await deleteMenu(menu.id);
      await reloadMenus();
      dispatch(refreshMyMenus());
      toast.success("삭제했습니다.");
    } catch (error) {
      toast.error(getErrorMessage(error));
      if (error.errorCode === "MENU_NOT_EXISTS") {
        await reloadMenus();
      }
    } finally {
      setSaving(false);
    }
  };

  // ───────── 순서 바꾸기 (손잡이 끌기 · ↑ ↓ 키, [순서 저장]으로 한 번에) ─────────

  // 상세를 수정 중이면 순서를 바꿀 수 없다 (저장 뒤 받은 목록이 저장하지 않은 순서를 덮어쓰므로)
  const canReorder = canUpdate && !saving && !anyEditing;

  /** 열에 보이는 메뉴: 저장하지 않은 순서가 있으면 그 순서 */
  const columnItems = (parentId) => {
    const children = getChildMenus(menus, parentId);
    const draft = orderDraft[orderKeyOf(parentId)];
    if (!draft) return children;
    return draft.map((id) => children.find((menu) => menu.id === id)).filter(Boolean);
  };

  const handleReorder = (level, fromIndex, toIndex) => {
    const parentId = parentIdOf(level);
    const ids = columnItems(parentId).map((menu) => menu.id);
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);

    const savedIds = getChildMenus(menus, parentId).map((menu) => menu.id);
    const key = orderKeyOf(parentId);
    setOrderDraft((prev) => {
      const next = { ...prev };
      if (sameIds(ids, savedIds)) delete next[key];
      else next[key] = ids;
      return next;
    });
  };

  const changedOrderNames = Object.keys(orderDraft).map((key) =>
    key === ROOT_KEY ? "대메뉴" : (findMenu(menus, key)?.title ?? key),
  );

  const handleSaveOrder = async () => {
    if (saving || !orderChanged) return;

    setSaving(true);
    try {
      const orders = Object.entries(orderDraft).map(([key, menuIds]) => ({
        parentId: parentIdOfKey(key),
        menuIds,
      }));
      applyMenuList(await modifyMenuOrder(orders));
      dispatch(refreshMyMenus());
      toast.success("순서를 저장했습니다.");
    } catch (error) {
      toast.error(getErrorMessage(error));
      if (error.errorCode === "MENU_ORDER_OUTDATED" || error.errorCode === "MENU_NOT_EXISTS") {
        // 그 사이 메뉴가 추가 · 삭제됨 → 서버 목록으로 다시 (저장하지 않은 순서는 버려짐)
        await reloadMenus();
      }
    } finally {
      setSaving(false);
    }
  };

  // ───────── 화면 ─────────

  if (listStatus === "loading") {
    return <StatusBox type="loading" title="목록을 불러오는 중..." />;
  }

  if (listStatus === "failed") {
    return (
      <StatusBox
        type="error"
        title="목록을 불러오지 못했습니다."
        detail={listError}
        onRetry={retryLoadMenus}
      />
    );
  }

  return (
    <div className="form-stack">
      {orderChanged && (
        <Callout
          tone="info"
          actions={
            <>
              <Button size="sm" disabled={saving} onClick={() => setOrderDraft({})}>
                되돌리기
              </Button>
              <Button size="sm" variant="primary" loading={saving} onClick={handleSaveOrder}>
                {saving ? "저장 중..." : "순서 저장"}
              </Button>
            </>
          }
        >
          순서가 변경되었습니다: {changedOrderNames.join(" · ")}
        </Callout>
      )}

      <div className="layout-3col">
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
              parentTitle={findMenu(menus, parentId)?.title ?? ""}
              items={active ? columnItems(parentId) : []}
              menus={menus}
              selectedId={selectedIds[level]}
              form={form}
              editing={isEditing(level)}
              errors={formErrors[level]}
              dirty={isFormDirty(form, menus)}
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
              canUpdate={canUpdate}
              canDelete={canDelete}
              canReorder={canReorder}
              orderPending={orderChanged}
              saving={saving}
              onSelect={handleSelect}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onChange={handleChange}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          );
        })}
      </div>
    </div>
  );
}
