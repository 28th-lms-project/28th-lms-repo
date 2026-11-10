/**
 * 역할 관리 화면 공통 상수 · 함수
 */

export const SUPER_ADMIN_ROLE_ID = "ROLE_SUPER_ADMIN";
export const STUDENT_ROLE_ID = "ROLE_STUDENT";

// 보호 역할: 삭제 불가, 순서 고정 (SUPER_ADMIN 맨 위, STUDENT 맨 아래)
const PROTECTED_ROLE_IDS = [SUPER_ADMIN_ROLE_ID, STUDENT_ROLE_ID];

export const isProtectedRole = (roleId) => PROTECTED_ROLE_IDS.includes(roleId);

// "ROLE_TUTOR(강사)"
export const formatRole = (role) => `${role.roleId}(${role.roleDisplayName})`;

// 입력값 검증 실패면 필드별 메시지를, 아니면 서버 에러 메시지를 반환
export const getErrorMessage = (error) =>
    error.validations
        ? Object.values(error.validations).flat().join("\n")
        : error.message;

export const isAbortError = (error) => error?.name === "AbortError";

// 역할 ID 접두어. 화면에는 고정 표시하고, 입력칸에는 뒷부분만 입력받는다.
export const ROLE_ID_PREFIX = "ROLE_";

// 백엔드 RegistRoleVO 검증과 같은 규칙 (역할 ID 전체 20자 이하 → 접두어 뒤 15자 이하)
const ROLE_ID_MAX_LENGTH = 20;
export const ROLE_ID_SUFFIX_MAX_LENGTH = ROLE_ID_MAX_LENGTH - ROLE_ID_PREFIX.length;
const ROLE_ID_SUFFIX_PATTERN = /^[A-Z0-9]+(_[A-Z0-9]+)*$/;

/**
 * 역할 ID 입력값 정리: 대문자 변환, 붙여넣은 값의 "ROLE_" 접두어 제거, 최대 길이 자르기
 * (maxLength 속성을 쓰면 "ROLE_..." 붙여넣기가 접두어 제거 전에 잘리므로 여기서 자름)
 */
export const normalizeRoleIdSuffix = (value) => {
    const upper = value.toUpperCase();
    const suffix = upper.startsWith(ROLE_ID_PREFIX) ? upper.slice(ROLE_ID_PREFIX.length) : upper;
    return suffix.slice(0, ROLE_ID_SUFFIX_MAX_LENGTH);
};

export const EMPTY_CREATE_ERRORS = { roleId: [], roleDisplayName: [] };

/**
 * 역할 생성 입력값 검사 (서버 요청 줄이기용, 서버 검증이 최종)
 * 메시지 키는 서버 validations와 같게 roleId / roleDisplayName
 * @param {{ roleIdSuffix: string, roleDisplayName: string }} newRole roleIdSuffix는 "ROLE_" 뒤의 값
 * @returns {{ roleId: string[], roleDisplayName: string[] }}
 */
export const validateNewRole = ({ roleIdSuffix, roleDisplayName }) => {
    const errors = { roleId: [], roleDisplayName: [] };

    if (!roleIdSuffix) {
        errors.roleId.push("역할ID를 입력해주세요.");
    } else {
        if (roleIdSuffix.length > ROLE_ID_SUFFIX_MAX_LENGTH) {
            errors.roleId.push(
                `역할ID는 ${ROLE_ID_PREFIX} 뒤 ${ROLE_ID_SUFFIX_MAX_LENGTH}자 이하로 입력해주세요.`
            );
        }
        if (!ROLE_ID_SUFFIX_PATTERN.test(roleIdSuffix)) {
            errors.roleId.push(
                "역할ID는 대문자·숫자와 단어 구분용 언더스코어(_)만 사용할 수 있습니다. (예: SUPER_ADMIN)"
            );
        }
    }

    const name = roleDisplayName.trim();
    if (!name) {
        errors.roleDisplayName.push("역할 이름을 입력해주세요.");
    } else if (name.length > 100) {
        errors.roleDisplayName.push("역할 이름은 100자 이하로 입력해주세요.");
    }

    return errors;
};

export const hasErrors = (errors) =>
    Object.values(errors).some((messages) => messages.length > 0);
