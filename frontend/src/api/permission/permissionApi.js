/**
 * 내 권한 API
 * 백엔드: backend/src/main/java/com/learningworks/common/action/web/ActionCodeController.java
 */
import { api } from "../common/apiClient";

/**
 * 로그인 사용자의 현재 역할과 허용된 권한 코드
 * SUPER_ADMIN이면 superAdmin: true, actionCodes: [] (모든 권한 허용으로 처리)
 * 서버 권한 검사 설정과 관계없이 항상 동작한다.
 * @returns {Promise<{ roleId: string, roleDisplayName: string, superAdmin: boolean, actionCodes: string[] }>}
 * errorCode: GLOBAL_UNAUTHORIZED(비로그인)
 */
export const getMyActionCodes = (options) => api.get("/action-codes/me", undefined, options);
