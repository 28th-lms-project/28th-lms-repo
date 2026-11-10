/**
 * 권한별 접근 권한(ACCESS_ROLE) API
 * 백엔드: backend/src/main/java/com/learningworks/accessrole/web/AccessRoleController.java
 * 역할 목록은 ROLE 모듈의 getRoles(api/admin/system/role/roleApi.js)를 사용합니다.
 */
import { api } from "../../../common/apiClient";

/**
 * 역할별 허용 권한 목록 조회
 * @param {{ roleId: string }} params
 * errorCode: GLOBAL_INVALID_PARAMETER, ROLE_NOT_EXISTS
 */
export const getAllowedPermissionList = (params) => api.get("/access-role/allowed", params);

/**
 * 역할별 미허용 권한 목록 조회
 * @param {{ roleId: string }} params
 * errorCode: GLOBAL_INVALID_PARAMETER, ROLE_NOT_EXISTS
 */
export const getDeniedPermissionList = (params) => api.get("/access-role/denied", params);

/**
 * 역할별 권한 저장 (전체 교체)
 * @param {{ roleId: string, actionIds: string[] }} params
 * @returns {Promise<object[]>} 저장 후 허용 권한 목록
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), ROLE_NOT_EXISTS, ACTION_NOT_EXISTS
 */
export const saveRolePermission = (params) => api.post("/access-role/save", params);
