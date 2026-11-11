# API 권한 설정 가이드

API마다 "어떤 역할이 호출할 수 있는지"는 **컨트롤러 메서드에 어노테이션 한 줄**로 지정합니다. 역할별 허용 여부는 코드가 아니라 관리자가 화면에서 정합니다.

- **모든 API에 아래 어노테이션 중 하나를 붙입니다.** 붙이지 않은 API는 **SUPER_ADMIN만** 호출할 수 있습니다.
  - 권한이 필요한 API (대부분): `@RequireAction(domain, action, description)`
  - 로그인한 사람이면 누구나 쓰는 API (내 정보 등): `@LoginRequired`
  - 로그인하지 않아도 쓰는 API (공개 정보): `@PublicApi`
  - 최고 관리자만 쓰는 API: `@RequireSuperAdmin` (권한 체계를 다루는 기능만, 2장)
- 공통 파일 수정, 권한 목록 파일 등록, DB 작업은 필요 없습니다. **자기 컨트롤러만 수정하면 됩니다.**
- 화면에서 권한에 따라 버튼 · 화면을 숨기는 방법은 `frontend/docs/permission-guide.md`를 참고하세요. 화면에서 숨겨도 API에는 이 가이드대로 어노테이션을 붙여야 합니다.

> **⚠️ 현재 상태: 권한 검사가 켜져 있습니다** (2026-11-10, `app.access-check.enabled: true`).
>
> `@RequireAction`을 붙인 API는 관리자가 권한을 등록 · 부여하기 전까지 **ROLE_SUPER_ADMIN만** 호출할 수 있습니다 (6장 참고). 어노테이션을 붙인 뒤 다른 역할로 테스트하려면 먼저 등록 · 부여하세요.
>
> **어노테이션이 없는 API는 SUPER_ADMIN만 호출할 수 있습니다** (2026-11-10, `app.access-check.default-super-admin: true`). 다른 역할이 써야 하는 API에는 반드시 어노테이션을 붙이세요. 서버 시작 로그에 어노테이션이 없는 API 목록이 표시됩니다 (7장).

---

## 1. 동작 방식

```text
[개발자]  컨트롤러 메서드에 @RequireAction(domain = "ASSIGNMENT", action = "CREATE", ...)
             ↓  서버 시작 시 자동 수집
[서버]    권한 코드 목록에 ASSIGNMENT_CREATE 등록
             ↓
[관리자]  ① 접근 관리 화면: 목록에서 ASSIGNMENT_CREATE를 골라 등록
          ② 권한별 접근 권한 관리 화면: ROLE_TUTOR에 ASSIGNMENT_CREATE 부여
             ↓
[요청]    ROLE_TUTOR 사용자가 호출 → 허용 / ROLE_STUDENT 사용자가 호출 → 403
```

- 권한 코드는 `domain + "_" + action`입니다 (예: `ASSIGNMENT_CREATE`).
- 요청자의 역할은 토큰이 아니라 **DB의 현재 역할** 기준으로 판단합니다. 회원의 역할이 바뀌면 다음 요청부터 바로 반영됩니다. (역할에 부여된 권한이 바뀌는 경우는 6장의 캐시 설명 참고)
- `ROLE_SUPER_ADMIN`은 모든 권한 코드를 항상 허용합니다.

---

## 2. 어노테이션 종류

| 어노테이션            | 호출할 수 있는 사람                         | 사용하는 곳                                                             |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| `@RequireAction(...)` | 관리자가 화면에서 허용한 역할 + SUPER_ADMIN | 대부분의 기능 (조회, 등록, 수정, 삭제 등)                               |
| `@LoginRequired`      | 로그인한 사용자 누구나 (비로그인 401)       | 내 정보 · 내 권한 · 내 수강 목록처럼 본인 데이터를 다루는 기능          |
| `@PublicApi`          | 누구나 (비로그인 포함)                      | 공개 공지 조회, 오류 응답(`/error`) 등                                  |
| `@RequireSuperAdmin`  | SUPER_ADMIN만 (다른 역할에 부여할 수 없음)  | 권한 체계 자체를 바꾸는 기능 (역할 생성 · 순서 변경, 권한 설정 저장 등) |
| **없음**              | **SUPER_ADMIN만**                           | 사용하지 마세요. 붙이는 것을 잊은 API가 열리지 않도록 막아 두는 기본값  |

- 한 메서드에는 **하나만** 붙입니다. 두 개 이상 붙이면 서버가 시작되지 않습니다 (5장).
- `@LoginRequired`와 `@PublicApi`는 권한 코드가 없어서 관리자가 화면에서 부여 · 해제할 수 없습니다. 역할에 따라 달라져야 하는 기능에는 `@RequireAction`을 쓰세요.
- 로그인(`/login`)은 컨트롤러가 아니라 필터에서 처리하므로 어노테이션이 필요 없습니다.

```java
import com.learningworks.common.action.LoginRequired;
import com.learningworks.common.action.PublicApi;
import com.learningworks.common.action.RequireAction;
import com.learningworks.common.action.RequireSuperAdmin;
```

### `@RequireSuperAdmin`이 붙은 API (현재 전체 목록)

**새 기능에는 `@RequireSuperAdmin`을 붙이지 마세요.** SUPER_ADMIN 전용은 권한 체계 자체를 다루는 아래 기능으로 한정합니다 (2026-11-10 합의). 그 외 기능은 모두 `@RequireAction`으로 두어, 필요하면 관리자가 다른 역할에도 부여할 수 있게 합니다. SUPER_ADMIN 전용이 꼭 필요한 기능이 생기면 ROLE 담당자와 먼저 협의하세요.

| 기능 | API |
| --- | --- |
| 역할 생성 · 이름 변경 · 순서 변경 · 삭제 | `POST /roles`, `PUT /roles/{roleId}`, `PUT /roles/order`, `DELETE /roles/{roleId}` |
| 권한 코드 목록 | `GET /action-codes` |
| 접근 관리: 메뉴 목록 · ACTION 등록 · 수정 | `GET /access/menus`, `POST /access/save` |
| 권한별 접근 권한 관리: 권한 저장 | `POST /access-role/save` |

참고로 권한 설정 화면의 **조회 API는 `@RequireAction`** 이라 다른 역할에도 부여할 수 있습니다: `GET /access/actions`(`ACCESS_READ`), `GET /access-role/allowed`(`ACCESS_ROLE_READ_ALLOWED`), `GET /access-role/denied`(`ACCESS_ROLE_READ_DENIED`). 단, 두 화면은 현재 프론트에서 SUPER_ADMIN에게만 표시됩니다.

---

## 3. `@RequireAction` 작성법

```java
@RestController
@RequestMapping("/assignments")
public class AssignmentController {

  @RequireAction(domain = "ASSIGNMENT", action = "READ", description = "과제 조회")
  @GetMapping
  public ApiResponse<List<AssignmentVO>> getAssignments(...) { ... }

  @RequireAction(domain = "ASSIGNMENT", action = "READ", description = "과제 조회")
  @GetMapping("/{assignmentId}")
  public ApiResponse<AssignmentVO> getAssignment(...) { ... }

  @RequireAction(domain = "ASSIGNMENT", action = "CREATE", description = "과제 등록")
  @PostMapping
  public ApiResponse<AssignmentVO> createAssignment(...) { ... }

  @RequireAction(domain = "ASSIGNMENT", action = "SUBMIT", description = "과제 제출")
  @PostMapping("/{assignmentId}/submissions")
  public ApiResponse<SubmissionVO> submitAssignment(...) { ... }
}
```

### 작성 규칙

| 항목           | 규칙                                           | 예시                          |
| -------------- | ---------------------------------------------- | ----------------------------- |
| `domain`       | 대문자 · 숫자, 단어 구분은 언더스코어          | `ASSIGNMENT`, `COURSE_NOTICE` |
| `action`       | 대문자 · 숫자, 단어 구분은 언더스코어          | `CREATE`, `USER_MOVE`         |
| 권한 코드 길이 | `domain_action` 전체 **40자 이하**             | `COURSE_NOTICE_CREATE` (20자) |
| `description`  | 관리자 화면에 보이는 한글 설명. 비워둘 수 없음 | `"과제 등록"`                 |

### domain 정하는 법

- **기능(화면) 단위**로 정합니다. 테이블 이름이 아닙니다.
- 같은 모듈 담당자끼리 같은 이름을 쓰세요. 이미 쓰이는 이름은 `GET /action-codes`(7장)로 확인할 수 있습니다.

| 기능      | domain          |
| --------- | --------------- |
| 역할 관리 | `ROLE`          |
| 과정 관리 | `COURSE`        |
| 과정 공지 | `COURSE_NOTICE` |
| 과제      | `ASSIGNMENT`    |
| 설문      | `SURVEY`        |

### action 정하는 법

기본 4개를 먼저 쓰고, 맞지 않을 때만 새 이름을 만드세요.

| action   | 의미                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| `READ`   | 조회 (목록 · 상세)                                                                                              |
| `CREATE` | 등록                                                                                                            |
| `UPDATE` | 수정                                                                                                            |
| `DELETE` | 삭제                                                                                                            |
| 그 외    | 동사 하나로 짧게. 예: `SUBMIT`(제출), `ANSWER`(응답), `APPROVE`(승인), `DOWNLOAD`(다운로드), `ORDER`(순서 변경) |

### 같은 권한을 여러 API에 붙일 때

- 목록 조회와 상세 조회처럼 같은 권한으로 묶을 API에는 **같은 값을 그대로 반복**해서 적습니다.
- 같은 권한 코드인데 `description`이 다르면 서버가 시작되지 않습니다 (5장).
- 반복이 불편하면 자기 모듈 안에 상수 클래스를 만들어도 됩니다 (선택). 공용 상수 파일은 만들지 마세요.

---

## 4. 어떤 API에 무엇을 붙일까

| API 성격                              | 붙일 것              | 예시                                      |
| ------------------------------------- | -------------------- | ----------------------------------------- |
| 역할에 따라 허용 여부가 달라지는 기능 | `@RequireAction`     | 과제 등록(강사만), 과제 조회(강사 · 학생) |
| 로그인만 하면 누구나 쓰는 기능        | `@LoginRequired`     | 내 정보 조회, 내 권한 조회                |
| 비로그인도 쓰는 기능                  | `@PublicApi`         | 공개 공지 조회                            |
| 권한 체계를 바꾸는 기능               | `@RequireSuperAdmin` | 역할 생성 · 삭제, 권한 설정 저장          |

- **고민되면 `@RequireAction`을 쓰세요.** 나중에 관리자가 모든 역할에 부여하면 `@LoginRequired`와 같은 효과를 낼 수 있지만, 반대로 `@LoginRequired`는 특정 역할만 막을 수 없습니다.
  - 예: "내 수강 목록"이 학생 · 강사 모두에게 필요하더라도, 관리자 계정에는 의미가 없다면 `@RequireAction(domain = "MY_COURSE", action = "READ", ...)`로 두고 학생 · 강사에게 부여합니다.
- `@PublicApi`는 정말 공개해야 하는 API에만 붙이세요. Spring Security 설정이 모든 요청을 허용(`permitAll`)하므로, `@PublicApi`가 붙은 API는 로그인 없이 누구나 호출할 수 있습니다.

### 로그인 사용자 ID 받기

**방법 1. `AuthUtil.getLoginId()` (로그인이 필요한 API)**

어디서든 호출할 수 있고, 비로그인이면 `GLOBAL_UNAUTHORIZED`(401)를 던집니다. 로그인 확인과 ID 조회가 한 줄로 끝납니다.

```java
import com.learningworks.common.utils.AuthUtil;

// Service
public List<CourseVO> readMyCourses() {
  String userId = AuthUtil.getLoginId(); // 비로그인이면 401
  ...
}
```

**방법 2. 컨트롤러 파라미터 `Authentication` (`@PublicApi`에서 로그인 여부에 따라 결과가 다른 경우)**

비로그인일 때 예외 대신 `null`로 받아 직접 처리하고 싶을 때 씁니다. 컨트롤러 파라미터에 `Authentication`을 추가하고 `getName()`을 사용합니다. 비로그인이면 `authentication`이 `null`입니다.

```java
import org.springframework.security.core.Authentication;

@PublicApi
@GetMapping("/notices")
public ApiResponse<List<NoticeVO>> getNotices(Authentication authentication) {
  String userId = authentication == null ? null : authentication.getName();
  return ApiResponse.OK(this.noticeService.readNotices(userId));
}
```

```java
// Service
public List<NoticeVO> readNotices(String userId) {
  if (userId == null) {
    return this.noticeDao.selectPublicNotices(); // 비로그인: 공개 공지만
  }
  ...
}
```

> **`@AuthenticationPrincipal LoginUser`는 쓰지 마세요.** JWT 인증 필터는 로그인 정보에 `LoginUser`가 아니라 회원 ID 문자열을 넣기 때문에, 이 값은 로그인해도 항상 `null`입니다.
>
> **`AuthUtil.isGranted("역할")`로 권한을 판단하지 마세요.** 이 메서드는 토큰에 적힌 역할 이름을 비교합니다. 토큰의 역할은 로그인 시점 값이라 바뀐 역할이 반영되지 않고, 역할별 권한은 관리자가 화면에서 바꿀 수 있습니다. 권한은 `@RequireAction`으로 지정하세요 (9장).

---

## 5. 서버 시작 실패 메시지

어노테이션 작성 규칙을 어기면 **서버가 시작되지 않고** 로그에 원인과 위치가 표시됩니다.

| 메시지                                                          | 원인                                                    | 해결                              |
| --------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------- |
| `@RequireAction 형식 오류 ... domain=Assignment`                | 소문자, 공백, 하이픈 등 사용                            | 대문자 · 숫자 · 언더스코어만 사용 |
| `권한 코드 ...가 40자를 넘습니다`                               | `domain_action`이 40자 초과                             | 이름을 줄이기                     |
| `@RequireAction의 description이 비어 있습니다`                  | `description` 누락                                      | 한글 설명 작성                    |
| `권한 코드 ...의 description이 서로 다릅니다`                   | 같은 권한 코드를 여러 API에 붙이면서 설명을 다르게 적음 | 설명을 똑같이 맞추기              |
| `권한 어노테이션 @RequireAction, @RequireSuperAdmin은 함께 사용할 수 없습니다. 하나만 붙이세요` | 한 메서드에 권한 어노테이션(`@RequireAction`, `@RequireSuperAdmin`, `@LoginRequired`, `@PublicApi`)을 두 개 이상 붙임 | 하나만 남기기 |

메시지 끝의 괄호에 위치가 나옵니다. 예: `(AssignmentController#createAssignment(AssignmentVO))`

---

## 6. 권한 등록 · 부여 (관리자 작업)

어노테이션을 붙인 뒤 아래 두 단계를 거쳐야 SUPER_ADMIN이 아닌 역할도 API를 쓸 수 있습니다. 개발 중에는 SUPER_ADMIN 계정으로 직접 진행하세요.

1. **접근 관리** 화면 (`시스템 관리 > 접근 관리`, `/admin/system/access`)
   - 도메인 → 권한 순서로 드롭다운에서 선택하고 메뉴를 지정해 등록합니다.
   - 드롭다운에는 서버가 수집한 권한 코드만 나옵니다. 이미 등록된 코드는 "(등록됨)"으로 표시됩니다.
2. **권한별 접근 권한 관리** 화면 (`시스템 관리 > 권한별 접근 권한 관리`, `/admin/system/access-role`)
   - 역할을 고르고 등록한 권한을 허용합니다.

| 상태                            | 결과                              |
| ------------------------------- | --------------------------------- |
| 어노테이션만 붙임 (등록 전)     | SUPER_ADMIN만 호출 가능           |
| 등록했지만 역할에 부여하지 않음 | SUPER_ADMIN만 호출 가능           |
| 역할에 부여함                   | 해당 역할 + SUPER_ADMIN 호출 가능 |

### 권한 변경이 반영되는 시점 (캐시)

- 서버는 역할별 허용 권한 코드 목록을 **만료 없이 캐시**합니다. 서버 검사와 내 권한 API(`GET /action-codes/me`, 프론트 화면 표시용)가 같은 캐시를 씁니다.
- `권한별 접근 권한 관리`에서 권한을 저장하면 해당 역할의 캐시가 비워지므로, **저장 즉시 서버 검사에 반영**됩니다. 화면 표시는 사용자가 **새로고침하거나 다시 로그인하면** 반영됩니다.
- 역할을 삭제할 때도 해당 역할의 캐시가 비워집니다.
- 캐시는 서버 메모리에 있으므로, 서버를 여러 대 띄우면 다른 서버의 캐시는 비워지지 않습니다 (현재는 서버 한 대 기준).
- 권한이 바뀌는 기능을 새로 만든다면(예: ACTION 삭제) ROLE 담당자에게 알려 주세요. 캐시를 비우는 호출이 필요합니다.

---

## 7. 확인 방법

- **서버 시작 로그**: 수집된 권한 코드와, **권한 어노테이션이 없어 SUPER_ADMIN만 호출할 수 있는 API**가 표시됩니다. 내 API가 두 번째 목록에 있으면 어노테이션을 붙이세요.

```text
INFO  c.l.common.action.ActionCodeRegistry -- 권한 코드 6개 등록: [ACCESS_READ, ..., ROLE_USER_READ]
INFO  c.l.common.action.ActionCodeRegistry -- 권한 어노테이션이 없는 API 14개 (app.access-check.default-super-admin: true이면 SUPER_ADMIN만 호출 가능): [com.learningworks.course.web.CourseController#addCourse(RegistCourseVO), ...]
```

- **권한 코드 목록 API** (SUPER_ADMIN): `GET /action-codes`. 도메인별 목록과 등록 여부(`registered`)를 볼 수 있습니다. 다른 모듈에서 이미 쓰는 domain 이름을 확인할 때도 사용합니다.
- **내 권한 API** (로그인 사용자): `GET /action-codes/me`. 현재 역할과 허용된 권한 코드를 반환합니다. 프론트에서 버튼 표시 여부를 판단할 때 사용하며, 프론트 공통 코드가 로그인 시 자동으로 호출합니다 (`frontend/docs/permission-guide.md`). 권한 검사 설정과 관계없이 항상 동작합니다.

---

## 8. 권한이 없을 때의 응답

공통 응답 형식으로 응답합니다. 서비스에서 따로 처리할 필요가 없습니다.

| 상황                   | 상태 | errorCode             |
| ---------------------- | ---- | --------------------- |
| 비로그인               | 401  | `GLOBAL_UNAUTHORIZED` |
| 로그인했지만 권한 없음 | 403  | `GLOBAL_FORBIDDEN`    |
| 회원이 없거나 탈퇴함   | 403  | `GLOBAL_FORBIDDEN`    |

```json
{
  "httpStatusCode": 403,
  "httpStatusMessage": "Forbidden",
  "errorCode": "GLOBAL_FORBIDDEN",
  "error": "접근 권한이 없습니다."
}
```

---

## 9. 하지 말 것

- `@PreAuthorize("hasRole(...)")`, `@PreAuthorize("hasAnyRole(...)")`로 역할을 직접 나열하기
  - 관리자가 화면에서 권한을 바꿔도 반영되지 않고, 새로 만든 역할은 아무 기능도 쓸 수 없게 됩니다.
- 서비스에서 역할 ID를 직접 비교하기
  - 예: `if ("ROLE_TUTOR".equals(roleId))`, `AuthUtil.isGranted("ROLE_TUTOR")`. 위와 같은 이유입니다. `isGranted`는 토큰의 역할(로그인 시점 값)을 보므로 바뀐 역할도 반영되지 않습니다.
- **등록한 뒤에 `domain` · `action` 바꾸기**
  - 권한 코드가 바뀌면 기존 등록 · 부여와 연결이 끊겨, 부여받았던 역할이 그 API를 쓸 수 없게 됩니다. 기존 코드는 접근 관리 화면에 "(미사용)"으로 표시됩니다.
  - 꼭 바꿔야 하면 바꾼 뒤 새 코드를 다시 등록 · 부여하고, ROLE 담당자에게 알려 주세요.
  - `description`만 바꾸는 것은 괜찮습니다.
- 클래스에 어노테이션 붙이기 (메서드에만 붙일 수 있습니다)
- 한 메서드에 권한 어노테이션을 두 개 이상 붙이기
- 테스트하기 편하려고 `@PublicApi`나 `@LoginRequired`를 붙이기
  - 다른 역할로 테스트하려면 `@RequireAction`을 붙이고 그 역할에 권한을 부여하세요 (6장).
- 어노테이션 없이 두기
  - SUPER_ADMIN 계정으로만 개발하면 문제를 모르고 지나치기 쉽습니다. 서버 시작 로그의 "권한 어노테이션이 없는 API" 목록을 확인하세요.

---

## 10. 체크리스트

- [ ] **모든 API에 권한 어노테이션이 하나씩 붙어 있는가?** (서버 시작 로그의 "권한 어노테이션이 없는 API"에 내 API가 없는가?)
- [ ] 역할에 따라 허용 여부가 달라지는 API에 `@RequireAction`을 붙였는가?
- [ ] `domain`이 테이블 이름이 아니라 기능 단위이고, 같은 모듈에서 같은 이름을 쓰는가?
- [ ] `action`은 가능하면 `READ` · `CREATE` · `UPDATE` · `DELETE`를 썼는가?
- [ ] 같은 권한 코드를 붙인 API들의 `description`이 똑같은가?
- [ ] `@PublicApi`는 정말 비로그인에게도 공개해야 하는 API에만 붙였는가?
- [ ] 로그인 사용자 ID를 `AuthUtil.getLoginId()` 또는 `Authentication.getName()`으로 받는가? (`@AuthenticationPrincipal LoginUser` 사용 안 함)
- [ ] 서버 시작 로그의 "권한 코드 N개 등록"에 내 권한 코드가 보이는가?

---

## 참고

### 관련 파일

| 파일                                        | 내용                               |
| ------------------------------------------- | ---------------------------------- |
| `common/action/RequireAction.java`          | 권한 지정 어노테이션               |
| `common/action/RequireSuperAdmin.java`      | SUPER_ADMIN 전용 어노테이션        |
| `common/action/LoginRequired.java`          | 로그인 사용자 누구나 어노테이션    |
| `common/action/PublicApi.java`              | 비로그인 포함 누구나 어노테이션    |
| `common/action/ActionCodeRegistry.java`     | 서버 시작 시 권한 코드 수집 · 검증 |
| `common/action/AccessChecker.java`          | 권한 검사 (역할별 허용 목록 캐시)  |
| `common/action/ActionCheckInterceptor.java` | 요청마다 어노테이션을 읽어 검사    |

경로는 모두 `backend/src/main/java/com/learningworks/` 아래입니다. **이 파일들은 수정하지 말고**, 필요한 변경은 ROLE 담당자에게 요청하세요.

### 지원하지 않는 것

- 컨트롤러가 아닌 서비스 안에서 조건에 따라 권한을 검사하기 (예: "작성자 본인이 아니면 추가 권한 필요"). 필요하면 ROLE 담당자에게 요청하세요.

### 관련 문서

- 프론트 화면 권한 적용: `frontend/docs/permission-guide.md`
- 권한 체계를 이렇게 정한 이유와 검토한 다른 방식: `backend/docs/access-role-collab/discussions.md`의 D-01 · D-02
- 권한 검사를 켜기 전에 남은 작업: `backend/docs/access-role-collab/README.md`의 "남은 작업"
