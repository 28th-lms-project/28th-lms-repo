/**
 * 메뉴 관리 화면 공통 상수 · 함수
 * 설계: frontend/docs/design/menu-page-design.md 6장, backend/docs/design/menu-design.md 3장 · 4-3
 */

/** 메뉴 관리 화면의 경로. 백엔드 MenuConstants.MENU_MANAGEMENT_URL과 같은 값 (자기 잠금 방지 보호 대상) */
export const MENU_MANAGEMENT_URL = "/admin/system/menu";

export const SUPER_ADMIN_ROLE_ID = "ROLE_SUPER_ADMIN";

/** 열(메뉴 단계): 대메뉴 → 중메뉴 → 소메뉴 */
export const LEVELS = ["top", "mid", "btm"];

export const LEVEL_TITLES = { top: "대메뉴", mid: "중메뉴", btm: "소메뉴" };

const TITLE_MAX_LENGTH = 100;
const MENU_URL_MAX_LENGTH = 100;

export const EMPTY_FORM_ERRORS = { title: [], menuUrl: [], etc: [] };

export const isAbortError = (error) => error?.name === "AbortError";

/** 입력값 검증 실패면 필드별 메시지를, 아니면 서버 에러 메시지를 반환 */
export const getErrorMessage = (error) =>
  error.validations ? Object.values(error.validations).flat().join("\n") : error.message;

export const hasErrors = (errors) =>
  Object.values(errors ?? {}).some((messages) => messages?.length > 0);

/** "YYYY-MM-DD HH:mm:ss" → "YYYY-MM-DD HH:mm" (화면 표시는 분까지) */
export const formatDateTime = (dateTime) => (dateTime ? dateTime.slice(0, 16) : "-");

const byMenuOrder = (a, b) => a.menuOrder - b.menuOrder || a.id.localeCompare(b.id);

/** parentId의 하위 메뉴 (MENU_ORDER 순). parentId가 null이면 대메뉴 */
export const getChildMenus = (menus, parentId) =>
  menus.filter((menu) => (menu.parentId ?? null) === (parentId ?? null)).sort(byMenuOrder);

export const findMenu = (menus, menuId) =>
  menuId ? (menus.find((menu) => menu.id === menuId) ?? null) : null;

/** menuId 메뉴부터 대메뉴까지 (자기 자신 포함). 순환 데이터가 있어도 멈춘다 */
export const getSelfAndAncestors = (menus, menuId) => {
  const chain = [];
  let current = findMenu(menus, menuId);
  while (current && !chain.includes(current)) {
    chain.push(current);
    current = findMenu(menus, current.parentId);
  }
  return chain;
};

/**
 * 상위 메뉴 때문에 이 역할에게 실제로는 보이지 않는지 (백엔드 3장 규칙).
 * 상위 메뉴 중 하나라도 미사용이거나 그 역할을 허용하지 않으면 true.
 * @param {object[]} menus
 * @param {string|null} parentId 판단할 메뉴의 상위 메뉴 ID
 * @param {string} roleId
 */
export const isBlockedByAncestors = (menus, parentId, roleId) =>
  getSelfAndAncestors(menus, parentId).some(
    (ancestor) => ancestor.useYn !== "Y" || !(ancestor.roleIds ?? []).includes(roleId),
  );

/**
 * 자기 잠금 방지 보호 대상: 메뉴 관리 소메뉴와 그 상위 중 · 대메뉴의 ID.
 * 메뉴 관리 메뉴가 없으면 빈 Set
 */
export const getProtectedMenuIds = (menus) => {
  const managementMenu = menus.find((menu) => menu.menuUrl === MENU_MANAGEMENT_URL);
  return new Set(
    managementMenu ? getSelfAndAncestors(menus, managementMenu.id).map((menu) => menu.id) : [],
  );
};

/**
 * 아래에 소메뉴가 하나라도 있는지. 사이드바는 소메뉴가 없는 그룹 · 섹션을 그리지 않는다.
 * @param {string} level "top" | "mid"
 */
export const hasBottomMenu = (menus, menuId, level) => {
  const children = getChildMenus(menus, menuId);
  if (level === "mid") return children.length > 0;
  return children.some((child) => getChildMenus(menus, child.id).length > 0);
};

// ───────── 상세 입력값 ─────────

/** 저장된 메뉴 → 상세 입력값 */
export const menuToForm = (menu) => ({
  mode: "view",
  id: menu.id,
  title: menu.title ?? "",
  useYn: menu.useYn === "N" ? "N" : "Y",
  spread: menu.spread === "Y" ? "Y" : "N",
  menuUrl: menu.menuUrl ?? "",
  roleIds: (menu.roleIds ?? []).filter((roleId) => roleId !== SUPER_ADMIN_ROLE_ID),
  // 표시용. 변경 여부 비교에는 쓰지 않는다
  crtDt: menu.crtDt ?? null,
  // 수정 요청에 그대로 보낸다 (동시 수정 검사)
  mdfyDt: menu.mdfyDt ?? null,
});

/**
 * 새 메뉴 입력값 (사용 체크, 펼침 해제, 역할 없음)
 * @param {string|null} prevId [취소] 시 다시 선택할 이전 선택 메뉴 ID
 */
export const createNewForm = (prevId) => ({
  mode: "new",
  id: null,
  prevId: prevId ?? null,
  title: "",
  useYn: "Y",
  spread: "N",
  menuUrl: "",
  roleIds: [],
  mdfyDt: null,
});

const sameRoleIds = (a, b) => a.length === b.length && a.every((roleId) => b.includes(roleId));

/**
 * 저장하지 않은 변경이 있는지: new 모드이거나, 입력값이 마지막 저장 값과 다르면 true.
 * 저장된 메뉴가 없어졌으면(다른 사용자가 삭제) false.
 */
export const isFormDirty = (form, menus) => {
  if (!form) return false;
  if (form.mode === "new") return true;

  const savedMenu = findMenu(menus, form.id);
  if (!savedMenu) return false;

  const saved = menuToForm(savedMenu);
  return (
    form.title !== saved.title ||
    form.useYn !== saved.useYn ||
    form.spread !== saved.spread ||
    form.menuUrl !== saved.menuUrl ||
    !sameRoleIds(form.roleIds, saved.roleIds)
  );
};

/**
 * 저장 전 입력 검사 (서버 요청 줄이기용, 서버 검증이 최종). 백엔드 4-3과 같은 규칙.
 * @param {object} form
 * @param {string} level "top" | "mid" | "btm"
 * @param {object[]} siblings 같은 상위 메뉴의 메뉴들 (이름 중복 검사)
 * @returns {{ title: string[], menuUrl: string[], etc: string[] }}
 */
export const validateMenuForm = (form, level, siblings) => {
  const errors = { title: [], menuUrl: [], etc: [] };

  const title = form.title.trim();
  if (!title) {
    errors.title.push("메뉴 이름을 입력해주세요.");
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title.push("메뉴 이름은 100자 이하로 입력해주세요.");
  } else if (
    siblings.some((menu) => menu.id !== form.id && (menu.title ?? "").trim() === title)
  ) {
    errors.title.push("같은 상위 메뉴에 이미 같은 이름의 메뉴가 있습니다.");
  }

  if (level === "btm") {
    if (!form.menuUrl) {
      errors.menuUrl.push("메뉴 URL을 입력해주세요.");
    } else if (form.menuUrl.length > MENU_URL_MAX_LENGTH) {
      errors.menuUrl.push("메뉴 URL은 100자 이하로 입력해주세요.");
    }
  }

  return errors;
};

/**
 * 서버 오류를 상세의 입력 오류로 바꾼다. 해당 칸이 없는 오류는 null (알림으로 표시)
 * @returns {{ title: string[], menuUrl: string[], etc: string[] } | null}
 */
export const toFormErrors = (error) => {
  if (error.errorCode === "GLOBAL_INVALID_PARAMETER" && error.validations) {
    const { title = [], menuUrl = [], ...rest } = error.validations;
    return { title, menuUrl, etc: Object.values(rest).flat() };
  }
  if (error.errorCode === "MENU_TITLE_USED") {
    return { ...EMPTY_FORM_ERRORS, title: [error.message] };
  }
  if (error.errorCode === "MENU_URL_USED") {
    return { ...EMPTY_FORM_ERRORS, menuUrl: [error.message] };
  }
  return null;
};

/**
 * 상세 입력값 → 등록 · 수정 요청 값.
 * 펼침은 중메뉴만, URL은 소메뉴만 보낸다 (서버도 그 외에는 무시함). SUPER_ADMIN은 보내지 않는다.
 */
export const toMenuRequest = (form, level) => ({
  title: form.title.trim(),
  useYn: form.useYn,
  spread: level === "mid" ? form.spread : "N",
  menuUrl: level === "btm" ? form.menuUrl || null : null,
  roleIds: form.roleIds.filter((roleId) => roleId !== SUPER_ADMIN_ROLE_ID),
});

/**
 * 소메뉴 URL 선택지.
 * - 라우트의 메뉴 URL 중 다른 메뉴가 쓰지 않는 것. 표시는 "crumb (URL)"
 * - 저장된 URL이 라우트에 없으면 "(등록되지 않은 경로) /xxx"로 맨 위에
 * @param {{ url: string, label: string }[]} routeOptions getMenuUrlOptions(routes)
 * @param {object[]} menus
 * @param {object} form
 * @returns {{ value: string, text: string }[]}
 */
export const getMenuUrlSelectOptions = (routeOptions, menus, form) => {
  const savedUrl = form.mode === "view" ? (findMenu(menus, form.id)?.menuUrl ?? "") : "";
  const usedUrls = new Set(
    menus.filter((menu) => menu.id !== form.id && menu.menuUrl).map((menu) => menu.menuUrl),
  );

  const options = routeOptions
    .filter((option) => !usedUrls.has(option.url))
    .map((option) => ({ value: option.url, text: `${option.label} (${option.url})` }));

  if (savedUrl && !routeOptions.some((option) => option.url === savedUrl)) {
    options.unshift({ value: savedUrl, text: `(등록되지 않은 경로) ${savedUrl}` });
  }
  return options;
};
