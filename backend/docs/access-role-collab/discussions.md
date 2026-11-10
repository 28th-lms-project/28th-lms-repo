# 협의 사항 (D)

처리 규칙은 `README.md`를 따릅니다.

> 최신화: 2026-11-10 (D-01에 프론트 내 권한 연동 완료 · 캐시 영향 범위 반영, D-02 · D-03 구현 현황 확인). 이전: 2026-11-09 (D-01 권한 검사의 JWT 연동 확인, R-09 처리 반영). 2026-11-06에 D-01(세부 사항 포함), D-02, D-03, D-06이 결정되었습니다. **D-01은 최종 결정으로 다시 정리되었습니다** (`ACTION_CODE` 컬럼 추가, `ACTION_ID`는 시퀀스, 권한 코드는 API의 `@RequireAction`에서 자동 수집). D-06의 배경(성공 메시지 포함 응답)은 R-01로 해소되었습니다.

**D 항목은 설계 결정입니다.** Claude Code는 선택지와 추천안을 담당자에게 설명하고, **담당자가 결정하기 전에는 코드를 수정하지 마세요.** 결정이 나면 `결정 결과`란에 기록하고, 필요한 작업은 새 R 항목으로 정리하거나 담당자와 ROLE 담당자가 나눠서 진행합니다.

| ID | 제목 | 우선순위 | 영향 범위 | 진행 상태 |
| --- | --- | --- | --- | --- |
| D-01 | 새로 만든 역할의 접근 권한 판단 방식 | 매우 높음 | 전체 API 권한 체크, ACTION 테이블 | **결정 · 권한 검사 구현 완료** (JWT 연동 확인, 검사는 켜기 전). ACCESS 작업: R-09 완료, R-10 대기 |
| D-02 | MENU_ROLE과 ROLE_ACTION의 역할 분담 | 매우 높음 | MENU / MENU_ROLE 구현 (ROLE 담당자) | **결정** (B안, MENU_ROLE 유지). MENU 구현 전 |
| D-03 | 권한 설정 · ACTION 관리 기능의 사용 범위 | 높음 | `/access/save`, `/access-role/save` | **결정**. 구현 대기 (R-10, R-11) |
| D-04 | 권한 설정 API의 URL 규칙 | 낮음 (선택) | ACCESS_ROLE API, 프론트 | 결정 대기 |
| D-05 | MENU 테이블 공동 사용 방식 | 중간 | ACCESS 모듈, MENU 구현 | 결정 대기 |
| D-06 | 성공 메시지를 응답에 포함할지 | 낮음 | R-01, R-06 | **결정 · 반영 완료** |

---

## D-01. 새로 만든 역할의 접근 권한 판단 방식

### 배경
- 역할은 관리자가 화면에서 새로 만들 수 있습니다 (`POST /roles`).
- 현재 계획은 컨트롤러에 `@PreAuthorize("hasAnyRole('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', ...)")`처럼 **허용 역할을 코드에 직접 나열**하는 방식입니다.

### 문제
1. 새 역할은 어떤 `hasAnyRole`에도 없으므로, 권한 설정 화면에서 ROLE_ACTION을 아무리 허용해도 **실제로는 아무 기능도 사용할 수 없습니다.**
2. 반대로 권한 설정 화면에서 기존 역할의 권한을 해제해도 코드의 `hasAnyRole`은 그대로라서 **화면 설정이 실제 권한에 반영되지 않습니다.**
3. 결과적으로 "권한별 접근 권한 관리" 화면이 실제 권한과 무관한 화면이 됩니다.

### 선택지

| 선택지 | 내용 | 장점 | 단점 |
| --- | --- | --- | --- |
| A. ROLE_ACTION 기반 검사 (추천) | API마다 필요한 ACTION을 지정하고, 요청자의 역할에 그 ACTION이 허용됐는지 DB 기준으로 검사 | 화면 설정이 곧 실제 권한. 새 역할도 코드 수정 없이 사용 가능 | 검사 빈(bean) · 캐시 구현 필요. ACTION에 고정 코드 필요 |
| B. `hasAnyRole` 고정 유지 | 역할을 코드에 나열 | 구현 단순 | 역할 추가 · 권한 변경마다 코드 수정 · 배포 필요. 권한 설정 화면이 의미 없어짐 |

### 추천안 (A) 구현 방향 (최초 제안)

```java
@PreAuthorize("@accessChecker.can('ROLE_DELETE')")
@DeleteMapping("/{roleId}")
public ApiResponse<RoleVO> deleteRole(...) { ... }
```

`accessChecker.can(actionCode)`:
1. 요청자가 `ROLE_SUPER_ADMIN`이면 항상 허용
2. 그 외에는 요청자 `BASE_ROLE`의 ROLE_ACTION에 해당 ACTION이 있는지 확인
3. 역할별 허용 ACTION 목록은 캐시하고, `/access-role/save`로 권한이 바뀌면 해당 역할 캐시를 초기화

**ACTION에 코드에서 가리킬 고정 식별자가 필요합니다.** 현재 `ACTION_ID`는 `SYS_GUID` 기반 무작위 값이라 코드에 적을 수 없습니다. → `ACTION_CODE VARCHAR2(n) NOT NULL UNIQUE` 컬럼 추가를 제안합니다 (예: `ROLE_DELETE`, `COURSE_CREATE`). ACTION 등록 화면에도 코드 입력란이 필요합니다.

> 최초 제안 중 `ACTION_CODE` 컬럼 추가는 최종 채택되었고, 권한 정의 · 검사 방식(`@PreAuthorize` 문자열, 관리자 직접 입력)은 바뀌었습니다. **아래 결정 결과의 "최종 결정"을 기준으로 하세요.**

### 결정이 필요한 것
- [x] A / B 중 선택 → A
- [x] (A 선택 시) `ACTION_CODE` 추가 여부와 이름 규칙 → **`ACTION_CODE` 컬럼 추가**, `{DOMAIN}_{ACTION}` 형식. 코드는 백엔드 개발자가 API에 정의하고, 관리자는 그 목록에서 선택
- [x] (A 선택 시) `accessChecker` 구현 담당 → **ROLE 담당자**
- [x] (A 선택 시) 요청자 역할을 JWT에서 읽을지 DB에서 읽을지 → **DB**

### 참고
- 회원에게 역할을 지정하는 규칙(자기보다 아래 순위만 지정)은 `ROLE_RANK` 기반 `RoleAssignPolicy`로 별도 처리되며, 이 결정과 무관하게 유지됩니다.

### 결정 결과
- 결정: A. ROLE_ACTION 기반 검사
- 결정일 · 참석자: 2026-11-06, ACCESS · ACCESS_ROLE 담당자 (A안 선택) / 2026-11-06, ROLE 담당자 (세부 사항)
- 후속 작업: ACCESS 모듈은 `requests.md`의 **R-09**, 권한 등록부 · 검사기는 ROLE 담당자

#### 최종 결정 (2026-11-06)

**1. ACTION 테이블**

| 컬럼 | 내용 |
| --- | --- |
| `ACTION_ID` | PK (`VARCHAR2(20 CHAR)`). **팀 공통 PK 규칙으로 자동 생성** (`약자-YYYYMMDD-시퀀스 6자리` 형식, SYS_GUID 사용 중단). 고정 부분이 16자이므로 약자는 4자 이하여야 20자에 들어감. `ROLE_ACTION.ACTION_ID`는 계속 이 값을 참조 |
| `ACTION_NAME` | 표시명 (`VARCHAR2(40 CHAR)`). 관리자가 입력 |
| `TOP_MENU_ID` · `MID_MENU_ID` · `BTM_MENU_ID` | 대 · 중 · 소메뉴 (각 `VARCHAR2(20 CHAR)`) |
| `ACTION_CODE` | **신규. 권한 코드** (`VARCHAR2(40 CHAR)`, `UNIQUE`). 예: `ROLE_DELETE`, `SURVEY_ANSWER`. 관리자가 직접 입력하지 않고 **백엔드에 정의된 코드 목록에서 선택** |

`DEL_YN` 컬럼은 없습니다. ACTION을 삭제한다면 물리 삭제이며, 권한 검사는 `ROLE_ACTION`과 `ACTION`을 조인하므로 삭제된 ACTION을 가리키는 `ROLE_ACTION` 행은 자동으로 무시됩니다 (FK가 없어 행 자체는 남으므로 함께 지우는 것을 권장).

**2. 권한 코드 정의: API 메서드에 `@RequireAction`을 붙인다 (규칙은 이것 하나)**

```java
@DeleteMapping("/roles/{roleId}")
@RequireAction(domain = "ROLE", action = "DELETE", description = "역할 삭제")
public ApiResponse<RoleVO> deleteRole(...) { ... }

@PostMapping("/surveys/{surveyId}/answers")
@RequireAction(domain = "SURVEY", action = "ANSWER", description = "설문 응답")
public ApiResponse<?> answerSurvey(...) { ... }
```

- 권한 코드 = `domain + "_" + action` (예: `ROLE_DELETE`, `ACCESS_ROLE_SAVE`)
- `domain`, `action`은 대문자 · 숫자 · 언더스코어 (`^[A-Z0-9]+(_[A-Z0-9]+)*$`). CRUD 외의 행위(`ANSWER`, `ORDER`, `APPROVE` 등)도 자유롭게 정의
- **중앙 enum · 공용 상수 파일 · DB 상수 테이블을 두지 않습니다.** 각 작업자는 자기 컨트롤러에 어노테이션만 붙이므로 공용 파일 수정이 없고 git 충돌도 생기지 않습니다.
- 같은 권한을 여러 API에 붙일 때는 같은 값을 반복해서 적습니다. 반복이 불편하면 그 모듈 담당자가 원할 때만 모듈 안에 상수 클래스를 둡니다 (선택).

**3. 권한 등록부 (`ActionCodeRegistry`, ROLE 담당자 구현)**

- 서버 시작 시 모든 컨트롤러 메서드의 `@RequireAction`을 수집해 권한 코드 목록을 만듭니다.
- 시작 시 검증 (어기면 **서버 시작 실패**)
  - `domain`, `action` 형식
  - 권한 코드 길이가 40자 이하 (`ACTION_CODE` `VARCHAR2(40 CHAR)`)
  - 같은 권한 코드인데 `description`이 다름
- 권한 코드 목록 API를 제공합니다. 권한 코드를 언더스코어로 나누는 작업은 **백엔드가** 합니다 (`ACCESS_ROLE_SAVE`처럼 도메인에 `_`가 들어가는 경우가 있어 프론트에서 나누면 경계가 모호함).

```json
{ "domainList": [
  { "domain": "ROLE", "actionList": [
    { "actionCode": "ROLE_DELETE", "action": "DELETE", "description": "역할 삭제" },
    { "actionCode": "ROLE_ORDER",  "action": "ORDER",  "description": "역할 순서 변경" } ] },
  { "domain": "SURVEY", "actionList": [
    { "actionCode": "SURVEY_ANSWER", "action": "ANSWER", "description": "설문 응답" } ] } ] }
```

- 서비스 안에서 조건부로 검사하는 권한(컨트롤러 메서드에 붙일 수 없는 권한)이 생기면, 모듈별 등록 수단(예: `ActionDefinitionProvider`를 구현한 모듈별 `@Component`)을 추가합니다. 이것도 모듈별 파일이므로 충돌이 없습니다.

**4. 권한 검사 (ROLE 담당자 구현)**

`@PreAuthorize` 문자열 대신, `HandlerInterceptor`가 `@RequireAction`을 읽어 `accessChecker`로 검사합니다. 권한이 없으면 `LearningworksException`(403)을 던지며, 인터셉터의 예외도 `GlobalExceptionHandler`가 공통 응답으로 처리합니다.

```text
@RequireAction(domain = "ROLE", action = "DELETE")  → 권한 코드 ROLE_DELETE
 1. 로그인 사용자 ID 확인 (없으면 거부)
 2. DB에서 BASE_ROLE 조회
 3. ROLE_SUPER_ADMIN이면 허용
 4. ROLE_ACTION ⨝ ACTION에서 (역할, ACTION_CODE = 'ROLE_DELETE')가 있으면 허용
 5. 역할별 허용 권한 코드 목록은 캐시. 권한 저장(/access-role/save) 성공 시 캐시 초기화
```

- 5번의 캐시 초기화 호출은 `requests.md`의 **R-10**으로 요청했습니다. ACTION 수정 시 초기화는 불필요로 정정되었습니다 (R-10 2번, 2026-11-09).
- 캐시에는 만료가 없습니다. 서버 검사와 내 권한 API(`GET /action-codes/me`)가 같은 캐시를 쓰므로, R-10이 처리되기 전에는 권한을 저장해도 **서버 재시작 전까지 서버 검사와 프론트 화면 표시 모두** 예전 권한을 씁니다 (2026-11-10 확인).

**구현 상태 (2026-11-06, ROLE 담당자)** — 패키지 `com.learningworks.common.action`

| 구성 요소 | 파일 | 상태 |
| --- | --- | --- |
| 권한 정의 어노테이션 | `RequireAction`, `RequireSuperAdmin` | 완료 |
| 권한 코드 규칙 (형식, 40자) | `ActionCodeRules` | 완료 |
| 등록부 (시작 시 수집 · 검증, `contains`) | `ActionCodeRegistry` | 완료 |
| 권한 코드 목록 API `GET /action-codes` (`@RequireSuperAdmin`, `registered` 포함) | `web.ActionCodeController`, `service.ActionCodeServiceImpl` | 완료 |
| 검사 인터셉터 · 검사기 (DB 역할 조회, 캐시, 커밋 후 evict) | `ActionCheckInterceptor`, `AccessChecker` | 완료 |
| `RoleController` 적용 | 역할 목록 조회 `ROLE_READ`, 역할 사용 회원 조회 `ROLE_USER_READ`, 회원 이동 `ROLE_USER_MOVE`, 생성 · 순서 · 이름 변경 · 삭제 `@RequireSuperAdmin` | 완료 |
| 역할 삭제 시 캐시 초기화 | `RoleServiceImpl.deleteRole` | 완료 |
| 내 권한 API `GET /action-codes/me` (프론트 버튼 표시용, 로그인만 필요) | `web.ActionCodeController`, `service.ActionCodeServiceImpl`, `vo.response.MyActionCodeVO` | 완료 (2026-11-09) |
| 프론트 내 권한 연동 (로그인 시 조회 · Redux 저장 · `usePermission` 훅) | `frontend/src/hooks/usePermission.js`, `store/slices/permissionSliceStore.js`, `layout/MainLayout.jsx`. 사용법 `frontend/docs/permission-guide.md` | 완료 (2026-11-10) |
| 권한 관리 화면 권한별 표시 (`ROLE_READ` · SUPER_ADMIN 기준) | `frontend/src/components/admin/system/role/Role.jsx` | 완료 (2026-11-10) |
| ACCESS · ACCESS_ROLE 쪽 적용 (캐시 초기화, SUPER_ADMIN 전용 표시, 화면 표시) | R-10, R-11 | 대기 |

- **권한 검사는 기본적으로 꺼져 있습니다** (`app.access-check.enabled`, 기본값 `false`). JWT 인증 필터는 머지되었지만(`878d6c0`), R-09 데이터 정리로 역할별 권한이 비어 있어 지금 켜면 SUPER_ADMIN 외에는 모두 막힙니다. 켜기 전 조건은 `README.md` "ROLE 담당자" 3번을 참고하세요. 꺼져 있어도 권한 코드 수집과 목록 API는 동작합니다.
- 요청자 ID는 `SecurityContext`의 `Authentication.getName()`을 사용합니다. **JWT 필터(`ValidateJwtAuthenticationFilter`)가 principal에 회원 ID(토큰 `sub`)를 넣는 것을 확인했습니다** (2026-11-09, 테스트 토큰으로 요청자 ID 전달 확인).
- 권한이 없으면 401(`GLOBAL_UNAUTHORIZED`) / 403(`GLOBAL_FORBIDDEN`)을 공통 응답 형식으로 반환합니다.

**5. 코드와 DB가 어긋날 때**

| 상황 | 결과 | 대응 |
| --- | --- | --- |
| 코드에 `@RequireAction`이 있는데 해당 `ACTION_CODE` 행이 없음 | SUPER_ADMIN 외 아무도 사용 불가 | ACTION 관리 화면에서 등록 (목록에 선택지로 나타남) |
| DB에 `ACTION_CODE`가 있는데 코드에서 삭제됨 | 검사하는 API가 없어 효과 없음 | 등록부에 없는 코드는 ACTION 관리 화면에서 "미사용"으로 표시 |
| 화면을 우회해 목록에 없는 코드로 저장 시도 | — | 저장 시 백엔드가 등록부 기준으로 검증해 400 (R-09) |

#### 검토 후 채택하지 않은 방식

| 방식 | 채택하지 않은 이유 |
| --- | --- |
| 관리자가 `ACTION_CODE`를 직접 입력 | 관리자가 백엔드 개발자가 정한 코드를 예측해 입력해야 함. 오타가 나면 어떤 API와도 연결되지 않는 권한이 조용히 생김 |
| `ACTION_ID`(PK)를 권한 코드로 사용 | `ACTION_CODE` 컬럼 추가로 대체. PK는 시퀀스로 생성 |
| DB 상수 테이블(테이블명) + CRUD 드롭다운, Java enum 병행 | 기준이 DB와 enum 두 곳이라 수동 동기화 필요. 실제로 검사하지 않는 조합도 만들 수 있음. CRUD로 표현하기 어려운 권한(`SURVEY_ANSWER` 등)을 만들 수 없음. 권한은 테이블이 아니라 기능 단위임 |
| 권한 코드를 중앙 enum 한 파일에 등록 | 모든 백엔드 작업자가 같은 파일을 수정해 git 충돌이 잦음 |

---

## D-02. MENU_ROLE과 ROLE_ACTION의 역할 분담

### 배경
- ACTION에 이미 메뉴 정보(`TOP_MENU_ID`, `MID_MENU_ID`, `BTM_MENU_ID`)가 있습니다.
- `MENU_ROLE` 테이블(역할별 메뉴 접근)도 존재합니다. MENU / MENU_ROLE 기능은 ROLE 담당자가 구현할 예정입니다.
- "이 역할이 어떤 메뉴를 볼 수 있는가"를 두 테이블 모두로 판단할 수 있는 상태입니다.

### 문제
두 테이블이 각각 기준이 되면 **"메뉴는 보이는데 기능은 막힘"** 또는 **"기능은 허용됐는데 메뉴가 안 보임"** 같은 불일치가 생기고, 관리자는 두 화면에서 설정을 맞춰야 합니다.

### 선택지

| 선택지 | 내용 | 장점 | 단점 |
| --- | --- | --- | --- |
| A. ROLE_ACTION에서 계산 (추천) | 해당 메뉴(또는 하위 메뉴)에 허용된 ACTION이 하나라도 있으면 메뉴 노출. MENU_ROLE 미사용 | 관리 지점이 하나. 불일치 없음 | 기능이 없는 메뉴(안내 페이지 등)도 "조회" ACTION을 만들어야 함 |
| B. MENU_ROLE 유지 | 메뉴 노출은 MENU_ROLE, 기능 허용은 ROLE_ACTION | 메뉴 노출을 기능과 별개로 제어 가능 | 관리자가 두 곳을 맞춰야 함. 일관성 규칙 추가 필요 (예: 노출이 꺼진 메뉴의 ACTION은 저장 시 거부) |

### 결정이 필요한 것
- [x] A / B 중 선택 → **B**
- [ ] ~~(A 선택 시) MENU_ROLE 테이블 삭제 여부~~ — 해당 없음
- [x] (B 선택 시) 두 테이블 간 일관성 규칙 → 아래 결정 결과 참고

### 결정 결과
- 결정: **B. MENU_ROLE 유지.** 두 테이블은 역할이 다르므로 모두 사용합니다.

  | 테이블 | 역할 | 예시 |
  | --- | --- | --- |
  | `MENU_ROLE` | 사이드바에 메뉴를 보여줄지 (화면 이동 제어) | '시스템 설정' 대메뉴는 SUPER_ADMIN · ADMIN에게만 표시 |
  | `ROLE_ACTION` | 페이지 안에서 할 수 있는 행동 (기능 권한) | 과제 페이지는 TUTOR · STUDENT 모두 접근하지만, TUTOR는 과제 CRUD 전부, STUDENT는 조회만 |

- 결정일 · 참석자: 2026-11-06, ROLE 담당자
- 운영 원칙
  1. **보안 검사는 `ROLE_ACTION`(`accessChecker`)으로만 합니다.** `MENU_ROLE`은 사이드바 · 화면 이동 제어용이며, 메뉴를 숨겨도 API는 직접 호출할 수 있으므로 API 보호 수단이 아닙니다.
  2. 주소창에 URL을 직접 입력하는 경우를 막기 위해, 프론트 라우터에서도 `MENU_ROLE` 기준으로 화면 접근을 막습니다. (MENU 구현 시 ROLE 담당자)
  3. 두 테이블이 어긋나는 경우의 동작
     - 메뉴는 보이는데 조회 ACTION이 없음 → 화면은 열리지만 데이터 조회가 403. 설정 실수이지만 안전한 방향
     - 메뉴는 숨겼는데 ACTION은 허용 → 화면으로는 못 들어가지만 API는 호출 가능. 관리자가 알고 있어야 함
     - 저장 시 강제로 막지는 않습니다. 필요해지면 권한 설정 화면에 "이 역할에게 숨겨진 메뉴의 권한" 경고를 추가하는 방식으로 보완합니다.
- 후속 작업
  - MENU · MENU_ROLE 구현 (ROLE 담당자). 메뉴 계층 규칙(예: 하위 메뉴가 하나라도 허용되면 대메뉴 표시)은 구현 시 정합니다.
  - 역할 삭제 시 `MENU_ROLE` 정리(`deleteMenuRoleByRoleId`)는 그대로 유지합니다.
  - ACCESS · ACCESS_ROLE 쪽 추가 작업은 없습니다.
- 구현 현황 (2026-11-10 확인)
  - 백엔드 `menu` 패키지는 빈 폴더(`.gitkeep`)뿐입니다. MENU · MENU_ROLE API는 아직 없습니다.
  - 프론트 사이드 메뉴는 고정 목록(`frontend/src/components/menu/menuData.js`)이라 역할과 관계없이 모든 메뉴가 보이고, 라우터에도 접근 제한이 없습니다 (운영 원칙 2번 미구현).
  - 그동안 각 화면은 `usePermission`으로 화면 안에서 권한을 확인합니다 (예: 권한 관리 화면은 `ROLE_READ`가 없으면 "권한이 없습니다").

---

## D-03. 권한 설정 · ACTION 관리 기능의 사용 범위

### 배경
- 권한 설정(`/access-role/save`)과 ACTION 등록 · 수정(`/access/save`)을 할 수 있는 사람이 실제 권한을 정합니다 (D-01 A안 기준).
- 하위 관리자가 **자기 역할**에 권한을 추가할 수 있으면 그대로 권한 상승이 됩니다.

### 추천안
- 두 기능 모두 **`ROLE_SUPER_ADMIN` 전용**
- `ROLE_SUPER_ADMIN`은 항상 모든 권한을 가지므로(D-01) **권한 설정 대상에서 제외**: 역할 목록에서 숨기거나, 저장 요청 시 거부
- JWT 인증이 준비되기 전까지는 TODO 주석으로 표시

### 결정이 필요한 것
- [ ] 사용 범위 (SUPER_ADMIN 전용 / 자기보다 아래 순위 역할만 수정 허용 / 기타)
- [ ] SUPER_ADMIN을 권한 설정 대상에서 제외할지

### 결정 결과
- 결정: `/access/save`, `/access-role/save` 모두 `ROLE_SUPER_ADMIN` 전용. `ROLE_SUPER_ADMIN`은 권한 설정 대상에서 제외
- 결정일 · 참석자: 2026-11-06, ACCESS · ACCESS_ROLE 담당자
- 후속 작업: 두 저장 API에 TODO 주석 추가 완료. JWT · 메서드 보안 적용 시 권한 제한, SUPER_ADMIN 제외(목록에서 숨김 또는 저장 거부) 구현 예정
- ROLE 담당자 확인 (2026-11-06)
  - 현재 권한 설정 화면은 `GET /roles` 결과를 그대로 쓰므로 **`ROLE_SUPER_ADMIN`이 역할 목록에 표시**됩니다.
  - SUPER_ADMIN 제외는 JWT 없이도 구현할 수 있습니다. 프론트에서 목록에서 제외하고, `/access-role/save`에서 `roleId`가 `RoleConstants.SUPER_ADMIN_ROLE`이면 저장을 거부하세요. 화면을 거치지 않는 직접 요청도 막으려면 백엔드 거부가 필요합니다.
  - 저장 거부용 ErrorCode는 새로 추가해 주세요. 기존 `ROLE_PROTECTED`는 문구가 "시스템 기본 역할은 삭제할 수 없습니다."라서 맞지 않습니다. 예: `ACTION_ROLE_PROTECTED(HttpStatus.CONFLICT, "최고 관리자 역할의 권한은 변경할 수 없습니다.")` (409 섹션, 상수 추가만)
- ROLE 담당자 보충 (2026-11-06, D-01 최종 결정 반영)
  - 두 저장 API의 권한 제한은 `@EnableMethodSecurity` · `@PreAuthorize`가 아니라 D-01의 **검사 인터셉터**로 처리합니다.
  - 일반 `@RequireAction`을 붙이면 그 권한을 다른 역할에 부여할 수 있게 되므로 "SUPER_ADMIN 전용"과 맞지 않습니다. 그래서 **부여할 수 없는 SUPER_ADMIN 전용 표시 `@RequireSuperAdmin`**(권한 코드 목록 API에 나타나지 않음)을 구현했습니다. 권한 검사가 꺼져 있는 동안에는 동작에 영향이 없으므로 지금 TODO 주석 위치에 붙여도 됩니다 (R-10).
- 구현 현황 (2026-11-10 확인, `1ce6a14`)

  | 항목 | 상태 | 요청 |
  | --- | --- | --- |
  | 두 저장 API에 `@RequireSuperAdmin` | 미적용 (TODO 주석만 있음) | R-10 3번 |
  | `/access-role/save`에서 `ROLE_SUPER_ADMIN` 저장 거부 (`ACTION_ROLE_PROTECTED`) | 미적용 (`ErrorCode`에 상수 없음) | D-03 (README 남은 작업 3번) |
  | 권한 설정 화면 역할 목록에서 `ROLE_SUPER_ADMIN` 숨김 | 미적용 | R-11 2번 |
  | 두 화면을 SUPER_ADMIN에게만 표시 | 미적용 (선택) | R-11 1번 |

  - 검사 인터셉터는 어노테이션이 없는 API를 통과시키므로, `@RequireSuperAdmin` 없이 검사를 켜면 로그인한 누구나 권한 설정을 저장할 수 있습니다. **검사를 켜기 전에 반드시 처리해야 합니다.**

---

## D-04. 권한 설정 API의 URL 규칙 (선택)

### 현재

| Method | URL |
| --- | --- |
| GET | `/access-role/allowed?roleId=` |
| GET | `/access-role/denied?roleId=` |
| POST | `/access-role/save` |

### 제안 (역할 자원 기준)

| Method | URL | 비고 |
| --- | --- | --- |
| GET | `/roles/{roleId}/actions?allowed=true` / `false` | 또는 허용 · 미허용을 한 응답에 `{ allowed, denied }`로 반환 |
| PUT | `/roles/{roleId}/actions` | 전체 교체 저장이므로 POST보다 PUT이 의미상 정확 |

- 컨트롤러는 `accessrole` 모듈에 그대로 두고 URL만 변경할 수 있습니다 (`/roles/{roleId}/actions`는 ROLE 모듈과 겹치지 않음).
- 프론트 수정 범위가 늘어나므로, **R-01 · R-06과 함께 진행할지만 결정**하면 됩니다. 필수는 아닙니다.

### 결정이 필요한 것
- [ ] 변경 여부 / 시점

### 결정 결과
- 결정:
- 결정일 · 참석자:
- 후속 작업:

---

## D-05. MENU 테이블 공동 사용 방식

### 배경
MENU / MENU_ROLE 기능은 ROLE 담당자가 구현할 예정이지만, ACCESS 모듈이 이미 MENU를 사용하고 있습니다.
- `GET /access/menus` (`AccessDaoMapper.xml`의 메뉴 목록 조회)
- ACTION의 `TOP_MENU_ID`, `MID_MENU_ID`, `BTM_MENU_ID`
- MENU 테이블 컬럼(확인된 것): `ID`, `TITLE`, `PARENT_ID`, `DEL_YN`. `AccessMenuVO`에는 `order` 필드가 있으나 쿼리에서 조회하지 않음

### 항목별 추천안

| 항목 | 현재 | 추천 |
| --- | --- | --- |
| 메뉴 목록 API | `GET /access/menus` | MENU 모듈의 메뉴 목록 API가 생기면 그것으로 대체하고 `/access/menus` 삭제 |
| 정렬 컬럼 | `ORDER BY ID DESC` (GUID 순서라 의미 없음) | 정렬 컬럼 추가. `ORDER`는 Oracle 예약어이므로 `MENU_ORDER` 등으로 명명 (ROLE은 `ROLE_RANK` 사용) |
| 삭제 방식 | `DEL_YN` 논리 삭제 | **논리 삭제 유지.** ACTION이 메뉴를 참조하므로 물리 삭제 시 참조 정리가 어려움 |
| ACTION의 메뉴 컬럼 3개 | 상 · 중 · 하위 메뉴 ID를 모두 저장 | MENU에 `PARENT_ID`가 있으므로 **ACTION은 최하위 메뉴 ID 하나만 저장**하고 상위는 `PARENT_ID`로 조회. 메뉴를 다른 위치로 옮겨도 ACTION과 어긋나지 않음 |
| ACTION 목록 정렬 | `ORDER BY A.ACTION_ID DESC` (`ACTION_ID`가 시퀀스로 바뀌면 최근 등록 순) | 메뉴 순서 + ACTION명 등 의미 있는 기준으로 변경 |

### 결정이 필요한 것
- [ ] 메뉴 목록 API 통합 시점
- [ ] 정렬 컬럼명
- [ ] ACTION 메뉴 컬럼 구조 변경 여부 / 시점 (지금 / MENU 구현 후)
- [ ] MENU 테이블 스키마 변경 담당

### 결정 결과
- 결정:
- 결정일 · 참석자:
- 후속 작업:

---

## D-06. 성공 메시지를 응답에 포함할지

### 배경
- 현재 ACCESS · ACCESS_ROLE 응답에는 `"권한이 저장되었습니다."` 같은 성공 메시지가 포함되어 있습니다.
- 공통 응답(`ApiResponse`)에는 성공 메시지 필드가 없습니다.

### 추천안
**응답에 포함하지 않고 프론트에서 문구를 표시합니다.**
- 프론트가 이미 `alert("저장되었습니다.")`처럼 자체 문구를 사용 중입니다.
- 문구 변경 시 백엔드 배포가 필요 없습니다.
- R-01, R-06은 이 추천안을 기준으로 작성되어 있습니다. 반려하는 경우 `ApiResponse` 변경이 필요하므로 ROLE 담당자와 다시 협의해 주세요.

### 결정 결과
- 결정: 응답에 포함하지 않고 프론트에서 표시 (추천안)
- 결정일 · 참석자: 2026-11-06, ACCESS · ACCESS_ROLE 담당자
- 후속 작업: R-01 · R-06에서 반영 완료
