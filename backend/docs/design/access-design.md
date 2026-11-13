# 권한 체계 · ACCESS 모듈 결정 기록

- 대상: 권한 검사(`com.learningworks.common.action`), ACCESS(`/access`, 접근 관리) · ACCESS_ROLE(`/access-role`, 권한별 접근 권한 관리) 모듈, `ACTION` · `ROLE_ACTION` 테이블
- 담당: ROLE 담당자 (2026-11-12부터 ACCESS · ACCESS_ROLE 모듈도 담당)
- 최종 정리: 2026-11-13

권한 체계와 ACCESS 모듈을 **왜 이렇게 만들었는지** 남긴 문서입니다. 사용법은 `backend/docs/access-control-guide.md`(백엔드), `frontend/docs/permission-guide.md`(프론트)를 보세요.

이 문서는 예전 협업 문서(`backend/docs/access-role-collab/`의 요청서 R-01 ~ R-11, 협의 D-01 ~ D-06, 정리 기록)를 하나로 합친 것입니다. 협의 번호(D-xx)는 코드 주석에서 쓰고 있어 그대로 유지했습니다. 진행 이력은 git 기록을 보세요.

---

## 한눈에 보기

| ID | 결정 | 상태 |
| --- | --- | --- |
| D-01 | API 권한은 `ROLE_ACTION` 기반으로 검사. 권한 코드는 API의 `@RequireAction`에서 수집 | 적용 |
| D-02 | `MENU_ROLE`은 사이드바 · 화면 이동, `ROLE_ACTION`은 API · 기능 권한 | 적용 |
| D-03 | 권한 체계를 바꾸는 기능은 SUPER_ADMIN 전용. SUPER_ADMIN은 권한 설정 대상에서 제외 | 적용 |
| D-04 | 권한 설정 API URL은 지금 그대로 (`/access-role/...`) | 보류 |
| D-05 | MENU 테이블 공동 사용: 메뉴 모듈 결정을 따름 | 종료 |
| D-06 | 성공 메시지는 응답에 넣지 않고 프론트가 표시 | 적용 |
| D-07 | 접근 관리 메뉴 목록은 메뉴 모듈의 `GET /menus` 사용 | 적용 |
| D-08 | `ROLE_ACTION_ID`는 팀 PK 규칙(시퀀스), 한 행씩 INSERT | 적용 |
| D-09 | ACTION 저장 시 메뉴 경로 확인 + 메뉴 행 잠금 | 적용 |
| D-10 | 메뉴 이동 시 ACTION 메뉴 갱신: ACCESS 모듈 DAO 메서드, 권한 `MENU_UPDATE` | 적용 |
| D-11 | ACTION 목록은 메뉴 순서로 정렬 | 적용 |
| D-12 | 쓰이지 않는 권한 코드: 경고 로그만, 삭제는 사람이 | 적용 |

---

## D-01. API 권한 검사 방식

**결정**: API마다 필요한 권한 코드를 지정하고, 요청자의 역할에 그 권한이 `ROLE_ACTION`으로 허용됐는지 DB 기준으로 검사합니다.

- 권한 코드는 백엔드 개발자가 API 메서드에 `@RequireAction(domain, action, description)`으로 정의합니다. 권한 코드 = `domain_action` (예: `ROLE_DELETE`, `SURVEY_ANSWER`).
- 서버가 시작할 때 `ActionCodeRegistry`가 모든 `@RequireAction`을 모아 권한 코드 목록을 만듭니다. 형식 위반, 40자 초과, 같은 코드인데 `description`이 다르면 서버가 시작되지 않습니다.
- 관리자는 접근 관리 화면에서 이 목록 중 하나를 골라 ACTION으로 등록하고(`ACTION_CODE`), 권한별 접근 권한 관리 화면에서 역할에 부여합니다(`ROLE_ACTION`).
- 검사: `ActionCheckInterceptor`가 `@RequireAction`을 읽어 `AccessChecker`로 확인합니다. 요청자 역할은 JWT가 아니라 **DB의 현재 `BASE_ROLE`** 입니다. SUPER_ADMIN은 항상 통과합니다.
- 역할별 허용 권한 코드는 캐시합니다 (만료 없음). 권한 저장(`/access-role/save`)과 역할 삭제 때 그 역할의 캐시를 비웁니다. SQL로 직접 바꾸면 서버를 재시작해야 합니다.
- 권한 어노테이션이 없는 API는 SUPER_ADMIN만 호출할 수 있습니다 (`app.access-check.default-super-admin: true`). 로그인 사용자 누구나는 `@LoginRequired`, 비로그인 공개는 `@PublicApi`.

**이유**: 역할을 코드에 나열하는 방식(`@PreAuthorize("hasAnyRole(...)")`)은 관리자가 화면에서 새로 만든 역할이 아무 기능도 쓸 수 없고, 화면에서 권한을 바꿔도 반영되지 않습니다. 권한 설정 화면이 실제 권한과 무관해집니다.

**채택하지 않은 방식**

| 방식 | 이유 |
| --- | --- |
| 관리자가 `ACTION_CODE`를 직접 입력 | 개발자가 정한 코드를 예측해 입력해야 하고, 오타가 나면 어떤 API와도 연결되지 않는 권한이 조용히 생김 |
| `ACTION_ID`(PK)를 권한 코드로 사용 | PK는 시퀀스로 자동 생성하므로 코드에 적을 수 없음 |
| DB 상수 테이블 + CRUD 드롭다운, 또는 Java enum 병행 | 기준이 두 곳이라 수동 동기화 필요. CRUD로 표현하기 어려운 권한(`SURVEY_ANSWER` 등)을 못 만듦. 권한은 테이블이 아니라 기능 단위 |
| 권한 코드를 중앙 enum 한 파일에 등록 | 모든 백엔드 작업자가 같은 파일을 고쳐 git 충돌이 잦음 |

**코드와 DB가 어긋날 때**: 코드에 있는데 ACTION에 없으면 SUPER_ADMIN만 쓸 수 있습니다(화면에서 등록). ACTION에 있는데 코드에 없으면 효과가 없고 화면에 "(미사용)"으로 표시됩니다(D-12).

## D-02. `MENU_ROLE`과 `ROLE_ACTION`의 역할 분담

**결정**: 두 테이블을 모두 쓰고, 역할을 나눕니다.

| 테이블 | 정하는 것 | 예 |
| --- | --- | --- |
| `MENU_ROLE` | 사이드바 표시와 화면(URL) 이동 | 시스템 관리 메뉴는 ADMIN에게만 표시 |
| `ROLE_ACTION` | 화면 안에서 할 수 있는 행동 (API · 버튼) | 과제 화면은 TUTOR · STUDENT 모두 열지만, CRUD는 TUTOR만 |

- **보안 검사는 `ROLE_ACTION`으로만 합니다.** 메뉴를 숨겨도 API는 직접 호출할 수 있으므로 `MENU_ROLE`은 API 보호 수단이 아닙니다.
- 두 설정이 어긋나도 저장을 막지 않습니다. 메뉴는 보이는데 권한이 없으면 화면은 열리고 데이터 조회가 403(안전한 방향), 메뉴는 숨겼는데 권한이 있으면 API는 호출 가능합니다. 관리자가 두 화면에서 맞춰야 합니다.
- 메뉴 쪽 상세: `backend/docs/design/menu-design.md`

**이유**: 메뉴 노출을 `ROLE_ACTION`에서 계산하면 관리 지점은 하나지만, 기능이 없는 화면(안내 페이지 등)에도 "조회" 권한을 만들어야 합니다. 화면 이동과 기능 권한은 성격이 달라 따로 두었습니다.

## D-03. 권한 체계를 바꾸는 기능의 사용 범위

**결정**

- **SUPER_ADMIN 전용(`@RequireSuperAdmin`)**: 역할 생성 · 이름 변경 · 순서 변경 · 삭제, 권한 코드 목록(`GET /action-codes`), ACTION 저장(`POST /access/save`), 역할별 권한 저장(`POST /access-role/save`). 전체 목록은 `access-control-guide.md` 2장.
- 접근 관리 · 권한별 접근 권한 관리 화면은 프론트에서 SUPER_ADMIN에게만 표시합니다. 두 화면의 조회 API는 `@RequireAction`입니다 (`ACCESS_READ`, `ACCESS_ROLE_READ_ALLOWED`, `ACCESS_ROLE_READ_DENIED`).
- **SUPER_ADMIN은 권한 설정 대상에서 제외**합니다. 권한별 접근 권한 관리 화면의 역할 목록에서 빼고, `/access-role/save`에 `ROLE_SUPER_ADMIN`이 오면 `ACTION_ROLE_PROTECTED`(409)로 거부합니다. SUPER_ADMIN은 항상 모든 권한을 가집니다.
- 그 외 기능은 모두 `@RequireAction`으로 두어 관리자가 필요한 역할에 부여할 수 있게 합니다. SUPER_ADMIN 전용을 새로 추가할 때는 이 원칙(권한 체계 자체를 바꾸는 기능만)에 맞는지 먼저 검토합니다.

**이유**: 권한 설정과 ACTION 관리를 할 수 있는 사람이 실제 권한을 정합니다. 하위 관리자가 자기 역할에 권한을 추가할 수 있으면 그대로 권한 상승이 됩니다. 일반 `@RequireAction`을 붙이면 그 권한을 다른 역할에 부여할 수 있게 되므로, 부여할 수 없는 `@RequireSuperAdmin`을 따로 만들었습니다.

## D-04. 권한 설정 API의 URL (보류)

`/access-role/allowed?roleId=`, `/access-role/denied?roleId=`, `POST /access-role/save`를 그대로 씁니다. 역할 자원 기준(`/roles/{roleId}/actions`, 저장은 `PUT`)이 더 정확하지만, 동작에 문제가 없고 백엔드 · 프론트를 함께 바꿔야 해서 보류했습니다. ACCESS_ROLE API를 크게 손볼 때 다시 검토합니다.

## D-05. MENU 테이블 공동 사용

ACCESS 모듈도 MENU를 씁니다 (ACTION의 `TOP_MENU_ID` · `MID_MENU_ID` · `BTM_MENU_ID`, 메뉴 이름 표시). 메뉴 모듈 설계(`menu-design.md`)를 따르기로 하고 종료했습니다.

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| 메뉴 목록 API | 메뉴 모듈의 `GET /menus` (D-07) | MENU를 읽는 곳을 한 곳으로 |
| 정렬 컬럼 | `MENU_ORDER` (`ORDER`, `TO`는 Oracle 예약어라 `MENU_ORDER`, `MENU_URL`로 변경) | — |
| 메뉴 삭제 | **물리 삭제.** 하위 메뉴가 있거나 ACTION이 가리키면 삭제 거부 (`MENU_HAS_CHILDREN` · `MENU_IN_USE`). 숨기기는 `USE_YN`. `DEL_YN` 컬럼은 삭제함 (2026-11-13) | 삭제 거부로 참조를 지킬 수 있고, 논리 삭제는 모든 조회에 조건을 붙여야 해 빠뜨리기 쉬움 |
| ACTION의 메뉴 컬럼 | **3개 유지** | 권한별 접근 권한 관리 화면의 대 · 중 · 소 필터와 메뉴 삭제 검사에 그대로 쓸 수 있음. 메뉴를 옮길 때 어긋나는 문제는 D-10으로 해결. 하나로 줄이면 ACCESS 매퍼 · 화면을 크게 고쳐야 함 |

## D-06. 성공 메시지

응답에 성공 메시지를 넣지 않고 프론트가 문구를 표시합니다. 공통 응답(`ApiResponse`)에 성공 메시지 필드가 없고, 문구를 바꿀 때 백엔드 배포가 필요 없습니다.

---

아래 D-07 ~ D-12는 ACCESS 담당자가 모듈에서 손을 뗀 뒤 ROLE 담당자가 정리한 결정입니다 (`feature/access-cleanup`, PR #51, 2026-11-12).

## D-07. 접근 관리 메뉴 목록을 `GET /menus`로

**결정**: ACCESS 모듈의 `GET /access/menus`를 삭제하고, 접근 관리 화면은 메뉴 모듈의 `GET /menus` 응답의 `menus`를 씁니다. 대메뉴는 `parentId === null`로 판단합니다.

**이유**

- MENU 구조는 계속 바뀝니다(`ORDER` → `MENU_ORDER` 이름 변경, `DEL_YN` 삭제, 메뉴 이동). MENU 목록을 조회하는 SQL이 두 모듈에 있으면 매번 같이 고쳐야 합니다. (ACCESS 목록의 메뉴 이름 표시 · 정렬용 JOIN은 남아 있으므로, MENU 컬럼 이름이 바뀌면 함께 고칩니다.)
- 권한 영향이 없습니다. 접근 관리 화면은 SUPER_ADMIN 전용이고, SUPER_ADMIN은 `MENU_READ`를 항상 통과합니다.
- 드롭다운이 사이드바 · 메뉴 관리 화면과 같은 순서로 나옵니다.

**채택하지 않은 방식**: `/access/menus`를 두고 SQL의 `DEL_YN` 조건만 지우기. 작업은 가장 작지만 MENU 목록을 조회하는 곳이 두 곳으로 남습니다.

## D-08. `ROLE_ACTION_ID`를 팀 PK 규칙으로

**결정**: `ROLE_ACTION_ID`를 `'RA-' || TO_CHAR(SYSDATE, 'YYYYMMDD-') || LPAD(SEQ_ROLE_ACTION_PK.NEXTVAL, 6, '0')`로 만들고, 권한 저장은 **한 행씩 INSERT** 합니다. (`ROLE_ID`, `ACTION_ID`)에 UNIQUE 제약 `UK_ROLE_ACTION`이 있습니다.

**이유**

- 다른 테이블은 모두 `접두어-YYYYMMDD-000001` 규칙입니다 (ACTION `AC-`, MENU `MN-`, MENU_ROLE `MR-`). 예전에는 `SYS_GUID` 앞 20자를 썼습니다.
- **`INSERT ALL`에 시퀀스를 쓰면 안 됩니다.** Oracle은 `INSERT ALL`에서 원본 행 하나당 `NEXTVAL`을 한 번만 증가시켜, 한 번에 저장하는 모든 행이 같은 ID를 받습니다 (PK 중복).
- 역할 하나의 권한은 수십 건 이하라 반복 INSERT의 비용은 무시할 수준입니다. 메뉴 모듈의 `MENU_ROLE` 저장과 같은 방식입니다.

예전 GUID 행은 그대로 둬도 됩니다. 권한 저장은 그 역할의 행을 모두 지우고 다시 넣으므로, 역할별로 한 번 저장하면 새 형식으로 바뀝니다.

## D-09. ACTION 저장 시 메뉴 경로 확인

**결정**: `POST /access/save`는 저장하기 전에 모든 ACTION의 메뉴가 대 > 중 > 소로 이어지는지 확인하고, 하나라도 틀리면 `ACTION_MENU_INVALID`(400)로 거부합니다(아무것도 저장하지 않음).

- 확인은 메뉴 모듈의 `MenuService.checkAndLockMenuPath(top, mid, btm)`로 합니다. ACCESS 매퍼는 경로 확인을 위해 MENU를 직접 조회하지 않습니다 (D-07과 같은 이유). ACCESS 매퍼가 MENU를 읽는 곳은 목록의 메뉴 이름 표시 · 정렬용 JOIN뿐입니다.
- 확인하면서 소메뉴 행을 `SELECT ... FOR UPDATE`로 잠급니다. 메뉴 삭제(`DELETE /menus/{menuId}`)도 같은 행을 잠근 뒤 ACTION 참조를 검사하므로, 둘이 동시에 일어나도 없는 메뉴를 가리키는 ACTION이 생기지 않습니다.
- 여러 ACTION을 한 번에 저장할 때는 소메뉴 ID 순서로 잠가 교착 상태를 피합니다.

**이유**: MENU · ACTION 사이에 FK가 없어서(의도된 설계), 화면을 거치지 않은 요청이나 화면을 열어 둔 사이 메뉴가 바뀐 경우 없는 메뉴나 계층이 맞지 않는 조합이 저장될 수 있습니다. ACTION의 메뉴 컬럼은 화면 필터와 메뉴 삭제 검사에 쓰이므로 틀리면 안 됩니다.

## D-10. 메뉴 이동 시 ACTION 메뉴 갱신

메뉴를 다른 상위 메뉴로 옮길 때(`PUT /menus/{menuId}/parent`, `menu-design.md` 4-7) 서버가 ACTION의 메뉴 컬럼도 함께 고칩니다.

| 옮긴 메뉴 | ACTION에서 바꾸는 것 |
| --- | --- |
| 소메뉴 | `BTM_MENU_ID` = 옮긴 메뉴인 행의 `MID_MENU_ID` · `TOP_MENU_ID` |
| 중메뉴 | `MID_MENU_ID` = 옮긴 메뉴인 행의 `TOP_MENU_ID` |

**결정 1: ACTION 수정은 ACCESS 모듈이 제공하는 메서드를 메뉴 모듈이 호출합니다.** 테이블을 고치는 SQL은 그 테이블의 담당 모듈에만 둡니다. 메뉴 모듈의 트랜잭션 안에서 호출되므로 이동과 ACTION 갱신이 함께 반영되거나 함께 취소됩니다.

- 구현: `AccessDao.updateActionMenusByBtmMenuId` · `updateActionTopMenuByMidMenuId` (SQL은 `AccessDaoMapper.xml`)를 `MenuServiceImpl.moveMenu`가 호출합니다.
- 서비스(`AccessService`)가 아니라 DAO를 쓰는 이유: `AccessServiceImpl`이 ACTION 저장 시 `MenuService.checkAndLockMenuPath`를 쓰므로, 메뉴 서비스가 ACCESS 서비스를 주입하면 순환 의존이 되어 서버가 시작되지 않습니다. SQL이 ACCESS 모듈에 있다는 결정의 목적은 그대로 지켜집니다.

**결정 2: 메뉴 이동 권한은 `MENU_UPDATE`입니다.** 이동이 바꾸는 것은 ACTION의 메뉴 컬럼뿐이고, 권한 코드 · 권한 부여 · 권한 캐시는 바뀌지 않습니다. D-03의 SUPER_ADMIN 전용 원칙(권한 체계를 바꾸는 기능)에 해당하지 않습니다. 나중에 바꿔야 하면 이동 API에 `@RequireSuperAdmin`만 붙이면 됩니다.

**이유**: 이 기능이 없으면 메뉴를 옮기려고 삭제 후 다시 만들어야 하고, ACTION이 가리키는 메뉴는 삭제가 거부되며, ACTION의 메뉴를 바꾸는 저장은 SUPER_ADMIN 전용이라 메뉴 구조 변경이 사실상 SUPER_ADMIN 작업이 됩니다.

## D-11. ACTION 목록 정렬

**결정**: 접근 관리 목록과 권한별 접근 권한 관리의 허용 · 미허용 목록을 대 → 중 → 소 메뉴 순서(`MENU_ORDER`), 같은 메뉴 안에서는 권한명 순으로 정렬합니다. 각 단계의 순서 뒤에 메뉴 ID를 붙여, 순서가 같거나 비어 있는 메뉴도 같은 메뉴끼리 모이게 합니다.

**이유**: 예전 정렬(`ACTION_ID` 역순, 메뉴 ID 순)은 "등록한 순서"라 의미가 없었습니다. 메뉴 관리 화면 · 사이드바와 같은 순서여야 찾기 쉽습니다.

## D-12. 쓰이지 않는 권한 코드

**상황**: `@RequireAction` API를 지우거나, `domain` · `action` 이름을 바꾸거나, 어노테이션을 `@RequireSuperAdmin` 등으로 바꾸면 ACTION에 쓰이지 않는 권한 코드가 남습니다. 접근 관리 화면에는 "(미사용)"으로 표시됩니다(`ActionCodeRegistry.contains`). 당장 동작에는 영향이 없지만, **같은 이름으로 API를 다시 만들면 예전에 부여된 역할이 그 API를 바로 쓸 수 있게 됩니다.**

**결정**: 서버 시작 시 경고 로그(`UnusedActionCodeReporter`, WARN)만 남기고, 삭제는 사람이 확인한 뒤 SQL로 합니다. 정리 방법은 `access-control-guide.md` 6장 "권한 코드를 바꾸거나 없앨 때"에 있습니다.

**채택하지 않은 방식**

| 방식 | 이유 |
| --- | --- |
| 접근 관리 화면에 삭제 기능 | 공용 개발 DB에서는 아직 머지되지 않은 다른 브랜치의 코드도 "(미사용)"으로 보여 잘못 지울 수 있음. 자주 생기면 다시 검토 (미사용 코드만, 부여된 역할을 확인 창에 표시) |
| 서버 시작 시 자동 삭제 | 다른 브랜치의 코드를 지울 수 있고, 배포를 되돌리면 지운 권한 부여는 복구할 수 없음 |
| 권한 코드를 바꾸는 PR마다 정리 SQL을 넣는 규칙 | 드문 일에 매번 SQL을 맡기는 부담 대비 효과가 작음 |

---

## 남은 일 (2026-11-13 기준)

| 일 | 내용 |
| --- | --- |
| 미사용 권한 코드 (보류) | `MENU_READ_DETAIL`(1개 역할에 부여), `MENU_READ_PERMISSION`(2개 역할에 부여)이 ACTION에 남아 있습니다. 어느 원격 브랜치에서도 쓰지 않는 것을 확인했지만 일부러 남겨 둡니다 (서버 시작 시 `UnusedActionCodeReporter` 경고만 나옴). 지울 때는 `access-control-guide.md` 6장의 SQL로 지우고 서버를 재시작합니다 |
| 오래된 원격 브랜치 | `dev`를 받지 않은 브랜치(2026-11-13 기준 원격 브랜치 19개)에는 `MENU.DEL_YN`을 조회하는 예전 `GET /access/menus`가 남아 있어, 그 브랜치로 띄우면 접근 관리 화면의 메뉴 조회가 실패합니다. 작업 중인 브랜치는 `dev`를 머지합니다 |

## 참고

### 코드 주석의 예전 요청 번호

| 주석 | 뜻 |
| --- | --- |
| `R-09` (`AccessVO`) | ACTION 등록을 `ACTION_CODE`(권한 코드 목록에서 선택) 기반으로 바꾼 작업. `ACTION_CODE`는 등록 때만 저장하고 수정하지 않음 |
| `R-10` (`AccessRoleServiceImpl`) | 권한 저장 후 그 역할의 권한 캐시를 비우는 호출 (D-01) |

### 다른 모듈과 맞물리는 곳

- `AccessRole.jsx`가 권한 관리 화면의 `role/roleUtils.js`에서 `SUPER_ADMIN_ROLE_ID`를 가져다 씁니다. 이름 · 위치를 바꿀 때 함께 고칩니다.
- 역할 삭제(`DELETE /roles/{roleId}`)는 같은 트랜잭션에서 그 역할의 `ROLE_ACTION` · `MENU_ROLE` 행을 지우고 권한 캐시를 비웁니다.
- ACTION은 MENU를 FK 없이 가리킵니다. 참조는 메뉴 삭제 거부(`MENU_IN_USE`, D-05)와 ACTION 저장 시 경로 확인(D-09)으로 지킵니다.
