# 메뉴 관리 화면 · 메뉴 기반 사이드바 · URL 접근 제한 설계

- 대상 화면: `시스템 관리 > 메뉴 관리` (`/admin/system/menu`), 사이드바(`SideMenu.jsx`), 모든 화면의 URL 접근
- 담당: ROLE 모듈 담당자
- 작성일: 2026-11-10
- 상태: 설계 확정. 메뉴 관리 화면(상위 메뉴 변경 포함) · 사이드바 · 가드 구현 완료

이 문서는 메뉴 관리 화면 · 사이드바 · 가드의 설계이자 현재 구현 기준입니다. 새 화면을 메뉴에 등록하는 순서는 `frontend/docs/page-guide.md`에 있습니다. API · 테이블은 `backend/docs/design/menu-design.md`, API 호출 규칙은 `frontend/docs/api-client-guide.md`, 버튼 권한은 `frontend/docs/permission-guide.md`를 함께 보세요.

---

## 1. 확정된 결정

| 항목 | 결정 |
| --- | --- |
| 역할 분담 | **메뉴(`MENU_ROLE`)는 사이드바 표시와 URL 접근**, **권한 코드(`ROLE_ACTION`)는 버튼 · API**. 화면 안의 버튼은 지금처럼 `can()`으로 따로 숨겨야 합니다 |
| 메뉴 단계 | 대메뉴 = 사이드바 섹션 제목(Main / My Page / System Management), 중메뉴 = 접히는 그룹, 소메뉴 = 링크 |
| 사이드바 데이터 | `menuData.js`(고정 데이터) 대신 `GET /menus/me` 결과를 씁니다 |
| 저장 후 반영 | 메뉴 관리에서 저장 · 삭제 · 순서 변경에 성공하면 내 메뉴를 다시 받아 **내 사이드바에 바로 반영**. 다른 사용자는 새로고침 · 재로그인 때 반영 |
| URL 선택 | **라우터에 표시한 경로만** 드롭다운으로 고릅니다 (5장) |
| URL 매칭 | 메뉴에 없는 URL은 **가장 긴 접두어**의 메뉴 권한을 따릅니다. 예: `/admin/course/list/123` → "과정 목록" |
| 어느 메뉴에도 속하지 않는 URL | **SUPER_ADMIN만** 열 수 있습니다. 예외: `/`(대시보드), `/login` |
| 팝업 (`/popup/...`) | 같은 가드를 적용합니다. 소속 메뉴는 라우트에 직접 적습니다 (5-2) |
| 메뉴를 받는 중 | 아무것도 그리지 않습니다 |
| 비로그인 | 가드 대상 URL이면 `/login`으로 이동 |
| SUPER_ADMIN | `MENU_ROLE`과 관계없이 모든 메뉴 표시 · 접근. **미사용 메뉴도** 사이드바에 흐리게 "(미사용)"으로 표시하고 접근 가능. 메뉴 관리 화면의 SUPER_ADMIN 체크박스는 **체크된 채로 비활성화** |
| 자기 잠금 방지 | SUPER_ADMIN이 아닌 관리자가 메뉴 관리 메뉴(와 상위 메뉴)에서 본인 역할 해제 · 미사용 · URL 변경 · 삭제를 하면 서버가 거부 (`MENU_SELF_LOCK`). 화면은 안내 문구와 서버 메시지 알림 (6-4) |
| 접근 거부 | 화면 전체에 "권한이 없습니다" (권한 관리 화면과 같은 방식) |
| 순서 변경 | 표준 `Table`의 순서 바꾸기(손잡이 끌기 · ↑ ↓ 키). **같은 상위 메뉴 안에서만.** 여러 열을 바꾼 뒤 [순서 저장]으로 한 번에 (2026-11-17) |
| UI 부품 | 표준 UI(`common/ui`, `frontend/docs/ui-style-guide.md` 8장 "화면 예시" › 메뉴 관리)를 씁니다 (6-1) |
| 동시 수정 | 수정 요청에 화면이 받은 `mdfyDt`를 보내고, 다른 사람이 먼저 저장했으면 서버가 거부 (`MENU_OUTDATED`) |
| 저장 안 한 변경 | 다른 메뉴 선택 · 다른 화면 이동 · 새로고침 모두 확인 창 (6-4) |
| 메뉴 이름 | 같은 상위 메뉴 안에서 중복 불가 (`MENU_TITLE_USED`) |
| 상위 메뉴 변경 | 중 · 소메뉴 상세의 "상위 메뉴" 드롭다운으로 옮깁니다 (6-6). 다른 수정과 따로 저장 |

---

## 2. 이 설계로 막을 수 있는 것과 없는 것

"과정 등록" 화면(`/admin/course/add`)에 STUDENT가 들어가면 403 알림이 세 번 뜨고 화면이 보이던 문제 기준입니다.

| 상황 | 결과 |
| --- | --- |
| 메뉴에서 허용되지 않은 화면 URL을 직접 입력 | **막힘.** 가드가 `<Outlet />` 위에서 막으므로 `CourseMain` 등 화면 컴포넌트가 아예 그려지지 않고, 알림도 뜨지 않습니다 |
| 화면 컴포넌트를 고치지 않아도 되는지 | **고치지 않아도 됩니다.** 라우터와 레이아웃만 바뀝니다 |
| 라우트의 `loader` | **막지 못합니다.** `loader`는 화면보다 먼저 실행됩니다. 지금은 `/admin/course/list`의 index `loader`(`getCourses`)가 해당합니다. 서버가 403으로 막으므로 데이터는 새지 않지만, 오류 화면이 보일 수 있습니다 |
| 메뉴는 허용됐는데 API 권한이 없음 | 막지 못합니다. 메뉴와 권한 코드는 따로 설정하므로, 관리자가 두 설정을 맞춰야 합니다 |
| 화면 안의 특정 버튼 | 막지 못합니다. 각 담당자가 `can()`으로 숨겨야 합니다 |

### 브레드크럼 · 화면 제목

메뉴 화면의 브레드크럼과 화면 제목은 DB 메뉴 이름을 따릅니다 (7-3, 2026-11-13). 메뉴 관리에서 이름을 바꾸거나 옮기면 사이드바와 함께 바로 바뀝니다. 라우트의 `crumb`은 메뉴에 없는 화면 · 상세 화면 표시와 메뉴 URL 선택지 이름에 씁니다.

---

## 3. 현재 상태

| 대상 | 상태 |
| --- | --- |
| 백엔드 `/menus` API | 구현 완료 (`backend/docs/design/menu-design.md`) |
| `components/admin/system/menu/Menu.jsx` | 메뉴 관리 화면 구현 완료 (9장 3단계) |
| 라우트 `handle.menu` | 메뉴 관리 URL 선택지용으로 표시 완료. `routes` export 완료 |
| `components/menu/SideMenu.jsx` | 내 메뉴(`menuSliceStore`)를 그림 (9장 4단계 완료). 조회는 `MainLayout`이 로그인 시 시작. `menuData.js` 삭제 |
| `components/menu/MenuGuard.jsx` | 가드 구현 완료 (9장 5단계). `MainLayout`의 `<Outlet />`과 숙제 팝업을 감쌈 |
| `router/MainRouterProvider.jsx` | `handle.menu` 표시 완료. `guardAs`: 숙제 팝업(`/admin/course/list`), `/my/course` index(`/my/course/list`) |
| 라우트 · 메뉴 등록 | "메뉴 관리" 라우트 등록 완료. 메뉴 항목은 DB(메뉴 관리 화면)에 등록되어 있음 (백엔드 문서 2-5) |

---

## 4. API

`src/api/admin/system/menu/menuApi.js`의 함수입니다. 성공하면 `body`, 실패하면 `ApiError`.

| 함수 | 요청 | 반환 (`body`) | 주요 errorCode |
| --- | --- | --- | --- |
| `getMyMenus(options)` | `GET /menus/me` | `{ superAdmin, menus, guardUrls }` | `GLOBAL_UNAUTHORIZED` |
| `getMenus(options)` | `GET /menus` | `{ roles, menus }` | — |
| `createMenu(menu)` | `POST /menus` | 메뉴 1건 | `GLOBAL_INVALID_PARAMETER`, `MENU_NOT_EXISTS`, `MENU_PARENT_INVALID`, `MENU_URL_USED`, `MENU_TITLE_USED`, `MENU_ROLE_INVALID` |
| `modifyMenu(menuId, menu)` | `PUT /menus/{menuId}` (`menu`에 `mdfyDt` 포함) | 메뉴 1건 | `GLOBAL_INVALID_PARAMETER`, `MENU_NOT_EXISTS`, `MENU_URL_USED`, `MENU_TITLE_USED`, `MENU_ROLE_INVALID`, `MENU_OUTDATED`, `MENU_SELF_LOCK` |
| `modifyMenuOrder(parentId, menuIds)` | `PUT /menus/order` | `{ roles, menus }` | `MENU_ORDER_INVALID`, `MENU_ORDER_OUTDATED`, `MENU_NOT_EXISTS` |
| `deleteMenu(menuId)` | `DELETE /menus/{menuId}` | 메뉴 1건 | `MENU_NOT_EXISTS`, `MENU_HAS_CHILDREN`, `MENU_IN_USE`, `MENU_SELF_LOCK` |
| `moveMenu(menuId, parentId, mdfyDt)` (6-6) | `PUT /menus/{menuId}/parent` | `{ roles, menus }` | `MENU_MOVE_INVALID`, `MENU_NOT_EXISTS`, `MENU_TITLE_USED`, `MENU_OUTDATED`, `MENU_SELF_LOCK` |

메뉴 객체 필드: `id`, `title`, `parentId`, `menuOrder`, `useYn`, `spread`, `menuUrl`, `roleIds`, `crtDt`, `mdfyDt`. `getMyMenus`의 메뉴에는 `roleIds` · 날짜가 없습니다. `getMyMenus`의 `useYn`은 SUPER_ADMIN만 `N`을 받을 수 있습니다.

- `spread`: 항상 `Y` 또는 `N`. 대 · 소메뉴는 서버가 `N`으로 저장하므로 의미가 없습니다 (화면에서는 중메뉴만 펼침 체크박스 표시).
- `menuUrl`: 소메뉴만 값이 있고 100자 이하입니다.
- `crtDt`, `mdfyDt`: `YYYY-MM-DD HH:mm:ss` 문자열. `mdfyDt`는 수정 요청에 **받은 값 그대로** 돌려보냅니다 (화면 표시만 분까지 잘라도 됨).

권한 코드: 화면 `MENU_READ`, 추가 `MENU_CREATE`, 저장 · 순서 변경 `MENU_UPDATE`, 삭제 `MENU_DELETE`.

---

## 5. 라우터 표시와 URL 접근 제한 (가드)

### 5-1. 메뉴로 고를 수 있는 경로 표시

메뉴 관리 화면이 "실제로 있는 화면"만 고르게 하려고, 라우트의 `handle`에 표시합니다.

```jsx
{ path: "add", element: <CourseAdd />, handle: { crumb: "과정 등록", menu: true } },
```

- `menu: true`를 붙일 수 있는 라우트: 파라미터(`:id`)가 없고 화면이 있는 경로.
- 사이드바 메뉴로 쓰는 화면 라우트에 모두 붙입니다. 대시보드도 포함합니다: `{ index: true, element: <Main />, handle: { crumb: "Dashboard", menu: true } }`.
- `router/routeUtils.js`의 `getMenuUrlOptions(routes)`가 라우트 트리를 돌며 `menu: true`인 경로의 전체 URL을 모읍니다. index 라우트는 상위 경로(대시보드는 `/`)로 계산합니다. 이를 위해 `MainRouterProvider.jsx`의 라우트 배열을 `routes`로 따로 export 합니다.
- 대시보드(`/`)는 메뉴로 등록하지만 가드는 항상 통과시킵니다 (5-3의 1번). 그래서 Dashboard 메뉴의 역할 체크는 **사이드바 링크 표시에만** 영향을 줍니다 (역할을 빼면 링크만 사라지고 `/`는 계속 열림).

### 5-2. 소속 메뉴 직접 지정

접두어로 메뉴를 찾을 수 없는 라우트는 `handle.guardAs`에 소속 메뉴 URL을 적습니다.

```jsx
{
  path: "/popup/homework/:courseId/:homeworkId",
  element: <MenuGuard><HomeworkDetails /></MenuGuard>,
  handle: { guardAs: "/admin/course/list" },   // 과정 목록 화면에서 여는 팝업
},
```

- 다른 주소로 보내기만 하는 중간 경로도 같습니다. `/my/course`는 메뉴가 아니어서 가드에 걸리므로, `list`로 보내는 index 라우트에 `guardAs: "/my/course/list"`를 붙였습니다.
- 가장 안쪽 라우트의 `guardAs`가 우선합니다.

### 5-3. 가드 판정 순서 (`MenuGuard`)

1. 경로가 `/` 또는 `/login`이면 통과. 없는 주소(404 라우트, `handle.notFound`)도 통과 (5-6).
2. 비로그인이면 `/login`으로 이동.
3. 내 메뉴 상태가 `idle`/`loading`이면 `StatusBox` loading "메뉴 정보를 불러오는 중...". `failed`면 `StatusBox` error "메뉴 정보를 불러오지 못했습니다." + [다시 시도](사이드바와 같은 `refreshMyMenus`, 2026-11-17).
4. `superAdmin`이면 통과.
5. 판정할 URL: 일치한 라우트 중 가장 안쪽의 `handle.guardAs`, 없으면 현재 `pathname`.
6. `guardUrls`에서 그 URL과 **같거나, 그 URL이 `기준URL + "/"`로 시작하는** 것 중 가장 긴 것을 찾음.
   - 경계 검사가 필요합니다: `/admin/system/access-role`이 `/admin/system/access`에 매칭되면 안 됩니다.
   - `/`는 매칭 후보에서 뺍니다 (모든 URL에 매칭되므로). `/`는 1번에서 처리합니다.
7. 찾지 못하면 거부 (SUPER_ADMIN은 4번에서 이미 통과).
8. 찾았으면 내 메뉴(`menus`)의 `menuUrl`에 그 URL이 있을 때만 통과.

거부되면 `StatusBox type="denied"`("권한이 없습니다.")를 본문에 표시합니다. 사이드바는 그대로 보입니다.

### 5-4. 배치

- `MainLayout.jsx`: `<Outlet />`을 `<MenuGuard><Outlet /></MenuGuard>`로 감쌉니다.
- 팝업 라우트: 5-2처럼 화면을 직접 감쌉니다 (`MainLayout` 밖이라서).
- 내 메뉴 조회(`fetchMyMenus`)는 `MainLayout`이 로그인 시 시작하고(4단계), `MenuGuard`도 시작합니다. 팝업은 `MainLayout` 밖이라 가드가 시작해야 합니다. `idle`일 때만 실행되므로 두 곳에서 불러도 한 번만 조회합니다. 사이드바는 같은 store 값을 읽기만 합니다.

### 5-5. 가드가 막지 않는 것

- **API 호출, 화면 안의 버튼:** 가드는 화면을 여는 것만 막습니다. 데이터는 API 권한(`@RequireAction`)이 막고, 버튼은 화면에서 `can()`으로 확인합니다 (`permission-guide.md`).
- **라우트 loader:** react-router는 loader를 화면보다 먼저 실행하므로 가드보다 먼저 돕니다 (예: `/admin/course/list`의 `getCourses`). loader가 부르는 API는 API 권한으로 막힙니다.
- **없는 경로** (예: `/abc`): 404 라우트가 받아 권한 검사 없이 "페이지를 찾을 수 없습니다"를 표시합니다 (5-6).
- **다른 사람이 바꾼 메뉴 역할:** 내 메뉴는 로그인 · 새로고침 · 내가 메뉴 관리에서 저장할 때만 다시 받습니다. 역할이 빠진 사용자도 새로고침 전까지는 그 화면에 들어갈 수 있습니다.

### 5-6. 없는 주소 · 화면 오류 (2026-11-13)

| 경우 | 처리 | 표시 |
| --- | --- | --- |
| 없는 주소 (`/abc`) | `MainLayout` children 맨 끝의 `path: "*"` 라우트 → `common/error/NotFound.jsx`. `handle.notFound`가 있어 가드가 통과시킴 | 사이드바 유지, `StatusBox type="notFound" size="lg"`: 큰 "404" + "페이지를 찾을 수 없습니다." + [뒤로] [홈으로] |
| 화면 코드 오류 · 라우트 loader 오류 | `MainLayout` 아래의 경로 없는 라우트에 둔 `errorElement` → `common/error/RouteError.jsx` | 사이드바 유지, `StatusBox type="error" size="lg"`: 큰 숫자 + "화면을 불러오지 못했습니다." + [다시 시도]. API 오류는 서버 메시지, 그 외 오류는 개발 환경에서만 "이름: 메시지" 한 줄 (스택은 콘솔) |
| 레이아웃 자체 오류 · 팝업 오류 | `/` 라우트와 팝업 라우트의 `errorElement` (같은 `RouteError`) | 사이드바 없이 오류 화면 |

- 큰 숫자는 오류에 따라 고릅니다: API 오류는 서버가 준 상태 코드(403 · 500 등), 라우터 오류는 그 상태 코드, 화면 코드 오류는 "500". 네트워크 오류(응답 없음)는 숫자 없이 오류 아이콘입니다. 원인과 다른 숫자를 보이지 않기 위해서입니다.
- 표준: `frontend/docs/ui-style-guide.md` 8장 "화면 예시" › 오류 화면. 머리(브레드크럼 · 제목) 없이 상태 상자만 둡니다 (큰 숫자와 제목이 상자 안에 있음). `RouteError.module.css`는 샘플의 통일 전 예시가 쓰고 있어, 그 예시를 지울 때 함께 지웁니다.
- 이전에는 `/` 라우트의 `errorElement`(`404 Not Found` 글자) 하나가 모든 오류를 받아, loader · 화면 오류도 404로 보이고 사이드바가 사라졌습니다.
- 새 라우트는 경로 없는 라우트의 `children`에 추가합니다 (그래야 화면 오류가 나도 사이드바가 남습니다). `path: "*"` 라우트는 항상 맨 끝에 둡니다.

---

## 6. 메뉴 관리 화면 (`/admin/system/menu`)

### 6-1. 사용할 컴포넌트 (표준 UI, 2026-11-17)

| 용도 | 표준 |
| --- | --- |
| 화면 틀 | `PageHeader` (`crumbs` = `useBreadcrumbs()`, 제목 = 브레드크럼 마지막 항목) |
| 권한 확인 중 · 실패 · 권한 없음, 목록 불러오는 중 · 실패 | `StatusBox` (`loading` · `error` · `denied`) |
| 3열 배치 | `layout-3col`. 열마다 `form-stack` 안에 목록 `Panel`(flush) + 상세 `Panel` |
| 목록 | 작은 `Table` (`selectedKey` · `onRowClick` · `isRowMuted`(미사용) · `onReorder`) |
| 순서 저장 바 | `Callout tone="info"` + [되돌리기] [순서 저장] |
| 상세 보기 | `desc-list` + [삭제](`danger`, `btn-start`) [수정] |
| 상세 수정 · 등록 | `Field` + `input.form-control` · `select.form-control`, 사용 · 펼침 · 역할은 `form-check-group` + [취소] [저장 · 등록] |
| 자기 잠금 안내 | `Callout tone="warning"` |
| 확인 창 · 알림 | `useConfirm` · `useToast` |

`Menu.module.css`에는 상세 보기의 라벨 폭(`--desc-label-width`)만 남았습니다.

### 6-2. 화면 구성

```text
[순서가 변경되었습니다: 시스템 관리        [되돌리기] [순서 저장]]   ← 순서를 바꿨을 때만
┌ 대메뉴  3개 [추가]┐┌ 중메뉴 · System…[추가]┐┌ 소메뉴 · 시스템 관리 [추가]┐
│ ⠿ Main          1 ││ ⠿ 과정 관리        2 ││ ⠿ 회원 관리              │
│ ⠿ System Mgmt   4 ││ ⠿ 시스템 관리      6 ││ ⠿ 메뉴 관리              │
└───────────────────┘└───────────────────────┘└──────────────────────────┘
┌ System Management ┐┌ 시스템 관리 [수정 중]┐┌ 메뉴 관리                  ┐
│ ID     MN-2026…   ││ 이름 [           ]   ││ ID     MN-2026…            │
│ 상태   사용        ││ ☑ 사용 ☐ 펼침        ││ 상위 메뉴 System › 시스템  │
│ 역할   관리자 · …  ││ 역할 ☑ 최고 관리자(고정)│ URL    /admin/system/menu  │
│ [삭제]      [수정] ││        [취소] [저장] ││ [삭제]               [수정]│
└───────────────────┘└───────────────────────┘└────────────────────────────┘
```

- 위: 목록 패널(작은 `Table`). 아래: 선택한 메뉴의 상세 패널. 상위 메뉴를 고르지 않은 열은 목록에 "상위 메뉴를 고르세요."만 보이고, 고른 메뉴가 없으면 상세에 "메뉴를 고르세요."가 보입니다.
- 버튼은 성격에 따라 두 곳에 둡니다: **목록에 대한 일([추가])은 목록 패널 머리**, **선택한 메뉴에 대한 일은 상세 패널 바닥**. 상세는 **보기 ↔ 수정** 두 상태입니다 (환경 변수 관리 화면과 같은 규칙).

| 열의 상태 | 목록 머리 | 상세 패널 |
| --- | --- | --- |
| 아무것도 선택 안 함 | [추가] | "메뉴를 고르세요." |
| 메뉴 선택 (보기) | [추가] | `desc-list` + [삭제] [수정] |
| 수정 중 | [추가] | 입력 칸 + 배지 "수정 중" + [취소] [저장] ([저장]은 바뀐 게 있을 때만) |
| 새 메뉴 입력 중 (`new`) | [추가] | 입력 칸 + 배지 "등록 중" + [취소] [등록] |
| 저장하지 않은 순서가 있음 | [추가] 비활성 | [삭제] [수정] 비활성 (이유: "순서를 저장하거나 되돌린 뒤 할 수 있습니다.") |
| 저장 · 삭제 · 순서 저장 중 (`saving`) | 같은 버튼, 비활성 | 같은 버튼, 비활성 (진행 중인 버튼은 "저장 중...") |

- [추가]는 그 열이 활성일 때만 보입니다 (대메뉴 열은 항상, 중 · 소메뉴 열은 상위 메뉴를 골랐을 때). 권한 조건은 6-5.
- 대메뉴를 고르면 중메뉴 열에 그 하위가, 중메뉴를 고르면 소메뉴 열에 그 하위가 나옵니다. 상위 선택이 바뀌면 오른쪽 열의 선택은 풀립니다.
- 목록의 "하위" 칸(대 · 중메뉴 열)은 하위 메뉴 수입니다.
- 미사용(`useYn = 'N'`) 메뉴는 목록에서 흐리게(`isRowMuted`) 표시하고 이름 뒤에 "(미사용)"을 붙입니다. 상세 보기에는 배지 "미사용".
- 소메뉴의 `menuUrl`이 라우트에 없으면(`getMenuUrlOptions(routes)`에 없음) 목록 이름 뒤와 상세 보기 URL 옆에 ⚠ "화면이 없는 URL입니다. URL을 다시 고르세요."를 붙입니다.
- 역할 체크박스 순서는 역할 순위 순서(`roles` 그대로)입니다.

### 6-3. 상태 설계

| 상태 | 내용 |
| --- | --- |
| `listStatus`, `listError` | `getMenus` 결과 상태 |
| `roles`, `menus` | `getMenus` 결과 (평평한 목록) |
| `selectedIds` | `{ top, mid, btm }` 열별 선택 메뉴 ID |
| `forms` | 열별 상세 입력값 `{ mode: "view" \| "new", id, parentId, title, useYn, spread, menuUrl, roleIds, crtDt, mdfyDt }` (`new` 모드는 [취소] 때 돌아갈 `prevId` 포함) |
| `formErrors` | 열별 입력 오류 |
| `editing` | `{ top, mid, btm }` 열별 수정 중인지 (보기 ↔ 수정). `new` 모드는 늘 수정 중 |
| `orderDraft` | 저장하지 않은 순서 `{ 상위 메뉴 ID(대메뉴는 "ROOT"): 메뉴 ID 목록 }`. 바뀐 열만 들어 있음 |
| `saving` | 저장 · 삭제 · 순서 저장 진행 중 (버튼 비활성) |

열 목록은 `menus`에서 `parentId`로 걸러서 `menuOrder`로 정렬해 계산하고, `orderDraft`에 그 열이 있으면 그 순서로 보여 줍니다.

### 6-4. 기능별 상세

#### 추가

- 목록 머리의 [추가]. 대메뉴 열은 항상, 중 · 소메뉴 열은 상위 메뉴를 골랐을 때만 보입니다.
- 누르면 그 열의 상세가 빈 입력(`mode: "new"`, 사용 체크, 펼침 해제, 역할 없음)이 됩니다. 저장하면 `createMenu`.
- 그 열에 저장하지 않은 변경이 있으면, 다른 메뉴를 고를 때와 같은 확인 창을 먼저 띄웁니다 (아래 "저장하지 않은 변경사항").
- 새 메뉴는 같은 상위 메뉴의 맨 뒤에 들어갑니다.

#### 수정 (보기 → 수정)

- 상세 보기의 [수정]으로 입력 칸이 됩니다. [취소]는 입력값을 마지막 저장 값으로 되돌리고 보기로 돌아갑니다. 저장에 성공해도 보기로 돌아갑니다.
- 다른 메뉴를 고르거나 [추가]를 누르면 그 열과 오른쪽 열은 보기 상태가 됩니다.

#### 저장

- `mode`가 `new`면 `createMenu`, 아니면 `modifyMenu`. 성공 알림은 토스트 "등록했습니다." · "저장했습니다."
- 입력 검사(백엔드와 같은 규칙): 이름 필수 · 100자 이하, 소메뉴 URL 필수. 같은 열에 같은 이름(앞뒤 공백 제외)이 있으면 저장 전에 이름 칸에 "같은 상위 메뉴에 이미 같은 이름의 메뉴가 있습니다." 표시 (서버의 `MENU_TITLE_USED`도 같은 칸에 표시).
- 수정은 화면이 받은 `mdfyDt`를 함께 보냅니다.
- 성공하면 `getMenus` 다시 조회 + 저장한 메뉴 선택 + 내 메뉴 다시 조회(7장).
- 대 · 중메뉴를 저장했을 때, 그 아래에 사이드바에 보일 소메뉴가 없으면 성공 알림에 "소메뉴를 추가해야 사이드바에 표시됩니다."를 덧붙입니다 (사이드바는 소메뉴가 없는 그룹 · 섹션을 그리지 않으므로, 저장이 실패한 것처럼 보이지 않게).
- `MENU_OUTDATED`면 서버 메시지 알림 → `getMenus` 다시 조회 → 같은 메뉴를 선택한 채 입력값을 서버 값으로 바꿉니다 (내가 입력한 값은 버려짐).

#### 취소

- 입력값을 마지막 저장 값으로 되돌립니다. `new` 모드면 상세를 비우고 이전 선택으로 돌아갑니다.

#### 삭제

- 상세 보기의 [삭제] → 확인 창("'이름' 메뉴를 삭제할까요?", 빨간 [삭제]) → `deleteMenu` → 토스트 "삭제했습니다."
- `MENU_HAS_CHILDREN` · `MENU_IN_USE`는 서버 메시지를 그대로 알림으로 표시.

#### 저장하지 않은 변경사항

- 입력을 바꾼 상태에서 다른 메뉴를 고르거나 상위 선택을 바꾸면 확인 창(`useConfirm`, "저장하지 않은 변경사항이 있습니다. 이동할까요?", [이동])을 띄웁니다.
- 다른 화면으로 이동(사이드바, 뒤로 가기)할 때도 같은 확인 창을 띄웁니다: react-router의 `useBlocker`(데이터 라우터인 `createBrowserRouter`라서 사용 가능).
- 새로고침 · 창 닫기는 `beforeunload`로 브라우저 기본 확인 창을 띄웁니다 (문구는 브라우저가 정함).
- "입력을 바꾼 상태" 판단: 열마다 현재 입력값과 마지막 저장 값이 다르거나 `new` 모드인 경우. 다른 화면 이동 · 새로고침은 **저장하지 않은 순서**가 있을 때도 확인합니다 (다른 메뉴를 고르는 것은 순서와 상관없이 자유).

#### 순서 변경

- 표준 `Table`의 순서 바꾸기: 손잡이(⠿)를 끌거나 손잡이에서 ↑ ↓ 키. 같은 열(같은 상위 메뉴) 안에서만.
- **바로 저장하지 않습니다.** 위에 "순서가 변경되었습니다: 바뀐 목록 이름" 바(`Callout`)가 나오고, 여러 열 · 여러 번 옮긴 뒤 [순서 저장]으로 한 번에 저장합니다 (역할 관리와 같은 규칙, 2026-11-17). 원래 순서로 되돌리면 그 열은 바에서 빠집니다.
- [순서 저장] → `modifyMenuOrder([{ parentId, menuIds }, …])` (바뀐 열만). 서버는 모두 검사한 뒤 저장하고 하나라도 거부되면 아무것도 바꾸지 않습니다 (백엔드 4-4). 성공하면 응답으로 목록 교체 + 내 메뉴 다시 조회 + 토스트 "순서를 저장했습니다."
- [되돌리기]는 저장된 순서로 돌아갑니다.
- 저장하지 않은 순서가 있는 동안 [추가] · [수정] · [삭제]는 비활성입니다 (저장 뒤 받은 목록이 저장하지 않은 순서를 덮어쓰므로). 반대로 상세를 수정 · 등록 중이면 손잡이가 숨겨집니다.
- `MENU_ORDER_OUTDATED` · `MENU_NOT_EXISTS`면 서버 메시지 토스트 후 목록 다시 조회 (저장하지 않은 순서는 버려짐).
- 이전에는 놓자마자 그 열만 저장했습니다. 키보드(↑ ↓)로 한 칸씩 옮길 때마다 요청이 가는 문제 때문에 바꿨습니다.

#### URL 선택 (소메뉴만)

- 선택지: `getMenuUrlOptions(routes)` 중 **다른 메뉴가 쓰지 않는** URL. 표시는 `crumb (URL)`.
- 저장된 URL이 선택지에 없으면(라우트가 없어짐) `(등록되지 않은 경로) /xxx`로 맨 위에 보여 줍니다.

#### 역할 체크박스

- SUPER_ADMIN은 항상 체크 · 비활성. 저장할 때 `roleIds`에 넣지 않습니다.
- **상위 메뉴 때문에 실제로는 안 보이는 역할 표시**: 체크되어 있어도 상위 메뉴에서 그 역할이 빠져 있거나 상위 메뉴가 미사용이면, 체크박스 옆에 흐리게 "(상위 메뉴에서 허용 안 됨)"을 붙입니다. 백엔드 3장 규칙과 같은 계산을 `menuUtils.js`에서 `menus`로 합니다. 저장 값은 바꾸지 않습니다 (상위 메뉴를 다시 허용하면 그대로 보이게).

#### 자기 잠금 방지 (메뉴 관리 메뉴)

- 보호 대상: `menuUrl`이 `MENU_MANAGEMENT_URL`(`"/admin/system/menu"`, `menuUtils.js` 상수)인 소메뉴와 그 상위 중 · 대메뉴. 백엔드 `MenuConstants`와 같은 값입니다.
- 내가 SUPER_ADMIN이 아니면, 보호 대상 메뉴의 상세에 `Callout tone="warning"`을 표시합니다: "메뉴 관리 화면이 속한 메뉴입니다. 본인 역할 해제 · 미사용 · URL 변경 · 삭제, 본인 역할이 허용되지 않은 곳으로 옮기기는 저장되지 않습니다."
- 실제 차단은 서버가 합니다. `MENU_SELF_LOCK`이면 서버 메시지를 알림으로 띄우고 입력값은 그대로 둡니다 (사용자가 [취소]로 되돌림).
- 다른 역할의 체크 해제는 그대로 저장됩니다.

### 6-5. 권한별 표시

| 권한 | 없을 때 |
| --- | --- |
| `MENU_READ` | `StatusBox type="denied"` (확인 중이면 `loading` "권한 확인 중...") |
| `MENU_CREATE` | [추가] 숨김 |
| `MENU_UPDATE` | 손잡이 숨김, 상세 보기의 [수정] 숨김 (상위 메뉴 드롭다운도 수정 상태 안에 있으므로 함께 없음) |
| `MENU_DELETE` | [삭제] 숨김 |

### 6-6. 상위 메뉴 변경

> **상태: 구현 완료 (2026-11-13)** (백엔드 문서 4-7). 결정은 2026-11-12.

- 중 · 소메뉴 상세에 "상위 메뉴" 드롭다운(일반 `<select>` + `Menu.module.css`, URL 선택과 같은 방식. 6-1)을 둡니다. 선택지는 한 단계 위의 메뉴 전체(소메뉴 → 모든 중메뉴, 중메뉴 → 모든 대메뉴)이고, 표시는 `대메뉴 > 중메뉴` 경로입니다. 대메뉴 상세에는 표시하지 않습니다.
- **이동은 다른 수정과 따로 저장합니다.** 저장 한 번에 API 하나만 부르게 해서, 일부만 저장되거나 검사(같은 이름, 자기 잠금, `mdfyDt`)가 중간 상태로 이뤄지는 일을 막습니다. 기존 수정 API · 저장 흐름은 바꾸지 않고 이동 기능만 덧붙입니다.
- 잠금 규칙:
  - 다른 칸(이름, 사용 여부, 펼침, URL, 역할)을 하나라도 바꾸면 상위 메뉴 드롭다운을 비활성화하고 "다른 변경을 저장하거나 취소한 뒤 옮길 수 있습니다."를 표시합니다.
  - 상위 메뉴를 바꾸면 다른 칸을 모두 비활성화하고 "저장하면 메뉴를 옮깁니다. 다른 칸은 옮긴 뒤 수정할 수 있습니다."를 표시합니다. 이때 [저장]은 `moveMenu(menuId, parentId, mdfyDt)`(`PUT /menus/{menuId}/parent`)만 부릅니다.
  - [취소]는 두 경우 모두 마지막 저장 값으로 되돌립니다 (잠금도 풀림).
- 옮기면서 이름도 바꿔야 하면 두 번 저장합니다. 새 그룹에 같은 이름이 있으면 저장 전에 드롭다운 아래에 "옮길 상위 메뉴에 같은 이름의 메뉴가 있습니다. 이름을 먼저 바꿔 저장한 뒤 옮기세요."를 표시합니다 (서버의 `MENU_TITLE_USED`도 같은 문구로 표시).
- 저장 전 `Confirm`: "메뉴를 옮기면 이 메뉴를 쓰는 접근 권한(ACTION)의 메뉴도 함께 바뀝니다. 옮길까요?" 왼쪽 열에 저장하지 않은 변경이 있으면 "다른 열의 저장하지 않은 변경사항은 사라집니다."를 덧붙입니다 (옮긴 뒤 왼쪽 열 선택이 새 위치로 바뀌므로).
- 성공하면 목록을 응답으로 교체하고, 옮긴 메뉴가 보이도록 열 선택을 새 위치로 바꾼 뒤 내 메뉴를 다시 조회하고 "메뉴를 옮겼습니다."를 알립니다.
- 상위 메뉴를 바꾸는 중에는 역할 옆의 "(상위 메뉴에서 허용 안 됨)"을 옮길 위치 기준으로 보여 줍니다 (옮긴 뒤 누구에게 보일지 미리 확인).
- 오류: `MENU_MOVE_INVALID`, `MENU_SELF_LOCK`은 서버 메시지 알림 후 선택 유지([취소]로 되돌림). `MENU_OUTDATED`는 알림 후 서버 값으로 바꿈, `MENU_NOT_EXISTS`는 알림 후 목록 다시 조회.
- 권한: `MENU_UPDATE` (2026-11-12 결정). `MENU_UPDATE`가 없으면 드롭다운을 표시하지 않습니다.
- 드래그로 다른 열 · 다른 그룹에 놓는 방식은 쓰지 않습니다 (실수로 옮기기 쉬움).

확인 시나리오는 10장 M32 ~ M38입니다.

---

## 7. 사이드바 (`SideMenu.jsx`)

### 7-1. store: `src/store/slices/menuSliceStore.js`

권한 store(`permissionSliceStore.js`)와 같은 구조로 만듭니다.

| 항목 | 내용 |
| --- | --- |
| 상태 | `{ status, superAdmin, menus, guardUrls, requestId }` (`status`: `idle` / `loading` / `succeeded` / `failed`) |
| `fetchMyMenus` | `status === "idle"`일 때만 실행 (`condition`) |
| `refreshMyMenus` | 조건 없이 다시 조회. 메뉴 관리에서 저장 성공 후 호출. 이전 값은 응답이 올 때까지 유지 (사이드바가 깜빡이지 않게) |
| 로그아웃 | `logout`에서 `idle`로 초기화 |
| 등록 | `store/StoreProvider.jsx`에 `menu` reducer 추가 |

### 7-2. 그리기 규칙

- `menus`를 대(섹션) → 중(그룹) → 소(링크) 트리로 만들어 `menuOrder` 순으로 그립니다.
- 소메뉴가 하나도 없는 중메뉴, 중메뉴가 하나도 없는 대메뉴는 그리지 않습니다.
- `useYn = 'N'`인 메뉴(SUPER_ADMIN만 받음)는 흐리게 표시하고 이름 뒤에 "(미사용)"을 붙입니다. 미사용 중메뉴 아래의 소메뉴도 그대로 보입니다.
- 그룹 펼침
  - 사용자가 직접 펼치거나 접지 않은 그룹은 **매번** 규칙으로 정합니다: `spread = 'Y'`이거나 현재 주소가 들어 있으면 펼침. 메뉴 관리에서 `spread`를 바꾸면 바로 반영됩니다.
  - 사용자가 직접 펼치거나 접은 그룹은 그 상태를 따릅니다. 새로고침 · 로그아웃 · 다른 계정 로그인 때 사라집니다 (`MainLayout`이 사용자 ID로 사이드바에 `key`를 줌).
  - 페이지를 옮겼을 때 새 현재 그룹을 사용자가 접어 둔 상태면 그 기록을 지워 펼칩니다. 지금 보고 있는 페이지의 링크가 숨겨지지 않게 하기 위해서입니다.
  - 펼쳐 둔 기록은 지우지 않습니다. 여러 그룹의 페이지를 오가며 작업할 때 그룹마다 처음 한 번만 클릭하면 됩니다. 클릭 없이 들어가기만 한 그룹(뒤로 가기, 페이지 안 링크)은 떠나면 규칙대로 돌아갑니다.
- `NavLink`의 `end`는 URL이 `/`일 때만 켭니다 (그 외 메뉴는 하위 경로에서도 활성 표시).
- 그룹 조작 기록은 이름이 아니라 **메뉴 ID**로 기억합니다 (같은 이름 그룹이 생길 수 있으므로).
- 메뉴를 받는 중에는 메뉴 영역을 비워 둡니다.

---

### 7-3. 브레드크럼 · 화면 제목 (`PageHeader` · `PageContainer`)

`hooks/useBreadcrumbs.js` → `router/breadcrumbUtils.js`의 `buildBreadcrumbs`가 항목을 만들고, 표준 `common/ui/PageHeader`의 브레드크럼이 그립니다 (2026-11-17. 이전에는 `common/Breadcrumb.jsx`가 "⌂ > 항목 > …"으로 그렸음). 화면 제목(`h2`)은 마지막 항목입니다 (`PageContainer`에 `title`을 넘기면 그 값).

| 화면 | 항목 | 예 |
| --- | --- | --- |
| 메뉴 화면 | 소속 메뉴의 DB 경로 (대 > 중 > 소 이름). 소속 메뉴는 가드와 같은 방법(`findGuardUrl`)으로 찾음 | ⌂ > System Management > 시스템 관리 > 메뉴 관리 |
| 메뉴 아래 상세 화면 | 메뉴 경로 + 그보다 깊은 라우트의 `crumb` | ⌂ > My Page > 수강 과정 > 과정 상세 |
| 메뉴에 없는 화면 (로그인 · 404 · 등록 전 화면) | 라우트 `crumb` | ⌂ > 페이지 없음 |

- 이어지는 같은 이름은 하나로 합칩니다 (중메뉴 "설문 관리" > 소메뉴 "설문 관리" → "설문 관리").
- 대시보드(`/`)도 메뉴 경로를 씁니다 (예: MAIN > Home > Dashboard).
- 항목은 링크가 아닙니다 (⌂만 대시보드 링크). 대 · 중메뉴는 주소가 없기 때문입니다.
- 메뉴 화면은 가드가 내 메뉴를 받을 때까지 본문을 그리지 않으므로, 라우트 이름이 잠깐 보였다가 바뀌는 일은 없습니다.

## 8. 파일 구성

```text
src/api/admin/system/menu/menuApi.js            (새 파일)
src/store/slices/menuSliceStore.js              (새 파일)
src/store/StoreProvider.jsx                     (reducer 등록)
src/router/routeUtils.js                        (새 파일: getMenuUrlOptions, getGuardTarget, findGuardUrl)
src/router/MainRouterProvider.jsx               (routes export, handle.menu, guardAs, 팝업 감싸기)
src/components/menu/MenuGuard.jsx               (새 파일)
src/components/common/error/NotFound.jsx        (새 파일: 404, 5-6)
src/router/breadcrumbUtils.js                   (새 파일: 브레드크럼 항목 계산, 7-3)
src/hooks/useBreadcrumbs.js                     (새 파일, 7-3)
src/components/common/Breadcrumb.jsx            (항목을 받아 그리기만, 7-3)
src/components/common/PageContainer.jsx         (호환용 틀: 안쪽은 표준 PageHeader, 제목 = 브레드크럼 마지막 항목, 7-3)
src/components/common/error/RouteError.jsx      (새 파일: 라우트 오류 화면, 5-6)
src/layout/MainLayout.jsx                       (Outlet 감싸기)
src/components/menu/SideMenu.jsx                (store 사용)
src/components/menu/sideMenuUtils.js            (새 파일: 트리 변환, 그룹 펼침 규칙)
src/components/admin/system/menu/Menu.jsx       (권한 확인 래퍼 + 화면)
src/components/admin/system/menu/MenuColumn.jsx (열 하나: 목록 + 상세)
src/components/admin/system/menu/menuUtils.js   (트리 계산, 입력 검사, 오류 메시지)
src/components/admin/system/menu/Menu.module.css
src/components/admin/system/role/Role.jsx       (역할 생성 성공 안내 문구 추가, 아래)
```

### 권한 관리 화면 안내 추가

새 역할은 `MENU_ROLE`이 비어 있어 그 역할의 사용자는 대시보드만 볼 수 있습니다 (권한 코드가 비어 있는 것과 같은 상황). 메뉴를 자동으로 넣지는 않고, 권한 관리 화면에서 역할 생성에 성공하면 안내 문구를 표시합니다: "새 역할은 메뉴와 권한이 비어 있습니다. 메뉴 관리와 권한별 접근 권한 관리에서 허용해 주세요." `frontend/docs/design/role-page-design.md`에도 같은 내용을 추가합니다.

### 지킬 것

- `MainRouterProvider.jsx`는 다른 담당자(과정 관리)와 같이 쓰는 파일입니다. 기존 라우트 구조는 바꾸지 말고 `handle`과 감싸기만 추가하세요. 수정 전에 담당자에게 알리세요.
- 화면 컴포넌트 파일(과정 관리 등)은 고치지 않습니다.

---

## 9. 적용 순서

> 1 ~ 5단계 완료 (2026-11-13). 6단계 공지 내용은 `frontend/docs/page-guide.md`로 정리했습니다.

1. 백엔드 `/menus` API 구현.
2. DB에 초기 메뉴 · `MENU_ROLE` 입력 (`backend/docs/design/menu-design.md` 2-5).
3. 메뉴 관리 화면 구현.
4. 사이드바를 store로 전환.
5. 라우터 표시 + 가드 적용. **2번이 끝나기 전에 켜면 SUPER_ADMIN 외에는 대시보드만 열립니다.**
6. 팀에 공지:
   - 새 화면을 만들면 라우트에 `handle.menu`를 붙이고, 메뉴 관리에서 메뉴와 역할을 등록해야 다른 역할이 들어갈 수 있습니다.
   - 새 팝업 등 접두어로 메뉴를 찾을 수 없는 라우트에는 `handle.guardAs`로 소속 메뉴 URL을 적어야 합니다. 빠뜨리면 SUPER_ADMIN만 열 수 있습니다.
   - 라우트 경로를 바꾸면 메뉴 관리에서 해당 메뉴의 URL도 다시 선택해야 합니다 (목록에 ⚠ 표시).

---

## 10. 확인 시나리오 (수동 테스트)

| # | 시나리오 | 기대 결과 |
| --- | --- | --- |
| M1 | STUDENT로 `/admin/course/add` 직접 입력 | 알림 없이 "권한이 없습니다" |
| M2 | STUDENT로 `/my/course/list/123` (수강 과정 허용) | 화면 표시 (접두어 매칭) |
| M3 | 메뉴 관리에서 ADMIN을 "접근 관리"(`/admin/system/access`) 소메뉴에만 체크하고 "권한별 접근 권한 관리"(`/admin/system/access-role`)는 해제한 뒤, ADMIN으로 `/admin/system/access-role` 입력 | "권한이 없습니다" (`/admin/system/access`로 시작하는 문자열이어도 다른 메뉴로 판정하는지 확인하는 경계 검사). `/admin/system/access`는 열림 |
| M4 | 메뉴에 없는 URL을 SUPER_ADMIN / 그 외로 입력 | 열림 / "권한이 없습니다" |
| M5 | 비로그인으로 `/admin/course/add` | `/login`으로 이동 |
| M6 | 과정 목록이 허용된 TUTOR로 숙제 팝업 열기 | 팝업 표시 (`guardAs`) |
| M7 | 메뉴 관리에서 소메뉴 이름 변경 · 미사용 · 역할 해제 후 저장 | 내 사이드바 즉시 반영 |
| M8 | 중메뉴 미사용 (SUPER_ADMIN이 아닌 역할) | 그 아래 소메뉴가 사이드바에서 사라지고 URL 접근도 거부 |
| M8-1 | 중메뉴 미사용 (SUPER_ADMIN) | 사이드바에 흐리게 "(미사용)"으로 보이고 그 아래 화면에 들어갈 수 있음 |
| M9 | `spread` 켠 중메뉴 | 새로고침 시 펼쳐진 상태 |
| M10 | 손잡이를 끌거나 ↑ ↓ 키로 두 열의 순서를 바꾼 뒤 [순서 저장] | 바에 두 열 이름, 저장하면 목록 · 사이드바 순서 변경 + 토스트. [되돌리기]면 원래 순서 |
| M11 | 하위 메뉴가 있는 대메뉴 삭제 | 서버 메시지 알림, 삭제 안 됨 |
| M12 | URL 드롭다운 | 이미 쓰인 URL과 파라미터 경로(`:id`)가 없음 |
| M13 | 입력 변경 후 다른 메뉴 선택 | 확인 창 |
| M14 | `MENU_UPDATE`만 없는 역할 | 손잡이 없음, 상세는 보기만 ([수정] 없음) |
| M15 | ADMIN으로 메뉴 관리 소메뉴 상세 열기 | 자기 잠금 안내 문구 표시 |
| M16 | ADMIN이 메뉴 관리 소메뉴에서 본인 역할 해제 후 저장 | 서버 메시지 알림, 저장 안 됨, 메뉴 관리 화면 계속 사용 가능 |
| M17 | SUPER_ADMIN으로 같은 작업 | 저장됨, 안내 문구 없음 |
| M18 | 두 탭에서 같은 메뉴를 열고 차례로 저장 | 두 번째 탭에 알림, 입력값이 첫 번째 저장 내용으로 바뀜 |
| M19 | 중메뉴에서 ADMIN 해제, 그 아래 소메뉴는 ADMIN 체크 | 소메뉴의 ADMIN 체크박스 옆에 "(상위 메뉴에서 허용 안 됨)" |
| M20 | DB에서 소메뉴 URL을 없는 경로로 바꾼 뒤 화면 열기 | 목록에 ⚠ 표시, URL 선택에 "(등록되지 않은 경로)" |
| M21 | 같은 열에 같은 이름으로 추가 | 이름 칸에 오류, 저장 안 됨 |
| M22 | 입력 변경 후 사이드바로 다른 화면 이동 / 새로고침 | 확인 창 / 브라우저 확인 창 |
| M23 | 대메뉴만 새로 추가하고 저장 | 성공 알림에 "소메뉴를 추가해야 사이드바에 표시됩니다." |
| M24 | 권한 관리에서 역할 생성 | 메뉴 · 권한 허용 안내 문구 |
| M25 | URL 드롭다운에서 `Dashboard (/)` 선택 가능 / Dashboard 메뉴에서 STUDENT 해제 후 STUDENT로 `/` 접속 | 선택 가능 / 사이드바에 Dashboard 링크가 없고 화면은 열림 |
| M26 | 메뉴 선택 → 이름 수정 → [취소] | 선택 시 [삭제]만, 수정하면 [저장] · [취소]로 바뀜, [취소] 후 다시 [삭제]만 |
| M27 | 이름 수정 중 목록 머리 [추가] | 저장하지 않은 변경 확인 창 |
| M28 | STUDENT로 `/my/course` 입력 (수강 과정 허용) | `/my/course/list`로 이동 (`guardAs`) |
| M29 | STUDENT로 `/my` 입력 (라우트는 있지만 메뉴가 아님) | "권한이 없습니다" |
| M30 | SUPER_ADMIN이 아닌 계정으로 `/abc` 입력 | 사이드바는 그대로, 본문에 큰 "404" + "페이지를 찾을 수 없습니다." + [뒤로] [홈으로] (권한이 없습니다가 아님) |
| M31 | 숙제 팝업 주소를 과정 목록이 허용되지 않은 역할로 열기 | 팝업에 "권한이 없습니다" |
| M32 | ACTION이 쓰는 소메뉴를 다른 중메뉴로 옮기기 | 확인 창 → "메뉴를 옮겼습니다.", 열 선택이 새 위치로 바뀜, 사이드바 위치 변경, 접근 관리 · 권한별 접근 권한 관리에서 그 ACTION의 메뉴가 새 위치로 표시 |
| M33 | 중메뉴를 다른 대메뉴로 옮기기 | 하위 소메뉴가 함께 옮겨짐, 원래 대메뉴의 남은 중메뉴 순서가 1부터 |
| M34 | 이름을 바꾼 상태 / 상위 메뉴를 바꾼 상태 | 상위 메뉴 드롭다운 비활성 + 안내 / 다른 칸 비활성 + 안내, [취소]로 둘 다 풀림 |
| M35 | 옮길 그룹에 같은 이름이 있는 메뉴를 옮기기 | 드롭다운 아래 안내, 저장 안 됨 |
| M36 | 상위 메뉴를 바꾼 상태에서 다른 메뉴 선택 · 다른 화면 이동 | 저장하지 않은 변경 확인 창 |
| M37 | ADMIN이 메뉴 관리 소메뉴를 ADMIN이 허용되지 않은 중메뉴로 옮기기 | `MENU_SELF_LOCK` 알림, 옮겨지지 않음 |
| M38 | `MENU_UPDATE`가 없는 역할 / 대메뉴 상세 | 상위 메뉴 드롭다운이 보이지 않음 |
| M39 | 백엔드를 끈 상태에서 `/admin/course/list` 진입 (loader의 API 실패) | 사이드바는 그대로, 본문에 오류 아이콘(네트워크 오류라 숫자 없음) + "화면을 불러오지 못했습니다." + 네트워크 메시지 + [다시 시도] (404가 아님). 권한이 없는 API 오류면 큰 "403" |
| M40 | 화면 컴포넌트에서 오류가 나는 경우 (개발 환경) | 사이드바는 그대로, 큰 "500" + "오류 이름: 메시지" 한 줄. 사이드바로 다른 화면 이동 가능 |
| M41 | 메뉴 관리에서 소메뉴 이름을 바꾼 뒤 그 화면 열기 | 사이드바 · 브레드크럼 · 화면 제목이 모두 새 이름 |
| M42 | 소메뉴를 다른 그룹으로 옮긴 뒤 그 화면 열기 | 브레드크럼이 새 그룹 경로 |
| M43 | 중메뉴 · 소메뉴 이름이 같은 화면 (예: 설문 관리) | 이름이 한 번만 표시 |
| M44 | `/my/course/list/(과정 ID)` · `/login` · `/abc` | 메뉴 경로 + "과정 상세" / "로그인" / "페이지 없음" |
| M45 | 순서를 바꾼 상태에서 [추가] · [수정] · [삭제] / 다른 화면 이동 | 비활성 + 이유 / 저장하지 않은 변경 확인 창 |
| M46 | 상세 [수정] → 입력 → [취소] / 메뉴를 고른 뒤 바로 보기 | 보기로 돌아가고 값은 저장된 값 / 입력 칸이 아니라 정보로 보임 |
| M47 | 순서를 바꾼 뒤 다른 탭에서 같은 열에 메뉴를 추가하고 [순서 저장] | 서버 메시지 토스트, 목록 다시 조회, 바 사라짐 (아무것도 저장 안 됨) |
