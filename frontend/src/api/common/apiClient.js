/**
 * 공통 API 호출 함수
 *
 * 백엔드 공통 응답(ApiResponse)을 해석해서
 * - 성공(2xx): 응답의 body를 반환합니다.
 * - 실패(4xx · 5xx · 네트워크 오류): ApiError를 throw 합니다.
 *
 * 사용 방법은 frontend/docs/api-client-guide.md 를 참고하세요.
 */
import { decodeToken, getToken, isTokenExpired, removeToken } from "../../utils/tokenStorage";

/** 백엔드 주소. .env 파일의 VITE_API_BASE_URL 로 변경할 수 있습니다. */
const BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

/** 응답에 error 메시지가 없을 때 사용할 기본 메시지 */
const DEFAULT_MESSAGES = {
  0: "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.",
  400: "잘못된 요청입니다.",
  401: "로그인이 필요합니다.",
  403: "권한이 없습니다.",
  404: "요청한 정보를 찾을 수 없습니다.",
  405: "지원하지 않는 요청입니다.",
  409: "요청이 현재 상태와 충돌합니다.",
  413: "업로드 파일의 크기가 너무 큽니다.",
  415: "지원하지 않는 요청 형식입니다.",
  500: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

/** 네트워크 오류 · JSON이 아닌 응답일 때 사용하는 프론트 전용 errorCode */
export const CLIENT_ERROR_CODE = {
  NETWORK_ERROR: "CLIENT_NETWORK_ERROR",
  INVALID_RESPONSE: "CLIENT_INVALID_RESPONSE",
};

/**
 * API 실패 시 throw 되는 에러
 * - httpStatusCode: HTTP 상태 코드 (네트워크 오류는 0)
 * - errorCode:      백엔드 ErrorCode 이름 (예: "ROLE_NOT_EXISTS")
 * - message:        사용자에게 보여줄 메시지 (응답의 error)
 * - validations:    입력값 검증 실패 시 { 필드명: [메시지, ...] }, 없으면 null
 */
export class ApiError extends Error {
  constructor({ httpStatusCode, errorCode, message, validations }) {
    super(message);
    this.name = "ApiError";
    this.httpStatusCode = httpStatusCode;
    this.errorCode = errorCode ?? null;
    this.validations = validations ?? null;
  }
}

/**
 * 요청에 사용할 로그인 토큰을 반환합니다.
 * 토큰이 없거나 만료되었으면 null (만료된 토큰을 보내면 로그인이 필요 없는 API까지 거부될 수 있으므로 보내지 않음)
 */
const getAccessToken = () => {
  const token = getToken();
  if (!token || isTokenExpired(decodeToken(token))) {
    return null;
  }
  return token;
};

/** 쿼리스트링 생성. null · undefined · 빈 문자열은 제외하고, 배열은 같은 키로 여러 번 붙입니다. */
const buildUrl = (url, params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    values
      .filter((item) => item !== null && item !== undefined && item !== "")
      .forEach((item) => searchParams.append(key, item));
  });

  const queryString = searchParams.toString();
  const fullUrl = `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  return queryString ? `${fullUrl}?${queryString}` : fullUrl;
};

/** 응답 본문을 JSON으로 읽습니다. 본문이 없거나 JSON이 아니면 null */
const parseJson = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const request = async (method, url, { params, data, signal } = {}) => {
  const headers = { Accept: "application/json" };
  let body;

  if (data instanceof FormData) {
    // 파일 업로드: Content-Type은 브라우저가 boundary와 함께 자동 설정
    body = data;
  } else if (data !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response;
  try {
    response = await fetch(buildUrl(url, params), {
      method,
      headers,
      body,
      signal,
    });
  } catch (error) {
    // 요청 취소(AbortController)는 그대로 전달
    if (error.name === "AbortError") {
      throw error;
    }
    throw new ApiError({
      httpStatusCode: 0,
      errorCode: CLIENT_ERROR_CODE.NETWORK_ERROR,
      message: DEFAULT_MESSAGES[0],
    });
  }

  const result = await parseJson(response);

  if (response.ok) {
    return result;
  }

  // TODO: JWT 로그인 구현 시 401이면 토큰 재발급 또는 로그인 페이지로 이동
  if (response.status === 401 && accessToken && url !== "/login") {
    removeToken();
    window.location.replace("/login");
  }

  const status = response.status;
  throw new ApiError({
    httpStatusCode: status,
    errorCode: result?.errorCode ?? CLIENT_ERROR_CODE.INVALID_RESPONSE,
    message:
      result?.error ??
      DEFAULT_MESSAGES[status] ??
      DEFAULT_MESSAGES[status >= 500 ? 500 : 400],
    validations: result?.validations,
  });
};

/** 응답의 body만 반환 */
const requestBody = async (method, url, options) => {
  const result = await request(method, url, options);
  return result?.body ?? null;
};

/**
 * 공통 API 호출 함수
 *
 * options.signal: 요청 취소용 AbortSignal (useEffect 정리 함수에서 사용)
 */
export const api = {
  /** GET → body */
  get: (url, params, options) =>
    requestBody("GET", url, { ...options, params }),

  /** GET (페이징 목록) → { body, paginate, search } */
  getPage: async (url, params, options) => {
    const result = await request("GET", url, { ...options, params });
    return {
      body: result?.body ?? [],
      paginate: result?.paginate ?? null,
      search: result?.search ?? null,
    };
  },

  /** POST → body. data가 FormData이면 multipart로 전송 */
  post: (url, data, options) => requestBody("POST", url, { ...options, data }),

  /** PUT → body */
  put: (url, data, options) => requestBody("PUT", url, { ...options, data }),

  /** DELETE → body */
  delete: (url, params, options) =>
    requestBody("DELETE", url, { ...options, params }),
};
