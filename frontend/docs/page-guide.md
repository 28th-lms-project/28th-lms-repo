# 새 화면 추가 가이드

새 화면을 만들어 **사이드바에 띄우고, 정해진 역할만 쓰게 하는** 순서입니다. 각 단계의 자세한 방법은 링크한 문서를 보세요.

화면 하나가 열리려면 서로 다른 세 가지가 모두 필요합니다.

| 무엇 | 어디서 정하나 | 빠지면 |
| --- | --- | --- |
| 화면에 들어갈 수 있는지 (사이드바 · 주소 입력) | 메뉴 관리의 메뉴 역할 (`MENU_ROLE`) | 사이드바에 없음, 주소로 들어가면 "권한이 없습니다" |
| API를 쓸 수 있는지 | 백엔드 `@RequireAction` + 접근 관리 · 권한별 접근 권한 관리 (`ROLE_ACTION`) | API 403 |
| 버튼을 보여 줄지 | 화면 코드의 `can("권한 코드")` | 권한이 있어도 버튼이 안 보이거나, 없는데 보임 |

SUPER_ADMIN은 세 가지 모두 항상 통과합니다. **테스트는 꼭 다른 역할 계정으로** 하세요.

---

## 1. 체크리스트

예시: 학생 성적 리더보드 `/my/leaderboard`, 학생(`ROLE_STUDENT`)이 봄.

### 코드 (개발자)

1. **백엔드 API**: 컨트롤러 메서드에 권한 어노테이션을 붙입니다.

   ```java
   @GetMapping("/leaderboard")
   @RequireAction(domain = "LEADERBOARD", action = "READ", description = "학생 성적 랭킹 조회")
   ```

   - 권한 코드는 `도메인_액션` (`LEADERBOARD_READ`). 서버를 시작하면 자동으로 수집됩니다.
   - 로그인만 확인하면 되는 API는 `@LoginRequired` (6 · 7번 생략, 3번 `can()`도 필요 없음).
   - 작성법: [access-control-guide.md](../../backend/docs/access-control-guide.md) 2 ~ 4장, 응답 · 예외: [api-response-guide.md](../../backend/docs/api-response-guide.md)
2. **프론트 API 함수**: `src/api/...`에 모듈 파일을 만듭니다. → [api-client-guide.md](api-client-guide.md) 3장
3. **화면 컴포넌트**: 권한 확인 후 조회하고, 버튼은 `can()`으로 숨깁니다. → [permission-guide.md](permission-guide.md) 3장
4. **라우트**: `src/router/MainRouterProvider.jsx`에 추가합니다.

   ```jsx
   { path: "leaderboard", element: <Leaderboard />, handle: { crumb: "리더보드", menu: true } },
   ```

   - `crumb`: 브레드크럼 · 화면 제목에 쓰는 이름
   - `menu: true`: 메뉴 관리에서 이 URL을 고를 수 있게 함. 파라미터(`:id`)가 없는 화면에만 붙입니다.
   - 상세 화면(`leaderboard/:id`)은 `menu` 없이 두면 상위 메뉴(`/my/leaderboard`) 권한을 따릅니다.
   - 팝업처럼 주소로 소속 메뉴를 찾을 수 없는 라우트, 다른 주소로 보내기만 하는 중간 경로에는 `handle: { guardAs: "소속 메뉴 URL" }`을 붙입니다. → [menu-page-design.md](design/menu-page-design.md) 5-2

### 화면 설정 (SUPER_ADMIN 계정)

5. **메뉴 관리** (`시스템 관리 > 메뉴 관리`): 대 > 중 > 소메뉴 위치에 소메뉴를 만들고 URL(`/my/leaderboard`)을 고른 뒤 볼 수 있는 역할을 체크합니다.
   - **상위 대 · 중메뉴에도 그 역할이 체크되어 있어야** 합니다.
   - 순서는 드래그로, 그룹을 처음부터 펼쳐 둘지는 중메뉴의 "펼침"으로 정합니다.
6. **접근 관리** (`시스템 관리 > 접근 관리`): 권한 코드(`LEADERBOARD_READ`)를 고르고 5번에서 만든 메뉴를 소속 메뉴로 지정해 등록합니다 (메뉴 지정이 필수라 5번을 먼저 합니다).
7. **권한별 접근 권한 관리**: 역할(`ROLE_STUDENT`)에 그 권한을 허용합니다. → 6 · 7번: [access-control-guide.md](../../backend/docs/access-control-guide.md) 6장

5 ~ 7번은 공용 DB에 저장되므로 한 번만 하면 팀 전체에 반영됩니다.

---

## 2. 안 될 때

| 증상 (SUPER_ADMIN이 아닌 계정) | 원인 |
| --- | --- |
| 메뉴 관리의 URL 선택지에 경로가 없음 | 4번 `menu: true` 누락, 또는 경로에 `:id`가 있음 |
| 사이드바에 메뉴가 없음 | 5번 역할 체크 누락 (상위 대 · 중메뉴 포함), 또는 메뉴가 미사용 |
| 주소로 들어가면 "권한이 없습니다" | 5번 메뉴 · 역할 누락. 팝업 · 중간 경로라면 4번 `guardAs` 누락 |
| 화면은 열리는데 API가 403 (`접근 권한이 없습니다.`) | 6 · 7번 누락, 또는 1번 어노테이션 이름과 등록한 권한 코드가 다름 |
| 권한을 줬는데 버튼이 안 보임 | 3번 `can()`의 코드가 API의 권한 코드와 다름. 또는 사용자가 아직 새로고침하지 않음 |
| 방금 바꾼 메뉴 · 권한이 다른 사용자에게 안 보임 | 그 사용자가 새로고침하거나 다시 로그인해야 반영됨 |

---

## 3. 나중에 바꿀 때

| 바꾸는 것 | 할 일 |
| --- | --- |
| 라우트 경로 | 메뉴 관리에서 그 메뉴의 URL을 다시 선택 (경로가 없어진 메뉴는 목록에 ⚠ 표시) |
| 화면 이름 | 사이드바 이름(메뉴 관리)과 `crumb`(라우트)은 따로 관리됩니다. 둘 다 고치세요 |
| `@RequireAction`의 `domain` · `action`, 또는 API 삭제 | [access-control-guide.md](../../backend/docs/access-control-guide.md) 6장 "권한 코드를 바꾸거나 없앨 때" |
| 메뉴를 다른 그룹으로 옮기기 | 메뉴 관리에서 메뉴를 선택하고 "상위 메뉴"를 바꿔 저장합니다. 그 메뉴를 쓰는 ACTION의 메뉴도 함께 바뀝니다 ([menu-page-design.md](design/menu-page-design.md) 6-6) |
