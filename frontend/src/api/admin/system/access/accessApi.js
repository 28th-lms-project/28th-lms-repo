/**
 * 접근 권한(ACCESS) API
 * 백엔드: backend/src/main/java/com/learningworks/access/web/AccessController.java
 */
import { api } from "../../../common/apiClient";

// 메뉴 목록은 메뉴 API(api/admin/system/menu/menuApi.js)의 getMenus를 사용합니다.

/**
 * 접근 권한 목록 조회
 * @param {{ topMenuId?: string, midMenuId?: string, btmMenuId?: string, actionName?: string }} params
 */
export const getAccessList = (params = {}) => api.get("/access/actions", params);

/**
 * 권한 코드 목록 조회 (ACTION 등록 드롭다운용, 도메인 → 행위)
 * 백엔드: backend/src/main/java/com/learningworks/common/action/web/ActionCodeController.java
 * @returns {Promise<{ actionCodeCount: number, domainList: { domain: string, actionList: { actionCode: string, action: string, description: string, registered: boolean }[] }[] }>}
 */
export const getActionCodes = () => api.get("/action-codes");

/**
 * 접근 권한 신규 등록 및 수정
 * @param {{ addedList: object[], modifiedList: object[] }} params
 * @returns {Promise<object[]>} 저장 후 전체 접근 권한 목록
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), GLOBAL_BAD_REQUEST, ACTION_CODE_NOT_EXISTS, ACTION_CODE_USED, ACTION_NOT_EXISTS, ACTION_FAILURE_SAVE
 */
export const saveAccessList = (params) => api.post("/access/save", params);
