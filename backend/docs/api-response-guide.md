# API 공통 응답 · 예외 처리 가이드

모든 API는 같은 형식으로 응답합니다. 기능을 개발할 때는 **Controller · Service · Mapper**만 작성하면 됩니다. 새로운 에러 상황이 생기면 **`ErrorCode.java`에 한 줄**만 추가하세요.

- 성공 응답: 컨트롤러에서 `ApiResponse.OK()` / `ApiResponse.CREATED()`를 반환합니다.
- 실패 응답: 서비스에서 `throw new LearningworksException(ErrorCode.XXX)`를 던집니다.
- HTTP 상태 코드, 에러 메시지, 로그는 공통 코드가 자동으로 처리합니다.

---

## 1. 응답 형식

값이 `null`인 필드는 응답 JSON에서 빠집니다.

### 성공

```json
{
  "httpStatusCode": 200,
  "httpStatusMessage": "OK",
  "body": { "roleId": "ROLE_ADMIN", "roleDisplayName": "관리자" }
}
```

### 실패

```json
{
  "httpStatusCode": 409,
  "httpStatusMessage": "Conflict",
  "errorCode": "ROLE_ID_USED",
  "error": "이미 사용 중인 역할 ID입니다."
}
```

### 입력값 검증 실패

```json
{
  "httpStatusCode": 400,
  "httpStatusMessage": "Bad Request",
  "errorCode": "GLOBAL_INVALID_PARAMETER",
  "error": "입력값을 확인해주세요.",
  "validations": {
    "roleId": ["역할ID는 'ROLE_'로 시작하고, ..."],
    "roleDisplayName": ["역할 이름을 입력해주세요."]
  }
}
```

### 페이징 목록

```json
{
  "httpStatusCode": 200,
  "httpStatusMessage": "OK",
  "body": [ ... ],
  "paginate": { "pageNo": 0, "listSize": 10, "pageCount": 7, ... },
  "search": { "keyword": "관리" }
}
```

| 필드                  | 설명                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `httpStatusCode`      | 실제 HTTP 응답 상태 코드와 **항상 같습니다**.                                                       |
| `body`                | 성공 시 데이터                                                                                      |
| `errorCode`           | 실패 시 에러 식별 코드. **프론트는 이 값으로 에러 종류를 구분합니다** (메시지 문구는 바뀔 수 있음). |
| `error`               | 실패 시 사용자에게 보여줄 메시지                                                                    |
| `validations`         | 검증 실패 시 `필드명 → 메시지 목록`                                                                 |
| `paginate` / `search` | 페이징 정보 / 요청에 사용된 검색 조건                                                               |

---

## 2. Controller

```java
@RestController
@RequestMapping("/roles")
@AllArgsConstructor
public class RoleController {

  private RoleService roleService;

  // 단건 조회 → 200
  @GetMapping("/{roleId}")
  public ApiResponse<RoleVO> getRole(@PathVariable String roleId) {
    return ApiResponse.OK(this.roleService.readRole(roleId));
  }

  // 검색 + 페이징 목록 → 200
  @GetMapping
  public ApiResponse<List<RoleVO>> getRoles(@ModelAttribute SearchRoleVO searchRoleVO) {
    List<RoleVO> list = this.roleService.readRoleList(searchRoleVO);
    return ApiResponse.OK(list, searchRoleVO.getPaginate(), searchRoleVO);
  }

  // 생성 → 201
  @PostMapping
  public ApiResponse<RoleVO> createRole(@Valid @RequestBody RegistRoleVO registRoleVO) {
    return ApiResponse.CREATED(this.roleService.createRole(registRoleVO));
  }
}
```

### 규칙

1. 반환 타입은 **항상 `ApiResponse<T>`** 입니다. VO나 String을 그대로 반환하지 마세요.
2. 생성(POST)은 `ApiResponse.CREATED()`, 나머지는 `ApiResponse.OK()`를 사용합니다.
3. 페이징 목록은 `ApiResponse.OK(list, paginate)` 또는 `ApiResponse.OK(list, paginate, search)`를 사용합니다. `PaginationVO.calculatePageCount()`를 먼저 호출해야 합니다.
4. 요청 데이터는 아래 기준으로 받습니다.

| 요청 종류                    | 받는 방법                                                     |
| ---------------------------- | ------------------------------------------------------------- |
| 등록 / 수정 (JSON body)      | `@Valid @RequestBody XxxVO`                                   |
| 검색 / 페이징 (query string) | `@Valid @ModelAttribute SearchXxxVO`                          |
| 파일 업로드 (multipart)      | `@Valid @ModelAttribute XxxVO` (VO 안에 `MultipartFile` 필드) |
| 경로 값                      | `@PathVariable`                                               |

5. 컨트롤러에서 **try-catch로 예외를 잡지 마세요.** 그대로 던지면 공통 핸들러가 처리합니다.

### 하지 말 것

- `new ApiResponse<>()`로 직접 생성 (생성자가 막혀 있습니다)
- `@ResponseStatus`, `HttpServletResponse.setStatus()`, `ResponseEntity` 사용 (상태 코드는 `ApiResponse`의 값으로 자동 설정됩니다)
- 컨트롤러 클래스에 `@Validated` 붙이기 (동작은 하지만, `@Valid`를 쓰는 기본 방식이 에러 필드명을 더 정확하게 알려줍니다)
- `@RestControllerAdvice`나 예외 클래스를 새로 만들기

---

## 3. 요청 VO (입력값 검증)

```java
@Data
public class RegistRoleVO {

  /** ROLE.ROLE_ID - VARCHAR2(20 CHAR) */
  @NotBlank(message = "역할ID를 입력해주세요.")
  @Size(max = 20, message = "역할ID는 20자 이하로 입력해주세요.")
  @Pattern(regexp = "^$|^ROLE_[A-Z0-9]+(_[A-Z0-9]+)*$",
      message = "역할ID는 'ROLE_'로 시작하고, 대문자·숫자와 단어 구분용 언더스코어(_)만 사용할 수 있습니다. (예: ROLE_SUPER_ADMIN)")
  private String roleId;

  /** ROLE.ROLE_DISPLAY_NAME - VARCHAR2(100 CHAR) */
  @NotBlank(message = "역할 이름을 입력해주세요.")
  @Size(max = 100, message = "역할 이름은 100자 이하로 입력해주세요.")
  private String roleDisplayName;
}
```

### 규칙

1. 검증 메시지는 어노테이션의 `message`에 **한글로** 작성합니다. 이 문구가 그대로 `validations`에 담겨 응답됩니다.
2. **DB 컬럼 제약은 VO에서 먼저 검증합니다.** 검증하지 않으면 DB 단계에서 실패해 500이 됩니다.

| DB 제약                       | VO 어노테이션        |
| ----------------------------- | -------------------- |
| `NOT NULL` (문자열)           | `@NotBlank`          |
| `NOT NULL` (숫자 · 날짜 등)   | `@NotNull`           |
| `VARCHAR2(n CHAR)`            | `@Size(max = n)`     |
| 형식 규칙 (코드값, 이메일 등) | `@Pattern`, `@Email` |

3. `@Pattern` 정규식 앞의 `^$|`는 빈 값일 때 `@NotBlank` 메시지만 나오도록 하기 위한 장치입니다. 함께 쓸 때 붙여주세요.
4. 숫자·날짜 필드에 잘못된 형식의 값이 들어오면 `"올바른 형식의 값이 아닙니다."`가 자동으로 응답됩니다.

---

## 4. Service

```java
@Override
public RoleVO readRole(String roleId) {
  RoleVO role = this.roleDao.selectRoleByRoleId(roleId);
  if (role == null) {
    throw new LearningworksException(ErrorCode.ROLE_NOT_EXISTS);   // 404
  }
  return role;
}

@Override
public RoleVO createRole(RegistRoleVO registRoleVO) {
  int insertedRow;
  try {
    insertedRow = this.roleDao.insertNewRole(registRoleVO);
  } catch (DuplicateKeyException dke) {                            // PK / UNIQUE 중복
    throw new LearningworksException(ErrorCode.ROLE_ID_USED, dke); // 409
  }
  if (insertedRow == 0) {
    throw new LearningworksException(ErrorCode.ROLE_FAILURE_CREATE); // 500
  }
  return this.roleDao.selectRoleByRoleId(registRoleVO.getRoleId());
}
```

### 규칙

1. 의도한 실패는 **모두 `LearningworksException(ErrorCode)`** 로 던집니다. `IllegalArgumentException` 등을 그대로 던지면 500이 됩니다.
2. 다른 예외를 감싸서 던질 때는 `new LearningworksException(ErrorCode, e)`를 사용합니다. 원인 예외가 로그에 남습니다.
3. 조회 결과가 없으면 `null`을 반환하지 말고 `XXX_NOT_EXISTS`(404)를 던집니다. `ApiResponse.OK(null)`은 `body`가 없는 응답이 되어 프론트에서 오류가 납니다.
4. DB 예외는 아래처럼 처리됩니다.

| DB 예외                        | 처리하지 않았을 때                                    | 도메인 메시지가 필요할 때                                               |
| ------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| PK / UNIQUE 중복 (ORA-00001)   | 409 `GLOBAL_DUPLICATED` "이미 존재하는 데이터입니다." | `DuplicateKeyException`을 catch해서 도메인 ErrorCode로 던지기           |
| FK 위반 (ORA-02291, ORA-02292) | 500                                                   | `DataIntegrityViolationException`을 catch해서 도메인 ErrorCode로 던지기 |
| NOT NULL · 길이 초과           | 500                                                   | VO에서 미리 검증하기 (3장 참고)                                         |
| SQL 문법 오류 등               | 500 + 서버 로그                                       | 코드 수정 대상                                                          |

---

## 5. Mapper

SQL만 작성하면 됩니다. MyBatis에서 발생한 DB 예외는 Spring이 알아서 변환하고, 공통 핸들러가 처리합니다.

---

## 6. ErrorCode 추가

파일 위치: `backend/src/main/java/com/learningworks/common/exceptions/enums/ErrorCode.java`

```java
// 404 NOT FOUND
GLOBAL_NOT_FOUND_URL(HttpStatus.NOT_FOUND, "존재하지 않는 URL이거나 요청 주소가 잘못되었습니다."), //
USER_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 회원입니다."), //
ROLE_NOT_EXISTS(HttpStatus.NOT_FOUND, "존재하지 않는 역할입니다."), //   ← 추가
```

### 규칙

1. 이름은 `도메인_상황` 형식입니다. 예: `COURSE_NOT_EXISTS`, `USER_USED`, `ROLE_FAILURE_CREATE`
2. 해당 상태 코드 섹션 안에, **같은 도메인끼리 모아서** 추가합니다. Git 충돌을 줄이기 위해서입니다.
3. 추가하기 전에 이미 있는 코드를 먼저 확인합니다. `GLOBAL_*`는 공통 코드입니다.
4. 상태 코드는 아래 기준으로 고릅니다.

| 상황                      | 상태 코드                 | 예시                        |
| ------------------------- | ------------------------- | --------------------------- |
| 입력값 · 요청 오류        | 400 BAD_REQUEST           | `FILES_BAD_REQUEST`         |
| 로그인 필요 · 인증 실패   | 401 UNAUTHORIZED          | `USER_NOT_MATCHED_IDENTIFY` |
| 로그인은 했지만 권한 없음 | 403 FORBIDDEN             | `COURSE_NOT_AUTHORIZED`     |
| 대상 데이터 없음          | 404 NOT_FOUND             | `USER_NOT_EXISTS`           |
| 중복 · 상태 충돌          | 409 CONFLICT              | `ROLE_ID_USED`              |
| 서버에서 처리 실패        | 500 INTERNAL_SERVER_ERROR | `ROLE_FAILURE_CREATE`       |

---

## 7. 자동으로 처리되는 에러

아래 상황은 따로 코드를 작성하지 않아도 공통 형식으로 응답됩니다.

| 상황                                                    | 상태 | errorCode                                    |
| ------------------------------------------------------- | ---- | -------------------------------------------- |
| `@Valid` 검증 실패                                      | 400  | `GLOBAL_INVALID_PARAMETER` (+ `validations`) |
| JSON 형식 오류 · JSON 타입 불일치                       | 400  | `GLOBAL_INVALID_JSON`                        |
| URL 파라미터 타입 불일치 (`/roles/abc`에서 숫자를 기대) | 400  | `GLOBAL_TYPE_MISMATCH`                       |
| 필수 `@RequestParam` 누락                               | 400  | `GLOBAL_MISSING_PARAMETER`                   |
| 존재하지 않는 URL                                       | 404  | `GLOBAL_NOT_FOUND_URL`                       |
| 지원하지 않는 HTTP 메서드                               | 405  | `GLOBAL_METHOD_NOT_ALLOWED`                  |
| PK / UNIQUE 중복                                        | 409  | `GLOBAL_DUPLICATED`                          |
| 업로드 파일 크기 초과                                   | 413  | `FILES_TOO_LARGE`                            |
| 지원하지 않는 Content-Type                              | 415  | `GLOBAL_UNSUPPORTED_MEDIA_TYPE`              |
| 그 외 모든 예외                                         | 500  | `GLOBAL_SYSTEM_ERROR` (+ 서버 로그)          |

---

## 8. 체크리스트

새 API를 만든 뒤 아래 항목을 확인하세요.

- [ ] 컨트롤러 반환 타입이 `ApiResponse<T>`인가?
- [ ] 생성 API는 `CREATED`(201)를 반환하는가?
- [ ] JSON 요청은 `@Valid @RequestBody`로 받는가?
- [ ] 요청 VO에 DB 컬럼 제약(`@NotBlank`, `@Size` 등)이 반영되어 있는가?
- [ ] 실패 상황은 `LearningworksException(ErrorCode)`로 던지는가?
- [ ] 조회 결과가 없을 때 404를 던지는가?
- [ ] 새 에러 상황에 맞는 ErrorCode를 추가했는가?

---

## 참고: 로그인 · 보안 기능 담당자

아래 항목은 아직 처리되지 않았습니다. 인증 기능을 구현할 때 함께 처리해야 합니다.

- 서비스에서 `AuthenticationManager.authenticate()`를 호출하면 `BadCredentialsException` 등이 발생하는데, 현재는 500으로 응답됩니다. `AuthenticationException` → 401 핸들러가 필요합니다.
- `formLogin` / `httpBasic`이 꺼져 있어서, 인증되지 않은 요청이 401이 아니라 403으로 응답됩니다. JWT 적용 시 `AuthenticationEntryPoint`(401)를 직접 등록해야 합니다.
- `SecurityConfig`에서 `anyRequest().permitAll()`을 해제할 때 **`/error`는 반드시 `permitAll`** 에 포함해야 합니다. 포함하지 않으면 모든 에러 응답이 빈 403으로 바뀝니다.
