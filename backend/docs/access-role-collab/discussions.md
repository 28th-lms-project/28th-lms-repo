# 협의 사항 (D)

처리 규칙은 `README.md`를 따릅니다.

> 최신화: 2026-11-06, `feature/role` 커밋 `cfa0da0` 기준. D-01(세부 사항 포함), D-02, D-03, D-06이 결정되었습니다. D-06의 배경(성공 메시지 포함 응답)은 R-01로 해소되었고, 나머지 배경 코드 상태(`SYS_GUID` 기반 `ACTION_ID`, `MENU` 정렬 `ORDER BY ID DESC`, ACTION의 메뉴 컬럼 3개)는 변동 없습니다.

**D 항목은 설계 결정입니다.** Claude Code는 선택지와 추천안을 담당자에게 설명하고, **담당자가 결정하기 전에는 코드를 수정하지 마세요.** 결정이 나면 `결정 결과`란에 기록하고, 필요한 작업은 새 R 항목으로 정리하거나 담당자와 ROLE 담당자가 나눠서 진행합니다.

| ID | 제목 | 우선순위 | 영향 범위 | 진행 상태 |
| --- | --- | --- | --- | --- |
| D-01 | 새로 만든 역할의 접근 권한 판단 방식 | 매우 높음 | 전체 API 권한 체크, ACTION 테이블 | **결정** (A안, 세부 사항 포함). ACCESS 작업은 R-09 |
| D-02 | MENU_ROLE과 ROLE_ACTION의 역할 분담 | 매우 높음 | MENU / MENU_ROLE 구현 (ROLE 담당자) | **결정** (B안, MENU_ROLE 유지) |
| D-03 | 권한 설정 · ACTION 관리 기능의 사용 범위 | 높음 | `/access/save`, `/access-role/save` | **결정**. 구현 대기 |
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

### 추천안 (A) 구현 방향

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

> 이 제안은 채택되지 않았습니다. `ACTION_CODE` 컬럼 대신 `ACTION_ID`를 고정 권한 코드로 쓰기로 결정했습니다 (아래 결정 결과 참고).

### 결정이 필요한 것
- [x] A / B 중 선택 → A
- [x] (A 선택 시) `ACTION_CODE` 추가 여부와 이름 규칙 → `ACTION_CODE` 컬럼 없이 **`ACTION_ID`(PK)를 그대로 사용**
- [x] (A 선택 시) `accessChecker` 구현 담당 → **ROLE 담당자**
- [x] (A 선택 시) 요청자 역할을 JWT에서 읽을지 DB에서 읽을지 → **DB**

### 참고
- 회원에게 역할을 지정하는 규칙(자기보다 아래 순위만 지정)은 `ROLE_RANK` 기반 `RoleAssignPolicy`로 별도 처리되며, 이 결정과 무관하게 유지됩니다.

### 결정 결과
- 결정: A. ROLE_ACTION 기반 검사 (`@accessChecker.can(actionCode)`)
- 결정일 · 참석자: 2026-11-06, ACCESS · ACCESS_ROLE 담당자
- 후속 작업: `ACTION_CODE` 컬럼 이름 규칙, `accessChecker` 구현 담당, 요청자 역할을 JWT / DB 중 어디서 읽을지는 아직 미정 (ROLE · JWT 담당자와 협의 필요)

#### 세부 사항 결정 (2026-11-06, ROLE 담당자)

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| 코드에서 가리킬 식별자 | `ACTION_CODE` 컬럼을 추가하지 않고 **`ACTION_ID`(PK)를 그대로 사용**. 예: `@accessChecker.can('ASSIGNMENT_CREATE')` | 현재 `SYS_GUID` 기반 `ACTION_ID`는 임시 값이며, 의미 있는 고정 ID로 바꿀 예정 |
| `accessChecker` 구현 | **ROLE 담당자** | JWT 담당자까지 협의에 참여하기 어려움 |
| 요청자 역할 조회 | **DB** (`USER.BASE_ROLE`) | `RoleAssignPolicy`와 같은 기준. 역할 변경이 즉시 반영됨 |

**`ACTION_ID`를 권한 코드로 쓰기 위한 조건** — 코드에 ID가 직접 적히므로 아래를 지켜야 합니다. ACCESS 모듈 작업은 `requests.md`의 **R-09**로 요청합니다.

1. **의미 있는 고정 문자열**: 대문자 · 숫자 · 언더스코어, `{도메인}_{행위}` 형식 (예: `ASSIGNMENT_CREATE`, `ROLE_DELETE`). 정규식 `^[A-Z0-9]+(_[A-Z0-9]+)*$`
2. **최대 20자** (`VARCHAR2(20 CHAR)`): `ASSIGNMENT_SUBMIT_UPDATE`(24자)처럼 넘칠 수 있으므로 이름을 짧게 짓거나, 필요하면 컬럼 길이 확장을 검토
3. **등록 후 변경 불가**: ID를 바꾸면 코드의 `can('...')`과 연결이 끊겨 SUPER_ADMIN 외 모든 역할이 해당 기능을 쓸 수 없게 됨. 수정 API · 화면에서 ID 변경을 허용하지 않음
4. **ACTION은 개발자가 정의**: API를 만들 때 개발자가 ACTION_ID를 정하고 코드에 적습니다. 관리자가 화면에서 새 ACTION을 등록해도 그 ID를 검사하는 코드가 없으면 효과가 없으므로, ACTION 관리 화면(`/access/save`)의 사용 범위를 다시 정해야 합니다 (R-09 참고)
5. **기존 데이터 전환**: GUID로 저장된 ACTION과 그것을 참조하는 `ROLE_ACTION` 행은 새 ID 체계로 바꿀 때 함께 정리 (FK가 없으므로 수동으로 맞춰야 함)

**`accessChecker` 구현 방향 (ROLE 담당자)**

```text
@accessChecker.can('ASSIGNMENT_CREATE')
 1. 로그인 사용자 ID 확인 (없으면 거부)
 2. DB에서 BASE_ROLE 조회
 3. ROLE_SUPER_ADMIN이면 허용
 4. ROLE_ACTION에 (역할, ACTION_ID)가 있으면 허용
 5. 역할별 허용 ACTION 목록은 캐시. 권한 저장(/access-role/save) 성공 시 해당 역할 캐시 초기화
```

- 5번의 캐시 초기화는 `AccessRoleServiceImpl.saveRolePermission`에서 호출해야 합니다. `accessChecker` 구현 후 ROLE 담당자가 호출할 메서드를 공유하고 별도 R 항목으로 요청합니다.
- 실제 동작은 JWT 인증과 `@EnableMethodSecurity`가 적용된 뒤 확인할 수 있습니다. 그 전에는 구현과 단위 테스트까지 진행합니다.
- `RoleController`의 TODO 주석(SUPER_ADMIN 전용 `@PreAuthorize`)도 `@accessChecker.can('...')` 방식으로 바꿀 예정입니다.

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

---

## D-03. 권한 설정 · ACTION 관리 기능의 사용 범위

### 배경
- 권한 설정(`/access-role/save`)과 ACTION 등록 · 수정(`/access/save`)을 할 수 있는 사람이 실제 권한을 정합니다 (D-01 A안 기준).
- 하위 관리자가 **자기 역할**에 권한을 추가할 수 있으면 그대로 권한 상승이 됩니다.

### 추천안
- 두 기능 모두 **`ROLE_SUPER_ADMIN` 전용**
- `ROLE_SUPER_ADMIN`은 항상 모든 권한을 가지므로(D-01) **권한 설정 대상에서 제외**: 역할 목록에서 숨기거나, 저장 요청 시 거부
- JWT · 메서드 보안(`@EnableMethodSecurity`)이 준비되기 전까지는 TODO 주석으로 표시

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
| ACTION 목록 정렬 | `ORDER BY A.ACTION_ID DESC` (GUID 순서) | 메뉴 순서 + ACTION명 등 의미 있는 기준으로 변경 |

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
