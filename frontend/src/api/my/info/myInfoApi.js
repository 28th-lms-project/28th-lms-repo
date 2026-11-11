/**
 * 내 정보 API
 * 백엔드: backend/src/main/java/com/learningworks/member/web/MemberController.java
 */
import { api } from "../../common/apiClient";

/**
 * 현재 비밀번호 확인 (내 정보 수정 화면 진입 전)
 * 실패 횟수는 로그인과 공유한다. 불일치는 401 이 아닌 400 으로 응답한다.
 * @param {string} password 현재 비밀번호
 * @returns {Promise<null>}
 * errorCode: GLOBAL_BAD_REQUEST(비밀번호 불일치), USER_BLOCKED_LOGIN(잠긴 계정), GLOBAL_INVALID_PARAMETER(validations)
 */
export const verifyPassword = (password) =>
  api.post("/members/me/password/verify", { password });

/**
 * 내 정보 조회
 * @returns {Promise<{ id: string, name: string, githubUrl: string | null, baseRole: string, createDate: string, modifyDate: string | null }>}
 * errorCode: GLOBAL_UNAUTHORIZED(비로그인)
 */
export const getMyInfo = (options) =>
  api.get("/members/me", undefined, options);

/**
 * 내 정보 수정 (이름 · GitHub 주소). 서버에서 비밀번호를 다시 확인한다.
 * @param {{ name: string, githubUrl: string, password: string }} params password 는 진입 시 확인한 비밀번호
 * @returns {Promise<{ id: string, name: string, githubUrl: string | null, baseRole: string, createDate: string, modifyDate: string }>} 수정된 내 정보
 * errorCode: GLOBAL_INVALID_PARAMETER(validations: name, githubUrl), GLOBAL_BAD_REQUEST(비밀번호 불일치), USER_BLOCKED_LOGIN
 */
export const updateInfo = ({ name, githubUrl, password }) =>
  api.put("/members/me", { name, githubUrl: githubUrl.trim(), password });

/**
 * 비밀번호 변경
 * @param {{ currentPassword: string, newPassword: string, newPasswordConfirm: string }} params
 * @returns {Promise<null>}
 * errorCode: GLOBAL_INVALID_PARAMETER(validations: newPassword, newPasswordConfirm, newPasswordConfirmed, newPasswordDifferent),
 *            GLOBAL_BAD_REQUEST(현재 비밀번호 불일치), USER_BLOCKED_LOGIN
 */
export const updatePassword = ({
  currentPassword,
  newPassword,
  newPasswordConfirm,
}) =>
  api.put("/members/me/password", {
    currentPassword,
    newPassword,
    newPasswordConfirm,
  });
