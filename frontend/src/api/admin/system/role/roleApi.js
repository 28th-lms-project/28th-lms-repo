/**
 * 역할(ROLE) API
 * 백엔드: backend/src/main/java/com/learningworks/role/web/RoleController.java
 */
import { api } from "../../../common/apiClient";

const rolePath = (roleId) => `/roles/${encodeURIComponent(roleId)}`;

/**
 * 역할 목록 조회 (상위 역할부터)
 * @returns {Promise<{ roleCount: number, roleList: { roleId: string, roleDisplayName: string }[] }>}
 */
export const getRoles = (options) => api.get("/roles", undefined, options);

/**
 * 역할 생성 (ROLE_STUDENT 바로 위 순위로 추가)
 * @param {{ roleId: string, roleDisplayName: string }} role
 * @returns {Promise<{ roleId: string, roleDisplayName: string }>}
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), ROLE_ID_USED
 */
export const createRole = (role) => api.post("/roles", role);

/**
 * 역할 이름 변경
 * @param {string} roleId
 * @param {string} roleDisplayName
 * @returns {Promise<{ roleId: string, roleDisplayName: string }>}
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), ROLE_NOT_EXISTS
 */
export const modifyRole = (roleId, roleDisplayName) => api.put(rolePath(roleId), { roleDisplayName });

/**
 * 역할 순서 변경 (드래그&드롭 후 전체 순서를 전송)
 * 첫 번째는 ROLE_SUPER_ADMIN, 마지막은 ROLE_STUDENT 이어야 합니다.
 * @param {string[]} roleIds 상위 역할부터 정렬된 전체 역할 ID 목록
 * @returns {Promise<{ roleCount: number, roleList: { roleId: string, roleDisplayName: string }[] }>}
 * errorCode: ROLE_ORDER_INVALID, ROLE_ORDER_OUTDATED(다른 사용자가 역할을 추가 · 삭제함 → 목록 다시 조회)
 */
export const modifyRoleOrder = (roleIds) => api.put("/roles/order", { roleIds });

/**
 * 역할 삭제
 * @param {string} roleId
 * @returns {Promise<{ roleId: string, roleDisplayName: string }>} 삭제된 역할
 * errorCode: ROLE_PROTECTED, ROLE_NOT_EXISTS, ROLE_IN_USE(사용 중인 회원을 먼저 다른 역할로 이동)
 */
export const deleteRole = (roleId) => api.delete(rolePath(roleId));

/**
 * 역할을 사용 중인 활성 회원 목록
 * @param {string} roleId
 * @returns {Promise<{ id: string, name: string }[]>}
 */
export const getRoleUsers = (roleId, options) => api.get(`${rolePath(roleId)}/users`, undefined, options);

/**
 * 역할을 사용 중인 회원을 다른 역할로 일괄 이동 (로그인 필요)
 * @param {string} roleId 현재 역할
 * @param {string} replaceRoleId 이동할 역할
 * @returns {Promise<{ fromRoleId: string, toRoleId: string, movedCount: number }>}
 * errorCode: ROLE_MOVE_SAME, ROLE_TARGET_FORBIDDEN, ROLE_ASSIGN_FORBIDDEN, GLOBAL_UNAUTHORIZED
 */
export const moveRoleUsers = (roleId, replaceRoleId) => api.put(`${rolePath(roleId)}/users`, { replaceRoleId });
