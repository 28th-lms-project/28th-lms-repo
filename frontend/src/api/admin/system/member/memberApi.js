/**
 * 회원 관리 API (관리자)
 * 백엔드: backend/src/main/java/com/learningworks/member/web/MemberController.java
 *
 * 공통 errorCode (모든 함수)
 * - GLOBAL_FORBIDDEN: 권한 코드(MEMBER_*)가 없는 역할로 호출
 *
 * 대상 회원을 다루는 함수(modify · delete · resetPassword · changeRole) 공통 errorCode
 * - ROLE_SELF_CHANGE: 자기 자신을 대상으로 요청 (내 정보는 /members/me 사용)
 * - ROLE_TARGET_FORBIDDEN: 자신보다 높거나 같은 역할의 회원 (SUPER_ADMIN 은 제외)
 * - USER_NOT_EXISTS: 없거나 삭제된 회원
 */
import { api } from "../../../common/apiClient.js";

const memberPath = (memberId) => `/members/${encodeURIComponent(memberId)}`;

/**
 * 회원 목록 조회 (검색 + 페이징). 권한 코드: MEMBER_READ_LIST
 * @param {{ keyword?: string, roleId?: string, pageNo?: number, listSize?: number }} params
 *   pageNo 는 0부터 시작. 빈 값은 자동으로 제외된다.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{
 *   body: Array<{ id: string, name: string, baseRole: string, roleName: string, createDate: string, loginBlockDate: string | null }>,
 *   paginate: { pageNo: number, pageCount: number, listSize: number, groupStartPageNo: number, pageCountInGroup: number }
 * }>}
 */
export const getMembers = (params, options) =>
  api.getPage("/members", params, options);

/**
 * 회원 상세 조회. 권한 코드: MEMBER_READ_DETAIL
 * @param {string} memberId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ id: string, name: string, baseRole: string, roleName: string, githubUrl: string | null,
 *   createDate: string, modifyDate: string | null, pwdChangeDate: string | null,
 *   loginFailCount: number, loginBlockDate: string | null }>}
 * errorCode: USER_NOT_EXISTS
 */
export const getMember = (memberId, options) =>
  api.get(memberPath(memberId), undefined, options);

/**
 * 회원 등록. 권한 코드: MEMBER_CREATE
 * @param {{ id: string, password: string, name: string, githubUrl?: string, baseRole: string }} member
 * @returns {Promise<string>} 등록된 회원 ID
 * errorCode: GLOBAL_INVALID_PARAMETER(validations: id, password, name, baseRole),
 *            USER_USED(이미 사용 중인 ID), ROLE_NOT_EXISTS,
 *            ROLE_ASSIGN_FORBIDDEN(자신보다 높거나 같은 역할 · 최고 관리자 역할로 등록)
 */
export const createMember = (member) => api.post("/members", member);

/**
 * 회원 정보 수정 (이름 · GitHub 주소). 권한 코드: MEMBER_UPDATE
 * @param {string} memberId
 * @param {{ name: string, githubUrl?: string | null }} params githubUrl 을 비우면 삭제된다.
 * @returns {Promise<object>} 수정된 회원 상세 (getMember 와 같은 형태)
 * errorCode: GLOBAL_INVALID_PARAMETER(validations: name, githubUrl), 대상 회원 공통 errorCode
 */
export const modifyMember = (memberId, { name, githubUrl }) =>
  api.put(memberPath(memberId), { name, githubUrl: githubUrl?.trim() });

/**
 * 회원 삭제 (DEL_YN = 'Y'). 권한 코드: MEMBER_DELETE
 * @param {string} memberId
 * @returns {Promise<null>}
 * errorCode: 대상 회원 공통 errorCode
 */
export const deleteMember = (memberId) => api.delete(memberPath(memberId));

/**
 * 비밀번호 초기화. 로그인 실패 횟수와 잠금도 함께 해제된다. 권한 코드: MEMBER_RESET_PASSWORD
 * @param {string} memberId
 * @param {string} password 새 비밀번호 (8~20자)
 * @returns {Promise<null>}
 * errorCode: GLOBAL_INVALID_PARAMETER(validations: password), 대상 회원 공통 errorCode
 */
export const resetPassword = (memberId, password) =>
  api.put(`${memberPath(memberId)}/password`, { password });

/**
 * 회원 역할 변경. 지금과 같은 역할로 바꿔도 성공한다. 권한 코드: MEMBER_CHANGE_ROLE
 * 바뀐 역할의 메뉴 · 버튼 권한은 대상 회원이 새로고침해야 화면에 반영된다. (서버 권한은 즉시 반영)
 * @param {string} memberId
 * @param {string} roleId 지정할 역할 ID (예: "ROLE_TUTOR")
 * @returns {Promise<object>} 변경된 회원 상세 (getMember 와 같은 형태)
 * errorCode: GLOBAL_INVALID_PARAMETER(validations: roleId), ROLE_NOT_EXISTS,
 *            ROLE_ASSIGN_FORBIDDEN(자신보다 높거나 같은 역할로 지정), 대상 회원 공통 errorCode
 */
export const changeRole = (memberId, roleId) =>
  api.put(`${memberPath(memberId)}/role`, { roleId });
