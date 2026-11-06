# 코드 변경 요청 (R)

처리 규칙은 `README.md`를 따릅니다. 각 항목의 `현재 상태`를 코드에서 직접 확인한 뒤 판단해 주세요.

> 최신화: 2026-11-06, `feature/role` 커밋 `644fe80` 기준 (`feature/access-role`의 `fafc7bc`, `a6961c3`과 `dev`의 `0e71877`까지 반영)

| ID | 제목 | 분류 | 우선순위 | 선행 조건 | 진행 상태 |
| --- | --- | --- | --- | --- | --- |
| R-01 | 컨트롤러 공통 응답(ApiResponse) 전환 | 공통화 | 높음 | 없음 | 대기 |
| R-02 | 예외를 LearningworksException으로 전환 | 공통화 · 버그 | 높음 | R-01 | 대기 |
| R-03 | 요청 VO 입력값 검증(@Valid) 적용 | 공통화 | 중간 | R-01 | 대기 |
| R-04 | ACTION_ID 타입을 String으로 통일 | 버그 | 높음 | 없음 | **완료** (`fafc7bc`) |
| R-05 | `updateAccess` SQL 문법 확인 | 버그 의심 | 높음 | 없음 | **완료** (`0e71877`) |
| R-06 | 프론트 응답 처리 전환 | 공통화 | 높음 | R-01, 공통 API 클라이언트 제공 | 대기 (클라이언트 제공 완료) |
| R-07 | 역할 목록 API를 `GET /roles`로 통합 | 중복 제거 | 중간 | D-01 논의 불필요, 단독 진행 가능 | 대기 |
| R-08 | 사용하지 않는 import 정리 | 정리 | 낮음 | 없음 | 대기 |

---

## R-01. 컨트롤러 공통 응답(ApiResponse) 전환

### 대상 파일
- `backend/src/main/java/com/learningworks/accessrole/web/AccessRoleController.java`
- `backend/src/main/java/com/learningworks/access/web/AccessController.java`

### 현재 상태
- 두 컨트롤러 모두 `ResponseEntity<Map<String, Object>>`에 `{ responseCode, message, data }`를 담아 반환합니다 (`success()`, `response()` 헬퍼).
- `AccessRoleController`에 컨트롤러 전용 `@ExceptionHandler(IllegalArgumentException.class)`가 있습니다. 컨트롤러 내부 핸들러는 `GlobalExceptionHandler`보다 우선하므로, **이 컨트롤러의 에러만 다른 형식**(`responseCode: "FAIL"`)으로 응답됩니다.

### 요청 내용
1. 모든 핸들러 메서드의 반환 타입을 `ApiResponse<T>`로 변경
   - 조회: `ApiResponse.OK(list)`
   - 저장: 아래 3번 참고
2. `success()`, `response()` 헬퍼와 `AccessRoleController`의 `@ExceptionHandler` 메서드 삭제
3. 저장 API의 반환값
   - `ApiResponse.OK(null)`은 `body` 필드가 빠진 응답이 되므로 사용하지 않습니다.
   - 추천: `/access-role/save`는 **저장 후의 허용 권한 목록**(`getAllowedPermissionList(roleId)` 결과)을, `/access/save`는 **저장 후의 접근 권한 목록**을 반환
4. 성공 메시지(`"권한이 저장되었습니다."` 등)는 응답에서 제거하고 프론트에서 표시 (D-06 참고)
5. `ResponseEntity`는 사용하지 않습니다. HTTP 상태는 `ApiResponse`의 값으로 자동 설정됩니다.

### 변경 예시

```java
@GetMapping("/allowed")
public ApiResponse<List<AccessRolePermissionVO>> getAllowedPermissionList(
        @RequestParam String roleId) {
    return ApiResponse.OK(accessRoleService.getAllowedPermissionList(roleId));
}

@PostMapping("/save")
public ApiResponse<List<AccessRolePermissionVO>> saveRolePermission(
        @Valid @RequestBody AccessRoleSaveRequestVO request) {
    accessRoleService.saveRolePermission(request);
    return ApiResponse.OK(accessRoleService.getAllowedPermissionList(request.getRoleId()));
}
```

### 완료 조건
- 두 컨트롤러에 `ResponseEntity`, `Map<String, Object>`, `@ExceptionHandler`가 남아 있지 않음
- 모든 API가 가이드의 응답 형식으로 응답 (Postman 등으로 확인)

### 처리 결과
- 상태:
- 판단 근거:
- 변경 내용:
- ROLE 담당자에게 요청:

---

## R-02. 예외를 LearningworksException으로 전환

### 대상 파일
- `backend/src/main/java/com/learningworks/accessrole/service/AccessRoleServiceImpl.java`
- `backend/src/main/java/com/learningworks/access/service/AccessServiceImpl.java`
- `backend/src/main/java/com/learningworks/common/exceptions/enums/ErrorCode.java` (상수 추가만)

### 현재 상태
- 두 서비스가 `IllegalArgumentException`, `IllegalStateException`을 던집니다.
- **`AccessController`에는 전용 예외 핸들러가 없어서**, `/access/save`의 입력값 오류(예: "접근 권한명과 대·중·소 메뉴를 모두 입력해주세요.")가 공통 `RuntimeException` 핸들러로 처리됩니다. 그 결과 **HTTP 500, "요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요."**로 응답되고, 원래 메시지는 사용자에게 전달되지 않습니다.
- `AccessRoleController`는 R-01에서 전용 핸들러를 제거하면 같은 문제가 생깁니다.

### 요청 내용
아래 표를 기준으로 전환해 주세요. 입력값 누락 검사는 R-03(VO 검증)으로 옮기면 서비스 코드에서 삭제할 수 있습니다.

| 위치 | 현재 | 변경 |
| --- | --- | --- |
| `AccessRoleServiceImpl.saveRolePermission` — request/roleId null 검사 | `IllegalArgumentException("역할 정보가 없습니다.")` | R-03의 `@NotBlank`로 대체 후 삭제 |
| `AccessRoleServiceImpl.saveRolePermission` — 없는 ACTION 포함 | `IllegalArgumentException("존재하지 않는 접근 권한이 포함되어 있습니다.")` | `LearningworksException(ErrorCode.ACTION_NOT_EXISTS)` |
| `AccessRoleServiceImpl.validateRole` — roleId 없음 | `IllegalArgumentException("역할 ID가 없습니다.")` | R-03의 `@NotBlank`로 대체 후 삭제 |
| `AccessRoleServiceImpl.validateRole` — 역할 없음 | `IllegalArgumentException("존재하지 않는 역할입니다.")` | `LearningworksException(ErrorCode.ROLE_NOT_EXISTS)` (이미 존재) |
| `AccessServiceImpl.saveAccess` — request null | `IllegalArgumentException("저장할 데이터가 없습니다.")` | R-03 검증으로 대체 또는 `ErrorCode.GLOBAL_BAD_REQUEST` |
| `AccessServiceImpl.validateAccess` — 필수값 누락 | `IllegalArgumentException(...)` | R-03의 `@NotBlank`로 대체 후 삭제 |
| `AccessServiceImpl.saveAccess` — 수정 대상 actionId 없음 | `IllegalArgumentException("수정할 접근 권한 ID가 없습니다.")` | `ErrorCode.GLOBAL_BAD_REQUEST` 또는 R-03 검증 |
| `AccessServiceImpl.saveAccess` — insert 결과 != 1 | `IllegalStateException("접근 권한 등록에 실패했습니다.")` | `LearningworksException(ErrorCode.ACTION_FAILURE_SAVE)` |
| `AccessServiceImpl.saveAccess` — update 결과 != 1 | `IllegalStateException("접근 권한 수정에 실패했습니다.")` | **0건이면 대상 없음** → `ErrorCode.ACTION_NOT_EXISTS` (404) |

`ErrorCode.java`에 추가할 상수 (이름 · 문구는 조정 가능):

```java
// 404 NOT FOUND 섹션
ACTION_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 접근 권한이 포함되어 있습니다."), //

// 500 INTERNAL SERVER ERROR 섹션
ACTION_FAILURE_SAVE(HttpStatus.INTERNAL_SERVER_ERROR, "접근 권한 저장을 실패했습니다."), //
```

### 완료 조건
- 두 서비스에 `IllegalArgumentException`, `IllegalStateException`이 남아 있지 않음
- `/access/save`에 필수값을 비워 요청하면 500이 아니라 400 + `validations`(또는 해당 ErrorCode)로 응답

### 처리 결과
- 상태:
- 판단 근거:
- 변경 내용:
- ROLE 담당자에게 요청:

---

## R-03. 요청 VO 입력값 검증(@Valid) 적용

### 대상 파일
- `backend/src/main/java/com/learningworks/accessrole/vo/request/AccessRoleSaveRequestVO.java`
- `backend/src/main/java/com/learningworks/access/vo/request/AccessSaveRequestVO.java`
- `backend/src/main/java/com/learningworks/access/vo/response/AccessVO.java` (요청 본문으로도 사용됨)
- 두 컨트롤러

### 현재 상태
- 요청 VO에 검증 어노테이션이 없고, 서비스에서 null · 빈 값을 직접 검사합니다.
- `@RequestParam String roleId`(`/access-role/allowed`, `/access-role/denied`)에 형식 검증이 없습니다.

### 요청 내용
1. `AccessRoleSaveRequestVO`

```java
@NotBlank(message = "역할ID를 입력해주세요.")
@Pattern(regexp = RoleConstants.ROLE_ID_PATTERN_ALLOW_EMPTY, message = "역할ID 형식이 올바르지 않습니다.")
private String roleId;

@NotNull(message = "접근 권한 목록을 입력해주세요.")  // 빈 배열은 허용 (= 모든 권한 해제)
private List<@NotBlank String> actionIds;           // R-04 참고
```

2. `AccessSaveRequestVO`: `private List<@Valid AccessVO> addedList;`, `modifiedList`도 동일
3. `AccessVO`: `actionName`, `topMenuId`, `midMenuId`, `btmMenuId`에 `@NotBlank(message = ...)`, `actionName`에 DB 컬럼 길이에 맞춘 `@Size(max = n)`
4. 컨트롤러의 `@RequestBody` 앞에 `@Valid`
5. `@RequestParam String roleId` 앞에 `@NotBlank @Pattern(regexp = RoleConstants.ROLE_ID_PATTERN)`
6. **컨트롤러 클래스에 `@Validated`를 붙이지 마세요.** (가이드 참고)
7. (선택) `AccessController.selectAccessList`는 검색 조건 4개를 `@RequestParam`으로 받아 `AccessSearchRequestVO`에 직접 옮겨 담고 있습니다. 가이드의 검색 요청 규칙대로 `@ModelAttribute AccessSearchRequestVO`로 받으면 옮겨 담는 코드가 필요 없습니다.

```java
@GetMapping("/actions")
public ApiResponse<List<AccessListVO>> selectAccessList(
        @ModelAttribute AccessSearchRequestVO request) {
    return ApiResponse.OK(accessService.selectAccessList(request));
}
```

참고: `AccessVO`가 `vo.response` 패키지에 있지만 요청 본문으로도 쓰이고 있습니다. 요청용 VO를 `vo.request`로 분리할지는 담당자 판단에 맡깁니다.

### 완료 조건
- 필수값을 비운 요청이 400 + `validations`로 응답 (필드별 메시지 포함)
- 서비스의 null · 빈 값 검사 코드 제거 (R-02와 함께)

### 처리 결과
- 상태:
- 판단 근거:
- 변경 내용:
- ROLE 담당자에게 요청:

---

## R-04. ACTION_ID 타입을 String으로 통일 (버그)

### 대상 파일
- `backend/src/main/java/com/learningworks/accessrole/vo/response/AccessRolePermissionVO.java` — `private Long actionId;`
- `backend/src/main/java/com/learningworks/accessrole/vo/request/AccessRoleSaveRequestVO.java` — `private List<Long> permissionIds;`
- `backend/src/main/java/com/learningworks/accessrole/dao/AccessRoleDao.java` — `selectActionCount`, `insertRolePermission`의 `List<Long>`
- `backend/src/main/java/com/learningworks/accessrole/service/AccessRoleServiceImpl.java`
- `frontend/src/components/admin/system/access-role/AccessRole.jsx` — 저장 시 `permissionIds` 전송 (287행 부근)

### 현재 상태
**반영 완료** (커밋 `fafc7bc`). 아래는 요청 당시의 상태입니다.

- ACCESS 모듈은 ACTION을 등록할 때 `ACTION_ID`를 `SUBSTR(RAWTOHEX(SYS_GUID()), 1, 20)`로 생성합니다 (`AccessDaoMapper.xml`의 `selectKey`). **영문자(A~F)가 섞인 문자열**이며, `AccessListVO.actionId`도 `String`입니다.
- ACCESS_ROLE 모듈은 같은 값을 **`Long`**으로 다뤘습니다.
- 예상 결과
  - 기존 데이터의 ACTION_ID가 숫자뿐이면 동작합니다.
  - **화면에서 새로 등록한 ACTION**은
    - 허용 · 미허용 목록 조회 시 `Long` 변환 실패 → 500
    - 권한 저장 시 JSON의 문자열 ID를 `Long`으로 변환 실패 → 400 `GLOBAL_INVALID_JSON`

### 검증 방법
1. 접근 권한 관리 화면(`/access/save`)에서 ACTION을 새로 등록
2. 권한별 접근 권한 관리 화면에서 아무 역할이나 선택 → 미허용 목록 조회가 실패하는지 확인

### 요청 내용
- 위 파일의 `Long` / `List<Long>`을 `String` / `List<String>`으로 변경
- 필드명 `permissionIds` → `actionIds`로 변경 권장 (테이블 컬럼명과 일치). 변경 시 프론트 전송 필드도 함께 수정

### 완료 조건
- 새로 등록한 ACTION을 역할에 허용 · 해제 · 조회할 수 있음

### 처리 결과
- 상태: 수락 (완료)
- 판단 근거: ROLE 담당자가 `644fe80` 기준 코드로 확인. `AccessRolePermissionVO.actionId`가 `String`이고, `AccessRoleSaveRequestVO`, `AccessRoleDao`, `AccessRoleServiceImpl`, `AccessRoleDaoMapper.xml`이 `List<String> actionIds`를 사용함. 프론트 `AccessRole.jsx`도 `actionIds`로 전송함.
- 변경 내용: `fafc7bc` 권한별 접근 관리 - 권한 부여/철회. 같은 커밋에서 `ROLE_ACTION`에 `ROLE_ACTION_ID`(SYS_GUID 기반 PK)를 추가하고, 등록을 `INSERT ALL`로 변경함.
- ROLE 담당자에게 요청: 없음
- 남은 확인: 위 `검증 방법`대로 새로 등록한 ACTION을 허용 · 해제할 수 있는지 화면에서 한 번 확인해 주세요.

---

## R-05. `updateAccess` SQL 문법 확인 (버그 의심)

### 대상 파일
- `backend/src/main/resources/com/learningworks/access/dao/mapper/AccessDaoMapper.xml` — `<update id="updateAccess">` (96행 부근)

### 현재 상태
**반영 완료** (커밋 `0e71877`, `SET(...)` 괄호 제거). 아래는 요청 당시의 코드입니다.

```sql
UPDATE ACTION
   SET(
        ACTION_NAME = #{actionName}
      , TOP_MENU_ID = #{topMenuId}
      , MID_MENU_ID = #{midMenuId}
      , BTM_MENU_ID = #{btmMenuId})
 WHERE ACTION_ID = #{actionId}
```

Oracle의 `SET (...)` 괄호 형식은 `SET (col1, col2) = (SELECT ...)`처럼 **서브쿼리 대입에만** 쓸 수 있습니다. `SET (컬럼 = 값, ...)` 형식은 문법 오류(ORA-00907 등)가 날 것으로 보입니다.

### 검증 방법
접근 권한 관리 화면에서 기존 ACTION을 수정 저장 → 서버 로그에 ORA 오류가 발생하는지 확인

### 요청 내용
오류가 확인되면 괄호를 제거해 주세요.

```sql
UPDATE ACTION
   SET ACTION_NAME = #{actionName}
     , TOP_MENU_ID = #{topMenuId}
     , MID_MENU_ID = #{midMenuId}
     , BTM_MENU_ID = #{btmMenuId}
 WHERE ACTION_ID = #{actionId}
```

정상 동작한다면 반려로 기록해 주세요.

### 처리 결과
- 상태: 수락 (완료)
- 판단 근거: ROLE 담당자가 `644fe80` 기준 코드로 확인. `AccessDaoMapper.xml`의 `updateAccess`가 `SET ACTION_NAME = ..., ...` 형식으로 수정됨.
- 변경 내용: `0e71877` 접근 관리 조회/저장/수정
- ROLE 담당자에게 요청: 없음

---

## R-06. 프론트 응답 처리 전환

### 대상 파일
- `frontend/src/api/admin/system/access-role/accessRoleApi.js`
- `frontend/src/api/admin/system/access/accessApi.js`
- `frontend/src/components/admin/system/access-role/AccessRole.jsx`
- `frontend/src/components/admin/system/access/Access.jsx`

### 선행 조건
- R-01 완료
- **공통 API 클라이언트 `frontend/src/api/common/apiClient.js`** — 작성 완료. 사용법: `frontend/docs/api-client-guide.md`, 사용 예: `frontend/src/api/admin/system/role/roleApi.js`. 현재 브랜치에 없다면 보류로 기록해 주세요.

### 현재 상태
- 두 API 파일에 `BASE_URL`, `get` / `post` / `handleResponse`가 각각 중복되어 있습니다. (응답을 text로 읽은 뒤 JSON으로 변환하는 처리가 추가됨)
- `handleResponse`는 실패 시 `result.message`를 읽지만, 공통 응답에는 `message`가 없고 `error`가 있습니다. 그래서 R-01 이후에는 서버가 보낸 에러 메시지가 표시되지 않고 항상 `요청 실패 (상태코드)`가 표시됩니다.
- 컴포넌트는 `response.responseCode === "SUCCESS"`, `response.data`를 확인합니다.
  - `AccessRole.jsx`: 40~41행(역할 목록), 61~65행(허용 · 미허용 목록), 239행(저장)
  - `Access.jsx`: 65~66행(메뉴 목록), 78~81행(접근 권한 목록), 205 · 224행(추가), 259 · 278행(수정)
- `Access.jsx`의 81 · 224 · 278행은 `responseCode`가 `"SUCCESS"`가 아닐 때 `response.message`를 표시하지만, 공통 클라이언트로 바꾸면 실패는 모두 `catch`로 들어오므로 이 분기는 삭제합니다.

### 공통 API 클라이언트 동작
- `api.get` / `api.post` / `api.put` / `api.delete`: HTTP 2xx이면 응답의 `body`를 반환
- `api.getPage`: `{ body, paginate, search }`를 반환
- 백엔드 주소(`http://localhost:8080`, `VITE_API_BASE_URL`로 변경 가능)가 자동으로 붙으므로 URL은 `/access-role/allowed`처럼 경로만 적습니다.
- 실패(4xx · 5xx · 네트워크 오류): 아래 필드를 가진 `ApiError`를 throw

```js
{ httpStatusCode, errorCode, message /* = 응답의 error */, validations }
```

### 요청 내용
1. 두 API 파일의 `get` / `post` / `handleResponse`를 공통 클라이언트 호출로 교체
2. 컴포넌트의 `responseCode === "SUCCESS"` 분기 제거 (성공이면 예외 없이 반환되므로), `response.data` → 반환값 직접 사용
3. 성공 알림 문구는 프론트에서 표시 (R-01 4번)
4. 에러 처리에서 `errorCode` 또는 `validations`를 활용 (예: `validations`가 있으면 필드 아래에 메시지 표시)

### 완료 조건
- 서버의 `error` 메시지가 화면에 그대로 표시됨 (예: 존재하지 않는 역할 → "존재하지 않는 역할입니다.")
- 두 페이지의 조회 · 저장이 정상 동작

### 처리 결과
- 상태:
- 판단 근거:
- 변경 내용:
- ROLE 담당자에게 요청:

---

## R-07. 역할 목록 API를 `GET /roles`로 통합

### 대상 파일
- `backend/src/main/java/com/learningworks/accessrole/web/AccessRoleController.java` — `GET /access-role/roles`
- `backend/src/main/java/com/learningworks/accessrole/service/AccessRoleService(Impl).java` — `getRoleList`
- `backend/src/main/java/com/learningworks/accessrole/dao/AccessRoleDao.java`, `AccessRoleDaoMapper.xml` — `selectRoleList`
- `backend/src/main/java/com/learningworks/accessrole/vo/response/AccessRoleVO.java`
- `frontend/src/api/admin/system/access-role/accessRoleApi.js` — `getRoleList`

### 현재 상태
- `GET /access-role/roles`와 `GET /roles`(ROLE 모듈)가 같은 데이터를 조회합니다.
- 정렬이 다릅니다: `/access-role/roles`는 `ORDER BY ROLE_ID`, `/roles`는 `ORDER BY ROLE_RANK, ROLE_ID`(상위 역할부터).

### 요청 내용
- 권한별 접근 권한 관리 화면의 역할 목록을 `GET /roles`로 조회
  - 응답 body: `{ roleCount, roleList: [{ roleId, roleDisplayName }] }` → `body.roleList` 사용
- 위 백엔드의 역할 목록 API · 서비스 · DAO · VO 삭제
- `selectRoleCount`(역할 존재 확인)는 ACCESS_ROLE 모듈에서 계속 사용하므로 유지

### 완료 조건
- 권한별 접근 권한 관리 화면의 역할 목록이 상위 역할부터 표시됨
- `/access-role/roles` 호출이 남아 있지 않음

### 처리 결과
- 상태:
- 판단 근거:
- 변경 내용:
- ROLE 담당자에게 요청:

---

## R-08. 사용하지 않는 import 정리

### 대상 파일
- `backend/src/main/java/com/learningworks/accessrole/service/AccessRoleServiceImpl.java` — `AccessRoleSaveRequestVO` import 중복
- `backend/src/main/java/com/learningworks/accessrole/dao/AccessRoleDao.java` — 사용하지 않는 `AccessRoleSaveRequestVO` import

### 요청 내용
중복 · 미사용 import 삭제

### 처리 결과
- 상태:
- 판단 근거:
- 변경 내용:
- ROLE 담당자에게 요청:
