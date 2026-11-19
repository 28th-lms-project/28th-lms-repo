# archive: 표준화 전 기록 (사용 금지)

> ⚠️ **새 코드에서 이 폴더의 파일을 import하지 마세요.**
> 이 폴더는 표준 UI로 옮기기 전 모습을 남긴 **기록**입니다. 화면 · 표준 부품에서 import하면 lint 오류가 납니다 (`eslint.config.js`의 `no-restricted-imports`).
> 새 화면은 표준 UI(`common/ui/`, `src/styles/`)를 씁니다. 가이드: `frontend/docs/ui-style-guide.md`

## 왜 남겨 두나

이 프로젝트는 "원래 이랬는데, 스타일을 표준화해서 이렇게 바뀌었다"를 보여 주려고 표준화 전 모습을 지우지 않고 남깁니다.
샘플 페이지(`/sample`)의 두 탭이 이 폴더를 씁니다.

- **표준화 전 (기록)**: 화면마다 흩어져 있던 UI를 모양 그대로 모은 것. 카탈로그는 `sample/catalog/archive/`
- **기존 샘플**: 처음부터 있던 `sample/` 컴포넌트 예시

이 두 곳(`sample/Sample.jsx`, `sample/catalog/archive/`) 말고는 이 폴더를 import할 수 없습니다.

## 규칙

- **고치지 않습니다.** 기록이라 그때 모습 그대로 둡니다. lint 검사에서도 뺐습니다. 고칠 수 있는 것은 파일을 옮겨서 생긴 import 경로뿐입니다.
- **새 파일을 만들지 않습니다.** 들어오는 파일은 아래 "들어오는 때"의 경우뿐입니다.
- 폴더 구조는 **원래 경로를 그대로** 따릅니다. 예: `archive/common/Breadcrumb.jsx`는 원래 `components/common/Breadcrumb.jsx`.
- 각 JS 파일 맨 위에 대신 쓸 표준 부품을 적어 두었습니다.

## 들어 있는 것

| 파일 (원래 위치) | 대신 쓰는 표준 |
| --- | --- |
| `Section.jsx` · `Section.css` | `common/ui/Panel` |
| `common/Breadcrumb.jsx` (+css) | `common/ui/PageHeader` + `useBreadcrumbs()` |
| `common/PageContainer.jsx` | `common/ui/PageHeader` + `useBreadcrumbs()` (2026-11-19 옮김) |
| `common/error/RouteError.module.css` | 지금의 `RouteError`는 `StatusBox size="lg"` (예전 스타일만 기록) |
| `common/Grid.jsx` (+css) | `common/ui/Table` (2026-11-19 옮김) |
| `common/Paginator.jsx` (+css) | `common/ui/Pagination` (2026-11-19 옮김) |
| `common/input/IconButton.jsx` (+css) | `common/ui/Button` (`icon`) (2026-11-19 옮김) |
| `common/input/Input.jsx` (+css) | `common/ui/Field` + 입력 클래스(`form-control` 등) |
| `sample/Grid.jsx` (+css) | `common/ui/Table` |
| `sample/Modal.jsx` (+css) | `common/ui/Modal` · `useConfirm()` |
| `sample/Paginator.jsx` (+css) | `common/ui/Pagination` |
| `sample/input/IconButton.jsx` (+css) | `common/ui/Button` (`icon`) |
| `sample/input/Input.jsx` (+css) | `common/ui/Field` + 입력 클래스 |
| `sample/input/icons.js` | `common/input/icons.js` (같은 내용, 표준 부품이 씀) |
| `sample/Poll.jsx` | `common/ui/QuestionBlock` (설문 문항) |
| `sample/Chart.jsx` | 표준 없음 (가이드 6장 "표준을 만들지 않기로 한 것") |

더 자세한 대응은 가이드 6장 "기존 컴포넌트 → 표준 대응"에 있습니다.

## 들어오는 때

아직 화면이 쓰고 있는 옛 부품은 원래 자리에 두고 `@deprecated`를 붙입니다 (VS Code에서 import에 취소선).
**그 부품을 쓰는 마지막 화면에 표준을 적용하는 PR에서** 이 폴더로 옮깁니다. 원래 경로를 따라 넣고, 맨 위에 기록용 한 줄을 붙이고, 이 표에 한 줄 추가합니다.

| 부품 | 아직 쓰는 화면 |
| --- | --- |
| (없음) | 2026-11-19에 마지막 `PageContainer`까지 옮겨서 남은 옛 부품이 없습니다 |

옮긴 뒤에도 샘플 표준화 전 탭이 그 부품을 쓰면, 탭의 import 경로만 `archive/`로 바꿉니다.
