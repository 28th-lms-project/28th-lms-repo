const TOKEN_KEY = "accessToken";

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export function decodeToken(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];

    // base64url → base64 로 변환
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

    // atob 는 한글 같은 UTF-8 문자를 깨뜨리므로 바이트 단위로 다시 디코드
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );

    return JSON.parse(json);
  } catch {
    // 형식이 잘못된 토큰
    return null;
  }
}

// 만료 여부 확인
export function isTokenExpired(payload) {
  if (!payload || !payload.exp) {
    return true;
  }
  return payload.exp * 1000 <= Date.now();
}
