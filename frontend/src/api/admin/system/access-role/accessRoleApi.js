/** @format */

// 백엔드 주소
const BASE_URL = "http://localhost:8080";

/**
 * 공통 응답 처리
 */
const handleResponse = async (response) => {
    const text = await response.text();

    let result;

    try {
        result = text ? JSON.parse(text) : {};
    } catch {
        throw new Error(
            `JSON 응답이 아닙니다. 실제 응답: ${text.substring(0, 200)}`
        );
    }

    if (!response.ok) {
        throw new Error(
            result.message || `요청 실패 (${response.status})`
        );
    }

    return result;
};


/**
 * GET 요청
 */
const get = async (url, params = {}) => {
    const queryString = new URLSearchParams(
        Object.entries(params).filter(
            ([, value]) =>
                value !== null &&
                value !== undefined &&
                value !== ""
        )
    ).toString();

    const response = await fetch(
        `${BASE_URL}${url}${queryString ? `?${queryString}` : ""}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    return await handleResponse(response);
};


/**
 * POST 요청
 */
const post = async (url, data = {}) => {
    const response = await fetch(`${BASE_URL}${url}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    return await handleResponse(response);
};


/**
 * 역할 목록 조회
 */
export const getRoleList = async (params = {}) => {
    return await get("/access-role/roles", params);
};


/**
 * 역할별 허용 권한 목록 조회
 */
export const getAllowedPermissionList = async (params = {}) => {
    return await get("/access-role/allowed", params);
};


/**
 * 역할별 미허용 권한 목록 조회
 */
export const getDeniedPermissionList = async (params = {}) => {
    return await get("/access-role/denied", params);
};


/**
 * 역할별 권한 저장
 */
export const saveRolePermission = async (params) => {
    return await post("/access-role/save", params);
};