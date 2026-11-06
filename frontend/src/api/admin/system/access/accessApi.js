/**
 * 접근 권한(ACCESS) API
 * 백엔드: backend/src/main/java/com/learningworks/access/web/AccessController.java
 */
import { api } from "../../../common/apiClient";

/**
 * 메뉴 목록 조회
 */
export const getAccessMenuList = () => api.get("/access/menus");

/**
 * 접근 권한 목록 조회
 * @param {{ topMenuId?: string, midMenuId?: string, btmMenuId?: string, actionName?: string }} params
 */
export const getAccessList = (params = {}) => api.get("/access/actions", params);

/**
 * 접근 권한 신규 등록 및 수정
 * @param {{ addedList: object[], modifiedList: object[] }} params
 * @returns {Promise<object[]>} 저장 후 전체 접근 권한 목록
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), GLOBAL_BAD_REQUEST, ACTION_NOT_EXISTS, ACTION_FAILURE_SAVE
 */
export const saveAccessList = (params) => api.post("/access/save", params);
