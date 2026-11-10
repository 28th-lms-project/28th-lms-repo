# API 권한 설정 가이드

API마다 "어떤 역할이 호출할 수 있는지"는 **컨트롤러 메서드에 어노테이션 한 줄**로 지정합니다. 역할별 허용 여부는 코드가 아니라 관리자가 화면에서 정합니다.

- 권한이 필요한 API: `@RequireAction(domain, action, description)`을 붙입니다.
- 최고 관리자만 쓰는 API: `@RequireSuperAdmin`을 붙입니다.
- 공통 파일 수정, 권한 목록 파일 등록, DB 작업은 필요 없습니다. **자기 컨트롤러만 수정하면 됩니다.**

> **⚠️ 현재 상태: 권한 검사는 꺼져 있습니다.**
>
> 지금은 어노테이션을 붙여도 동작에 영향이 없으므로 **미리 붙여 두세요.** 검사를 켜면 바로 적용됩니다. 켜는 시점은 ROLE 담당자가 공지합니다.
>
> 검사가 켜진 뒤에는 관리자가 권한을 등록 · 부여하기 전까지 **ROLE_SUPER_ADMIN만** 해당 API를 호출할 수 있습니다 (6장 참고).

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
- 요청자의 역할은 토큰이 아니라 **DB의 현재 역할** 기준으로 판단합니다. 역할이 바뀌면 다음 요청부터 바로 반영됩니다.
- `ROLE_SUPER_ADMIN`은 모든 권한 코드를 항상 허용합니다.

---

## 2. 어노테이션 종류

| 어노테이션            | 호출할 수 있는 사람                         | 사용하는 곳                                                             |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| `@RequireAction(...)` | 관리자가 화면에서 허용한 역할 + SUPER_ADMIN | 대부분의 기능 (조회, 등록, 수정, 삭제 등)                               |
| `@RequireSuperAdmin`  | SUPER_ADMIN만 (다른 역할에 부여할 수 없음)  | 권한 체계 자체를 바꾸는 기능 (역할 생성 · 순서 변경, 권한 설정 저장 등) |
| 없음                  | 누구나 (비로그인 포함)                      | 로그인, 공개 정보 조회 등                                               |

```java
import com.learningworks.common.action.RequireAction;
import com.learningworks.common.action.RequireSuperAdmin;
```

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

| API 성격                              | 붙일 것                       | 예시                                      |
| ------------------------------------- | ----------------------------- | ----------------------------------------- |
| 역할에 따라 허용 여부가 달라지는 기능 | `@RequireAction`              | 과제 등록(강사만), 과제 조회(강사 · 학생) |
| 권한 체계를 바꾸는 기능               | `@RequireSuperAdmin`          | 역할 생성 · 삭제, 권한 설정 저장          |
| 로그인만 하면 누구나 쓰는 기능        | 없음 + 서비스에서 로그인 확인 | 내 정보 조회, 내 수강 목록                |
| 비로그인도 쓰는 기능                  | 없음                          | 로그인, 공개 공지 조회                    |

> **어노테이션이 없는 API는 비로그인 사용자도 호출할 수 있습니다.** 현재 Spring Security 설정이 모든 요청을 허용(`permitAll`)하기 때문입니다. 로그인이 필요하면 아래처럼 로그인 사용자 ID가 없을 때 `GLOBAL_UNAUTHORIZED`를 던지세요.

### 로그인 사용자 ID 받기

컨트롤러 파라미터에 `Authentication`을 추가하고 `getName()`을 사용합니다. 비로그인이면 `authentication`이 `null`입니다.

```java
import org.springframework.security.core.Authentication;

@GetMapping("/my/courses")
public ApiResponse<List<CourseVO>> getMyCourses(Authentication authentication) {
  String userId = authentication == null ? null : authentication.getName();
  return ApiResponse.OK(this.courseService.readMyCourses(userId));
}
```

```java
// Service
public List<CourseVO> readMyCourses(String userId) {
  if (userId == null) {
    throw new LearningworksException(ErrorCode.GLOBAL_UNAUTHORIZED);
  }
  ...
}
```

> **`@AuthenticationPrincipal LoginUser`는 쓰지 마세요.** JWT 인증 필터는 로그인 정보에 `LoginUser`가 아니라 회원 ID 문자열을 넣기 때문에, 이 값은 로그인해도 항상 `null`입니다.

---

## 5. 서버 시작 실패 메시지

어노테이션 작성 규칙을 어기면 **서버가 시작되지 않고** 로그에 원인과 위치가 표시됩니다.

| 메시지                                                          | 원인                                                    | 해결                              |
| --------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------- |
| `@RequireAction 형식 오류 ... domain=Assignment`                | 소문자, 공백, 하이픈 등 사용                            | 대문자 · 숫자 · 언더스코어만 사용 |
| `권한 코드 ...가 40자를 넘습니다`                               | `domain_action`이 40자 초과                             | 이름을 줄이기                     |
| `@RequireAction의 description이 비어 있습니다`                  | `description` 누락                                      | 한글 설명 작성                    |
| `권한 코드 ...의 description이 서로 다릅니다`                   | 같은 권한 코드를 여러 API에 붙이면서 설명을 다르게 적음 | 설명을 똑같이 맞추기              |
| `@RequireAction과 @RequireSuperAdmin은 함께 사용할 수 없습니다` | 한 메서드에 둘 다 붙임                                  | 하나만 남기기                     |

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

---

## 7. 확인 방법

- **서버 시작 로그**: 수집된 권한 코드가 모두 표시됩니다.

```text
INFO  c.l.common.action.ActionCodeRegistry -- 권한 코드 3개 등록: [ROLE_READ, ROLE_USER_MOVE, ROLE_USER_READ]
```

- **권한 코드 목록 API** (SUPER_ADMIN): `GET /action-codes`. 도메인별 목록과 등록 여부(`registered`)를 볼 수 있습니다. 다른 모듈에서 이미 쓰는 domain 이름을 확인할 때도 사용합니다.
- **내 권한 API** (로그인 사용자): `GET /action-codes/me`. 현재 역할과 허용된 권한 코드를 반환합니다. 프론트에서 버튼 표시 여부를 판단할 때 사용합니다.

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
  - 예: `if ("ROLE_TUTOR".equals(roleId))`. 위와 같은 이유입니다.
- **등록한 뒤에 `domain` · `action` 바꾸기**
  - 권한 코드가 바뀌면 기존 등록 · 부여와 연결이 끊겨, 부여받았던 역할이 그 API를 쓸 수 없게 됩니다. 기존 코드는 접근 관리 화면에 "(미사용)"으로 표시됩니다.
  - 꼭 바꿔야 하면 바꾼 뒤 새 코드를 다시 등록 · 부여하고, ROLE 담당자에게 알려 주세요.
  - `description`만 바꾸는 것은 괜찮습니다.
- 클래스에 어노테이션 붙이기 (메서드에만 붙일 수 있습니다)
- 한 메서드에 `@RequireAction`과 `@RequireSuperAdmin`을 함께 붙이기

---

## 10. 체크리스트

- [ ] 역할에 따라 허용 여부가 달라지는 API에 `@RequireAction`을 붙였는가?
- [ ] `domain`이 테이블 이름이 아니라 기능 단위이고, 같은 모듈에서 같은 이름을 쓰는가?
- [ ] `action`은 가능하면 `READ` · `CREATE` · `UPDATE` · `DELETE`를 썼는가?
- [ ] 같은 권한 코드를 붙인 API들의 `description`이 똑같은가?
- [ ] 어노테이션이 없는 API 중 로그인이 필요한 곳은 서비스에서 로그인을 확인하는가?
- [ ] 로그인 사용자 ID를 `Authentication.getName()`으로 받는가? (`@AuthenticationPrincipal LoginUser` 사용 안 함)
- [ ] 서버 시작 로그의 "권한 코드 N개 등록"에 내 권한 코드가 보이는가?

---

## 참고

### 관련 파일

| 파일                                        | 내용                               |
| ------------------------------------------- | ---------------------------------- |
| `common/action/RequireAction.java`          | 권한 지정 어노테이션               |
| `common/action/RequireSuperAdmin.java`      | SUPER_ADMIN 전용 어노테이션        |
| `common/action/ActionCodeRegistry.java`     | 서버 시작 시 권한 코드 수집 · 검증 |
| `common/action/AccessChecker.java`          | 권한 검사 (역할별 허용 목록 캐시)  |
| `common/action/ActionCheckInterceptor.java` | 요청마다 어노테이션을 읽어 검사    |

경로는 모두 `backend/src/main/java/com/learningworks/` 아래입니다. **이 파일들은 수정하지 말고**, 필요한 변경은 ROLE 담당자에게 요청하세요.

### 지원하지 않는 것

- 컨트롤러가 아닌 서비스 안에서 조건에 따라 권한을 검사하기 (예: "작성자 본인이 아니면 추가 권한 필요"). 필요하면 ROLE 담당자에게 요청하세요.

### 설계 문서

권한 체계를 이렇게 정한 이유와 검토한 다른 방식은 `backend/docs/access-role-collab/discussions.md`의 D-01 · D-02를 참고하세요.
