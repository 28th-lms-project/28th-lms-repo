# 협의 사항 (D)

처리 규칙은 `README.md`를 따릅니다.

> 최신화: 2026-11-06, `feature/role` 커밋 `644fe80` 기준으로 재검토. 모든 항목이 아직 결정 전이며, 배경으로 적힌 코드 상태(`SYS_GUID` 기반 `ACTION_ID`, `MENU` 정렬 `ORDER BY ID DESC`, ACTION의 메뉴 컬럼 3개, 성공 메시지 포함 응답 등)도 변동 없습니다.

**D 항목은 설계 결정입니다.** Claude Code는 선택지와 추천안을 담당자에게 설명하고, **담당자가 결정하기 전에는 코드를 수정하지 마세요.** 결정이 나면 `결정 결과`란에 기록하고, 필요한 작업은 새 R 항목으로 정리하거나 담당자와 ROLE 담당자가 나눠서 진행합니다.

| ID | 제목 | 우선순위 | 영향 범위 |
| --- | --- | --- | --- |
| D-01 | 새로 만든 역할의 접근 권한 판단 방식 | 매우 높음 | 전체 API 권한 체크, ACTION 테이블 |
| D-02 | MENU_ROLE과 ROLE_ACTION의 역할 분담 | 매우 높음 | MENU / MENU_ROLE 구현 (ROLE 담당자) |
| D-03 | 권한 설정 · ACTION 관리 기능의 사용 범위 | 높음 | `/access/save`, `/access-role/save` |
| D-04 | 권한 설정 API의 URL 규칙 | 낮음 (선택) | ACCESS_ROLE API, 프론트 |
| D-05 | MENU 테이블 공동 사용 방식 | 중간 | ACCESS 모듈, MENU 구현 |
| D-06 | 성공 메시지를 응답에 포함할지 | 낮음 | R-01, R-06 |

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

### 결정이 필요한 것
- [ ] A / B 중 선택
- [ ] (A 선택 시) `ACTION_CODE` 추가 여부와 이름 규칙
- [ ] (A 선택 시) `accessChecker` 구현 담당 (추천: ACCESS 담당자 + JWT 담당자)
- [ ] (A 선택 시) 요청자 역할을 JWT에서 읽을지 DB에서 읽을지 (DB 추천: 역할 변경이 즉시 반영됨)

### 참고
- 회원에게 역할을 지정하는 규칙(자기보다 아래 순위만 지정)은 `ROLE_RANK` 기반 `RoleAssignPolicy`로 별도 처리되며, 이 결정과 무관하게 유지됩니다.

### 결정 결과
- 결정: A. ROLE_ACTION 기반 검사 (`@accessChecker.can(actionCode)`)
- 결정일 · 참석자: 2026-11-06, ACCESS · ACCESS_ROLE 담당자
- 후속 작업: `ACTION_CODE` 컬럼 이름 규칙, `accessChecker` 구현 담당, 요청자 역할을 JWT / DB 중 어디서 읽을지는 아직 미정 (ROLE · JWT 담당자와 협의 필요)

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
- [ ] A / B 중 선택
- [ ] (A 선택 시) MENU_ROLE 테이블 삭제 여부. 삭제하면 ROLE 모듈의 역할 삭제 로직에서 `deleteMenuRoleByRoleId` 제거 필요 (ROLE 담당자 작업)
- [ ] (B 선택 시) 두 테이블 간 일관성 규칙

### 결정 결과
- 결정:
- 결정일 · 참석자:
- 후속 작업:

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
