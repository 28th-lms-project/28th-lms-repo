# 메뉴 관리 화면 · 메뉴 기반 사이드바 · URL 접근 제한 설계

- 대상 화면: `시스템 관리 > 메뉴 관리` (`/admin/system/menu`), 사이드바(`SideMenu.jsx`), 모든 화면의 URL 접근
- 담당: ROLE 모듈 담당자
- 작성일: 2026-11-10
- 상태: 설계 확정. 메뉴 관리 화면 · 사이드바 구현 완료, 가드 구현 전

이 문서는 프론트 구현을 시작할 때 참고하는 설계입니다. API · 테이블은 `backend/docs/design/menu-design.md`, API 호출 규칙은 `frontend/docs/api-client-guide.md`, 버튼 권한은 `frontend/docs/permission-guide.md`를 함께 보세요.

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
| 순서 변경 | HTML5 Drag and Drop. **같은 상위 메뉴 안에서만** |
| UI 부품 | `src/components/sample`의 컴포넌트를 씁니다 (6-1) |
| 동시 수정 | 수정 요청에 화면이 받은 `mdfyDt`를 보내고, 다른 사람이 먼저 저장했으면 서버가 거부 (`MENU_OUTDATED`) |
| 저장 안 한 변경 | 다른 메뉴 선택 · 다른 화면 이동 · 새로고침 모두 확인 창 (6-4) |
| 메뉴 이름 | 같은 상위 메뉴 안에서 중복 불가 (`MENU_TITLE_USED`) |
| 상위 메뉴 변경 | **현재**: 지원하지 않음. 옮기려면 삭제 후 다시 만들기 (백엔드 문서 4-4 "메뉴 옮기기"). **최종 목표**: 6-6 "상위 메뉴 변경"으로 구현 (방식 · 권한 결정 완료, 구현 예정) |

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

### 알려진 차이: 브레드크럼

`common/Breadcrumb.jsx`는 라우트의 `handle.crumb`을 씁니다. 메뉴 관리에서 메뉴 이름을 바꾸면 **사이드바는 바뀌지만 브레드크럼은 예전 이름**이 남습니다. 이번 구현에서는 그대로 둡니다 (공용 컴포넌트 수정, 메뉴에 없는 상세 화면 처리가 필요해서). 이름을 맞추려면 `crumb`도 함께 고치세요.

---

## 3. 현재 상태

| 대상 | 상태 |
| --- | --- |
| 백엔드 `/menus` API | 구현 완료 (`backend/docs/design/menu-design.md`) |
| `components/admin/system/menu/Menu.jsx` | 메뉴 관리 화면 구현 완료 (9장 3단계) |
| 라우트 `handle.menu` | 메뉴 관리 URL 선택지용으로 표시 완료. `routes` export 완료 |
| `components/menu/SideMenu.jsx` | 내 메뉴(`menuSliceStore`)를 그림 (9장 4단계 완료). 조회는 `MainLayout`이 로그인 시 시작. `menuData.js` 삭제 |
| `router/MainRouterProvider.jsx` | `handle.menu` 표시 완료. 가드 · `guardAs` 없음 |
| 라우트 · 메뉴 등록 | "메뉴 관리" 라우트와 메뉴 항목은 등록되어 있음 |

---

## 4. API

`src/api/admin/system/menu/menuApi.js`에 함수를 만듭니다. 성공하면 `body`, 실패하면 `ApiError`.

| 함수 | 요청 | 반환 (`body`) | 주요 errorCode |
| --- | --- | --- | --- |
| `getMyMenus(options)` | `GET /menus/me` | `{ superAdmin, menus, guardUrls }` | `GLOBAL_UNAUTHORIZED` |
| `getMenus(options)` | `GET /menus` | `{ roles, menus }` | — |
| `createMenu(menu)` | `POST /menus` | 메뉴 1건 | `GLOBAL_INVALID_PARAMETER`, `MENU_NOT_EXISTS`, `MENU_PARENT_INVALID`, `MENU_URL_USED`, `MENU_TITLE_USED`, `MENU_ROLE_INVALID` |
| `modifyMenu(menuId, menu)` | `PUT /menus/{menuId}` (`menu`에 `mdfyDt` 포함) | 메뉴 1건 | `GLOBAL_INVALID_PARAMETER`, `MENU_NOT_EXISTS`, `MENU_URL_USED`, `MENU_TITLE_USED`, `MENU_ROLE_INVALID`, `MENU_OUTDATED`, `MENU_SELF_LOCK` |
| `modifyMenuOrder(parentId, menuIds)` | `PUT /menus/order` | `{ roles, menus }` | `MENU_ORDER_INVALID`, `MENU_ORDER_OUTDATED` |
| `deleteMenu(menuId)` | `DELETE /menus/{menuId}` | 메뉴 1건 | `MENU_NOT_EXISTS`, `MENU_HAS_CHILDREN`, `MENU_IN_USE`, `MENU_SELF_LOCK` |
| `moveMenu(menuId, parentId, mdfyDt)` (**구현 예정**, 6-6) | `PUT /menus/{menuId}/parent` | `{ roles, menus }` | `MENU_MOVE_INVALID`, `MENU_TITLE_USED`, `MENU_OUTDATED`, `MENU_SELF_LOCK` |

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
- 지금 `menuData.js`에 있는 링크에 모두 붙입니다. 대시보드도 포함합니다: `{ index: true, element: <Main />, handle: { crumb: "Dashboard", menu: true } }`.
- `router/routeUtils.js`의 `getMenuUrlOptions(routes)`가 라우트 트리를 돌며 `menu: true`인 경로의 전체 URL을 모읍니다. index 라우트는 상위 경로(대시보드는 `/`)로 계산합니다. 이를 위해 `MainRouterProvider.jsx`의 라우트 배열을 `routes`로 따로 export 합니다.
- 대시보드(`/`)는 메뉴로 등록하지만 가드는 항상 통과시킵니다 (5-3의 1번). 그래서 Dashboard 메뉴의 역할 체크는 **사이드바 링크 표시에만** 영향을 줍니다 (역할을 빼면 링크만 사라지고 `/`는 계속 열림).

### 5-2. 소속 메뉴 직접 지정

접두어로 메뉴를 찾을 수 없는 라우트는 `handle.guardAs`에 소속 메뉴 URL을 적습니다.

```jsx
{
  path: "/popup/homework/:courseid/:homeworkId",
  element: <MenuGuard><HomeworkDetails /></MenuGuard>,
  handle: { guardAs: "/admin/course/list" },   // 과정 목록 화면에서 여는 팝업
},
```

### 5-3. 가드 판정 순서 (`MenuGuard`)

1. 경로가 `/` 또는 `/login`이면 통과.
2. 비로그인이면 `/login`으로 이동.
3. 내 메뉴 상태가 `idle`/`loading`이면 아무것도 그리지 않음. `failed`면 "메뉴 정보를 불러오지 못했습니다." 안내.
4. `superAdmin`이면 통과.
5. 판정할 URL: 일치한 라우트 중 가장 안쪽의 `handle.guardAs`, 없으면 현재 `pathname`.
6. `guardUrls`에서 그 URL과 **같거나, 그 URL이 `기준URL + "/"`로 시작하는** 것 중 가장 긴 것을 찾음.
   - 경계 검사가 필요합니다: `/admin/system/access-role`이 `/admin/system/access`에 매칭되면 안 됩니다.
   - `/`는 매칭 후보에서 뺍니다 (모든 URL에 매칭되므로). `/`는 1번에서 처리합니다.
7. 찾지 못하면 거부 (SUPER_ADMIN은 4번에서 이미 통과).
8. 찾았으면 내 메뉴(`menus`)의 `menuUrl`에 그 URL이 있을 때만 통과.

거부되면 "권한이 없습니다"를 화면 전체에 표시합니다. 사이드바는 그대로 보입니다.

### 5-4. 배치

- `MainLayout.jsx`: `<Outlet />`을 `<MenuGuard><Outlet /></MenuGuard>`로 감쌉니다.
- 팝업 라우트: 5-2처럼 화면을 직접 감쌉니다 (`MainLayout` 밖이라서).
- 내 메뉴 조회(`fetchMyMenus`)는 `MainLayout`이 로그인 시 시작하고(4단계), `MenuGuard`도 시작합니다. 팝업은 `MainLayout` 밖이라 가드가 시작해야 합니다. `idle`일 때만 실행되므로 두 곳에서 불러도 한 번만 조회합니다. 사이드바는 같은 store 값을 읽기만 합니다.

---

## 6. 메뉴 관리 화면 (`/admin/system/menu`)

### 6-1. 사용할 sample 컴포넌트

| 용도 | 컴포넌트 |
| --- | --- |
| 이름 입력 | 일반 `<input>` + `Menu.module.css` (권한 관리 화면과 같은 방식) |
| URL 선택 | 일반 `<select>` + `Menu.module.css` (`value`로 제어) |
| 사용여부 · 펼침 · 역할 체크박스 | `common/input/Input.jsx`의 `Checkbox` (`disabled` 지원) |
| 추가 · 삭제 · 저장 · 취소 | `common/input/IconButton.jsx`의 `IconButton` (`disabled` 지원) |
| 삭제 확인, 저장 안 한 변경사항 확인 | `sample/Modal.jsx`의 `Confirm` |
| 화면 틀 | `common/PageContainer`, `components/Section.jsx` |

- sample의 `TextField` · `NativeSelect` · `Button`은 쓰지 않습니다. `disabled` 속성이 없어 권한 · 저장 중 · 상위 메뉴 변경 잠금(6-5, 6-6)을 만들 수 없고, `NativeSelect`는 `value` 대신 `option`의 `selected`로 선택값을 정해서 [취소]로 되돌리기 어렵기 때문입니다.
- 목록(드래그 순서 변경)은 권한 관리 화면처럼 직접 만든 목록을 씁니다. sample `Grid`에는 드래그 기능이 없습니다.

### 6-2. 화면 구성

```text
┌ 대메뉴 ─── [추가] ┐┌ 중메뉴 ─── [추가] ┐┌ 소메뉴 ─── [추가] ┐
│ ≡ Main            ││ ≡ 과정 관리       ││ ≡ 과정 목록       │
│ ≡ My Page         ││ ≡ 설문 관리       ││ ≡ 과정 등록       │
│ ≡ System Mgmt  ◀  ││ ≡ 시스템 관리  ◀  ││                   │
├───────────────────┤├───────────────────┤├───────────────────┤
│ ID  MN-2026...    ││ ID  MN-2026...    ││ ID  MN-2026...    │
│ 이름 [          ] ││ 이름 [          ] ││ 이름 [          ] │
│ ☑ 사용            ││ ☑ 사용  ☐ 펼침    ││ ☑ 사용            │
│ 역할              ││ 역할              ││ 역할              │
│ ☑ 슈퍼관리자(고정)││ ☑ 슈퍼관리자(고정)││ ☑ 슈퍼관리자(고정)│
│ ☐ 관리자 ☐ 강사…  ││ ☐ 관리자 ☐ 강사…  ││ ☐ 관리자 ☐ 강사…  │
│                   ││                   ││ URL [선택      ▼] │
│ 생성 2026-11-10…  ││ 생성 …            ││ 생성 …            │
│ 수정 -            ││ 수정 …            ││ 수정 …            │
│ [삭제]            ││ [저장][취소]      ││ [삭제]            │
└───────────────────┘└───────────────────┘└───────────────────┘
  (변경 없음)          (입력 변경)          (변경 없음)
```

- 위: 목록. 아래: 선택한 메뉴의 상세.
- 버튼은 성격에 따라 두 곳에 둡니다: **목록에 대한 일([추가])은 목록 머리**, **선택한 메뉴에 대한 일([삭제] · [저장] · [취소])은 상세 아래**. 상세 아래 버튼은 열의 상태에 따라 바뀝니다 (아래 표).

| 열의 상태 | 목록 머리 | 상세 아래 |
| --- | --- | --- |
| 아무것도 선택 안 함 | [추가] | (상세 없음) |
| 메뉴 선택, 변경 없음 | [추가] | [삭제] |
| 메뉴 선택, 입력 변경 | [추가] | [저장] [취소] |
| 새 메뉴 입력 중 (`new`) | [추가] | [저장] [취소] |
| 저장 · 삭제 · 순서 변경 중 (`saving`) | 같은 버튼, 비활성 | 같은 버튼, 비활성 |

- [추가]는 그 열이 활성일 때만 보입니다 (대메뉴 열은 항상, 중 · 소메뉴 열은 상위 메뉴를 골랐을 때). 권한 조건은 6-5.
- "입력 변경"의 판단은 6-4 "저장하지 않은 변경사항"과 같습니다.
- 버튼이 바뀌어도 상세 영역 높이가 흔들리지 않도록 버튼 줄의 높이를 고정합니다.
- 대메뉴를 고르면 중메뉴 열에 그 하위가, 중메뉴를 고르면 소메뉴 열에 그 하위가 나옵니다. 상위 선택이 바뀌면 오른쪽 열의 선택은 풀립니다.
- 미사용(`useYn = 'N'`) 메뉴는 목록에서 흐리게 표시하고 이름 뒤에 "(미사용)"을 붙입니다.
- 소메뉴의 `menuUrl`이 라우트에 없으면(`getMenuUrlOptions(routes)`에 없음) 목록에 ⚠ 표시와 툴팁 "화면이 없는 URL입니다. URL을 다시 선택하세요."를 붙입니다. 라우트 경로가 바뀌어 메뉴 링크가 끊긴 것을 찾기 위한 것입니다.
- 역할 체크박스 순서는 역할 순위 순서(`roles` 그대로)입니다.

### 6-3. 상태 설계

| 상태 | 내용 |
| --- | --- |
| `listStatus`, `listError` | `getMenus` 결과 상태 |
| `roles`, `menus` | `getMenus` 결과 (평평한 목록) |
| `selectedIds` | `{ top, mid, btm }` 열별 선택 메뉴 ID |
| `forms` | 열별 상세 입력값 `{ mode: "view" \| "new", id, title, useYn, spread, menuUrl, roleIds, mdfyDt }` |
| `formErrors` | 열별 입력 오류 |
| `saving` | 저장 · 삭제 · 순서 변경 진행 중 (버튼 비활성) |

열 목록은 `menus`에서 `parentId`로 걸러서 `menuOrder`로 정렬해 계산합니다 (따로 저장하지 않음).

### 6-4. 기능별 상세

#### 추가

- 목록 머리의 [추가]. 대메뉴 열은 항상, 중 · 소메뉴 열은 상위 메뉴를 골랐을 때만 보입니다.
- 누르면 그 열의 상세가 빈 입력(`mode: "new"`, 사용 체크, 펼침 해제, 역할 없음)이 됩니다. 저장하면 `createMenu`.
- 그 열에 저장하지 않은 변경이 있으면, 다른 메뉴를 고를 때와 같은 확인 창을 먼저 띄웁니다 (아래 "저장하지 않은 변경사항").
- 새 메뉴는 같은 상위 메뉴의 맨 뒤에 들어갑니다.

#### 저장

- `mode`가 `new`면 `createMenu`, 아니면 `modifyMenu`.
- 입력 검사(백엔드와 같은 규칙): 이름 필수 · 100자 이하, 소메뉴 URL 필수. 같은 열에 같은 이름(앞뒤 공백 제외)이 있으면 저장 전에 이름 칸에 "같은 상위 메뉴에 이미 같은 이름의 메뉴가 있습니다." 표시 (서버의 `MENU_TITLE_USED`도 같은 칸에 표시).
- 수정은 화면이 받은 `mdfyDt`를 함께 보냅니다.
- 성공하면 `getMenus` 다시 조회 + 저장한 메뉴 선택 + 내 메뉴 다시 조회(7장).
- 대 · 중메뉴를 저장했을 때, 그 아래에 사이드바에 보일 소메뉴가 없으면 성공 알림에 "소메뉴를 추가해야 사이드바에 표시됩니다."를 덧붙입니다 (사이드바는 소메뉴가 없는 그룹 · 섹션을 그리지 않으므로, 저장이 실패한 것처럼 보이지 않게).
- `MENU_OUTDATED`면 서버 메시지 알림 → `getMenus` 다시 조회 → 같은 메뉴를 선택한 채 입력값을 서버 값으로 바꿉니다 (내가 입력한 값은 버려짐).

#### 취소

- 입력값을 마지막 저장 값으로 되돌립니다. `new` 모드면 상세를 비우고 이전 선택으로 돌아갑니다.

#### 삭제

- `Confirm`으로 확인 후 `deleteMenu`. 기존 메뉴를 골랐고 변경이 없을 때만 보입니다 (`new` 모드 · 입력 변경 중에는 [저장] · [취소]로 바뀜).
- `MENU_HAS_CHILDREN` · `MENU_IN_USE`는 서버 메시지를 그대로 알림으로 표시.

#### 저장하지 않은 변경사항

- 입력을 바꾼 상태에서 다른 메뉴를 고르거나 상위 선택을 바꾸면 `Confirm`("저장하지 않은 변경사항이 있습니다. 이동할까요?")을 띄웁니다.
- 다른 화면으로 이동(사이드바, 뒤로 가기)할 때도 같은 확인 창을 띄웁니다: react-router의 `useBlocker`(데이터 라우터인 `createBrowserRouter`라서 사용 가능).
- 새로고침 · 창 닫기는 `beforeunload`로 브라우저 기본 확인 창을 띄웁니다 (문구는 브라우저가 정함).
- "입력을 바꾼 상태" 판단: 열마다 현재 입력값과 마지막 저장 값이 다르거나 `new` 모드인 경우.

#### 순서 변경

- 권한 관리 화면과 같은 HTML5 Drag and Drop. 같은 열(같은 상위 메뉴) 안에서만.
- 놓으면 `modifyMenuOrder(parentId, 그 열의 전체 ID 목록)`. 성공하면 응답으로 목록 교체 + 내 메뉴 다시 조회.
- `MENU_ORDER_OUTDATED`면 "메뉴 목록이 변경되었습니다…" 알림 후 목록 다시 조회.

#### URL 선택 (소메뉴만)

- 선택지: `getMenuUrlOptions(routes)` 중 **다른 메뉴가 쓰지 않는** URL. 표시는 `crumb (URL)`.
- 저장된 URL이 선택지에 없으면(라우트가 없어짐) `(등록되지 않은 경로) /xxx`로 맨 위에 보여 줍니다.

#### 역할 체크박스

- SUPER_ADMIN은 항상 체크 · 비활성. 저장할 때 `roleIds`에 넣지 않습니다.
- **상위 메뉴 때문에 실제로는 안 보이는 역할 표시**: 체크되어 있어도 상위 메뉴에서 그 역할이 빠져 있거나 상위 메뉴가 미사용이면, 체크박스 옆에 흐리게 "(상위 메뉴에서 허용 안 됨)"을 붙입니다. 백엔드 3장 규칙과 같은 계산을 `menuUtils.js`에서 `menus`로 합니다. 저장 값은 바꾸지 않습니다 (상위 메뉴를 다시 허용하면 그대로 보이게).

#### 자기 잠금 방지 (메뉴 관리 메뉴)

- 보호 대상: `menuUrl`이 `MENU_MANAGEMENT_URL`(`"/admin/system/menu"`, `menuUtils.js` 상수)인 소메뉴와 그 상위 중 · 대메뉴. 백엔드 `MenuConstants`와 같은 값입니다.
- 내가 SUPER_ADMIN이 아니면, 보호 대상 메뉴의 상세에 안내 문구를 표시합니다: "메뉴 관리 화면이 속한 메뉴입니다. 본인 역할 해제 · 미사용 · URL 변경 · 삭제는 저장되지 않습니다."
- 실제 차단은 서버가 합니다. `MENU_SELF_LOCK`이면 서버 메시지를 알림으로 띄우고 입력값은 그대로 둡니다 (사용자가 [취소]로 되돌림).
- 다른 역할의 체크 해제는 그대로 저장됩니다.

### 6-5. 권한별 표시

| 권한 | 없을 때 |
| --- | --- |
| `MENU_READ` | 화면 전체 "권한이 없습니다" (권한 관리 화면처럼 감싸는 컴포넌트에서 처리, 확인 중이면 "권한 확인 중...") |
| `MENU_CREATE` | [추가] 숨김 |
| `MENU_UPDATE` | 드래그 손잡이 숨김. 기존 메뉴의 입력칸 비활성 (입력을 바꿀 수 없으므로 [저장] · [취소]도 나타나지 않음) |
| `MENU_DELETE` | [삭제] 숨김 |

### 6-6. 상위 메뉴 변경 (결정 완료, 구현 예정)

> **상태: 결정 완료 (2026-11-12), 구현 전** (백엔드 문서 4-7). 백엔드 이동 API가 생기면 이 절대로 구현하고, 1장 "상위 메뉴 변경"을 고칩니다.

- 중 · 소메뉴 상세에 "상위 메뉴" 드롭다운(`NativeSelect`)을 둡니다. 선택지는 한 단계 위의 메뉴 전체(소메뉴 → 모든 중메뉴, 중메뉴 → 모든 대메뉴)이고, 표시는 `대메뉴 > 중메뉴` 경로입니다. 대메뉴 상세에는 표시하지 않습니다.
- **이동은 다른 수정과 따로 저장합니다.** 저장 한 번에 API 하나만 부르게 해서, 일부만 저장되거나 검사(같은 이름, 자기 잠금, `mdfyDt`)가 중간 상태로 이뤄지는 일을 막습니다. 기존 수정 API · 저장 흐름은 바꾸지 않고 이동 기능만 덧붙입니다.
- 잠금 규칙:
  - 다른 칸(이름, 사용 여부, 펼침, URL, 역할)을 하나라도 바꾸면 상위 메뉴 드롭다운을 비활성화하고 "다른 변경을 저장하거나 취소한 뒤 옮길 수 있습니다."를 표시합니다.
  - 상위 메뉴를 바꾸면 다른 칸을 모두 비활성화합니다. 이때 [저장]은 `moveMenu(menuId, parentId, mdfyDt)`(`PUT /menus/{menuId}/parent`)만 부릅니다.
  - [취소]는 두 경우 모두 마지막 저장 값으로 되돌립니다 (잠금도 풀림).
- 옮기면서 이름도 바꿔야 하면 두 번 저장합니다. 새 그룹에 같은 이름이 있으면 이름을 먼저 바꿔 저장한 뒤 옮깁니다 (`MENU_TITLE_USED` 메시지로 안내됨).
- 저장 전 `Confirm`: "메뉴를 옮기면 이 메뉴를 쓰는 접근 권한(ACTION)의 메뉴도 함께 바뀝니다. 옮길까요?"
- 성공하면 목록을 응답으로 교체하고, 옮긴 메뉴가 보이도록 열 선택을 새 위치로 바꾼 뒤 내 메뉴를 다시 조회합니다.
- 오류: `MENU_MOVE_INVALID`, `MENU_TITLE_USED`, `MENU_OUTDATED`, `MENU_SELF_LOCK`은 서버 메시지 알림.
- 권한: `MENU_UPDATE` (2026-11-12 결정). `MENU_UPDATE`가 없으면 드롭다운을 표시하지 않습니다.
- 드래그로 다른 열 · 다른 그룹에 놓는 방식은 쓰지 않습니다 (실수로 옮기기 쉬움).

확인 시나리오 (구현 시 10장에 추가):

- 소메뉴를 다른 중메뉴로 옮긴 뒤 목록 · 사이드바 위치 변경, 권한별 접근 권한 관리 화면의 메뉴 필터에서 해당 ACTION이 새 메뉴로 걸리는지 확인.
- 이름을 바꾼 상태에서 상위 메뉴 드롭다운이 비활성인지, 상위 메뉴를 바꾼 상태에서 다른 칸이 비활성인지, [취소]로 둘 다 풀리는지 확인.

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
- 처음 펼칠 그룹: `spread = 'Y'`인 그룹 + 현재 주소가 들어 있는 그룹 (지금 동작 유지).
- `NavLink`의 `end`는 URL이 `/`일 때만 켭니다 (지금 `menuData.js`에서 `end`를 쓴 곳은 `/`와 `/sample`이고, `/sample`은 하위 경로가 없어 차이가 없습니다).
- 그룹을 펼친 상태는 지금처럼 이름이 아니라 **메뉴 ID**로 기억합니다 (같은 이름 그룹이 생길 수 있으므로).
- 메뉴를 받는 중에는 메뉴 영역을 비워 둡니다.
- 전환이 끝나면 `menuData.js`를 삭제합니다.

---

## 8. 파일 구성

```text
src/api/admin/system/menu/menuApi.js            (새 파일)
src/store/slices/menuSliceStore.js              (새 파일)
src/store/StoreProvider.jsx                     (reducer 등록)
src/router/routeUtils.js                        (새 파일: getMenuUrlOptions, findGuardUrl)
src/router/MainRouterProvider.jsx               (routes export, handle.menu, guardAs, 팝업 감싸기)
src/components/menu/MenuGuard.jsx               (새 파일)
src/layout/MainLayout.jsx                       (Outlet 감싸기)
src/components/menu/SideMenu.jsx                (store 사용)
src/components/menu/sideMenuUtils.js            (새 파일: 트리 변환, 처음 펼칠 그룹)
src/components/menu/menuData.js                 (전환 후 삭제)
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

1. 백엔드 `/menus` API 구현.
2. DB에 초기 메뉴 · `MENU_ROLE` 입력 (`backend/docs/design/menu-design.md` 2-5).
3. 메뉴 관리 화면 구현.
4. 사이드바를 store로 전환.
5. 라우터 표시 + 가드 적용. **2번이 끝나기 전에 켜면 SUPER_ADMIN 외에는 대시보드만 열립니다.**
6. 팀에 공지:
   - 새 화면을 만들면 라우트에 `handle.menu`를 붙이고, 메뉴 관리에서 메뉴와 역할을 등록해야 다른 역할이 들어갈 수 있습니다.
   - 새 팝업 등 접두어로 메뉴를 찾을 수 없는 라우트에는 `handle.guardAs`로 소속 메뉴 URL을 적어야 합니다. 빠뜨리면 SUPER_ADMIN만 열 수 있습니다.
   - 라우트 경로를 바꾸면 메뉴 관리에서 해당 메뉴의 URL도 다시 선택해야 합니다 (목록에 ⚠ 표시). 브레드크럼 이름(`crumb`)은 메뉴 이름과 따로 관리됩니다.

---

## 10. 확인 시나리오 (수동 테스트)

| # | 시나리오 | 기대 결과 |
| --- | --- | --- |
| M1 | STUDENT로 `/admin/course/add` 직접 입력 | 알림 없이 "권한이 없습니다" |
| M2 | STUDENT로 `/my/course/list/123` (수강 과정 허용) | 화면 표시 (접두어 매칭) |
| M3 | ADMIN으로 `/admin/system/access-role` (접근 관리만 허용) | "권한이 없습니다" (경계 검사) |
| M4 | 메뉴에 없는 URL을 SUPER_ADMIN / 그 외로 입력 | 열림 / "권한이 없습니다" |
| M5 | 비로그인으로 `/admin/course/add` | `/login`으로 이동 |
| M6 | 과정 목록이 허용된 TUTOR로 숙제 팝업 열기 | 팝업 표시 (`guardAs`) |
| M7 | 메뉴 관리에서 소메뉴 이름 변경 · 미사용 · 역할 해제 후 저장 | 내 사이드바 즉시 반영 |
| M8 | 중메뉴 미사용 (SUPER_ADMIN이 아닌 역할) | 그 아래 소메뉴가 사이드바에서 사라지고 URL 접근도 거부 |
| M8-1 | 중메뉴 미사용 (SUPER_ADMIN) | 사이드바에 흐리게 "(미사용)"으로 보이고 그 아래 화면에 들어갈 수 있음 |
| M9 | `spread` 켠 중메뉴 | 새로고침 시 펼쳐진 상태 |
| M10 | 드래그로 순서 변경 | 목록 · 사이드바 순서 변경 |
| M11 | 하위 메뉴가 있는 대메뉴 삭제 | 서버 메시지 알림, 삭제 안 됨 |
| M12 | URL 드롭다운 | 이미 쓰인 URL과 파라미터 경로(`:id`)가 없음 |
| M13 | 입력 변경 후 다른 메뉴 선택 | 확인 창 |
| M14 | `MENU_UPDATE`만 없는 역할 | 드래그 손잡이 없음, 입력 비활성, [저장] · [취소] 안 보임 |
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
