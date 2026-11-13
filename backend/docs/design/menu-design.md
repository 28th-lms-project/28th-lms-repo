# 메뉴 · 메뉴 접근 권한 백엔드 설계

- 대상: `MENU`, `MENU_ROLE` 테이블과 `com.learningworks.menu` 패키지
- 담당: ROLE 모듈 담당자
- 작성일: 2026-11-10
- 상태: 설계 확정. 백엔드 구현 완료 (4-7 제외)

이 문서는 백엔드 구현을 시작할 때 참고하는 설계입니다. 화면 설계는 `frontend/docs/design/menu-page-design.md`, 권한 체계는 `backend/docs/access-control-guide.md`, ACCESS 모듈과의 연동 정리는 `backend/docs/access-role-collab/remaining-issues.md`를 함께 보세요.

---

## 1. 확정된 결정

| 항목 | 결정 |
| --- | --- |
| 역할 분담 (D-02) | `MENU_ROLE`은 **사이드바 표시와 URL 접근**을 정합니다. API · 기능 권한은 지금처럼 `ROLE_ACTION`이 정합니다 |
| 컬럼 이름 | `ORDER` → `MENU_ORDER`, `TO` → `MENU_URL`. 둘 다 Oracle 예약어라서 바꿉니다 |
| MENU 삭제 | **물리 삭제.** `DEL_YN` 컬럼은 없앱니다. 숨기기는 `USE_YN`으로 합니다. 하위 메뉴가 있거나 ACTION이 참조 중이면 삭제를 거부합니다 (409) |
| MENU ID | 팀 공통 규칙을 따릅니다 (`MN-YYYYMMDD-000001`, 생성식은 2-4) |
| MENU_ROLE 삭제 | **물리 삭제.** `DEL_YN`, `MDFY_DT` 컬럼은 없앱니다. (`MENU_ID`, `ROLE_ID`)에 UNIQUE 제약을 겁니다 |
| MENU_ROLE ID | 팀 공통 규칙을 따릅니다 (`MR-YYYYMMDD-000001`, 생성식은 2-4) |
| 메뉴 단계 | 3단계 고정. 대메뉴(`PARENT_ID` null) → 중메뉴 → 소메뉴. 소메뉴 아래에는 메뉴를 만들 수 없습니다 |
| 상위 메뉴 변경 | **현재**: 지원하지 않습니다. 순서는 같은 상위 메뉴 안에서만 바꿉니다. 다른 그룹으로 옮기려면 삭제 후 다시 만듭니다 (4-4 "메뉴 옮기기"). **최종 목표**: 4-7 "상위 메뉴 변경"(ACTION 메뉴 ID 함께 수정)으로 구현합니다. 방식 · 권한은 결정 완료 (2026-11-12), 구현 예정 |
| 동시 수정 | 화면을 열 때 받은 `mdfyDt`를 수정 요청에 함께 보내고, 서버 값과 다르면 거부합니다 (`MENU_OUTDATED`) |
| 메뉴 이름 | 같은 상위 메뉴 안에서는 중복 불가 (`MENU_TITLE_USED`). 상위 메뉴가 다르면 허용 |
| SUPER_ADMIN | `MENU_ROLE`과 관계없이 모든 메뉴를 봅니다. **미사용(`USE_YN = N`) 메뉴도** 사이드바에 받고 접근할 수 있습니다. SUPER_ADMIN의 `MENU_ROLE` 행은 저장하지 않습니다 |
| 자기 잠금 방지 | SUPER_ADMIN이 아닌 사용자가 **본인이 메뉴 관리 화면에 다시 들어올 수 없게 되는 변경**을 저장하면 거부합니다 (`MENU_SELF_LOCK`, 4-6) |
| 내 메뉴 API 권한 | `@LoginRequired` |
| 메뉴 관리 API 권한 | `@RequireAction(domain = "MENU", ...)` (4장) |
| ACTION의 메뉴 컬럼 3개 | 그대로 둡니다. 권한별 접근 권한 관리 화면(`/admin/system/access-role`)의 필터로 계속 쓰고, 메뉴 삭제 때 참조 검사에도 씁니다 |
| `/access/menus` | 이 모듈의 `GET /menus`로 바꾸고 삭제했습니다 (`feature/access-cleanup`, 7장) |

---

## 2. 테이블

### 2-1. MENU (변경 후)

| 컬럼 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `ID` | `VARCHAR2(20 CHAR)` | PK | `MN-YYYYMMDD-000001` |
| `TITLE` | `VARCHAR2(100 CHAR)` | Y | 메뉴 이름 |
| `PARENT_ID` | `VARCHAR2(20 CHAR)` | | 상위 메뉴 ID. 대메뉴는 null |
| `MENU_ORDER` | `NUMBER` | Y | 같은 상위 메뉴 안의 순서. 1부터. DB는 null 허용이지만 코드가 항상 채움 |
| `USE_YN` | `CHAR(1 CHAR)` | Y | `Y` 사용 / `N` 미사용(SUPER_ADMIN 외에는 사이드바에서 숨김, URL 접근 거부) |
| `SPREAD` | `CHAR(1 CHAR)` | Y | **중메뉴만** 의미가 있음. `Y`면 화면을 처음 열 때 펼친 상태로 표시. 대 · 소메뉴는 항상 `N` 저장 |
| `MENU_URL` | `VARCHAR2(100 CHAR)` | | **소메뉴만** 사용(필수). 대 · 중메뉴는 null. UNIQUE |
| `CRT_DT` | `DATE` | Y | 생성일 |
| `MDFY_DT` | `DATE` | | 수정일. 생성 직후에는 null |

### 2-2. MENU_ROLE (변경 후)

| 컬럼 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `ID` | `VARCHAR2(20 CHAR)` | PK | `MR-YYYYMMDD-000001` |
| `MENU_ID` | `VARCHAR2(20 CHAR)` | Y | `MENU.ID` |
| `ROLE_ID` | `VARCHAR2(20 CHAR)` | Y | `ROLE.ROLE_ID` |
| `CRT_DT` | `DATE` | Y | 생성일 |

UNIQUE (`MENU_ID`, `ROLE_ID`)

외래 키(FK)는 두지 않습니다 (의도된 설계). 상위 메뉴 존재, 하위 메뉴 · ACTION 참조, 역할 존재 여부는 서비스 코드가 검사합니다 (4-3, 4-4). 시퀀스 `SEQ_MENU_PK`, `SEQ_MENU_ROLE_PK`는 생성되어 있습니다.

### 2-3. 변경 스크립트 (DB 담당: 프로젝트 담당자가 직접 실행)

1단계는 **적용 완료**되었습니다. 남은 것은 2단계(`MENU.DEL_YN` 삭제)뿐입니다. 이 컬럼을 쓰던 ACCESS 모듈의 `selectMenuList`(`/access/menus`)는 `feature/access-cleanup`에서 삭제했으므로, **그 브랜치가 배포된 뒤에** 실행하세요. 확인 쿼리를 포함한 실행용 SQL은 `access-role-collab/access-cleanup.sql`의 1번입니다.

```sql
-- 1단계: 적용 완료
ALTER TABLE MENU RENAME COLUMN "ORDER" TO MENU_ORDER;
ALTER TABLE MENU RENAME COLUMN "TO" TO MENU_URL;
ALTER TABLE MENU MODIFY (PARENT_ID VARCHAR2(20 CHAR));  -- ID와 길이 단위 통일
ALTER TABLE MENU MODIFY (MDFY_DT NULL);                 -- 생성 직후 null
ALTER TABLE MENU ADD CONSTRAINT UK_MENU_URL UNIQUE (MENU_URL);  -- null은 여러 개 허용됨

-- MENU_ROLE 정리: 논리 삭제된 행과 중복 행을 먼저 지운다
DELETE FROM MENU_ROLE WHERE DEL_YN = 'Y';
-- (중복이 있으면 하나만 남기고 삭제한 뒤 아래 제약 추가)
ALTER TABLE MENU_ROLE DROP COLUMN DEL_YN;
ALTER TABLE MENU_ROLE DROP COLUMN MDFY_DT;
ALTER TABLE MENU_ROLE ADD CONSTRAINT UK_MENU_ROLE UNIQUE (MENU_ID, ROLE_ID);

-- 2단계: feature/access-cleanup(/access/menus 삭제) 배포 후 실행 (미적용)
DELETE FROM MENU WHERE DEL_YN = 'Y';   -- 참조하는 ACTION · MENU_ROLE · 하위 메뉴가 없는지 먼저 확인
ALTER TABLE MENU DROP COLUMN DEL_YN;
```

### 2-4. ID 생성식 (MyBatis `selectKey`)

```sql
SELECT 'MN-' || TO_CHAR(SYSDATE, 'YYYYMMDD-') || LPAD(SEQ_MENU_PK.NEXTVAL, 6, '0') FROM DUAL
SELECT 'MR-' || TO_CHAR(SYSDATE, 'YYYYMMDD-') || LPAD(SEQ_MENU_ROLE_PK.NEXTVAL, 6, '0') FROM DUAL
```

`MENU_ROLE`은 수정할 때마다 지우고 다시 넣으므로 시퀀스 번호가 빨리 늘어나지만, 행은 쌓이지 않습니다.

### 2-5. 초기 데이터

현재 `MENU` · `MENU_ROLE`에는 메뉴 구현 전에 ACCESS 개발용으로 넣은 데이터(숫자 ID, 자리표시 값)가 있습니다. **메뉴 구현 후 모든 데이터를 이 문서의 규칙에 맞게 새로 만듭니다.** 이때 ACTION의 `TOP_MENU_ID` · `MID_MENU_ID` · `BTM_MENU_ID`도 새 메뉴 ID로 다시 지정해야 하므로 ACCESS 담당자와 함께 진행합니다 (기존 ID를 지우면 권한별 접근 권한 관리 화면의 필터가 비게 됨).

메뉴 가드(프론트)를 켜기 **전에** 지금 `frontend/src/components/menu/menuData.js`의 구성을 `MENU`에 넣고, 역할별 `MENU_ROLE`을 채워야 합니다. 비어 있으면 SUPER_ADMIN이 아닌 사용자는 대시보드 외에 아무 화면도 열 수 없습니다.

- 대메뉴 = 섹션(Main / My Page / System Management), 중메뉴 = 그룹, 소메뉴 = 링크.
- 대시보드(Main > Home > Dashboard, `MENU_URL = '/'`)도 메뉴로 넣습니다. 프론트 가드는 `/`를 항상 통과시키므로, 이 메뉴의 `MENU_ROLE`은 사이드바 링크 표시에만 쓰입니다.
- `menuData.js`의 "DB 관리"(`/admin/system/db`)는 라우트가 없습니다. 라우트가 생길 때 추가하세요.
- 입력은 SQL로 직접 하거나, 메뉴 관리 화면이 완성된 뒤 SUPER_ADMIN 계정으로 입력합니다.

---

## 3. 메뉴 판정 규칙

"내 메뉴"에 들어가는 조건입니다.

- **SUPER_ADMIN**: 모든 메뉴 (미사용 포함).
- **그 외 역할**: **자기 자신과 모든 상위 메뉴가** 아래 두 조건을 모두 만족하는 메뉴.
  1. `USE_YN = 'Y'`
  2. `MENU_ROLE`에 (메뉴, 내 역할) 행이 있음

예: 중메뉴 "과정 관리"가 STUDENT에게 허용되지 않았다면, 그 아래 소메뉴는 STUDENT에게 허용되어 있어도 보이지 않습니다.

내 역할은 `AccessChecker`와 같은 기준(`ActionCodeDao.selectBaseRoleByUserId`)으로 조회합니다.

---

## 4. API

패키지: `com.learningworks.menu` (`web`, `service`, `dao`, `vo/request`, `vo/response`). 공통 경로: `/menus`.

| 메서드 · 경로 | 권한 | 요청 | 응답 (`body`) |
| --- | --- | --- | --- |
| `GET /menus/me` | `@LoginRequired` | — | `{ superAdmin, menus, guardUrls }` (4-1) |
| `GET /menus` | `MENU_READ` "메뉴 목록 조회" | — | `{ roles, menus }` (4-2) |
| `POST /menus` | `MENU_CREATE` "메뉴 등록" | `{ parentId, title, useYn, spread, menuUrl, roleIds }` | 만든 메뉴 1건 |
| `PUT /menus/{menuId}` | `MENU_UPDATE` "메뉴 수정" | `{ title, useYn, spread, menuUrl, roleIds, mdfyDt }` | 수정한 메뉴 1건 |
| `PUT /menus/order` | `MENU_UPDATE` "메뉴 수정" | `{ parentId, menuIds }` | `{ roles, menus }` (변경 후 전체) |
| `DELETE /menus/{menuId}` | `MENU_DELETE` "메뉴 삭제" | — | 삭제한 메뉴 1건 |

- 같은 권한 코드는 `description`이 같아야 서버가 뜹니다 (`MENU_UPDATE` 두 곳 모두 "메뉴 수정").
- `PUT /menus/order`는 `PUT /menus/{menuId}`보다 먼저 매칭되도록 경로를 확인하세요 (Spring은 고정 경로를 우선합니다. `RoleController`와 같은 구조).

### 4-1. `GET /menus/me` 응답

```json
{
  "superAdmin": false,
  "menus": [
    { "id": "MN-...", "title": "System Management", "parentId": null, "menuOrder": 3, "useYn": "Y", "spread": "N", "menuUrl": null },
    { "id": "MN-...", "title": "과정 관리", "parentId": "MN-...", "menuOrder": 1, "useYn": "Y", "spread": "Y", "menuUrl": null },
    { "id": "MN-...", "title": "과정 목록", "parentId": "MN-...", "menuOrder": 1, "useYn": "Y", "spread": "N", "menuUrl": "/admin/course/list" }
  ],
  "guardUrls": ["/admin/course/add", "/admin/course/list", "..."]
}
```

- `menus`: 3장 규칙을 통과한 메뉴만. 평평한 목록, 정렬은 (단계, `PARENT_ID`, `MENU_ORDER`).
- `useYn`: SUPER_ADMIN이 받은 미사용 메뉴를 사이드바에서 흐리게 표시하는 데 씁니다. 다른 역할은 항상 `Y`만 받습니다.
- `guardUrls`: **모든** 소메뉴의 `MENU_URL` (미사용 · 미허용 포함). 프론트 가드가 "이 URL이 어느 메뉴 소속인지" 찾을 때 씁니다. 미사용 메뉴도 넣어야, 숨긴 메뉴의 URL이 더 짧은 다른 메뉴에 매칭되어 열리는 일이 없습니다.
- URL 목록은 이미 프론트 코드에 들어 있는 정보라서 로그인 사용자 모두에게 보내도 됩니다.

### 4-2. `GET /menus` 응답 (메뉴 관리 화면용)

```json
{
  "roles": [{ "roleId": "ROLE_SUPER_ADMIN", "roleDisplayName": "슈퍼관리자" }, "..."],
  "menus": [
    {
      "id": "MN-...", "title": "과정 목록", "parentId": "MN-...", "menuOrder": 1,
      "useYn": "Y", "spread": "N", "menuUrl": "/admin/course/list",
      "roleIds": ["ROLE_ADMIN", "ROLE_TUTOR"],
      "crtDt": "2026-11-10 14:03:27", "mdfyDt": null
    }
  ]
}
```

- `roles`: 역할 순위 순서의 전체 역할. 메뉴 관리 화면의 체크박스용입니다. 여기 포함해서, 메뉴 관리자에게 `ROLE_READ`가 따로 필요 없게 합니다.
- `roleIds`: SUPER_ADMIN은 넣지 않습니다 (화면이 항상 체크 · 비활성으로 표시).
- 날짜는 `TO_CHAR(..., 'YYYY-MM-DD HH24:MI:SS')` 문자열. `mdfyDt`는 동시 수정 검사(4-4)에 그대로 쓰이므로 **초까지** 보냅니다. 화면은 필요하면 분까지만 잘라 표시합니다.
- ACCESS 모듈도 메뉴 필터용으로 이 API를 씁니다 (7장).

### 4-3. 입력값 규칙

| 필드 | 규칙 | 메시지 |
| --- | --- | --- |
| `title` | 필수, 100자 이하. 앞뒤 공백 제거 후 저장. 같은 상위 메뉴 안에서 중복 불가(자기 자신 제외) | "메뉴 이름을 입력해주세요." / "메뉴 이름은 100자 이하로 입력해주세요." / 중복은 `MENU_TITLE_USED` |
| `useYn` | 필수, `Y` 또는 `N` | "사용 여부가 올바르지 않습니다." |
| `spread` | 중메뉴면 필수(`Y`/`N`), 그 외에는 무시하고 `N` 저장 (컬럼이 NOT NULL) | "펼침 여부가 올바르지 않습니다." |
| `menuUrl` | 소메뉴면 필수, `/`로 시작, 공백 없음, 100자 이하. 그 외에는 무시하고 null 저장 | "메뉴 URL을 입력해주세요." / "메뉴 URL은 '/'로 시작해야 합니다." / "메뉴 URL에는 공백을 넣을 수 없습니다." / "메뉴 URL은 100자 이하로 입력해주세요." |
| `roleIds` | 배열(빈 배열 허용, null 불가). 없는 역할이 있으면 거부. SUPER_ADMIN과 중복은 저장하지 않고 건너뜀 | null이면 "역할 목록을 입력해주세요." / 없는 역할은 `MENU_ROLE_INVALID` |
| `parentId` (등록) | null(대메뉴) 또는 존재하는 대 · 중메뉴 | 없으면 `MENU_NOT_EXISTS` / 소메뉴면 `MENU_PARENT_INVALID` |
| `menuIds` (순서 변경) | 비어 있지 않고 중복 없음. `parentId`는 null(대메뉴) 또는 존재하는 메뉴 | 빈 목록 · 중복은 `MENU_ORDER_INVALID` / 없는 `parentId`는 `MENU_NOT_EXISTS` |
| `mdfyDt` (수정) | 화면이 받은 값 그대로 (생성 후 수정된 적 없으면 null) | 서버 값과 다르면 `MENU_OUTDATED` |

백엔드는 프론트 라우트를 알 수 없으므로 `menuUrl`은 **형식만** 검사합니다. 실제 화면이 있는 URL만 고르게 하는 것은 프론트가 합니다.

`spread` · `menuUrl`처럼 메뉴 단계에 따라 규칙이 달라지는 필드는 `@Valid`로 검사할 수 없어 서비스가 검사합니다. 이때는 `ValidationFailedException`(common)을 던지고, `@Valid` 실패와 같은 형식(`GLOBAL_INVALID_PARAMETER` + `validations`)으로 응답합니다.

`MENU`의 `DEL_YN` 컬럼(2-3의 2단계 전까지 남아 있음)은 이 모듈의 쿼리에서 쓰지 않습니다.

### 4-4. 동작

- **등록**: 새 메뉴는 같은 상위 메뉴의 맨 뒤(`MAX(MENU_ORDER) + 1`)에 추가. `CRT_DT = SYSDATE`, `MDFY_DT = null`. `MENU_ROLE`을 함께 저장.
- **수정**: 먼저 요청의 `mdfyDt`와 DB의 `MDFY_DT`를 비교합니다 (둘 다 null이면 같음). 다르면 `MENU_OUTDATED`. 같으면 `MDFY_DT = SYSDATE`로 저장하고, `MENU_ROLE`은 해당 메뉴 행을 모두 지우고 `roleIds`로 다시 넣습니다 (물리 삭제라 행이 쌓이지 않음). 한 트랜잭션. 비교와 저장 사이에 다른 요청이 끼지 않도록 `SELECT ... FOR UPDATE`로 메뉴 행을 잠근 뒤 비교합니다.
  - 이 검사가 없으면 두 관리자가 같은 메뉴를 열어 두었을 때 나중에 저장한 쪽이 먼저 저장한 변경(특히 역할 체크)을 말없이 덮어씁니다.
- **순서 변경**: `menuIds`는 해당 상위 메뉴의 **현재 하위 메뉴 전체**여야 합니다. 개수 · 구성이 다르면 `MENU_ORDER_OUTDATED`. 받은 순서대로 1부터 다시 매깁니다 (역할 순서 변경과 같은 방식). `MDFY_DT`는 바꾸지 않습니다 (열어 둔 다른 화면의 수정이 `MENU_OUTDATED`로 거부되지 않게).
- **삭제**: 하위 메뉴가 있으면 `MENU_HAS_CHILDREN`, ACTION의 `TOP_MENU_ID` · `MID_MENU_ID` · `BTM_MENU_ID` 중 하나라도 참조하면 `MENU_IN_USE`. 통과하면 `MENU_ROLE` 행 삭제 → `MENU` 삭제 → 같은 상위 메뉴의 순서를 1부터 다시 매김. 한 트랜잭션.
  - 검사 전에 메뉴 행을 `SELECT ... FOR UPDATE`로 잠급니다. ACTION 저장도 같은 소메뉴 행을 잠그므로(7장 "ACTION 저장 시 메뉴 검증"), 검사와 삭제 사이에 이 메뉴를 쓰는 ACTION이 저장되지 않습니다.
- 역할 삭제 시 `MENU_ROLE` 물리 삭제는 이미 `RoleDaoMapper.deleteMenuRoleByRoleId`가 합니다 (변경 없음).
- 수정 · 삭제는 4-6의 자기 잠금 검사를 먼저 통과해야 합니다.
- **메뉴 옮기기** (지원하지 않음, 운영 절차): 소메뉴를 다른 그룹으로 옮기려면 새 위치에 메뉴를 만들고 기존 메뉴를 삭제합니다. 기존 메뉴를 ACTION이 참조하면 삭제가 `MENU_IN_USE`로 거부되므로, 먼저 접근 관리 화면에서 해당 ACTION의 메뉴를 새 메뉴로 바꿔야 합니다 (그 저장은 SUPER_ADMIN 전용). 운영 중 메뉴 구조 변경은 드물다는 전제입니다.
  - 이 절차는 **4-7 구현 전까지의 임시 방안**입니다. 4-7을 구현하면 이 항목은 삭제합니다.

### 4-5. ErrorCode (추가)

| 코드 | HTTP | 메시지 |
| --- | --- | --- |
| `MENU_NOT_EXISTS` | 404 | "메뉴가 존재하지 않습니다." |
| `MENU_PARENT_INVALID` | 400 | "소메뉴 아래에는 메뉴를 추가할 수 없습니다." |
| `MENU_URL_USED` | 409 | "이미 다른 메뉴에서 사용 중인 URL입니다." |
| `MENU_HAS_CHILDREN` | 409 | "하위 메뉴가 있어 삭제할 수 없습니다. 하위 메뉴를 먼저 삭제해주세요." |
| `MENU_IN_USE` | 409 | "이 메뉴를 사용하는 접근 권한(ACTION)이 있어 삭제할 수 없습니다. 접근 관리에서 먼저 변경해주세요." |
| `MENU_ORDER_INVALID` | 400 | "메뉴 순서 정보가 올바르지 않습니다." |
| `MENU_ORDER_OUTDATED` | 409 | "메뉴 목록이 변경되었습니다. 새로고침 후 다시 시도해주세요." |
| `MENU_ROLE_INVALID` | 400 | "존재하지 않는 역할이 포함되어 있습니다." |
| `MENU_TITLE_USED` | 409 | "같은 상위 메뉴에 이미 같은 이름의 메뉴가 있습니다." |
| `MENU_OUTDATED` | 409 | "다른 사용자가 먼저 수정했습니다. 새로고침 후 다시 시도해주세요." |
| `MENU_SELF_LOCK` | 409 | "저장하면 본인이 메뉴 관리 화면에 들어올 수 없게 됩니다. 본인 역할 해제 · 미사용 · URL 변경 · 삭제는 다른 관리자나 최고 관리자에게 요청해주세요." |
| `MENU_MOVE_INVALID` (**4-7 구현 시**) | 400 | "같은 단계의 다른 상위 메뉴로만 옮길 수 있습니다." |

### 4-6. 자기 잠금 방지 (`MENU_SELF_LOCK`)

메뉴 관리 API는 `@RequireAction`이라 SUPER_ADMIN이 아니어도 메뉴를 바꿀 수 있습니다. 관리자가 실수로 자기 역할을 빼면 메뉴 관리 화면에 다시 들어올 수 없고, SUPER_ADMIN이 복구해야 합니다. 이를 서버에서 막습니다.

**보호 대상 메뉴**: `MENU_URL`이 `MenuConstants.MENU_MANAGEMENT_URL`(`"/admin/system/menu"`)인 소메뉴와 그 상위 메뉴 2개(중 · 대메뉴). 이 상수는 프론트 라우트 경로와 맞물리므로, 경로를 바꾸면 함께 바꿔야 합니다.

**검사 조건**: 요청자가 SUPER_ADMIN이 **아니고**, 대상 메뉴가 보호 대상이며, 아래 중 하나에 해당하면 거부합니다.

| 요청 | 거부하는 경우 |
| --- | --- |
| `PUT /menus/{menuId}` | `roleIds`에서 **요청자의 역할**이 빠짐 |
| `PUT /menus/{menuId}` | `useYn`이 `N` |
| `PUT /menus/{menuId}` | 메뉴 관리 소메뉴의 `menuUrl`이 바뀜 |
| `DELETE /menus/{menuId}` | 보호 대상 메뉴 삭제 (하위 메뉴 검사보다 먼저) |

- 다른 역할을 빼는 것은 허용합니다 (관리자가 의도한 권한 조정).
- SUPER_ADMIN은 항상 들어올 수 있으므로 검사하지 않습니다.
- 메뉴 관리 메뉴가 아직 없으면(초기 데이터 입력 전) 보호 대상도 없습니다. 이때 `/admin/system/menu`는 어느 메뉴에도 속하지 않아 SUPER_ADMIN만 들어갈 수 있으므로, 처음 등록은 SUPER_ADMIN이 합니다.
- 권한 코드 쪽(`MENU_READ` 제거)은 따로 막을 필요가 없습니다. 권한 저장(`/access-role/save`)이 SUPER_ADMIN 전용이기 때문입니다.

### 4-7. 상위 메뉴 변경 (결정 완료, 구현 예정)

> **상태: 결정 완료 (2026-11-12), 구현 전.** ACCESS 담당자가 모듈에서 손을 떼어 ROLE 담당자가 ACCESS 모듈까지 맡게 되면서, 아래 "결정"의 두 가지를 정했습니다. 구현하면 1장 "상위 메뉴 변경"과 4-4 "메뉴 옮기기"(임시 방안)를 이 절 기준으로 고칩니다.

**왜 필요한가**: 지금은 메뉴를 다른 그룹으로 옮기려면 삭제 후 다시 만들어야 하는데, ACTION이 참조하는 메뉴는 삭제가 거부되고(`MENU_IN_USE`), ACTION의 메뉴를 바꾸는 저장은 SUPER_ADMIN 전용입니다. 그래서 메뉴 구조를 바꾸는 일이 사실상 SUPER_ADMIN 작업이 되고 절차도 깁니다.

**결정**: 메뉴를 옮길 때 서버가 **ACTION 테이블의 `TOP_MENU_ID` · `MID_MENU_ID` · `BTM_MENU_ID`도 함께 고칩니다.** ACTION은 ACCESS 모듈의 테이블이므로 아래 두 가지를 정했습니다. 이유는 `access-role-collab/remaining-issues.md` 4번을 보세요.

1. ACTION 수정은 **ACCESS 모듈이 제공하는 메서드**를 메뉴 모듈이 호출합니다. 테이블을 고치는 SQL은 그 테이블의 담당 모듈에만 둡니다.
2. 메뉴 이동 권한은 **`MENU_UPDATE`** 입니다. 이동이 바꾸는 것은 ACTION의 메뉴 컬럼뿐이고, 권한 코드 · 권한 부여 · 권한 캐시는 바뀌지 않습니다.

#### API (안)

| 메서드 · 경로 | 권한 | 요청 | 응답 |
| --- | --- | --- | --- |
| `PUT /menus/{menuId}/parent` | `MENU_UPDATE` (결정 2번) | `{ parentId, mdfyDt }` | `{ roles, menus }` (변경 후 전체) |

- **수정 API(`PUT /menus/{menuId}`)와 따로 둡니다.** 화면은 이동과 다른 수정을 따로 저장하므로(프론트 문서 6-6), 한 요청은 항상 한 가지 일만 합니다. 기존 수정 API · 검사 로직 · 테스트를 고치지 않고 덧붙일 수 있고, 나중에 SUPER_ADMIN 전용으로 바꿔야 하면 이 메서드에 `@RequireSuperAdmin`만 붙이면 됩니다.
- 이동 요청은 이름 · 역할 등을 바꾸지 않습니다. 같은 이름 · 자기 잠금 검사는 "현재 값 + 새 상위 메뉴" 기준으로 합니다.

#### 규칙

- 같은 단계 안에서만 옮깁니다: 소메뉴 → 다른 중메뉴, 중메뉴 → 다른 대메뉴. 대메뉴는 옮길 대상이 없습니다. 단계가 맞지 않거나 지금과 같은 상위 메뉴면 `MENU_MOVE_INVALID`(400).
- 옮긴 메뉴는 새 상위 메뉴의 맨 뒤에 들어가고, 원래 상위 메뉴의 순서는 1부터 다시 매깁니다.
- `MENU_ROLE`은 그대로 둡니다. 새 상위 메뉴의 역할 설정에 따라 실제로 보이는 범위는 달라질 수 있습니다 (화면에서 "(상위 메뉴에서 허용 안 됨)"으로 표시).
- 같은 이름이 새 상위 메뉴에 있으면 `MENU_TITLE_USED`, `mdfyDt`가 다르면 `MENU_OUTDATED`.
- 자기 잠금 검사(4-6): 메뉴 관리 소메뉴(또는 그 중메뉴)를 요청자의 역할이 허용되지 않은 · 미사용 상위 메뉴로 옮기면 `MENU_SELF_LOCK`.

#### ACTION 갱신 (한 트랜잭션)

| 옮긴 메뉴 | ACTION에서 바꾸는 것 |
| --- | --- |
| 소메뉴 | `BTM_MENU_ID` = 옮긴 메뉴인 행의 `MID_MENU_ID` · `TOP_MENU_ID`를 새 중메뉴 · 그 대메뉴로 |
| 중메뉴 | `MID_MENU_ID` = 옮긴 메뉴인 행의 `TOP_MENU_ID`를 새 대메뉴로 (그 아래 소메뉴를 참조하는 행 포함) |

- 권한 코드 캐시(`AccessChecker`)는 비우지 않아도 됩니다. 캐시는 역할별 권한 코드만 담고, ACTION의 메뉴 컬럼은 화면 필터에만 쓰이기 때문입니다.

#### 확인 시나리오 (구현 시 8장에 추가)

| # | 시나리오 | 기대 결과 |
| --- | --- | --- |
| B20 | ACTION이 참조하는 소메뉴를 다른 중메뉴로 이동 | 성공, 해당 ACTION의 대 · 중 메뉴 ID가 새 위치로 바뀜 |
| B21 | 중메뉴를 다른 대메뉴로 이동 | 성공, 그 아래 소메뉴를 참조하는 ACTION의 `TOP_MENU_ID`도 바뀜 |
| B22 | 소메뉴를 대메뉴 아래로 / 같은 상위 메뉴로 이동 | `MENU_MOVE_INVALID` |
| B23 | ADMIN이 메뉴 관리 소메뉴를 ADMIN이 허용되지 않은 중메뉴로 이동 | `MENU_SELF_LOCK` |

---

## 5. 캐시

메뉴는 서버 캐시를 두지 않습니다 (요청마다 조회). 권한 코드 캐시(`AccessChecker`)와 관계없습니다.

다른 사용자의 사이드바는 그 사용자가 새로고침하거나 다시 로그인할 때 바뀝니다.

---

## 6. 파일 구성

```text
backend/src/main/java/com/learningworks/menu/
  MenuConstants.java   (MENU_MANAGEMENT_URL)
  web/MenuController.java
  service/MenuService.java, MenuServiceImpl.java
  dao/MenuDao.java
  vo/request/RegistMenuVO.java, ModifyMenuVO.java, ModifyMenuOrderVO.java
  vo/response/MenuVO.java, MenuListVO.java, MyMenuVO.java, MyMenuListVO.java
backend/src/main/resources/com/learningworks/menu/dao/mapper/MenuDaoMapper.xml
common/exceptions/enums/ErrorCode.java   (4-5 추가)
```

---

## 7. ACCESS 모듈 연동 (D-05)

ACCESS 담당자가 모듈에서 손을 떼어, ROLE 담당자가 `feature/access-cleanup`에서 직접 처리했습니다. 항목별 상세는 `access-role-collab/remaining-issues.md`를 보세요.

| # | 내용 | 상태 |
| --- | --- | --- |
| 1 | 메뉴 목록을 `/access/menus` 대신 `GET /menus`로 받고, `/access/menus`와 `selectMenuList` 삭제 | **완료.** 배포 후 `MENU.DEL_YN` 삭제 (2-3) |
| 2 | 접근 관리 · 권한별 접근 권한 관리 화면을 쓰는 역할에 `MENU_READ`도 허용 | **불필요.** 접근 관리 화면은 SUPER_ADMIN 전용이고, 권한별 접근 권한 관리 화면은 `GET /menus`를 부르지 않음 |
| 3 | 메뉴 이름순 · ID순 정렬을 `MENU_ORDER` 순으로 | **완료.** 메뉴 드롭다운(`GET /menus`), 접근 관리 목록, 권한별 접근 권한 관리 목록 모두 메뉴 순서 |
| 4 | 메뉴 상위 변경 시 ACTION의 메뉴 ID를 함께 고치는 방식과 권한 | **결정 완료**, 구현 예정 (4-7) |
| 5 | ACTION 저장 시 메뉴 검증 | **완료.** 저장 전에 `MenuService.checkAndLockMenuPath`로 대 > 중 > 소 계층을 확인하고 소메뉴 행을 잠금. 틀리면 `ACTION_MENU_INVALID`(400) |

ACTION의 메뉴 컬럼 3개는 구조를 바꾸지 않습니다. 지금은 메뉴의 상위 메뉴를 바꿀 수 없고 ACTION 저장 시 계층을 검사하므로 ACTION에 저장된 대 · 중 · 소 조합이 어긋날 일이 없습니다. 4-7을 구현한 뒤에는 메뉴를 옮길 때 서버가 조합을 함께 고칩니다.

---

## 8. 확인 시나리오

| # | 시나리오 | 기대 결과 |
| --- | --- | --- |
| B1 | 비로그인으로 `GET /menus/me` | 401 |
| B2 | SUPER_ADMIN으로 `GET /menus/me` | `superAdmin: true`, 미사용을 포함한 모든 메뉴 (`useYn`으로 구분) |
| B3 | 중메뉴가 미허용인 역할로 `GET /menus/me` | 그 아래 소메뉴가 없음 |
| B4 | `USE_YN = 'N'` 소메뉴 (SUPER_ADMIN이 아닌 역할) | `menus`에 없고 `guardUrls`에는 있음 |
| B5 | `MENU_READ` 없는 역할로 `GET /menus` | 403 |
| B6 | 소메뉴 아래에 등록 | `MENU_PARENT_INVALID` |
| B7 | 같은 URL로 소메뉴 두 개 | 두 번째에서 `MENU_URL_USED` |
| B8 | 수정에서 역할을 여러 번 켰다 껐다 | `MENU_ROLE` 행 수가 체크한 역할 수와 같음 |
| B9 | 하위 메뉴가 있는 메뉴 삭제 / ACTION이 참조하는 메뉴 삭제 | `MENU_HAS_CHILDREN` / `MENU_IN_USE` |
| B10 | 순서 변경 중 다른 사람이 같은 상위 메뉴에 메뉴 추가 | `MENU_ORDER_OUTDATED` |
| B11 | `roleIds`에 `ROLE_SUPER_ADMIN` 포함해서 저장 | 저장은 성공, SUPER_ADMIN 행은 생기지 않음 |
| B12 | ADMIN이 메뉴 관리 소메뉴 · 시스템 관리 중메뉴 · 대메뉴에서 ROLE_ADMIN 해제 | 각각 `MENU_SELF_LOCK` |
| B13 | ADMIN이 메뉴 관리 소메뉴를 미사용 · URL 변경 · 삭제 | 각각 `MENU_SELF_LOCK` |
| B14 | ADMIN이 메뉴 관리 소메뉴에서 ROLE_TUTOR만 해제 | 성공 |
| B15 | SUPER_ADMIN이 메뉴 관리 소메뉴에서 모든 역할 해제 | 성공 (SUPER_ADMIN은 검사 안 함) |
| B16 | 같은 메뉴를 두 화면에서 열고 차례로 저장 | 두 번째에서 `MENU_OUTDATED`, 첫 번째 저장 내용 유지 |
| B17 | 순서 변경 후, 미리 열어 둔 화면에서 그 메뉴 저장 | 성공 (순서 변경은 `MDFY_DT`를 바꾸지 않음) |
| B18 | 같은 상위 메뉴에 같은 이름 등록 / 다른 상위 메뉴에 같은 이름 등록 | `MENU_TITLE_USED` / 성공 |
| B19 | 이름 앞뒤 공백만 다른 같은 이름 등록 | `MENU_TITLE_USED` |
