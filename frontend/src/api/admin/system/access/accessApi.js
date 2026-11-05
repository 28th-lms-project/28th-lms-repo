
/** @format */

/**
 * 공통 응답 처리
 */
const handleResponse = async (response) => {
    const result = await response.json();

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
            ([, value]) => value !== null && value !== undefined && value !== ""
        )
    ).toString();

    const response = await fetch(
        queryString ? `${url}?${queryString}` : url,
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
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    return await handleResponse(response);
};

/**
 * 대메뉴 / 중메뉴 / 소메뉴 목록 조회
 */
export const getAccessMenuList = async (params = {}) => {
    return await get("/access/menus", params);
};

/**
 * 접근 권한 목록 조회
 * ACTION + MENU JOIN
 */
export const getAccessList = async (params = {}) => {
    return await get("/access/actions", params);
};

/**
 * 접근 권한 신규 추가 및 수정
 */
export const saveAccessList = async (params) => {
    return await post("/access/save", params);
};
