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
    } catch (error) {
        console.error("JSON 변환 실패:", text);
        throw new Error("서버 응답이 JSON 형식이 아닙니다.");
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
 * 메뉴 목록 조회
 */
export const getAccessMenuList = async () => {
    return await get("/access/menus");
};

/**
 * 접근 권한 목록 조회
 */
export const getAccessList = async (params = {}) => {
    return await get("/access/actions", params);
};

/**
 * 접근 권한 신규 등록 및 수정
 */
export const saveAccessList = async (params) => {
    return await post("/access/save", params);
};