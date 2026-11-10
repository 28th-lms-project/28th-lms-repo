# 코드 변경 요청 (R)

처리 규칙은 `README.md`를 따릅니다. 각 항목의 `현재 상태`를 코드에서 직접 확인한 뒤 판단해 주세요.

> 최신화: 2026-11-10, `feature/role` 커밋 `1ce6a14` 기준. R-10, R-03 잔여, R-09 기록이 코드에서 **아직 미처리**임을 확인했습니다. R-10은 프론트 화면 표시에도 영향이 있어 우선순위를 **높음**으로 올렸고, **R-11**(권한 설정 화면에 내 권한 표시 적용, 선택)을 추가했습니다. 남은 작업은 `README.md`의 "남은 작업"을 참고하세요.
>
> 이전: 2026-11-09, `3cee4b1` 기준. ACCESS 담당자의 R-09 처리 결과를 ROLE 담당자가 코드와 대조해 확인 (아래 R-09 "ROLE 담당자 확인"). R-10 2번(ACTION 저장 후 `evictAll`)을 불필요로 정정.

| ID   | 제목                                               | 분류                      | 우선순위    | 선행 조건                                           | 진행 상태                                           |
| ---- | -------------------------------------------------- | ------------------------- | ----------- | --------------------------------------------------- | --------------------------------------------------- |
| R-01 | 컨트롤러 공통 응답(ApiResponse) 전환               | 공통화                    | 높음        | 없음                                                | **완료** (`0014d42`)                                |
| R-02 | 예외를 LearningworksException으로 전환             | 공통화 · 버그             | 높음        | R-01                                                | **완료** (`0014d42`)                                |
| R-03 | 요청 VO 입력값 검증(@Valid) 적용                   | 공통화                    | 중간        | R-01                                                | **완료** (`0014d42`). `ACTION_NAME` `@Size` 남음    |
| R-04 | ACTION_ID 타입을 String으로 통일                   | 버그                      | 높음        | 없음                                                | **완료** (`fafc7bc`)                                |
| R-05 | `updateAccess` SQL 문법 확인                       | 버그 의심                 | 높음        | 없음                                                | **완료** (`0e71877`)                                |
| R-06 | 프론트 응답 처리 전환                              | 공통화                    | 높음        | R-01, 공통 API 클라이언트 제공                      | **완료** (`0014d42`)                                |
| R-07 | 역할 목록 API를 `GET /roles`로 통합                | 중복 제거                 | 중간        | D-01 논의 불필요, 단독 진행 가능                    | **완료** (`0014d42`)                                |
| R-08 | 사용하지 않는 import 정리                          | 정리                      | 낮음        | 없음                                                | **완료** (`0014d42`)                                |
| R-09 | ACTION_CODE 기반 권한 등록으로 전환                | 설계 반영 (D-01)          | 높음        | ACCESS 담당자 동의 (권한 코드 목록 API는 제공 완료) | **완료** (`6f4b85f`). `r09-migration.sql` 기록 남음 |
| R-10 | 권한 캐시 초기화 호출 · SUPER_ADMIN 전용 표시 적용 | 설계 반영 (D-01, D-03)    | **높음**    | 없음                                                | 대기                                                |
| R-11 | 권한 설정 화면에 내 권한 표시 적용                 | 설계 반영 (D-03) · 프론트 | 낮음 (선택) | 없음 (R-10 · D-03 구현과 함께 권장)                 | 대기                                                |

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

- 상태: 수락 (완료)
- 판단 근거: 2026-11-06 확인. 두 컨트롤러가 `ResponseEntity<Map>` + `{ responseCode, message, data }`로 응답하고, `AccessRoleController`에 전용 `@ExceptionHandler(IllegalArgumentException)`가 있었음. 문서 내용과 일치.
- 변경 내용: `AccessController`, `AccessRoleController`를 `ApiResponse<T>`로 전환. `success()` · `response()` 헬퍼와 `@ExceptionHandler` 삭제. 저장 API는 저장 후 목록을 반환 (`/access-role/save` → 허용 권한 목록, `/access/save` → 전체 접근 권한 목록). 성공 메시지는 응답에서 제거 (D-06). `0014d42`(`feature/access-role`의 머지 커밋)에 포함.
- ROLE 담당자에게 요청: 없음

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

| 위치                                                                  | 현재                                                                       | 변경                                                            |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `AccessRoleServiceImpl.saveRolePermission` — request/roleId null 검사 | `IllegalArgumentException("역할 정보가 없습니다.")`                        | R-03의 `@NotBlank`로 대체 후 삭제                               |
| `AccessRoleServiceImpl.saveRolePermission` — 없는 ACTION 포함         | `IllegalArgumentException("존재하지 않는 접근 권한이 포함되어 있습니다.")` | `LearningworksException(ErrorCode.ACTION_NOT_EXISTS)`           |
| `AccessRoleServiceImpl.validateRole` — roleId 없음                    | `IllegalArgumentException("역할 ID가 없습니다.")`                          | R-03의 `@NotBlank`로 대체 후 삭제                               |
| `AccessRoleServiceImpl.validateRole` — 역할 없음                      | `IllegalArgumentException("존재하지 않는 역할입니다.")`                    | `LearningworksException(ErrorCode.ROLE_NOT_EXISTS)` (이미 존재) |
| `AccessServiceImpl.saveAccess` — request null                         | `IllegalArgumentException("저장할 데이터가 없습니다.")`                    | R-03 검증으로 대체 또는 `ErrorCode.GLOBAL_BAD_REQUEST`          |
| `AccessServiceImpl.validateAccess` — 필수값 누락                      | `IllegalArgumentException(...)`                                            | R-03의 `@NotBlank`로 대체 후 삭제                               |
| `AccessServiceImpl.saveAccess` — 수정 대상 actionId 없음              | `IllegalArgumentException("수정할 접근 권한 ID가 없습니다.")`              | `ErrorCode.GLOBAL_BAD_REQUEST` 또는 R-03 검증                   |
| `AccessServiceImpl.saveAccess` — insert 결과 != 1                     | `IllegalStateException("접근 권한 등록에 실패했습니다.")`                  | `LearningworksException(ErrorCode.ACTION_FAILURE_SAVE)`         |
| `AccessServiceImpl.saveAccess` — update 결과 != 1                     | `IllegalStateException("접근 권한 수정에 실패했습니다.")`                  | **0건이면 대상 없음** → `ErrorCode.ACTION_NOT_EXISTS` (404)     |

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

- 상태: 수락 (완료)
- 판단 근거: 2026-11-06 확인. 두 서비스가 `IllegalArgumentException` / `IllegalStateException`을 던지고 있었음. 문서 내용과 일치.
- 변경 내용: `ErrorCode`에 `ACTION_NOT_EXISTS`(404, "존재하지 않는 접근 권한입니다."), `ACTION_FAILURE_SAVE`(500) 추가 (상수 추가만). 없는 ACTION 포함 · update 0건 → `ACTION_NOT_EXISTS`, insert 실패 → `ACTION_FAILURE_SAVE`, 없는 역할 → `ROLE_NOT_EXISTS`, 수정 대상 actionId 없음 → `GLOBAL_BAD_REQUEST`. null · 필수값 검사는 R-03 검증으로 옮기고 서비스에서 삭제. `ACTION_NOT_EXISTS`는 update 0건에도 쓰므로 문구를 "포함되어 있습니다" 대신 일반 문구로 조정. `0014d42`(`feature/access-role`의 머지 커밋)에 포함.
- ROLE 담당자에게 요청: 없음

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

- 상태: 수락 (완료, `@Size` 제외 → 아래 남은 작업)
- 판단 근거: 2026-11-06 확인. 요청 VO에 검증 어노테이션이 없었음. 문서 내용과 일치.
- 변경 내용: `AccessRoleSaveRequestVO`(`@NotBlank` + `@Pattern(ROLE_ID_PATTERN_ALLOW_EMPTY)`, `@NotNull List<@NotBlank String> actionIds`), `AccessSaveRequestVO`(`List<@Valid AccessVO>`), `AccessVO`(메뉴 3개 · 권한명 `@NotBlank`), 두 컨트롤러 `@RequestBody`에 `@Valid`. `@RequestParam roleId`는 `RoleController`와 같이 `@Pattern(ROLE_ID_PATTERN)`만 적용 (빈 값도 패턴에서 걸리므로 `@NotBlank`를 함께 쓰면 메시지가 2개 나옴). 선택 항목 7번(`@ModelAttribute AccessSearchRequestVO`)도 적용. 클래스 `@Validated` 미사용. `0014d42`(`feature/access-role`의 머지 커밋)에 포함.
- 남은 작업: `ACTION.ACTION_NAME` 컬럼 길이를 확인하지 못해 `@Size(max = n)`는 TODO 주석으로 남김 (저장소에 DDL 없음).
- ROLE 담당자에게 요청: 없음
- ROLE 담당자 답변 (2026-11-06): 컬럼 길이는 `ACTION_ID` `VARCHAR2(20 CHAR)`, `ACTION_NAME` `VARCHAR2(40 CHAR)`입니다. `AccessVO.actionName`에 `@Size(max = 40, message = "접근 권한명은 40자 이하로 입력해주세요.")`를 추가하고 TODO 주석을 삭제해 주세요. `ACTION_ID`는 시퀀스로 자동 생성되므로 입력 검증이 필요 없고, 새로 추가된 `actionCode` 검증은 R-09에서 함께 처리합니다.

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
{
  (httpStatusCode, errorCode, message /* = 응답의 error */, validations);
}
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

- 상태: 수락 (완료)
- 판단 근거: 2026-11-06 확인. `apiClient.js` 제공 확인. 문서 내용과 일치하나, `Access.jsx`는 작업 중 변경으로 행 번호가 달랐음 (실제 35 · 48 · 175 · 229행).
- 변경 내용: `accessApi.js`, `accessRoleApi.js`를 `api.get` / `api.post`로 교체 (중복 `BASE_URL` · `get` · `post` · `handleResponse` 삭제). 두 컴포넌트의 `responseCode` 분기 · `response.data` 제거. 에러는 `validations`가 있으면 필드별 메시지를, 없으면 서버 `error` 메시지를 alert로 표시. 성공 문구는 프론트에서 표시. `0014d42`(`feature/access-role`의 머지 커밋)에 포함.
- ROLE 담당자에게 요청: 없음

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

- 상태: 수락 (완료)
- 판단 근거: 2026-11-06 확인. `/access-role/roles`가 `ORDER BY ROLE_ID`로 `/roles`와 같은 데이터를 조회하고 있었음.
- 변경 내용: `AccessRole.jsx`가 `roleApi.getRoles()`의 `body.roleList`를 사용. 백엔드 `GET /access-role/roles`, `getRoleList`, `selectRoleList`(DAO · 매퍼), `AccessRoleVO` 삭제. `selectRoleCount`는 유지. `0014d42`(`feature/access-role`의 머지 커밋)에 포함.
- ROLE 담당자에게 요청: 없음

---

## R-08. 사용하지 않는 import 정리

### 대상 파일

- `backend/src/main/java/com/learningworks/accessrole/service/AccessRoleServiceImpl.java` — `AccessRoleSaveRequestVO` import 중복
- `backend/src/main/java/com/learningworks/accessrole/dao/AccessRoleDao.java` — 사용하지 않는 `AccessRoleSaveRequestVO` import

### 요청 내용

중복 · 미사용 import 삭제

### 처리 결과

- 상태: 수락 (완료)
- 판단 근거: 2026-11-06 확인. `AccessRoleServiceImpl` 4 · 5행 중복 import, `AccessRoleDao`의 미사용 `AccessRoleSaveRequestVO` import 확인.
- 변경 내용: 두 import 삭제 (R-07로 미사용이 된 `AccessRoleVO` import도 삭제). `0014d42`(`feature/access-role`의 머지 커밋)에 포함.
- ROLE 담당자에게 요청: 없음

---

## R-09. ACTION_CODE 기반 권한 등록으로 전환 (D-01 반영)

### 배경

`discussions.md` D-01 최종 결정에 따라 ACTION 테이블에 **`ACTION_CODE`(권한 코드) 컬럼이 추가**되었고, `ACTION_ID`는 **시퀀스로 자동 생성**합니다.

- 권한 코드는 백엔드 개발자가 API 메서드에 `@RequireAction(domain, action, description)`으로 정의합니다. 예: `ROLE_DELETE`, `SURVEY_ANSWER`.
- 서버 시작 시 ROLE 담당자의 `ActionCodeRegistry`가 이 코드들을 모으고, 목록 API로 제공합니다.
- 관리자는 ACTION을 등록할 때 코드를 직접 입력하지 않습니다. **목록에서 도메인 → 행위 순으로 선택**합니다.
- 앞서 협의한 "DB 상수 테이블(테이블명) + CRUD 드롭다운" 방식은 이 방식으로 대체되었습니다. 상수 테이블은 만들지 않습니다. 채택하지 않은 이유는 D-01을 참고하세요.

### 선행 조건

- ACCESS 담당자 동의 (상수 테이블 방식을 대체하므로 재합의 필요)
- 3번의 등록부 검증과 6번의 드롭다운에 필요한 `ActionCodeRegistry` · `GET /action-codes`는 ROLE 담당자가 구현을 마쳤습니다 (아래 "ROLE 담당자가 제공하는 것").

### 대상 파일

- `backend/src/main/resources/com/learningworks/access/dao/mapper/AccessDaoMapper.xml` — `insertAccess`의 `selectKey`, 조회 · 등록 SQL
- `backend/src/main/java/com/learningworks/access/vo/response/AccessVO.java`, 목록 응답 VO
- `backend/src/main/java/com/learningworks/access/service/AccessServiceImpl.java`
- `backend/src/main/java/com/learningworks/common/exceptions/enums/ErrorCode.java` (상수 추가만)
- `frontend/src/components/admin/system/access/Access.jsx` — 등록 · 수정 화면

### 현재 상태

- `insertAccess`가 `ACTION_ID`를 `SUBSTR(RAWTOHEX(SYS_GUID()), 1, 20)`로 생성합니다.
- DB에는 `ACTION_CODE` 컬럼이 추가되었지만 매퍼 · VO · 화면에는 아직 반영되지 않았습니다.

### 요청 내용

1. **`ACTION_ID`를 팀 공통 PK 규칙으로 생성**
   - `selectKey`의 `SYS_GUID`를 팀 공통 규칙(`'약자-' || TO_CHAR(SYSDATE, 'YYYYMMDD-') || LPAD(SEQ_테이블_명_PK.NEXTVAL, 6, '0')`)으로 변경
   - Java 타입은 `String` 유지 (R-04)
   - `ACTION_ID`는 `VARCHAR2(20 CHAR)`이고 규칙의 고정 부분(`-YYYYMMDD-` + 6자리)이 16자이므로, **약자는 4자 이하**여야 합니다 (예: `ACT-20261109-000001`, 19자).
2. **`ACTION_CODE`를 매퍼 · VO에 반영**
   - 목록 · 상세 조회 결과와 등록 SQL에 `ACTION_CODE` 추가
   - `AccessVO.actionCode` 추가
3. **`actionCode` 검증 (등록 시)**
   - `@NotBlank(message = "권한 코드를 선택해주세요.")`, `@Size(max = 40, message = "권한 코드는 40자 이하로 입력해주세요.")` (`ACTION_CODE` `VARCHAR2(40 CHAR)`)
   - **등록부에 있는 코드인지 서비스에서 확인**: ROLE 담당자가 제공할 `ActionCodeRegistry.contains(actionCode)`가 false이면 400. 드롭다운은 화면을 거치지 않는 요청으로 우회할 수 있으므로 백엔드 검증이 필요합니다.
   - 형식 정규식(`@Pattern`)은 등록부 검증에 포함되므로 따로 두지 않아도 됩니다.
   ```java
   // 400 BAD_REQUEST 섹션
   ACTION_CODE_NOT_EXISTS(HttpStatus.BAD_REQUEST, "등록되지 않은 권한 코드입니다."), //
   ```
4. **중복 처리**: `ACTION_CODE`의 `UNIQUE` 제약 위반(`DuplicateKeyException`)을 잡아 새 ErrorCode로 던지기
   ```java
   // 409 CONFLICT 섹션
   ACTION_CODE_USED(HttpStatus.CONFLICT, "이미 등록된 권한 코드입니다."), //
   ```
5. **등록 후 `ACTION_CODE` 변경 불가 (추천)**
   - 코드를 바꾸면 이미 그 ACTION을 부여받은 역할이 다른 API를 쓸 수 있게 되는 등 권한의 의미가 바뀝니다.
   - 수정(`modifiedList`)은 이름 · 메뉴만 바꾸고 `updateAccess`의 `SET`에 `ACTION_CODE`를 넣지 않습니다. 코드를 바꿔야 하면 삭제 후 다시 등록합니다.
   - 수정 화면에서 권한 코드는 읽기 전용으로 표시합니다.
6. **등록 화면: 드롭다운 2개** — `GET /action-codes`(구현 완료)의 `domainList`를 사용합니다. 응답 형식은 아래 "ROLE 담당자가 제공하는 것"을 참고하세요. 언더스코어로 문자열을 나누지 말고 응답의 값을 그대로 쓰세요.

   ```text
   [1] 도메인      [ ROLE                 ▼ ]   ← 표시: domain (영문 그대로)
   [2] 권한        [ 역할 삭제 (DELETE)      ▼ ]   ← 표시: "description (action)", value: actionCode
       권한 코드   ROLE_DELETE                    ← 읽기 전용 표시
       권한명      [ 역할 삭제               ]   ← description이 기본값, 수정 가능
   ```

   - **1번 드롭다운**: `domain`을 영문 그대로 표시합니다 (도메인 한글명은 두지 않기로 결정).
   - **2번 드롭다운**: 표시는 `description (action)`, 선택값은 `actionCode`. 받은 `actionCode`를 그대로 저장 요청의 `actionCode`에 넣습니다.
   - **이미 등록된 코드**: `registered`가 `true`인 선택지는 비활성화하고 "(등록됨)"을 붙입니다.
   - **도메인을 바꾸면**: 2번 선택값과 권한명을 초기화합니다.
   - **권한명 기본값**: 2번을 고르면 `ACTION_NAME`에 `description`을 채웁니다. 단, 관리자가 권한명을 직접 고친 뒤에는 2번 선택을 바꿔도 덮어쓰지 않습니다.
   - **수정 화면**: 두 드롭다운 모두 읽기 전용 (5번).

7. **(선택) 미사용 코드 표시**: 목록에서 등록부에 없는 `ACTION_CODE`(코드에서 삭제된 권한)를 "미사용"으로 표시
8. **기존 데이터 정리**
   - GUID로 저장된 `ACTION`과 이를 참조하는 `ROLE_ACTION.ACTION_ID`를 함께 정리해야 합니다 (FK가 없으므로 수동).
   - 테스트 데이터라면 삭제 후 다시 등록하는 것이 가장 간단합니다.
9. **DB 상수 테이블은 만들지 않습니다.** 작업 중이던 상수 테이블과 관련 코드는 정리해 주세요.

### ROLE 담당자가 제공하는 것 (구현 완료)

패키지: `com.learningworks.common.action`

- `ActionCodeRegistry.contains(String actionCode)`: 등록부에 있는 코드인지 확인 (3번 검증에 사용, 주입받아 호출)
- `GET /action-codes` (`@RequireSuperAdmin`): 권한 코드 목록

```json
{
  "httpStatusCode": 200,
  "httpStatusMessage": "OK",
  "body": {
    "actionCodeCount": 3,
    "domainList": [
      {
        "domain": "COURSE_NOTICE",
        "actionList": [
          {
            "actionCode": "COURSE_NOTICE_CREATE",
            "action": "CREATE",
            "description": "강의 공지 등록",
            "registered": false
          }
        ]
      },
      {
        "domain": "ROLE",
        "actionList": [
          {
            "actionCode": "ROLE_DELETE",
            "action": "DELETE",
            "description": "역할 삭제",
            "registered": true
          },
          {
            "actionCode": "ROLE_READ",
            "action": "READ",
            "description": "역할 목록 조회",
            "registered": false
          }
        ]
      }
    ]
  }
}
```

- 도메인 · 행위 모두 이름순 정렬, `@RequireSuperAdmin` API는 목록에 없음
- `registered`: `ACTION.ACTION_CODE`에 이미 있는 코드인지
- 캐시 초기화 호출은 R-10 참고

### 완료 조건

- 새 ACTION이 팀 공통 규칙의 `ACTION_ID`와 선택한 `ACTION_CODE`로 등록됨
- 등록부에 없는 코드는 400, 이미 등록된 코드는 409로 응답
- 수정 시 `ACTION_CODE`가 바뀌지 않음
- 기존 GUID 데이터가 정리됨

### 처리 결과

- 상태: 수락
- 판단 근거: ACCESS 담당자가 D-01 최종 결정(`@RequireAction` 자동 수집, 상수 테이블 미사용)에 동의. `ActionCodeRegistry.contains`, `GET /action-codes` 구현 확인
- 변경 내용: (미커밋)
  1. `AccessDaoMapper.xml` `insertAccess` selectKey → `'AC-' || TO_CHAR(SYSDATE, 'YYYYMMDD-') || LPAD(SEQ_ACTION_PK.NEXTVAL, 6, '0')`
  2. 목록 조회 · 등록 SQL에 `ACTION_CODE` 추가, `AccessVO.actionCode` · `AccessListVO.actionCode` 추가
  3. `actionCode` 검증: `@NotBlank`는 등록에만 적용(검증 그룹 `AccessVO.Add` + `AccessSaveRequestVO.addedList`의 `@ConvertGroup`), `@Size(max = 40)`, 서비스에서 `ActionCodeRegistry.contains` false면 `ACTION_CODE_NOT_EXISTS`(400)
  4. 등록 시 `DuplicateKeyException` → `ACTION_CODE_USED`(409). `ErrorCode`에 두 상수 추가
  5. `updateAccess`의 `SET`에 `ACTION_CODE` 미포함, 수정 화면에서 도메인 · 권한 드롭다운 읽기 전용
  6. `Access.jsx` 도메인 → 권한 드롭다운(등록됨 비활성화, 도메인 변경 시 초기화, 권한명 기본값), 그리드에 권한 코드 컬럼
  7. 목록 응답에 `actionCodeInUse` 추가, 등록부에 없는 코드는 그리드에 "(미사용)" 표시
  8. `r09-migration.sql`: `SEQ_ACTION_PK` 생성, GUID 데이터(`ROLE_ACTION` 포함) 삭제 스크립트. 2026-11-09 개발 DB(`LEARNING_WORKS`)에 실행 완료: 시퀀스는 이미 존재해 생략, `ACTION` 10행 · `ROLE_ACTION` 23행 삭제 (`AC-20261109-000001` `ROLE_READ`만 남음)
  9. 저장소에 상수 테이블 관련 코드 없음 (정리 대상 없음). DB에 생성한 상수 테이블이 있다면 수동 DROP 필요
- ROLE 담당자에게 요청: 없음
- ROLE 담당자 확인 (2026-11-09, `3cee4b1` 기준)
  - 1 ~ 7번은 코드와 일치합니다. 등록부 검증 → 중복 409 순서, 등록 전용 검증 그룹, 수정 시 `ACTION_CODE` 제외, 드롭다운 동작(R-09 6번 규칙 전부) 확인
  - "변경 내용: (미커밋)"은 실제로 `6f4b85f`에 커밋되어 `5f96007`로 `feature/role`에 머지되었습니다.
  - 8번의 `r09-migration.sql`이 저장소에 없습니다. 공유 DB의 데이터를 삭제한 작업이므로 저장소에 추가해 기록을 남겨 주세요.
  - 8번의 데이터 삭제로 **역할별 권한(ROLE_ACTION)이 모두 비었습니다.** 권한 검사를 켜기 전에 ACTION 등록과 역할별 권한 부여가 다시 필요합니다 (`README.md` "ROLE 담당자" 3번).

---

## R-10. 권한 캐시 초기화 호출 · SUPER_ADMIN 전용 표시 적용 (D-01, D-03 반영)

### 배경

ROLE 담당자가 D-01의 권한 검사(`com.learningworks.common.action`)를 구현했습니다.

- `AccessChecker`는 역할별 허용 권한 코드를 **캐시**합니다. ROLE_ACTION이나 ACTION_CODE가 바뀌는 곳에서 캐시를 비워야 바뀐 권한이 바로 반영됩니다.
- `@RequireSuperAdmin`을 붙인 API는 SUPER_ADMIN만 호출할 수 있습니다 (D-03).
- 권한 검사는 기본적으로 **꺼져 있습니다** (`app.access-check.enabled`, 기본값 `false`). 꺼져 있는 동안에는 어노테이션을 붙여도 동작에 영향이 없으므로 지금 적용해도 안전합니다.
- JWT 인증 필터가 머지되어(`878d6c0`) 검사를 켤 수 있는 상태입니다. **이 항목은 검사를 켜기 전에 처리되어야 합니다** (`README.md` "ROLE 담당자" 3번).
- **(2026-11-10 추가) 검사가 꺼진 지금도 영향이 있습니다.** 프론트의 내 권한 조회(`GET /action-codes/me`, 버튼 · 화면 표시용)도 `AccessChecker`의 같은 캐시를 씁니다. 캐시에는 만료가 없어서, 권한별 접근 권한 관리 화면에서 권한을 저장해도 **이미 한 번 조회된 역할은 서버를 재시작하기 전까지 화면 표시가 바뀌지 않습니다.**
- **(2026-11-10 추가)** 검사 인터셉터는 `@RequireAction` · `@RequireSuperAdmin`이 없는 API를 그대로 통과시킵니다. 3번이 처리되지 않은 채 검사를 켜면 **로그인한 누구나 권한 설정을 저장**할 수 있습니다.

### 현재 상태 (2026-11-10, `1ce6a14` 확인)

- `AccessRoleServiceImpl`에 `evictRole` 호출 없음 (프로젝트에서 `evictRole` 호출은 `RoleServiceImpl.deleteRole` 한 곳뿐)
- `AccessController`, `AccessRoleController`에 `@RequireAction` · `@RequireSuperAdmin` 없음
- D-03 TODO 주석 위치: `AccessController.java` 44행(`/access/save`), `AccessRoleController.java` 50행(`/access-role/save`)

### 대상 파일

- `backend/src/main/java/com/learningworks/accessrole/service/AccessRoleServiceImpl.java`
- `backend/src/main/java/com/learningworks/accessrole/web/AccessRoleController.java`
- `backend/src/main/java/com/learningworks/access/web/AccessController.java`

### 요청 내용

1. **권한 저장 후 캐시 초기화**: `AccessRoleServiceImpl.saveRolePermission`에서 저장이 끝난 뒤 `accessChecker.evictRole(roleId)` 호출
   - 트랜잭션 안에서 호출하면 **커밋 후에** 비워지므로, 호출 위치는 메서드 끝이면 됩니다.
2. ~~ACTION 저장 후 `evictAll()` 호출~~ **불필요 (2026-11-09 삭제).** ACTION 수정은 `ACTION_CODE`를 바꾸지 않고(R-09 5번) 삭제 기능도 없어서, ACTION 저장으로 역할의 허용 권한 코드가 바뀌지 않습니다. 나중에 ACTION 삭제나 코드 변경 기능을 만들면 그때 `evictAll()`을 호출하세요.
3. **SUPER_ADMIN 전용 표시**: D-03 TODO 주석 위치(`/access/save`, `/access-role/save`)에 `@RequireSuperAdmin` 추가, TODO 주석 삭제
4. 조회 API(`/access/actions`, `/access-role/allowed`, `/access-role/denied` 등)는 권한 설정 화면 전용이므로 함께 `@RequireSuperAdmin`을 붙이기를 권장합니다 (선택).

```java
import com.learningworks.common.action.AccessChecker;
import com.learningworks.common.action.RequireSuperAdmin;

@RequireSuperAdmin
@PostMapping("/save")
public ApiResponse<...> saveRolePermission(...) { ... }

// AccessRoleServiceImpl.saveRolePermission 마지막
this.accessChecker.evictRole(request.getRoleId());
```

### 완료 조건

- 권한 저장 후 `evictRole`이 호출됨
- 두 저장 API에 `@RequireSuperAdmin`이 붙고 D-03 TODO 주석이 삭제됨

### 처리 결과

- 상태:
- 판단 근거:
- 변경 내용:
- ROLE 담당자에게 요청:

---

## R-11. 권한 설정 화면에 내 권한 표시 적용 (선택, D-03 반영)

### 배경

- 프론트에 내 권한 조회와 `usePermission` 훅이 추가되었습니다 (2026-11-10, ROLE 담당자). 사용법은 `frontend/docs/permission-guide.md`를 참고하세요.
- 권한 설정 기능(`/access/save`, `/access-role/save`)은 D-03 결정에 따라 SUPER_ADMIN 전용입니다. 지금은 두 화면이 누구에게나 그대로 보입니다.
- 화면 숨김은 표시용입니다. 실제 차단은 R-10의 `@RequireSuperAdmin`이 합니다.

### 현재 상태 (2026-11-10, `1ce6a14` 확인)

- `Access.jsx`, `AccessRole.jsx`에서 내 권한을 확인하지 않음
- `AccessRole.jsx`는 `GET /roles` 결과를 그대로 역할 목록에 쓰므로 `ROLE_SUPER_ADMIN`이 표시됨 (D-03 구현 항목)

### 대상 파일

- `frontend/src/components/admin/system/access/Access.jsx`
- `frontend/src/components/admin/system/access-role/AccessRole.jsx`

### 요청 내용

1. 두 화면에서 `usePermission()`으로 SUPER_ADMIN 여부를 확인해, 아니면 "권한이 없습니다."를 표시하고 화면의 API를 호출하지 않기
   - 권한 조회 중에는 "권한이 없습니다."가 잠깐 보이지 않도록 `status`를 함께 확인 (가이드 3-3, 3-5)
   - 관리자 전용 화면이므로 조회 중 "권한 확인 중..." 문구는 표시해도 됩니다 (권한 관리 화면과 같은 방식)
2. `AccessRole.jsx`의 역할 목록에서 `ROLE_SUPER_ADMIN` 제외 (D-03)

```jsx
import usePermission from "../../../../hooks/usePermission";

const { isSuperAdmin, status } = usePermission();

if (status === "loading")
  return (
    <PageContainer>
      <p>권한 확인 중...</p>
    </PageContainer>
  );
if (status !== "loaded") return <PageContainer />;
if (!isSuperAdmin)
  return (
    <PageContainer>
      <p>권한이 없습니다.</p>
    </PageContainer>
  );
// 이후 기존 화면 (권한이 있을 때만 마운트되는 하위 컴포넌트로 분리하면 API 호출도 막힘)
```

- 참고 구현: `frontend/src/components/admin/system/role/Role.jsx` (`Role` → `RoleManagement` 분리 구조)

### 완료 조건

- SUPER_ADMIN이 아닌 계정으로 두 화면에 들어가면 "권한이 없습니다."가 표시되고 API를 호출하지 않음
- 권한별 접근 권한 관리 화면의 역할 목록에 `ROLE_SUPER_ADMIN`이 없음

### 처리 결과

- 상태:
- 판단 근거:
- 변경 내용:
- ROLE 담당자에게 요청:
