# ACCESS 모듈 정리 기록

- 읽는 사람: ACCESS · ACCESS_ROLE 모듈 전 담당자, 이 모듈을 이어서 볼 사람
- 작성 · 처리: ROLE · MENU 모듈 담당자 (ACCESS 담당자가 모듈에서 손을 떼어 직접 처리)
- 작성일: 2026-11-12 (분석 기준 코드: `feature/menu` 브랜치 `3ae9d66`)
- 처리 브랜치: `feature/access-cleanup`
- 이 문서만 보면 됩니다. 같은 폴더의 `README.md` · `requests.md` · `discussions.md`는 지난 이력입니다 (R-01 ~ R-11 처리 완료, D-05는 이 문서 5번으로 종료).
- 각 항목의 "현재" · "선택지" · "추천"은 **결정할 당시의 분석**입니다. 실제로 바뀐 내용은 맨 아래 "처리 기록"을 보세요.

---

## 한눈에 보기

| # | 항목 | 결정 | 상태 | 커밋 |
| --- | --- | --- | --- | --- |
| 1 | 메뉴 목록 API 통합 | `GET /access/menus`를 지우고 `GET /menus` 사용 | **완료** | `e777274` |
| 2 | `ROLE_ACTION` PK를 팀 규칙으로 | 시퀀스 ID, 한 행씩 INSERT | **완료** (DB 시퀀스 생성 필요) | `621bf6b` |
| 3 | ACTION 저장 시 메뉴 검증 | 메뉴 존재 · 계층 검사 + 메뉴 행 잠금 | **완료** | `e314f39`, `bce89bd` |
| 4 | 메뉴 이동 시 ACTION 메뉴 갱신 방식 | ACCESS 모듈이 메서드 제공, 권한은 `MENU_UPDATE` | **결정 완료**, 구현 예정 | — |
| 5 | MENU 테이블 공동 사용 (D-05) 마무리 | 메뉴 설계에서 정한 내용으로 확정 | **종료** | — |
| 6 | 데이터 정리 | 아래 순서대로 | 진행 중 | — |
| 7 | ACTION 목록 정렬 | 메뉴 순서 → 접근 권한명 | **완료** | `9ed5564` |
| 8 | 쓰이지 않는 권한 코드 관리 (추가) | 경고 로그 + 가이드. 삭제 기능은 보류 | **완료** | `664bbe2` |

### 배포 · DB 작업 순서

SQL은 `access-cleanup.sql`에 모아 두었습니다. Claude Code는 실행하지 않았습니다.

1. **배포 전**: 시퀀스 `SEQ_ROLE_ACTION_PK` 생성 (SQL 2-1, 필수). 없으면 권한별 접근 권한 관리의 저장이 실패합니다. (선택) UNIQUE 제약 (SQL 2-2)
2. **배포**: 백엔드와 프론트를 함께 배포합니다. 백엔드만 먼저 배포하면 접근 관리 화면의 메뉴 조회가 실패합니다 (1번).
3. **배포 후**: `MENU.DEL_YN` 컬럼 삭제 (SQL 1)

---

## 1. 메뉴 목록 API 통합 (`GET /access/menus` → `GET /menus`)

### 현재

접근 관리 화면(`Access.jsx`)의 대 · 중 · 소 메뉴 드롭다운이 `GET /access/menus`를 씁니다. 메뉴 모듈에는 같은 메뉴를 주는 `GET /menus`가 따로 있습니다.

| 항목 | `GET /access/menus` | `GET /menus` |
| --- | --- | --- |
| 권한 | `@RequireSuperAdmin` | `MENU_READ` (SUPER_ADMIN은 항상 통과) |
| 응답 | 배열 `[{ id, title, parentId, order }]`. `order`는 SQL에서 조회하지 않아 항상 null | `{ roles, menus }`. 메뉴마다 `menuOrder`, `useYn`, `spread`, `menuUrl`, `roleIds`, `crtDt`, `mdfyDt`가 더 있음 |
| 조건 | `NVL(DEL_YN, 'N') = 'N'` | 없음 (MENU는 이제 물리 삭제만 함) |
| 정렬 | `ID DESC` | 단계 → 상위 메뉴 → 메뉴 순서 (사이드바 · 메뉴 관리 화면과 같음) |

2026-11-12 DB 기준 `DEL_YN = 'Y'`인 메뉴는 0건입니다. 그래서 지금은 두 API가 돌려주는 메뉴가 같고, 다른 것은 순서와 응답 모양뿐입니다.

### 선택지

| | A. `GET /menus`로 교체 | B. `/access/menus`는 두고 SQL의 `DEL_YN` 조건만 삭제 |
| --- | --- | --- |
| 작업량 | 프론트 2줄 + 백엔드 5곳 삭제 | 매퍼 1줄 |
| `DEL_YN` 컬럼 삭제 가능 | O | O |
| MENU를 읽는 SQL | 메뉴 모듈 한 곳 | 메뉴 모듈 · ACCESS 모듈 두 곳 |
| MENU 구조가 바뀔 때 | 메뉴 모듈만 고침 | ACCESS 매퍼도 같이 고쳐야 함 |
| 드롭다운 순서 | 사이드바와 같음 | `ORDER BY`를 따로 맞춰야 함 |
| 배포 | 백엔드 · 프론트를 함께 배포해야 함 | 제약 없음 |

### 추천: A

- **권한 영향이 없습니다.** 접근 관리 화면 전체가 SUPER_ADMIN 전용(`Access.jsx`에서 `isSuperAdmin`일 때만 표시)이고, SUPER_ADMIN은 `MENU_READ`를 항상 통과합니다. 예전 협의(D-05)에서 "접근 관리 화면을 쓰는 역할에 `MENU_READ` 허용"을 요청했지만, 지금 구조에서는 필요 없습니다.
- **프론트 수정이 두 줄**이라 A와 B의 비용 차이가 작습니다. 화면이 쓰는 필드(`id`, `title`, `parentId`)는 이름이 같습니다.
- MENU 구조는 앞으로도 바뀝니다(`DEL_YN` 삭제, 4번의 메뉴 이동). 지난번 `ORDER` → `MENU_ORDER`, `TO` → `MENU_URL` 이름 변경 때처럼, MENU를 읽는 SQL이 두 곳이면 매번 같이 고쳐야 합니다.

B는 1번을 바로 할 시간이 없는데 `DEL_YN`만 먼저 지워야 할 때 쓰는 임시 방법으로만 권합니다.

### 할 일 (A안)

1. 프론트
   - `accessApi.js`의 `getAccessMenuList`를 지우고 `api/admin/system/menu/menuApi.js`의 `getMenus`를 씁니다.
   - `Access.jsx`의 `setMenuList(body ?? [])` → `setMenuList(body?.menus ?? [])`
   - (권장) 대메뉴 판정을 "목록에 부모가 없는 메뉴"에서 `item.parentId === null`로 바꿉니다. 지금 방식은 부모가 지워진 메뉴도 대메뉴로 보여 줍니다.
2. 백엔드: 아래를 삭제합니다. 다른 곳에서 쓰지 않습니다.
   - `AccessController.selectMenuList` (`GET /access/menus`)
   - `AccessService` · `AccessServiceImpl`의 `selectMenuList`
   - `AccessDao.selectMenuList`, `AccessDaoMapper.xml`의 `selectMenuList`
   - `AccessMenuVO`
3. **배포 순서 주의**: 백엔드 API를 먼저 지우면 프론트가 바뀌기 전까지 접근 관리 화면의 메뉴 조회가 실패합니다. 한 PR로 같이 바꾸거나, 프론트를 먼저 바꾼 뒤 백엔드를 지우세요.
4. 끝나면 ROLE 담당자에게 알려 주세요. DB 담당자가 `MENU.DEL_YN`을 삭제합니다 (`backend/docs/design/menu-design.md` 2-3의 2단계).

### 확인

- SUPER_ADMIN으로 접근 관리 화면에서 대 · 중 · 소 드롭다운이 메뉴 순서대로 나오는지
- ACTION 등록 · 수정 · 메뉴 필터 검색이 그대로 되는지

---

## 2. `ROLE_ACTION` PK를 팀 규칙으로

### 현재

- `AccessRoleDaoMapper.xml`의 `insertRolePermission`이 ID를 `SUBSTR(RAWTOHEX(SYS_GUID()), 1, 20)`으로 만듭니다 (예: `04E241F323014F059834`).
- 다른 테이블은 팀 공통 규칙 `접두어-YYYYMMDD-000001`(시퀀스)을 씁니다. ACTION은 `AC-`, MENU는 `MN-`, MENU_ROLE은 `MR-`.
- `ROLE_ACTION_ID`는 `VARCHAR2(20 CHAR)`, 현재 18행. (`ROLE_ID`, `ACTION_ID`) UNIQUE 제약은 없습니다. 서비스가 `distinct()`로 중복을 거르고 있어 지금 중복 행은 0건입니다.

### 주의: `INSERT ALL`에 시퀀스만 넣으면 안 됩니다

지금 쿼리는 `INSERT ALL INTO ... INTO ... SELECT 1 FROM DUAL` 형태입니다. Oracle은 `INSERT ALL`에서 **원본 행 하나당 `NEXTVAL`을 한 번만 증가**시킵니다. 원본이 `DUAL` 한 행이므로, ID 부분만 `SEQ_..._PK.NEXTVAL`로 바꾸면 한 번에 저장하는 모든 행이 같은 ID를 받아 PK 중복 오류가 납니다.

### 선택지

| | 방법 | 장점 | 단점 |
| --- | --- | --- | --- |
| A | 역할의 권한을 **한 행씩 INSERT** (서비스에서 반복 호출, `VALUES`에 ID 생성식) | 단순하고 확실함. MENU_ROLE 저장과 같은 방식 | 권한 수만큼 쿼리 실행 (역할당 수십 건이라 문제없음) |
| B | `INSERT INTO ... SELECT 시퀀스, ... FROM (여러 행을 만드는 서브쿼리)` | 쿼리 한 번 | 시퀀스 사용 제약을 피하도록 쿼리를 신경 써서 짜야 함 |
| C | 지금처럼 GUID 유지 | 작업 없음 | 팀 규칙과 다름. 다른 테이블과 형식이 달라 조회 · 디버깅이 불편 |

### 추천: A

- 가장 단순하고, 메뉴 모듈의 `MENU_ROLE` 저장(`MenuDaoMapper.xml`의 `insertMenuRole`)과 같은 방식이라 참고할 코드가 있습니다.
- 역할 하나의 권한은 수십 건 이하라 반복 INSERT의 비용은 무시할 수준입니다.

### 할 일

1. DB 담당: 시퀀스 `SEQ_ROLE_ACTION_PK` 생성 (읽기 전용 계정으로는 시퀀스 목록이 보이지 않아 있는지 확인하지 못했습니다).
2. 매퍼: `insertRolePermission`을 한 행 INSERT로 바꿉니다. ID 생성식은
   `'RA-' || TO_CHAR(SYSDATE, 'YYYYMMDD-') || LPAD(SEQ_ROLE_ACTION_PK.NEXTVAL, 6, '0')` (18자, 컬럼 20자 안에 들어감). `RA-` 접두어는 다른 테이블과 겹치지 않는지 팀 규칙 표에서 확인해 주세요.
3. 서비스: `saveRolePermission`에서 `actionIds`를 돌며 한 행씩 저장합니다. 지금처럼 한 트랜잭션 안에서 처리합니다.
4. 기존 GUID 행 18건은 **그대로 둬도 됩니다.** 저장할 때 그 역할의 행을 모두 지우고 다시 넣으므로, 각 역할의 권한을 한 번 저장하면 새 형식으로 바뀝니다.
5. (선택) (`ROLE_ID`, `ACTION_ID`) UNIQUE 제약 추가. 서비스가 중복을 거르고 있지만, DB에서도 막아 두면 안전합니다. `MENU_ROLE`에도 같은 제약이 있습니다.

### 확인

- 권한별 접근 권한 관리 화면에서 권한을 여러 개 체크하고 저장 → `ROLE_ACTION_ID`가 `RA-...` 형식이고 서로 다른지
- 저장 후 그 역할의 사용자가 바로 해당 API를 쓸 수 있는지 (캐시 비움은 그대로 동작해야 함)

---

## 3. ACTION 저장 시 메뉴 검증

### 현재

- `AccessServiceImpl.saveAccess`는 메뉴 ID 세 개(`topMenuId`, `midMenuId`, `btmMenuId`)가 비어 있지 않은지만 검사합니다.
- MENU · ACTION 사이에 FK가 없습니다 (의도된 설계). 그래서 다음이 그대로 저장됩니다.
  - 없는 메뉴 ID
  - 계층이 맞지 않는 조합 (예: 선택한 중메뉴가 선택한 대메뉴 아래가 아님)
- 메뉴 삭제(`DELETE /menus/{menuId}`)는 "ACTION이 가리키는 메뉴는 삭제 거부(`MENU_IN_USE`)"로 참조를 지킵니다. 그런데 **메뉴 삭제와 ACTION 저장이 같은 순간에 일어나면** 검사를 통과한 뒤 저장되어, 없는 메뉴를 가리키는 ACTION이 생길 수 있습니다. 둘 다 관리자가 드물게 하는 작업이라 가능성은 낮습니다.

### 선택지

| | 방법 | 막는 것 |
| --- | --- | --- |
| A | 저장 전에 메뉴 존재 · 계층 검사 + 소메뉴 행을 `SELECT ... FOR UPDATE`로 잠금 | 잘못된 조합, 동시 삭제 |
| B | 메뉴 존재 · 계층 검사만 | 잘못된 조합 |
| C | 하지 않음 (화면이 드롭다운으로만 고르게 하므로) | 없음 |

### 추천: A

- 화면을 거치지 않은 요청(Postman 등)이나 화면을 열어 둔 사이 메뉴가 바뀐 경우에도 잘못된 데이터가 들어가지 않습니다.
- ACTION의 메뉴 컬럼은 권한별 접근 권한 관리 화면의 메뉴 필터와 메뉴 삭제 검사에 쓰이므로, 틀리면 필터에서 ACTION이 사라지거나 메뉴 삭제 검사가 무의미해집니다.
- 잠금은 메뉴 모듈과 함께 해야 효과가 있습니다. **메뉴 모듈 쪽(삭제할 때 같은 메뉴 행을 잠금)은 ROLE 담당자가 맞춰 수정합니다.**

### 할 일

1. `saveAccess`에서 등록 · 수정하는 ACTION마다
   - 소메뉴 행을 잠그고 조회: `SELECT ID, PARENT_ID FROM MENU WHERE ID = #{btmMenuId} FOR UPDATE`
   - 없으면 거부, `소메뉴.PARENT_ID = midMenuId`이고 `중메뉴.PARENT_ID = topMenuId`이고 `대메뉴.PARENT_ID IS NULL`인지 확인
2. 에러 코드: `ErrorCode`에 새 상수를 추가합니다 (예: `ACTION_MENU_INVALID`, 400, "메뉴 정보가 올바르지 않습니다. 새로고침 후 다시 선택해주세요."). 기존 상수는 바꾸지 마세요.
3. MENU 조회 SQL을 ACCESS 매퍼에 직접 쓰는 대신 메뉴 모듈에 메서드를 요청해도 됩니다. 1번과 같은 이유(MENU를 읽는 곳을 한 곳으로)로 그쪽을 더 권합니다. 필요하면 ROLE 담당자에게 말해 주세요.

---

## 4. 메뉴 이동 시 ACTION 메뉴 갱신 방식 (결정 완료: 4-1 A, 4-2 A)

### 배경

- 지금은 메뉴를 다른 그룹으로 옮길 수 없습니다. 옮기려면 새로 만들고 기존 메뉴를 삭제해야 합니다.
- 기존 메뉴를 ACTION이 가리키면 삭제가 거부됩니다(`MENU_IN_USE`). 그래서 먼저 접근 관리 화면에서 ACTION의 메뉴를 바꿔야 하고, 이 저장은 SUPER_ADMIN 전용입니다. 결국 메뉴 구조 변경이 사실상 SUPER_ADMIN 작업이 되고 절차도 깁니다.
- 그래서 메뉴 이동 API(`PUT /menus/{menuId}/parent`)를 만들고, 옮길 때 **서버가 ACTION의 `TOP_MENU_ID` · `MID_MENU_ID` · `BTM_MENU_ID`를 함께 고치려** 합니다. ACTION은 ACCESS 모듈의 테이블이라 두 가지를 정해야 합니다.
- 상세 설계: `backend/docs/design/menu-design.md` 4-7

| 옮긴 메뉴 | ACTION에서 바꾸는 것 |
| --- | --- |
| 소메뉴 | `BTM_MENU_ID` = 옮긴 메뉴인 행의 `MID_MENU_ID` · `TOP_MENU_ID`를 새 위치로 |
| 중메뉴 | `MID_MENU_ID` = 옮긴 메뉴인 행의 `TOP_MENU_ID`를 새 대메뉴로 |

### 결정 4-1. ACTION 수정을 어느 모듈 코드로 할까

| | 방법 | 장점 | 단점 |
| --- | --- | --- | --- |
| A | **ACCESS 모듈이 메서드(서비스 또는 DAO)를 제공**하고 메뉴 모듈이 호출 | ACTION을 고치는 SQL이 ACCESS 모듈에만 있음. ACTION 구조를 바꿀 때 ACCESS 담당자만 알면 됨 | ACCESS 담당자 작업이 생김 (메서드 1~2개) |
| B | 메뉴 모듈 매퍼가 ACTION을 직접 UPDATE | ACCESS 담당자 작업 없음 | ACTION을 고치는 코드가 두 모듈에 흩어짐. ACCESS 담당자가 모르는 사이 ACTION이 바뀜 |

**추천: A.** 1번에서 "MENU를 읽는 곳은 메뉴 모듈 한 곳"으로 정리하는 것과 같은 원칙입니다. 테이블을 고치는 코드는 그 테이블의 담당 모듈에 둡니다. 메서드는 메뉴 모듈의 트랜잭션 안에서 호출되므로 이동과 ACTION 갱신이 한 번에 반영되거나 한 번에 취소됩니다.

제공해 주실 메서드 (예시, 이름 · 위치는 자유):

```java
/** 소메뉴가 옮겨졌을 때: BTM_MENU_ID = btmMenuId인 ACTION의 상위 메뉴 ID를 바꾼다. 바뀐 행 수 */
int updateMenusOfBottom(String btmMenuId, String newMidMenuId, String newTopMenuId);

/** 중메뉴가 옮겨졌을 때: MID_MENU_ID = midMenuId인 ACTION의 대메뉴 ID를 바꾼다. 바뀐 행 수 */
int updateTopOfMid(String midMenuId, String newTopMenuId);
```

### 결정 4-2. 메뉴 이동 권한

| | 방법 | 장점 | 단점 |
| --- | --- | --- | --- |
| A | **`MENU_UPDATE`** (메뉴 수정 권한이 있으면 이동 가능) | 메뉴 관리자가 혼자 구조를 바꿀 수 있음. 이 기능을 만드는 목적에 맞음 | ACTION의 메뉴 컬럼이 SUPER_ADMIN이 아닌 사람에 의해 바뀜 |
| B | SUPER_ADMIN 전용 | ACTION 관련 변경은 모두 SUPER_ADMIN만 하게 됨 (D-03 원칙과 일치) | 지금과 같은 문제(구조 변경이 SUPER_ADMIN 작업)가 남음 |

**추천: A.**
- ACTION 저장을 SUPER_ADMIN 전용으로 한 이유(D-03)는 권한 코드와 권한 구조가 바뀌기 때문입니다. 메뉴 이동이 바꾸는 것은 **메뉴 컬럼뿐**이고, 이 컬럼은 화면의 메뉴 필터와 메뉴 삭제 검사에만 쓰입니다. 누가 어떤 API를 쓸 수 있는지(권한 코드 · `ROLE_ACTION` · 권한 캐시)는 바뀌지 않습니다.
- 이동은 메뉴를 바꾸는 일이므로, 메뉴 수정 권한과 같은 수준으로 보는 것이 자연스럽습니다.
- 나중에 SUPER_ADMIN 전용으로 바꾸려면 API 하나에 `@RequireSuperAdmin`만 붙이면 됩니다. 이동 API를 수정 API와 따로 두는 이유이기도 합니다.

---

## 5. MENU 테이블 공동 사용 (D-05) 마무리

`discussions.md`의 D-05는 "결정 대기"였습니다. 그 뒤 메뉴 모듈을 설계 · 구현하면서 모두 정해져, 아래 내용으로 **D-05를 닫았습니다** (2026-11-12).

| D-05 항목 | 당시 추천 | 현재 결정 (메뉴 설계) | 바뀐 이유 |
| --- | --- | --- | --- |
| 메뉴 목록 API | MENU 모듈 API로 대체 | 같음 → 1번 | — |
| 정렬 컬럼 | `MENU_ORDER` 등 추가 | `MENU_ORDER` 추가 완료 (`ORDER` → `MENU_ORDER`, `TO` → `MENU_URL`, 둘 다 Oracle 예약어) | — |
| 삭제 방식 | 논리 삭제(`DEL_YN`) 유지 | **물리 삭제.** 하위 메뉴가 있거나 ACTION이 가리키면 삭제 거부 (`MENU_HAS_CHILDREN` · `MENU_IN_USE`). 숨기기는 `USE_YN` | 삭제 거부로 참조가 끊기지 않게 지킬 수 있고, 논리 삭제는 모든 조회에 조건을 붙여야 해서 빠뜨리기 쉬움 |
| ACTION의 메뉴 컬럼 3개 | 최하위 메뉴 ID 하나만 저장 | **3개 그대로 유지** | 권한별 접근 권한 관리 화면의 대 · 중 · 소 필터와 메뉴 삭제 검사에 그대로 쓸 수 있음. 메뉴를 옮길 때 어긋나는 문제는 4번(서버가 함께 갱신)으로 해결. 구조를 바꾸면 ACCESS 매퍼 · 화면을 크게 고쳐야 함 |
| MENU 스키마 변경 담당 | 미정 | ROLE · MENU 담당자 설계, DB 담당자 실행 | — |

---

## 6. 데이터 정리 (ROLE 담당자, 진행 중)

메뉴 관리 화면이 완성되어, 개발용 메뉴 데이터를 정식 데이터로 다시 만들 차례입니다. ACTION이 메뉴를 가리키고 있어 순서가 중요합니다. ACCESS 담당자가 손을 떼어 모두 ROLE 담당자가 진행합니다.

1. 메뉴 관리 화면에서 정식 메뉴(대 3 · 중 9 · 소 15, 현재 사이드바 구성)와 역할별 허용을 입력합니다.
2. **접근 관리 화면에서 모든 ACTION의 대 · 중 · 소 메뉴를 새 메뉴로 다시 지정합니다.** 2026-11-12 기준 ACTION 20건이고, 그중 `MENU_*` 권한 4건은 테스트 메뉴(`MN-20261111-...`)를 가리킵니다.
3. 예전 개발용 메뉴(숫자 ID)와 테스트 메뉴를 삭제합니다. ACTION이 가리키는 메뉴는 삭제가 거부되므로, 2번이 끝나야 지워집니다.
4. 쓰지 않는 권한 코드 `MENU_READ_DETAIL`, `MENU_READ_PERMISSION`은 **정리하지 않고 보류**합니다 (8번).

---

## 7. ACTION 목록 정렬 (선택)

- 현재: 접근 관리 목록이 `ORDER BY A.ACTION_ID DESC`입니다. `ACTION_ID`가 시퀀스이므로 결과적으로 "최근 등록 순"입니다.
- 추천: **대메뉴 순서 → 중메뉴 순서 → 소메뉴 순서 → 접근 권한명**. 메뉴 관리 화면 · 사이드바와 같은 순서라 찾기 쉽습니다. `selectAccessList`에 이미 `LEFT JOIN MENU`가 있으므로 `ORDER BY TOP_MENU.MENU_ORDER, MID_MENU.MENU_ORDER, BTM_MENU.MENU_ORDER, A.ACTION_NAME`처럼 바꾸면 됩니다.
- 급하지 않습니다. 다른 작업과 함께 할 때 반영하면 됩니다.

---

## 8. 쓰이지 않는 권한 코드 관리 (처리 중 추가)

### 현재 (처리 전)

- 접근 관리 목록은 서버가 시작할 때 모은 권한 코드 목록(`ActionCodeRegistry`, 모든 `@RequireAction`)에 없는 코드를 "(미사용)"으로 표시만 합니다 (`AccessServiceImpl.selectAccessList` → `actionCodeInUse`).
- ACTION 삭제 기능은 없습니다 (API · 화면 모두). DB에서 SQL로만 지울 수 있습니다.
- 그대로 두면 당장 동작에는 문제없지만, **같은 이름으로 API를 다시 만들면 예전에 부여된 역할이 그 API를 바로 쓸 수 있게 됩니다.** 2026-11-12 기준 `MENU_READ_DETAIL`(부여 없음), `MENU_READ_PERMISSION`(ROLE_ADMIN · ROLE_STUDENT에 부여)이 해당합니다.

### 선택지

| | 방법 | 판단 |
| --- | --- | --- |
| A | 접근 관리 화면에 미사용 ACTION 삭제 기능 | 공용 개발 DB에서는 아직 머지되지 않은 다른 브랜치의 코드도 "(미사용)"으로 보여 잘못 지울 수 있음 → **보류** |
| B | 권한 코드를 바꾸는 PR에 정리 SQL을 넣는 규칙 | 드문 일에 매번 SQL을 맡기는 부담 대비 효과가 작음 |
| C | 서버 시작 시 경고 로그 + 가이드 안내 | 빠뜨려도 발견 가능, 삭제는 사람이 확인 후 → **채택** |

서버 시작 시 자동 삭제는 하지 않습니다. 다른 브랜치의 코드를 지울 수 있고, 배포를 되돌리면(롤백) 지운 권한 부여는 복구할 수 없기 때문입니다.

### 결과

- `UnusedActionCodeReporter`: 서버 시작 후 ACTION에 등록됐지만 코드에 없는 권한 코드를 `WARN` 로그로 표시 (삭제하지 않음)
- `backend/docs/access-control-guide.md` 6장 "권한 코드를 바꾸거나 없앨 때": 해당 경우, 정리 SQL, 공용 개발 DB 주의
- `MENU_READ_DETAIL`, `MENU_READ_PERMISSION`: 다른 브랜치에서 쓰는지 확인 전이라 보류. 확인 후 가이드의 정리 SQL로 지우고 서버 재시작
- 사용이 잦아지면 A(삭제 기능, 미사용 코드만, 부여된 역할을 확인 창에 표시)를 다시 검토

---

## 처리 기록

| # | 상태 | 변경 내용 | 커밋 |
| --- | --- | --- | --- |
| 1 | 완료 | `GET /access/menus`와 관련 코드(`AccessController` · `Service` · `Dao` · 매퍼의 `selectMenuList`, `AccessMenuVO`) 삭제. 접근 관리 화면은 `menuApi.getMenus` 사용, 대메뉴 판정을 `parentId === null`로 | `e777274` |
| 2 | 완료 | `insertRolePermission`을 한 행 INSERT로, ID는 `'RA-' \|\| TO_CHAR(SYSDATE, 'YYYYMMDD-') \|\| LPAD(SEQ_ROLE_ACTION_PK.NEXTVAL, 6, '0')`. 서비스 테스트 추가. 개발 DB에서 저장 시 새 형식으로 바뀌는 것 확인 | `621bf6b` |
| 3 | 완료 | 메뉴 모듈에 `MenuService.checkAndLockMenuPath` 추가(소메뉴 행 잠금 + 계층 확인), 메뉴 삭제 시 행 잠금. `saveAccess`가 저장 전에 모든 경로를 소메뉴 ID 순서로 확인, 틀리면 `ACTION_MENU_INVALID`(400). MENU 조회는 ACCESS 매퍼가 아니라 메뉴 모듈을 통해서 함 | `e314f39`, `bce89bd` |
| 4-1 | 결정 | A: ACCESS 모듈이 ACTION 메뉴 갱신 메서드를 제공하고 메뉴 모듈이 호출 | — |
| 4-2 | 결정 | A: 메뉴 이동 권한은 `MENU_UPDATE` | — |
| 5 | 종료 | D-05를 메뉴 설계 결정(물리 삭제, ACTION 메뉴 컬럼 3개 유지 등)으로 종료 | — |
| 6 | 진행 중 | 정식 메뉴 입력 → ACTION 메뉴 재지정 → 옛 메뉴 삭제 | — |
| 7 | 완료 | 접근 관리 목록과 권한별 접근 권한 관리 허용 · 미허용 목록을 대 · 중 · 소 메뉴 순서 → 권한명 순으로. 순서가 빈 예전 데이터는 메뉴 ID로 묶음 | `9ed5564` |
| 8 | 완료 (삭제는 보류) | 미사용 권한 코드 경고 로그, 권한 가이드 안내 추가 | `664bbe2` |
