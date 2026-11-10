# 메뉴 · 메뉴 접근 권한 백엔드 설계

- 대상: `MENU`, `MENU_ROLE` 테이블과 `com.learningworks.menu` 패키지
- 담당: ROLE 모듈 담당자
- 작성일: 2026-11-10
- 상태: 설계 확정. 구현 전

이 문서는 백엔드 구현을 시작할 때 참고하는 설계입니다. 화면 설계는 `frontend/docs/design/menu-page-design.md`, 권한 체계는 `backend/docs/access-control-guide.md`, ACCESS 모듈과의 협의는 `backend/docs/access-role-collab/discussions.md`의 D-05를 함께 보세요.

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
| 상위 메뉴 변경 | 지원하지 않습니다. 순서는 같은 상위 메뉴 안에서만 바꿉니다 |
| SUPER_ADMIN | `MENU_ROLE`과 관계없이 모든 메뉴를 봅니다. SUPER_ADMIN의 `MENU_ROLE` 행은 저장하지 않습니다 |
| 내 메뉴 API 권한 | `@LoginRequired` |
| 메뉴 관리 API 권한 | `@RequireAction(domain = "MENU", ...)` (4장) |
| ACTION의 메뉴 컬럼 3개 | 그대로 둡니다. 권한별 접근 권한 관리 화면(`/admin/system/access-role`)의 필터로 계속 쓰고, 메뉴 삭제 때 참조 검사에도 씁니다 |
| `/access/menus` | 이 모듈의 `GET /menus`로 바꾸고 삭제합니다. ACCESS 담당자에게 요청합니다 (7장) |

---

## 2. 테이블

### 2-1. MENU (변경 후)

| 컬럼 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `ID` | `VARCHAR2` | PK | `MN-YYYYMMDD-000001` |
| `TITLE` | `VARCHAR2(100)` | Y | 메뉴 이름 |
| `PARENT_ID` | `VARCHAR2` | | 상위 메뉴 ID. 대메뉴는 null |
| `MENU_ORDER` | `NUMBER` | Y | 같은 상위 메뉴 안의 순서. 1부터 |
| `USE_YN` | `CHAR(1)` | Y | `Y` 사용 / `N` 미사용(사이드바에서 숨김, URL 접근 거부) |
| `SPREAD` | `CHAR(1)` | | **중메뉴만** 사용. `Y`면 화면을 처음 열 때 펼친 상태로 표시. 대 · 소메뉴는 null |
| `MENU_URL` | `VARCHAR2` | | **소메뉴만** 사용(필수). 대 · 중메뉴는 null. UNIQUE |
| `CRT_DT` | `DATE` | Y | 생성일 |
| `MDFY_DT` | `DATE` | | 수정일. 생성 직후에는 null |

### 2-2. MENU_ROLE (변경 후)

| 컬럼 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `ID` | `VARCHAR2` | PK | `MR-YYYYMMDD-000001` |
| `MENU_ID` | `VARCHAR2` | Y | `MENU.ID` |
| `ROLE_ID` | `VARCHAR2` | Y | `ROLE.ROLE_ID` |
| `CRT_DT` | `DATE` | Y | 생성일 |

UNIQUE (`MENU_ID`, `ROLE_ID`)

### 2-3. 변경 스크립트 (DB 담당: 프로젝트 담당자가 직접 실행)

순서가 중요합니다. **`MENU.DEL_YN` 삭제는 ACCESS 모듈의 `selectMenuList`(`/access/menus`)가 없어진 뒤에** 실행하세요. 지금 그 쿼리가 `WHERE NVL(DEL_YN, 'N') = 'N'`을 씁니다.

```sql
-- 1단계: 바로 실행 가능 (지금 코드가 쓰지 않는 컬럼)
ALTER TABLE MENU RENAME COLUMN "ORDER" TO MENU_ORDER;
ALTER TABLE MENU RENAME COLUMN "TO" TO MENU_URL;

-- MENU_ROLE 정리: 논리 삭제된 행과 중복 행을 먼저 지운다
DELETE FROM MENU_ROLE WHERE DEL_YN = 'Y';
-- (중복이 있으면 하나만 남기고 삭제한 뒤 아래 제약 추가)
ALTER TABLE MENU_ROLE DROP COLUMN DEL_YN;
ALTER TABLE MENU_ROLE DROP COLUMN MDFY_DT;
ALTER TABLE MENU_ROLE ADD CONSTRAINT UK_MENU_ROLE UNIQUE (MENU_ID, ROLE_ID);

-- 2단계: ACCESS 모듈이 /access/menus를 없앤 뒤 실행
DELETE FROM MENU WHERE DEL_YN = 'Y';   -- 참조하는 ACTION · MENU_ROLE · 하위 메뉴가 없는지 먼저 확인
ALTER TABLE MENU DROP COLUMN DEL_YN;
ALTER TABLE MENU ADD CONSTRAINT UK_MENU_URL UNIQUE (MENU_URL);  -- null은 여러 개 허용됨
```

### 2-4. ID 생성식 (MyBatis `selectKey`)

```sql
SELECT 'MN-' || TO_CHAR(SYSDATE, 'YYYYMMDD-') || LPAD(SEQ_MENU_PK.NEXTVAL, 6, '0') FROM DUAL
SELECT 'MR-' || TO_CHAR(SYSDATE, 'YYYYMMDD-') || LPAD(SEQ_MENU_ROLE_PK.NEXTVAL, 6, '0') FROM DUAL
```

`MENU_ROLE`은 수정할 때마다 지우고 다시 넣으므로 시퀀스 번호가 빨리 늘어나지만, 행은 쌓이지 않습니다.

### 2-5. 초기 데이터

메뉴 가드(프론트)를 켜기 **전에** 지금 `frontend/src/components/menu/menuData.js`의 구성을 `MENU`에 넣고, 역할별 `MENU_ROLE`을 채워야 합니다. 비어 있으면 SUPER_ADMIN이 아닌 사용자는 대시보드 외에 아무 화면도 열 수 없습니다.

- 대메뉴 = 섹션(Main / My Page / System Management), 중메뉴 = 그룹, 소메뉴 = 링크.
- `menuData.js`의 "DB 관리"(`/admin/system/db`)는 라우트가 없습니다. 라우트가 생길 때 추가하세요.
- 입력은 SQL로 직접 하거나, 메뉴 관리 화면이 완성된 뒤 SUPER_ADMIN 계정으로 입력합니다.

---

## 3. 메뉴 판정 규칙

"내 메뉴"에 들어가는 조건입니다. **자기 자신과 모든 상위 메뉴가** 아래를 만족해야 합니다.

1. `USE_YN = 'Y'`
2. SUPER_ADMIN이거나, `MENU_ROLE`에 (메뉴, 내 역할) 행이 있음

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
| `PUT /menus/{menuId}` | `MENU_UPDATE` "메뉴 수정" | `{ title, useYn, spread, menuUrl, roleIds }` | 수정한 메뉴 1건 |
| `PUT /menus/order` | `MENU_UPDATE` "메뉴 수정" | `{ parentId, menuIds }` | `{ roles, menus }` (변경 후 전체) |
| `DELETE /menus/{menuId}` | `MENU_DELETE` "메뉴 삭제" | — | 삭제한 메뉴 1건 |

- 같은 권한 코드는 `description`이 같아야 서버가 뜹니다 (`MENU_UPDATE` 두 곳 모두 "메뉴 수정").
- `PUT /menus/order`는 `PUT /menus/{menuId}`보다 먼저 매칭되도록 경로를 확인하세요 (Spring은 고정 경로를 우선합니다. `RoleController`와 같은 구조).

### 4-1. `GET /menus/me` 응답

```json
{
  "superAdmin": false,
  "menus": [
    { "id": "MN-...", "title": "System Management", "parentId": null, "menuOrder": 3, "spread": null, "menuUrl": null },
    { "id": "MN-...", "title": "과정 관리", "parentId": "MN-...", "menuOrder": 1, "spread": "Y", "menuUrl": null },
    { "id": "MN-...", "title": "과정 목록", "parentId": "MN-...", "menuOrder": 1, "spread": null, "menuUrl": "/admin/course/list" }
  ],
  "guardUrls": ["/admin/course/add", "/admin/course/list", "..."]
}
```

- `menus`: 3장 규칙을 통과한 메뉴만. 평평한 목록, 정렬은 (단계, `PARENT_ID`, `MENU_ORDER`).
- `guardUrls`: **모든** 소메뉴의 `MENU_URL` (미사용 · 미허용 포함). 프론트 가드가 "이 URL이 어느 메뉴 소속인지" 찾을 때 씁니다. 미사용 메뉴도 넣어야, 숨긴 메뉴의 URL이 더 짧은 다른 메뉴에 매칭되어 열리는 일이 없습니다.
- URL 목록은 이미 프론트 코드에 들어 있는 정보라서 로그인 사용자 모두에게 보내도 됩니다.

### 4-2. `GET /menus` 응답 (메뉴 관리 화면용)

```json
{
  "roles": [{ "roleId": "ROLE_SUPER_ADMIN", "roleDisplayName": "최고 관리자" }, "..."],
  "menus": [
    {
      "id": "MN-...", "title": "과정 목록", "parentId": "MN-...", "menuOrder": 1,
      "useYn": "Y", "spread": null, "menuUrl": "/admin/course/list",
      "roleIds": ["ROLE_ADMIN", "ROLE_TUTOR"],
      "crtDt": "2026-11-10 14:03", "mdfyDt": null
    }
  ]
}
```

- `roles`: 역할 순위 순서의 전체 역할. 메뉴 관리 화면의 체크박스용입니다. 여기 포함해서, 메뉴 관리자에게 `ROLE_READ`가 따로 필요 없게 합니다.
- `roleIds`: SUPER_ADMIN은 넣지 않습니다 (화면이 항상 체크 · 비활성으로 표시).
- 날짜는 `TO_CHAR(..., 'YYYY-MM-DD HH24:MI')` 문자열.
- ACCESS 모듈도 메뉴 필터용으로 이 API를 씁니다 (7장).

### 4-3. 입력값 규칙

| 필드 | 규칙 | 메시지 |
| --- | --- | --- |
| `title` | 필수, 100자 이하 | "메뉴 이름을 입력해주세요." / "메뉴 이름은 100자 이하로 입력해주세요." |
| `useYn` | 필수, `Y` 또는 `N` | "사용 여부가 올바르지 않습니다." |
| `spread` | 중메뉴면 필수(`Y`/`N`), 그 외에는 무시하고 null 저장 | "펼침 여부가 올바르지 않습니다." |
| `menuUrl` | 소메뉴면 필수, `/`로 시작, 공백 없음, 컬럼 길이 이하. 그 외에는 무시하고 null 저장 | "메뉴 URL을 입력해주세요." / "메뉴 URL은 '/'로 시작해야 합니다." |
| `roleIds` | 배열(빈 배열 허용). 없는 역할이 있으면 거부. SUPER_ADMIN은 저장하지 않고 건너뜀 | — |
| `parentId` (등록) | null(대메뉴) 또는 존재하는 대 · 중메뉴 | — |

백엔드는 프론트 라우트를 알 수 없으므로 `menuUrl`은 **형식만** 검사합니다. 실제 화면이 있는 URL만 고르게 하는 것은 프론트가 합니다.

### 4-4. 동작

- **등록**: 새 메뉴는 같은 상위 메뉴의 맨 뒤(`MAX(MENU_ORDER) + 1`)에 추가. `CRT_DT = SYSDATE`, `MDFY_DT = null`. `MENU_ROLE`을 함께 저장.
- **수정**: `MDFY_DT = SYSDATE`. `MENU_ROLE`은 해당 메뉴 행을 모두 지우고 `roleIds`로 다시 넣습니다 (물리 삭제라 행이 쌓이지 않음). 한 트랜잭션.
- **순서 변경**: `menuIds`는 해당 상위 메뉴의 **현재 하위 메뉴 전체**여야 합니다. 개수 · 구성이 다르면 `MENU_ORDER_OUTDATED`. 받은 순서대로 1부터 다시 매깁니다 (역할 순서 변경과 같은 방식).
- **삭제**: 하위 메뉴가 있으면 `MENU_HAS_CHILDREN`, ACTION의 `TOP_MENU_ID` · `MID_MENU_ID` · `BTM_MENU_ID` 중 하나라도 참조하면 `MENU_IN_USE`. 통과하면 `MENU_ROLE` 행 삭제 → `MENU` 삭제 → 같은 상위 메뉴의 순서를 1부터 다시 매김. 한 트랜잭션.
- 역할 삭제 시 `MENU_ROLE` 물리 삭제는 이미 `RoleDaoMapper.deleteMenuRoleByRoleId`가 합니다 (변경 없음).

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

---

## 5. 캐시

메뉴는 서버 캐시를 두지 않습니다 (요청마다 조회). 권한 코드 캐시(`AccessChecker`)와 관계없습니다.

다른 사용자의 사이드바는 그 사용자가 새로고침하거나 다시 로그인할 때 바뀝니다.

---

## 6. 파일 구성

```text
backend/src/main/java/com/learningworks/menu/
  web/MenuController.java
  service/MenuService.java, MenuServiceImpl.java
  dao/MenuDao.java
  vo/request/RegistMenuVO.java, ModifyMenuVO.java, ModifyMenuOrderVO.java
  vo/response/MenuVO.java, MenuListVO.java, MyMenuVO.java, MyMenuListVO.java
backend/src/main/resources/com/learningworks/menu/dao/mapper/MenuDaoMapper.xml
common/exceptions/enums/ErrorCode.java   (4-5 추가)
```

---

## 7. ACCESS 담당자에게 요청할 것 (D-05)

| # | 요청 | 이유 |
| --- | --- | --- |
| 1 | 메뉴 목록을 `/access/menus` 대신 `GET /menus`로 받고, `/access/menus`와 `selectMenuList` 삭제 | 메뉴 목록 API를 하나로 통일. 이 작업이 끝나야 `MENU.DEL_YN`을 지울 수 있음 (2-3) |
| 2 | 접근 관리 · 권한별 접근 권한 관리 화면을 쓰는 역할에 `MENU_READ`도 허용 | 1번 이후 메뉴 필터가 `GET /menus`를 부르기 때문 |
| 3 | (선택) 메뉴 이름순 · ID순 정렬을 `MENU_ORDER` 순으로 | 사이드바와 같은 순서로 보이게 |

ACTION의 메뉴 컬럼 3개는 바꾸지 않습니다. 메뉴의 상위 메뉴를 바꿀 수 없게 했으므로, ACTION에 저장된 대 · 중 · 소 조합이 어긋날 일도 없습니다.

---

## 8. 확인 시나리오

| # | 시나리오 | 기대 결과 |
| --- | --- | --- |
| B1 | 비로그인으로 `GET /menus/me` | 401 |
| B2 | SUPER_ADMIN으로 `GET /menus/me` | `superAdmin: true`, 미사용을 뺀 모든 메뉴 |
| B3 | 중메뉴가 미허용인 역할로 `GET /menus/me` | 그 아래 소메뉴가 없음 |
| B4 | `USE_YN = 'N'` 소메뉴 | `menus`에 없고 `guardUrls`에는 있음 |
| B5 | `MENU_READ` 없는 역할로 `GET /menus` | 403 |
| B6 | 소메뉴 아래에 등록 | `MENU_PARENT_INVALID` |
| B7 | 같은 URL로 소메뉴 두 개 | 두 번째에서 `MENU_URL_USED` |
| B8 | 수정에서 역할을 여러 번 켰다 껐다 | `MENU_ROLE` 행 수가 체크한 역할 수와 같음 |
| B9 | 하위 메뉴가 있는 메뉴 삭제 / ACTION이 참조하는 메뉴 삭제 | `MENU_HAS_CHILDREN` / `MENU_IN_USE` |
| B10 | 순서 변경 중 다른 사람이 같은 상위 메뉴에 메뉴 추가 | `MENU_ORDER_OUTDATED` |
| B11 | `roleIds`에 `ROLE_SUPER_ADMIN` 포함해서 저장 | 저장은 성공, SUPER_ADMIN 행은 생기지 않음 |
