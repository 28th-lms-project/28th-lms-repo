# 프론트 공통 API 호출 가이드

> **⚠️ 사용 전제: 백엔드 컨트롤러가 반드시 `ApiResponse`를 반환해야 합니다.**
>
> 공통 API 호출 함수는 백엔드 공통 응답(`ApiResponse`)의 `body`를 꺼내서 반환합니다. 컨트롤러가 `ApiResponse`가 아닌 값(VO, List, String, `Map`, `ResponseEntity` 등)을 반환하면 **요청은 성공해도 데이터가 `null`로 반환**됩니다. 에러가 나지 않아서 원인을 찾기 어려우니 주의하세요.
>
> | 컨트롤러 반환값                                     | `api.get()` 결과     |
> | --------------------------------------------------- | -------------------- |
> | `ApiResponse.OK(data)`                              | `data` (정상)        |
> | VO · List 그대로                                    | `null` (데이터 유실) |
> | 문자열                                              | `null`               |
> | `{ responseCode, message, data }` 등 직접 만든 형식 | `null`               |
>
> 실패 응답도 같습니다. 서비스에서 던진 예외는 `GlobalExceptionHandler`가 공통 형식으로 응답하지만, 컨트롤러 안에 `@ExceptionHandler`를 따로 두고 다른 형식으로 응답하면 `errorCode`가 `CLIENT_INVALID_RESPONSE`가 되고 서버 메시지 대신 기본 메시지가 표시됩니다.
>
> **데이터가 `null`로 오거나 서버 에러 메시지가 표시되지 않으면, 먼저 백엔드 컨트롤러의 반환 타입이 `ApiResponse<T>`인지 확인하세요.** (`backend/docs/api-response-guide.md` 2장 참고)

---

백엔드 API는 모두 **공통 API 호출 함수(`api`)** 를 통해 호출합니다. 화면을 개발할 때는 **모듈 API 파일**에 URL만 적고, **컴포넌트**에서는 성공 데이터 사용과 에러 대응만 작성하면 됩니다.

- 성공하면 응답의 `body`가 그대로 반환됩니다. `responseCode`, `.data`, `.body`를 확인할 필요가 없습니다.
- 실패하면 `ApiError`가 throw 됩니다. `try-catch`로 받아서 `errorCode`, `message`, `validations`를 사용합니다.
- 백엔드 주소, 헤더, 응답 해석, (추후) 로그인 토큰은 공통 함수가 처리합니다. **컴포넌트나 모듈 API 파일에서 `fetch`를 직접 사용하지 마세요.**

백엔드 응답 형식은 `backend/docs/api-response-guide.md`를 참고하세요.

---

## 1. 구조

```text
[컴포넌트]            →  [모듈 API 파일]          →  [공통 API 호출 함수]        →  백엔드
Role.jsx                 roleApi.js                  apiClient.js
데이터 사용 · 에러 대응    URL · 메서드 정의             URL 조립, 헤더, 응답 해석
```

| 파일                                    | 역할               | 누가 작성        |
| --------------------------------------- | ------------------ | ---------------- |
| `src/api/common/apiClient.js`           | 공통 API 호출 함수 | 공통 (수정 금지) |
| `src/api/{메뉴 경로}/{모듈}Api.js`      | 모듈별 API 함수    | 각 담당자        |
| `src/components/{메뉴 경로}/{화면}.jsx` | 화면               | 각 담당자        |

예: `src/api/admin/system/role/roleApi.js`

---

## 2. 공통 API 호출 함수

```js
import { api } from "../../../common/apiClient";
```

| 함수                                  | HTTP   | 반환값                       |
| ------------------------------------- | ------ | ---------------------------- |
| `api.get(url, params?, options?)`     | GET    | `body`                       |
| `api.getPage(url, params?, options?)` | GET    | `{ body, paginate, search }` |
| `api.post(url, data?, options?)`      | POST   | `body`                       |
| `api.put(url, data?, options?)`       | PUT    | `body`                       |
| `api.delete(url, params?, options?)`  | DELETE | `body`                       |

| 인자      | 설명                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `url`     | 백엔드 경로. `/roles`처럼 `/`로 시작합니다. 백엔드 주소(`http://localhost:8080`)는 자동으로 붙습니다.  |
| `params`  | 쿼리스트링 객체. `null` · `undefined` · 빈 문자열 값은 자동으로 제외되고, 배열은 같은 키로 반복됩니다. |
| `data`    | 요청 본문. 객체는 JSON으로 전송되고, `FormData`는 파일 업로드(multipart)로 전송됩니다.                 |
| `options` | `{ signal }` — 요청 취소용 `AbortSignal` (5장 참고)                                                    |

### 백엔드 주소 변경

기본값은 `http://localhost:8080`입니다. 바꿔야 할 때는 `frontend/.env.local` 파일을 만들어 설정합니다. (Git에 올리지 마세요.)

```text
VITE_API_BASE_URL=http://localhost:9090
```

---

## 3. 모듈 API 파일 작성

```js
/**
 * 역할(ROLE) API
 */
import { api } from "../../../common/apiClient";

/** 역할 목록 조회 */
export const getRoles = () => api.get("/roles");

/** 역할 생성 */
export const createRole = (role) => api.post("/roles", role);

/** 역할 이름 변경 */
export const modifyRole = (roleId, roleDisplayName) =>
  api.put(`/roles/${encodeURIComponent(roleId)}`, { roleDisplayName });

/** 역할 삭제 */
export const deleteRole = (roleId) =>
  api.delete(`/roles/${encodeURIComponent(roleId)}`);

/** 검색 + 페이징 목록 */
export const getCourses = (search) => api.getPage("/courses", search);
```

### 규칙

1. 함수 하나가 API 하나입니다. 이름은 `get` · `create` · `modify` · `delete` + 대상으로 짓습니다.
2. 요청 데이터의 필드명은 **백엔드 요청 VO의 필드명과 같게** 작성합니다. (`roleDisplayName` ↔ `RegistRoleVO.roleDisplayName`)
3. URL 경로에 값을 넣을 때는 `encodeURIComponent()`로 감쌉니다.
4. 함수 주석에 **반환되는 데이터 형태**와 **화면에서 대응해야 하는 errorCode**를 적어두면 컴포넌트 작성자가 편합니다.

### 하지 말 것

- 모듈 API 파일에서 `fetch` 직접 사용, `get` / `post` / `handleResponse` 함수를 새로 만들기
- 모듈 API 파일에서 `try-catch`로 에러를 잡기 (컴포넌트까지 그대로 전달되어야 합니다)
- `Content-Type`, `Authorization` 헤더 직접 설정

---

## 4. 컴포넌트에서 사용

### 조회

```jsx
const [roles, setRoles] = useState([]);

const loadRoles = async () => {
  try {
    const { roleList } = await getRoles(); // 응답의 body가 바로 반환됨
    setRoles(roleList);
  } catch (error) {
    alert(error.message); // "서버에서 오류가 발생했습니다. ..."
  }
};
```

### 등록 (입력값 검증 메시지 표시)

```jsx
const [fieldErrors, setFieldErrors] = useState({});

const handleSubmit = async () => {
  setFieldErrors({});
  try {
    await createRole({ roleId, roleDisplayName });
    alert("역할이 등록되었습니다."); // 성공 메시지는 프론트에서 작성
    loadRoles();
  } catch (error) {
    if (error.validations) {
      setFieldErrors(error.validations); // { roleId: ["역할ID를 입력해주세요."] }
    } else {
      alert(error.message); // "이미 사용 중인 역할 ID입니다."
    }
  }
};

// 입력칸 아래
{
  fieldErrors.roleId?.map((message) => <p key={message}>{message}</p>);
}
```

### errorCode로 분기

```jsx
const handleDelete = async (roleId) => {
  try {
    await deleteRole(roleId);
    loadRoles();
  } catch (error) {
    if (error.errorCode === "ROLE_IN_USE") {
      openMoveUsersDialog(roleId); // 사용 중인 회원 이동 화면 열기
      return;
    }
    alert(error.message);
  }
};
```

### 규칙

1. API 호출은 항상 `try-catch`로 감쌉니다. 실패 시 반드시 throw 됩니다.
2. 에러 종류는 **`errorCode`로 구분**합니다. `message` 문구는 바뀔 수 있으므로 문자열 비교에 사용하지 마세요.
3. 별도로 대응할 필요가 없는 에러는 `error.message`를 그대로 보여주면 됩니다. 사용자용 한글 메시지가 담겨 있습니다.
4. 성공 메시지("저장되었습니다." 등)는 백엔드가 보내지 않습니다. 필요하면 프론트에서 작성합니다.

---

## 5. 에러 객체 (ApiError)

| 필드             | 설명                                                      | 예시                                     |
| ---------------- | --------------------------------------------------------- | ---------------------------------------- |
| `httpStatusCode` | HTTP 상태 코드. 서버에 연결하지 못하면 `0`                | `404`                                    |
| `errorCode`      | 백엔드 `ErrorCode` 이름                                   | `"ROLE_NOT_EXISTS"`                      |
| `message`        | 사용자에게 보여줄 메시지 (백엔드 응답의 `error`)          | `"존재하지 않는 역할입니다."`            |
| `validations`    | 입력값 검증 실패 시 `필드명 → 메시지 목록`. 없으면 `null` | `{ roleId: ["역할ID를 입력해주세요."] }` |

백엔드가 공통 응답을 보내지 못한 경우에도 같은 형태의 에러가 throw 됩니다.

| 상황                                     | httpStatusCode | errorCode                 | message                          |
| ---------------------------------------- | -------------- | ------------------------- | -------------------------------- |
| 백엔드 서버가 꺼져 있음 · 네트워크 오류  | `0`            | `CLIENT_NETWORK_ERROR`    | "서버에 연결할 수 없습니다. ..." |
| JSON이 아닌 응답 (프록시 에러 페이지 등) | 실제 상태 코드 | `CLIENT_INVALID_RESPONSE` | 상태 코드별 기본 메시지          |

### 요청 취소 (선택)

화면을 벗어난 뒤 늦게 도착한 응답으로 state가 바뀌는 것을 막으려면 `signal`을 넘깁니다. 취소된 요청은 `ApiError`가 아니라 `AbortError`로 throw 되므로 무시합니다.

```jsx
useEffect(() => {
  const controller = new AbortController();

  getRoles({ signal: controller.signal })
    .then(({ roleList }) => setRoles(roleList))
    .catch((error) => {
      if (error.name !== "AbortError") alert(error.message);
    });

  return () => controller.abort();
}, []);
```

> 모듈 API 함수에서 `options`를 받아 `api`에 넘겨줘야 사용할 수 있습니다. 예: `export const getRoles = (options) => api.get("/roles", undefined, options);`

---

## 6. 자주 쓰는 errorCode

공통 errorCode입니다. 모듈별 errorCode는 `backend/src/main/java/com/learningworks/common/exceptions/enums/ErrorCode.java`를 확인하세요.

| errorCode                  | 상태 | 상황                  | 프론트 대응 예시                   |
| -------------------------- | ---- | --------------------- | ---------------------------------- |
| `GLOBAL_INVALID_PARAMETER` | 400  | 입력값 검증 실패      | `validations`를 입력칸 아래 표시   |
| `GLOBAL_INVALID_JSON`      | 400  | 요청 데이터 형식 오류 | 요청 코드 확인 (개발 중 오류)      |
| `GLOBAL_UNAUTHORIZED`      | 401  | 로그인 필요           | 로그인 페이지로 이동 (JWT 적용 후) |
| `GLOBAL_FORBIDDEN`         | 403  | 권한 없음             | 메시지 표시                        |
| `GLOBAL_NOT_FOUND_URL`     | 404  | 존재하지 않는 URL     | 요청 URL 확인 (개발 중 오류)       |
| `GLOBAL_DUPLICATED`        | 409  | 중복 데이터           | 메시지 표시                        |
| `GLOBAL_SYSTEM_ERROR`      | 500  | 서버 오류             | 메시지 표시                        |

---

## 7. 체크리스트

- [ ] 모듈 API 파일이 `api.get` / `api.post` / `api.put` / `api.delete` / `api.getPage`만 사용하는가?
- [ ] `fetch`, `handleResponse`, `Content-Type` 헤더를 직접 작성하지 않았는가?
- [ ] 요청 데이터의 필드명이 백엔드 요청 VO와 같은가?
- [ ] 컴포넌트에서 `responseCode === "SUCCESS"`, `response.data` 같은 확인 없이 반환값을 바로 사용하는가?
- [ ] API 호출을 `try-catch`로 감쌌는가?
- [ ] 에러 종류를 `message`가 아니라 `errorCode`로 구분하는가?
- [ ] 입력 화면에서 `validations` 메시지를 표시하는가?

---

## 참고: 로그인 기능 담당자

### 처리된 것

- 로그인 토큰은 `src/utils/tokenStorage.js`의 `getToken()`에서 읽어 **모든 요청에 `Authorization: Bearer {토큰}` 헤더로 자동 첨부**됩니다.
- 토큰이 없거나 만료되었으면 헤더를 붙이지 않습니다. 만료된 토큰을 보내면 로그인이 필요 없는 API까지 거부될 수 있기 때문입니다.
- 로그인 성공 시 `loginSuccess` 액션으로 토큰을 저장하면 그 이후 요청부터 바로 적용됩니다. 화면이나 모듈 API 파일에서 토큰을 따로 다룰 필요가 없습니다.

### 아직 처리되지 않은 것

JWT 인증을 구현할 때 `src/api/common/apiClient.js`에서 처리합니다.

- 401 응답 시 로그아웃(`logout` 액션) 후 로그인 페이지 이동, 또는 토큰 재발급 (`TODO` 주석 위치)
- 쿠키로 토큰을 주고받는 방식을 선택한다면 `fetch` 옵션에 `credentials: "include"` 추가가 필요합니다.
