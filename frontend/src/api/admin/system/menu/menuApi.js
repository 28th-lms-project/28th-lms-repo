/**
 * 메뉴(MENU) API
 * 백엔드: backend/src/main/java/com/learningworks/menu/web/MenuController.java
 * 설계: backend/docs/design/menu-design.md 4장
 *
 * 메뉴 객체: { id, title, parentId, menuOrder, useYn, spread, menuUrl, roleIds, crtDt, mdfyDt }
 * - parentId: 대메뉴는 null
 * - spread: 중메뉴만 의미가 있음 (대 · 소메뉴는 항상 "N")
 * - menuUrl: 소메뉴만 값이 있음
 * - roleIds: SUPER_ADMIN은 포함하지 않음
 * - crtDt, mdfyDt: "YYYY-MM-DD HH:mm:ss". mdfyDt는 수정 요청에 받은 값 그대로 보낸다
 */
import { api } from "../../../common/apiClient";

const menuPath = (menuId) => `/menus/${encodeURIComponent(menuId)}`;

/**
 * 내 메뉴 (사이드바 · 메뉴 가드용, 로그인 필요)
 * @returns {Promise<{ superAdmin: boolean, menus: object[], guardUrls: string[] }>}
 *   menus에는 roleIds · 날짜가 없다. useYn = "N"은 SUPER_ADMIN만 받는다.
 * errorCode: GLOBAL_UNAUTHORIZED
 */
export const getMyMenus = (options) => api.get("/menus/me", undefined, options);

/**
 * 전체 역할 · 전체 메뉴 (메뉴 관리 화면용, MENU_READ)
 * @returns {Promise<{ roles: { roleId: string, roleDisplayName: string }[], menus: object[] }>}
 *   roles는 역할 순위 순서
 */
export const getMenus = (options) => api.get("/menus", undefined, options);

/**
 * 메뉴 등록 (MENU_CREATE). 같은 상위 메뉴의 맨 뒤에 추가된다.
 * @param {{ parentId: string|null, title: string, useYn: string, spread: string, menuUrl: string|null, roleIds: string[] }} menu
 * @returns {Promise<object>} 만든 메뉴
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), MENU_NOT_EXISTS, MENU_PARENT_INVALID,
 *            MENU_URL_USED, MENU_TITLE_USED, MENU_ROLE_INVALID
 */
export const createMenu = (menu) => api.post("/menus", menu);

/**
 * 메뉴 수정 (MENU_UPDATE). 상위 메뉴 · 순서는 바꾸지 않는다.
 * @param {string} menuId
 * @param {{ title: string, useYn: string, spread: string, menuUrl: string|null, roleIds: string[], mdfyDt: string|null }} menu
 * @returns {Promise<object>} 수정한 메뉴
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), MENU_NOT_EXISTS, MENU_URL_USED, MENU_TITLE_USED,
 *            MENU_ROLE_INVALID, MENU_OUTDATED(다른 사용자가 먼저 수정), MENU_SELF_LOCK
 */
export const modifyMenu = (menuId, menu) => api.put(menuPath(menuId), menu);

/**
 * 메뉴 순서 변경 (MENU_UPDATE). 같은 상위 메뉴의 하위 메뉴 전체를 순서대로 보낸다.
 * @param {string|null} parentId 대메뉴의 순서를 바꿀 때는 null
 * @param {string[]} menuIds
 * @returns {Promise<{ roles: object[], menus: object[] }>} 변경 후 전체
 * errorCode: MENU_ORDER_INVALID, MENU_ORDER_OUTDATED(그 사이 추가 · 삭제됨 → 목록 다시 조회), MENU_NOT_EXISTS
 */
export const modifyMenuOrder = (parentId, menuIds) => api.put("/menus/order", { parentId, menuIds });

/**
 * 상위 메뉴 변경 = 메뉴 옮기기 (MENU_UPDATE). 소메뉴는 다른 중메뉴로, 중메뉴는 다른 대메뉴로.
 * 이 메뉴를 쓰는 접근 권한(ACTION)의 메뉴도 서버가 함께 바꾼다. 이름 · 역할 등은 바꾸지 않는다 (수정과 따로 저장).
 * @param {string} menuId
 * @param {string} parentId 새 상위 메뉴 ID
 * @param {string|null} mdfyDt 화면이 받은 값 그대로
 * @returns {Promise<{ roles: object[], menus: object[] }>} 변경 후 전체
 * errorCode: MENU_MOVE_INVALID, MENU_NOT_EXISTS, MENU_TITLE_USED, MENU_OUTDATED, MENU_SELF_LOCK
 */
export const moveMenu = (menuId, parentId, mdfyDt) =>
  api.put(`${menuPath(menuId)}/parent`, { parentId, mdfyDt });

/**
 * 메뉴 삭제 (MENU_DELETE)
 * @param {string} menuId
 * @returns {Promise<object>} 삭제한 메뉴
 * errorCode: MENU_NOT_EXISTS, MENU_HAS_CHILDREN, MENU_IN_USE, MENU_SELF_LOCK
 */
export const deleteMenu = (menuId) => api.delete(menuPath(menuId));
