# UI 스타일 가이드 (현황 · 카탈로그)

프론트엔드 화면들이 쓰는 UI를 **현재 모양 그대로** 모아 둔 문서입니다. 공통 스타일(`index.css`)과 디자인 시스템을 정하기 위한 출발점입니다.

- 실제 모양: 샘플 페이지 `/sample` (사이드바 메뉴 "Sample", 맨 위 목차 버튼으로 이동)
- 코드: `src/components/sample/catalog/` (스타일은 `Catalog.module.css` 하나에 모음)
- 기준: 2026-11-16 `dev` 브랜치

> 1 ~ 5장과 카탈로그는 **"지금 이렇게 되어 있다"** 를, 6장 결정 사항과 7장 토큰은 **"앞으로 이렇게 쓴다"** 를 다룹니다. 새 코드는 7장의 토큰을 씁니다.

---

## 1. 샘플 페이지 구성

페이지는 큰 구역 셋으로 나뉩니다. 구역마다 `PartHeader`(`CatalogParts.jsx`)로 큰 제목과 왼쪽 색 선을 달았고, 목차의 구역 이름을 누르면 그 구역으로 갑니다.

| 구역 | 색 | 내용 |
| --- | --- | --- |
| PART 1 **표준** | 강조색 | 새 화면이 쓰는 UI. 다크 모드를 따름 |
| PART 2 **통일 전 (현재)** | 경고색 | 지금 화면들의 모양 그대로 (비교용). 다크 모드에서도 밝게 고정 |
| PART 3 **기존 샘플** | 회색 | 처음부터 있던 `sample/` 컴포넌트 예시 |

| 목차 | 내용 | 파일 |
| --- | --- | --- |
| **표준 UI** | 버튼 · 입력 · 배지 · 상태 상자 · 토스트 · 확인 창 · 모달의 표준 모양과 사용 코드 (8장). 새 화면은 이것을 씀 | `StandardCatalog.jsx` |
| **표준 UI 2** | 표 · 페이지 이동 · 탭 · 패널 · 카드 · 안내 상자 · 키-값 목록 · 타임라인 · 선택 목록 · 배치, 화면 조합 예시 (8장) | `StandardLayoutCatalog.jsx` |
| **표준 UI 3** | 화면 머리 · 브레드크럼 · 사이드 메뉴 · pill 선택 · 세그먼트 · 켜고 끄는 버튼 · 스위치 · 날짜 · 기간 · 파일 · 진행 막대 (8장) | `StandardNavCatalog.jsx` |
| 토큰 | 표준 토큰(index.css, 7장) + 통일 전 색 · 글자 크기 · 모서리 · 컨트롤 높이 · 포커스 · 비활성 | `TokenCatalog.jsx` |
| 버튼 | 공통 컴포넌트 + 화면별 raw 버튼 13종 | `ButtonCatalog.jsx` |
| 입력 · 폼 | 공통 Input 컴포넌트, 검색 툴바, 폼 필드 4종, textarea, 라디오 · 체크박스, react-select, 파일 | `FormCatalog.jsx` |
| 리스트 · 표 | Grid, native table 3종, 3단 컬럼 리스트, 키-값 목록 4종, 타임라인, 문제 블록, 댓글 | `ListCatalog.jsx` |
| 내비게이션 | 브레드크럼 · 화면 제목, 탭 5종, 사이드 메뉴, Paginator | `NavigationCatalog.jsx` |
| 피드백 | 배지 · 태그, 안내 · 빈 상태 · 로딩, 오류 · 성공 · 힌트 문구, 경고 상자, 토스트, 오류 화면 | `FeedbackCatalog.jsx` |
| 레이아웃 | 패널 · 카드 6종, 화면 배치 (목록 \| 상세, 3패널) | `LayoutCatalog.jsx` |
| 오버레이 | 폼 모달, 확인 모달, 큰 내용 모달 (열어 볼 수 있음) | `OverlayCatalog.jsx` |
| 기존 샘플 | 원래 있던 Buttons · Modals · FileInput · Grids · Paginator · Chart · Poll | `Sample.jsx` 아래쪽 |

카탈로그의 칸 하나는 `Variant`입니다. 칸 머리 오른쪽 회색 글자가 **원본 파일**(`src/components` 기준)이고, 클래스 이름은 `Catalog.module.css`의 주석에 원본 CSS 위치가 적혀 있습니다.

### 새 UI를 만들었을 때

1. 화면에 새로운 모양(버튼 · 배지 · 상자 등)을 만들었으면 먼저 카탈로그에 비슷한 것이 있는지 봅니다. 있으면 그 값을 그대로 씁니다.
2. 없어서 새로 만들었다면 해당 카탈로그 파일에 `Variant`를 하나 추가하고, 이 문서 5장 표에 한 줄 추가합니다.

```jsx
<Variant name="이름" source="원본 경로" note="설명 (선택)">
    {/* 실제 모양 */}
</Variant>
```

---

## 2. 공통 컴포넌트

표준 UI 컴포넌트(`common/ui/` — `Button` · `Field` · `Badge` · `StatusBox` · `Modal` · `ConfirmDialog` · `useToast` · `useConfirm` · `Table` · `Pagination` · `Tabs` · `Panel` · `StatCard` · `Callout`)는 8장에 따로 정리했습니다. 아래는 그 전부터 있던 컴포넌트입니다.

| 컴포넌트 | 위치 | 주요 props · 메모 |
| --- | --- | --- |
| `PageContainer` | `common/PageContainer.jsx` | 브레드크럼 + 22px 제목 + 본문. `title`을 안 넘기면 브레드크럼 마지막 항목 |
| `Breadcrumb` | `common/Breadcrumb.jsx` | `crumbs: {key, title}[]`. 항목 계산은 `useBreadcrumbs` |
| `Section` | `components/Section.jsx` | 흰 카드 + 1.2rem 제목. `title`, `nopadding`, `nomargin`, `direction`, `itemGap` |
| `Grid` | `common/Grid.jsx` | CSS grid 표. `header`, `content`, `columnStyle`, `checkable`, `editable`, `clickableColumn`, `activeRows`, `footer` |
| `Paginator` | `common/Paginator.jsx` | `start`, `countPerPageGroup`, `activePage`, `setActivePage`, `totalPageCount` |
| `IconButton` | `common/input/IconButton.jsx` | `icon`, `iconSize`(기본 20, 화면에서는 주로 16), `backgroundColor`, `disabled`, `hoverIconRotate`, `alwaysIconRotate`, `style`. `className` · 그 밖의 props(`aria-label` 등)는 `<button>`에 전달 (2026-11-16 수정, sample 복사본도 같음). 모양은 아직 그대로 — 표준 `Button`으로 바꾸는 것은 다음 단계 3번 |
| `icons` | `common/input/icons.js` | edit, close, add, setting, fullStar, star, login, logout, download, downloadDone, progress, delete, refresh, sort, unchecked, checked, radioUnChecked, radioChecked, home, arrowRight, error, ok, full, exitFull |
| `Id` · `Password` · `TextField` · `NativeSelect` · `Textarea` · `Checkbox` · `Radio` · `FileField` · `Button` | `common/input/Input.jsx` | `NativeSelect` · `Textarea`는 스타일 클래스가 정의되어 있지 않아 브라우저 기본 모양 |
| `Editor` | `common/Editor.jsx` | 리치 텍스트 에디터 (MyCourseData에서 사용). 카탈로그에는 넣지 않음 |
| `NotFound` · `RouteError` | `common/error/` | 404 · 라우트 오류 화면 |
| `Alert` · `Confirm` | `sample/Modal.jsx` | `ref.current.open()`. 새 코드는 `common/ui/Modal` · `useConfirm()`을 씀 (8장). 쓰는 곳(`admin/system/menu/Menu.jsx`)을 옮기면 삭제 |
| `Chart` · `PollList` · `DataGrid` | `sample/` | 샘플 전용. `Chart`(apexcharts)는 샘플에서만 사용 |

### sample / common 중복

| 파일 | 차이 |
| --- | --- |
| `input/` (IconButton, Input, icons), `Paginator` | 두 폴더가 완전히 같음 |
| `Grid.jsx` | common만 `activeRows`(선택 행 배경)가 있고, `clickableColumn` 콜백이 `(value, rowIndex)` (sample은 `(value)`) |
| `Modal.jsx` | sample에만 있음 (`admin/system/menu/Menu.jsx`도 sample에서 가져다 씀) |

`sample/`에서 가져다 쓰는 화면: `admin/course/**` 전체, `admin/survey/Survey.jsx`, `admin/test/AddTest.jsx` · `UpdateTest.jsx`, `admin/system/menu/Menu.jsx`(Modal). 새 코드는 **`common/`에서** 가져옵니다.

---

## 3. 토큰 현황

### 색

| 용도 | 지금 쓰는 값 (많이 쓰는 순) |
| --- | --- |
| 기본 글자 | `#333` · `#222` · `#212529` |
| 보조 글자 · 라벨 | `#495057` · `#555` · `#666` |
| 힌트 · 빈 상태 | `#777` · `#888` · `#999` · `#868e96` · `#adb5bd`(placeholder) |
| 테두리 | `#ccc` · `#ced4da` · `#ddd` · `#e5e5e5` · `#e4e4e4` · `#eee` |
| 배경 | `#fff`(카드) · `#e9e9e9`(body) · `#f7f7f7`(머리글 · 줄무늬) · `#f8f9fa`(패널 머리) · `#fafafa`(hover) · `#f2f2f2`(disabled) |
| 강조 (파랑) | `#3b5bdb`(검색 버튼) · `#3f6fb5`(상담 화면) · `#4a7fd8`(선택 · 드래그) · `#6b9cf6`(스위치) · `rgb(86 151 255)`(Button positive) |
| 링크 | `#1c7ed6` · `#1a73e8` · `#1a5fb4` · `#24518b` |
| 오류 · 위험 | `#c62828` · `#dc3545` · `#d64545` · `#b42318` · `#e03131` · `#d93025` · `#d1242f` |
| 성공 | `#2b8a3e` · `#1a7f37` · `#1e7b34` · `#0f5132` |
| 경고 | `#8a6100` · `#9a6700` · `#7a5b00` · `#d68a00` · `#d8a800` |
| 사이드바 | 배경 `#212529`, 글자 `#f1f3f5` · `#ced4da` · `#adb5bd`, 현재 메뉴 `#ff5252` |

- 회색이 두 계열로 나뉩니다: **Bootstrap 계열**(`#212529` `#495057` `#ced4da` `#e9ecef` `#f8f9fa`, member · login · my/info · 사이드바)과 **단순 회색 계열**(`#333` `#666` `#ccc` `#e5e5e5` `#f7f7f7`, admin/system · my/course · course).
- 오류 빨강만 7가지입니다.
- 토큰 도입 전에는 CSS 변수가 하나도 없었습니다 (`App.css`의 `var(--accent)` 등은 Vite 템플릿 잔재). 지금은 `index.css`에 토큰이 있습니다 → 7장.

### 글자

- 글꼴: `"Roboto Mono", "Noto Sans KR", sans-serif` (`index.css`). 글꼴 파일을 불러오지 않으므로 설치되지 않은 PC에서는 기본 글꼴로 보입니다.
- 크기: px 계열(13px ×36, 12px ×22, 14px, 11px, 16px …)과 rem 계열(0.85rem, 0.9rem, 0.875rem, 0.8rem, 0.75rem …)이 섞여 있습니다. 실제 크기로는 **11 · 12 · 13 · 14 · 16 · 18 · 20 · 22px** 정도로 모입니다.

### 모서리 · 높이 · 상태

| 항목 | 지금 |
| --- | --- |
| border-radius | **4px**(×59, 대부분) · 6px(툴바 · 패널) · 5px(IconButton) · 7px(Input 컴포넌트) · 8px(모달) · 10px · 12px(배지) · 14px(pill) |
| 입력 · 버튼 높이 | 29 · 30 · 34 · 35 · 36 · 37 · 38 · 43.5px |
| 표 | 머리글 40px, 행 48px |
| 포커스 테두리 | `#495057` · `#888` · `#3f6fb5` (화면마다 다름), 아웃라인은 대부분 제거 |
| 비활성 | 입력: 배경 `#f2f2f2` · 글자 `#aaa` · 테두리 `#ddd`. 버튼: opacity 0.5 ~ 0.6 |

---

## 4. 레이아웃 기본

- 앱 틀: `layout/MainLayout` — 사이드바(260px, 접으면 60px) + 본문(`padding: 24px 32px`, 세로 스크롤)
- 화면 틀: `PageContainer` 아래에 흰 카드(`Section` 또는 화면별 패널)를 쌓습니다.
- 반응형 기준: 1024px(태블릿), 768px(모바일). `Section.css` · `MyInfo`는 1000px · 600px도 씁니다.

---

## 5. 패턴 목록

원본 파일은 `src/components` 기준. "통일 메모"는 6장에서 정할 때 참고할 점입니다.

### 버튼

| 패턴 | 원본 | 핵심 값 | 통일 메모 |
| --- | --- | --- | --- |
| IconButton | 대부분 화면 | buttonface 배경, radius 5, hover 시 굵게 | 실질적인 기본 버튼 |
| Button (positive / negative) | `common/input/Input.jsx` | `rgb(86 151 255)` / `rgb(232 107 123)` | 실제 화면에서는 거의 안 씀 |
| 검색 (파랑) · 등록 (초록) · 초기화 | `admin/system/member/MemberManagement` | 36px, radius 4 | primary · success · secondary 후보 |
| 보조 · 위험 | `admin/system/member/MemberDetail` | 34px, 흰 배경 + 테두리 | secondary · danger(outline) 후보 |
| 작은 버튼 | `MemberDetail` (.btnRoleChange) | 30px | small 크기 후보 |
| 회색 납작 | `admin/system/access-role/AccessRole` | 29px, `#eee`, 12px | |
| 회색 테두리 | `admin/system/access/Access` | 35px, radius 3 | |
| 전체 폭 제출 | `login/Login` · `my/info/*Form` | 38px, 100% | block 변형 후보 |
| 뒤로 가기 | `my/course/MyCounsel` | 13px, 흰 배경 | |
| 진한 확인 / 밝은 취소 | `admin/course/.../ConfirmModal` 외 (인라인) | `#333` / `#fff` | 인라인 스타일 → 클래스로 |
| 선택형 채점 | `.../ExamGradeModal` (인라인) | 선택 시 채점 색으로 채움 | toggle 버튼 후보 |
| 텍스트 버튼 | `my/course/MyTimetable` | `#24518b`, 테두리 없음 | link 버튼 후보 |
| 사이드바 버튼 | `menu/SideMenu` | 어두운 배경용 | |
| 스타일 없는 버튼 | `HomeworkItem` · `Member*Modal` · `LogoutButton` · `MyCourse` | 브라우저 기본 | 공통 버튼으로 교체 대상 |

### 입력 · 폼

| 패턴 | 원본 | 핵심 값 |
| --- | --- | --- |
| 공통 Input (Id · Password · TextField · Checkbox · Radio · FileField) | `common/input/Input.jsx` | 43.5px, radius 7, 테두리 `#ddd` |
| 검색 툴바 (셀렉트 + 검색어 + 버튼, 오른쪽 등록) | `admin/system/member/MemberManagement` | 36px, 툴바 radius 6 |
| 라벨 위 필드 + 폼 카드 | `login/Login` · `my/info/*Form` · `Member*Modal` | 38px, 라벨 .875rem/600 |
| 13px 라벨 필드 + 접두어 입력 (`ROLE_`) | `admin/system/role/Role` | 35px, 3열 grid |
| 연쇄 셀렉트 (대 > 중 > 소) · 읽기 전용 코드 | `admin/system/access/Access` · `AccessRole` | 36 · 37px |
| 줄바꿈 인라인 폼 | `my/course/MyInterview` | 34px, 회색 상자 |
| 인라인 한 줄 폼 | `my/course/MyCounsel` (.inlineForm) | 34px |
| 날짜 · 숫자 · 검색 입력 | `CourseAdd` · `HomeworkSubmitStatus` · `MyCourseData` | 대부분 스타일 없음 |
| 글자 수 textarea | `my/course/MyCounsel` | min-height 96, 카운터 11px |
| 인라인 textarea | `HomeworkForm` · `ReplyForm` · `HomeworkItem` · `HomeworkReply` | radius 7 또는 없음 |
| 코드 답안 textarea | `ExamTakeModal` · `ExamQuestionViewModal` | Consolas |
| pill 라디오 | `my/course/MyCounsel` (.typeGroup) | radius 14, 선택 `#3f6fb5` |
| 기본 라디오 · 체크박스 · fieldset | `admin/test/AddTest` · `Survey` · `Test` | 브라우저 기본 |
| react-select | `admin/course/selector/*` · `Survey` | 기본 테마, 감싸는 div로 폭 (300 · 400px) |
| 파일 선택 상자 | `my/course/MyTimetable` | 275px, 숨긴 input + label 버튼 |

### 리스트 · 표

| 패턴 | 원본 | 핵심 값 |
| --- | --- | --- |
| Grid + 선택 행 | `MemberManagement` · `Code` · `AccessRole` · `Access` · my/course | 줄무늬 `#f7f7f7`, 선택 `#ddd` |
| CSS 모듈 표 (드래그 · 보호 행 · 작업 칸) | `admin/system/role/Role` | th 40px `#f7f7f7`, td 48px, 13px |
| 줄무늬 점선 표 | `.../ExamSetTable` (인라인) | 14px, 점선 `#e5e5e5` |
| 시간표 | `my/course/MyTimetable` | 11px, 머리글 `#bfd4fa`, 오늘 `#e3f6d0` |
| 3단 컬럼 리스트 | `admin/system/menu/MenuColumn` | 머리 48px, 선택 `#eef3fd` + ◀ |
| 상세 목록 (점선) | `admin/system/member/MemberDetail` | 110px \| 1fr |
| 상세 목록 (회색 상자) | `my/info/MyInfoForm` | 80px \| 1fr |
| 3열 정보 | `my/course/MyCounsel` | dt 12px 위, dd 14px 아래 |
| 회색 상자 글머리 목록 | `admin/system/role/RoleUserMoveModal` | max-height 200 |
| 타임라인 | `my/course/MyCounsel` | 왼쪽 선 `#d6dfec`, 점 `#3f6fb5` |
| 보기 선택 목록 | `admin/test/test/Test` | 선택 `#bbfdbb` |
| 시험 문제 블록 | `Exam*Modal` (인라인) | 제목 15px, 문제 상자 `#f7f7f7` |
| 댓글 | `.../HomeworkReply` (인라인) | 12px · 10px |

### 내비게이션

| 패턴 | 원본 | 핵심 값 |
| --- | --- | --- |
| 브레드크럼 | `common/Breadcrumb` | 13px `#777`, `⌂ > 대 > 중 > 소` |
| 화면 제목 | `common/PageContainer` | 22px, 아래 테두리 `#d0d0d0` |
| 밑줄 제목 (미사용) | `admin/system/access/Access` (.pageTitle) | 20px/600 |
| 회색 탭 바 | `admin/survey/survey/Survey` · `admin/test/test/Test` | `#f5f5f5`, 선택 `#fff`, 상자 radius 10 10 0 0 |
| 세그먼트 탭 | `Survey` (.surveyList) | `#ccc`, padding 10px 50px |
| 폴더 탭 | `.../ExamGradeModal` (인라인) | 선택 `#333` 배경 흰 글자 |
| 쿼리 파라미터 탭 | `my/course/MyCourse` | `tab-list` · `active` 클래스 정의 없음 → 기본 버튼 |
| 세로 탭 | `admin/course/CourseMain` | IconButton, 선택 `#fff` |
| 사이드 메뉴 | `menu/SideMenu` · `UserProfile` | 260px `#212529`, 현재 메뉴 `#ff5252` |
| Paginator | `common/Paginator` | 현재 페이지 빨간 글자 |

### 피드백

| 패턴 | 원본 | 핵심 값 |
| --- | --- | --- |
| 상태 배지 (정상 · 잠김) | `admin/system/member/MemberDetail` | .75rem/600, radius 12, 배경 + 테두리 |
| 등급 배지 (상 · 중 · 하 · 미진단) | `my/course/MyCounsel` | 12px/700, radius 12, 배경만 |
| 태그 칩 | `my/course/MyCounsel` (.typeTag) | 11px, `#e8eef7` / `#3f6fb5` |
| 채점 결과 글자 | `.../ExamGradeModal` | Y `#1a7f37` · N `#d1242f` · H `#0969da` · R `#9a6700` |
| 안내 상자 (권한 확인 · 권한 없음) | `Role` · `Menu` · `Access` · `AccessRole` · `menu/MenuGuard` | 같은 CSS가 5곳에 복사됨 |
| 빈 상태 | `MemberManagement`(점선) · `AccessRole`(가운데) · `Menu` · `Role`(td) · my/course(12px 문구) | 5가지 이상 |
| 로딩 | `MyInfoForm`(.loadingText) · my/course(.loading) · 버튼 문구 "저장 중..." | |
| 오류 + 다시 시도 | `Menu` · `Role` · `SideMenu` | 오류 상세 12px `#d64545` + refresh 버튼 |
| 필드 오류 문구 | `MyInfoForm` · `AddTest` · `MyCourseData` · `MyCounsel` · `HomeworkItem` | 5가지 (색 · 크기 다름) |
| 성공 메시지 | `my/info/*Form` | `#d1e7dd` / `#0f5132` |
| 힌트 문구 | `Role` · `Menu` · `MyCounsel` | 13px `#777` · 12px `#888` · 13px `#555` |
| 경고 상자 | `Menu` (.selfLockNotice) · `MyCounsel` (.notice) | 노랑 배경, 실선 / 점선 |
| 변경 안내 바 | `admin/system/role/Role` (.orderBar) | `#f3f7ff` / `#c9d9f5` |
| 토스트 | `my/course/MyCourseData` | 아래 가운데, 어두운 배경, 오류는 빨강 |
| 건수 표시 | `AccessRole` · `MyCourseData` | 12px |
| 브라우저 alert / confirm | Member · Role · Code · course 여러 곳 | 토스트 · 모달로 바꿀 후보 |
| 404 · 라우트 오류 화면 | `common/error/*` | 흰 상자, 개발 환경 오류 상세 |

### 레이아웃

| 패턴 | 원본 | 핵심 값 |
| --- | --- | --- |
| Section | `components/Section.jsx` | 흰 배경, padding 2rem, 제목 1.2rem |
| 머리 · 본문 · 바닥 패널 | `admin/system/member/MemberDetail` | radius 6, 머리 · 바닥 `#f8f9fa` |
| 제목 밑줄 패널 | `admin/system/access-role/AccessRole` | padding 30, 제목 17px |
| 제목 + 버튼 줄 카드 | `my/course/MyCounsel` (로컬 Section) | 제목 16px |
| 강조선 정보 카드 · 수치 카드 · 3칸 카드 · 인용 상자 | `my/course/MyCounsel` | `#3f6fb5` 강조 |
| 상세 머리 · 메타 · 본문 · 첨부 칩 | `my/course/MyCourseData` | 메타 12px `#777` |
| my/course 화면 틀 (.page > .content) | `MyCourseData` · `MyInterview` · `MyTimetable` · `MyCounsel` | 테두리 `#ccc` |
| 목록 \| 상세 | `MemberManagement` | grid `1fr 380px` |
| 3패널 | `AccessRole` · `Code` · `Menu` | grid 3열 |
| 대시보드 카드 | `main/Main` | Section과 같은 제목 여백 |

### 오버레이

| 패턴 | 원본 | 핵심 값 | 닫기 |
| --- | --- | --- | --- |
| 폼 모달 | `admin/system/member/Member*Modal` (MemberModal.module.css) | 460px, radius 6, 머리 · 바닥 구분선 | 버튼만 |
| 역할 이동 모달 | `admin/system/role/RoleUserMoveModal` | 460px, `role="dialog"` | 바깥 클릭 · Esc |
| 확인 모달 | `.../ConfirmModal` (인라인) | min 300px, radius 8, 가운데 정렬 | 바깥 클릭 = 취소 |
| 큰 내용 모달 | `ExamQuestionViewModal` · `ExamTakeModal` · `ExamGradeModal` (인라인) | 800 · 900px, 88 · 90vh | 모달마다 다름 |
| Alert · Confirm | `sample/Modal.jsx` | radius 10, 제목 1.4rem, 배경 `#000d` | 버튼 |
| 팝업 창 | `.../HomeWorkList` | `window.open` 1620×1080 | |

---

## 6. 통일할 때 볼 점

### 바로 고칠 문제 (모양이 의도와 다름)

- **정의되지 않은 클래스**: `tab-list`(MyCourse), `codeButtons` · `inputForm` · `codeInput` · `fieldError`(Code), `gridContainer`, `surveyPreview`, `repliesFooter`, `access-role-layout`, `pageList`(CourseItem, Paginator 모듈 안에만 있음), MyTimetable의 `loading` · `dateHeader` · `dateSelect`, Survey의 `surveyQuestion`
- ~~IconButton에 넘긴 `className`이 무시됨~~ → IconButton은 수정됨. 하지만 넘기던 클래스 자체가 없어서 아직 모양 변화는 없습니다: `admin/course/list/CourseItem.jsx`의 `"active"`(전역 `.active` 없음 → 탭 선택 표시가 여전히 안 보임), `admin/survey/survey/Survey.jsx`의 `style.addData`(Survey.module.css에 없음)
- **`.section` 전역 클래스**는 `Section.jsx`를 import한 화면에서만 로드됩니다. `CourseItem` · `CourseAdd` · `HomeworkItem`은 `className="section"`만 쓰고 있어서, 샘플 페이지를 먼저 열었는지에 따라 모양이 달라집니다.
- `CourseMain.jsx`의 `borederBotton` 오타 (스타일이 적용되지 않음)

### 정리 대상

- `App.jsx` · `App.css`: Vite 템플릿 잔재입니다. `App.css`는 `App.jsx`만 import하고, `App.jsx`는 아무 데서도 쓰지 않습니다.
- `index.css`의 `.main_container` · `.sidebar_container` · `.main_content`: 쓰는 곳이 없습니다 (`MainLayout.module.css`가 대신함).
- 같은 CSS 복사본: `.notice`(5곳), 모달 인라인 스타일 객체(`overlayStyle` · `boxStyle` · `headerStyle` … 4개 모달)
- `@fullcalendar/*` 패키지: 설치만 되어 있고 쓰는 곳이 없습니다.

### 결정 사항 (2026-11-16)

기준: 가장 정돈된 화면(회원 관리 · 로그인 · 내 정보 · 사이드바)이 이미 [Open Color](https://yeun.github.io/open-color/) 값을 쓰고 있어서(`#495057` `#ced4da` `#3b5bdb` `#2b8a3e` `#e03131` `#fff5f5` `#ffc9c9` `#ebfbee` `#b2f2bb`), 나머지를 이 체계로 맞춥니다. 명암비는 흰 배경 기준 어림값입니다.

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| 회색 팔레트 | Open Color gray 0 ~ 9 (= Bootstrap 계열) | 단순 회색은 테두리색만 6가지인 즉흥 값. 10단계 스케일이라 "테두리는 4번"처럼 규칙으로 말할 수 있고, 옮겨도 눈에 띄는 차이가 거의 없음 |
| 강조색 | indigo 7 `#3b5bdb`, hover indigo 8, 연한 배경 indigo 0 | 명암비 약 5.7:1 (`#4a7fd8`은 약 3.9:1로 AA 미달). 스케일에 속해 hover · 선택 배경이 따라옴. 지금 선택 행 `#eef3fd` ≒ indigo 0 |
| 상태색 | 성공 green · 오류 red · 정보 indigo, 각각 글자 / 배경 / 테두리 3단계. 경고 글자만 `#8a6100` | MemberDetail 배지가 이미 이 값. 오류 빨강 7가지 → red 8 하나. Open Color 노랑 · 주황은 명암비 4.5:1 미만이라 경고 글자만 예외 |
| 글자 크기 단위 | px, 7단계 (11 · 12 · 13 · 14 · 16 · 18 · 22) | 높이 · 여백이 모두 px이라 글자만 rem이면 확대 시 깨짐. 변수로 묶었으니 나중에 rem 전환은 한 곳만 고치면 됨 |
| 컨트롤 높이 | sm 30px · md 36px (표 머리글 40 · 행 48은 별도) | 36px이 가장 많고 34 · 35 · 37 · 38은 1 ~ 2px 차이. 단계가 적을수록 규칙이 단순함 |
| radius | 4px 기본 · 6px 큰 상자 · 999px pill | 4px이 ×59로 압도적. 배지 12 · pill 14는 "높이 절반"을 노린 값이라 pill이 의도를 유지 |
| 버튼 | variant primary · secondary(기본) · danger · text × size sm · md. IconButton은 같은 스타일에 아이콘 옵션 | 초록 "등록"은 primary로 합침 (강조색은 화면당 하나). IconButton이 가장 많이 쓰여 API는 유지하고 스타일만 교체. `buttonface` → 토큰, hover 굵기 변화(폭 흔들림) → 배경 변화, `className` · 나머지 props 전달 |
| 모달 | `common/Modal` 하나, 크기 sm 400 · md 460 · lg 800, `open` prop. Esc · 닫기 버튼은 항상, 바깥 클릭은 확인 · 읽기 모달만 | RoleUserMoveModal(portal · Esc · 바깥 클릭 · `role="dialog"`)을 기반으로 MemberModal 스타일. `sample/Modal`의 ref 명령형 API · 항상 렌더링 · z-index 999999는 버림 |
| 피드백 | 성공 · 요청 실패는 토스트, 입력 오류는 필드 아래 문구, `confirm()`은 확인 모달, 권한 없음 · 로딩 · 오류 · 빈 목록은 상태 상자 하나 | `alert()`는 화면을 막고 모양을 못 바꿈. 토스트는 MyCourseData 구현을 common으로. 상태 상자는 5곳에 복사된 `.notice` 기준 |
| 글꼴 | 본문 **Pretendard** (npm `pretendard`, 가변 글꼴 · 동적 서브셋), 코드 · ID는 `--font-mono` (Consolas 등) | 아래 참고 |

#### 글꼴을 Pretendard로 정한 이유

- 전에는 `"Roboto Mono"`가 첫 글꼴이라 영문 · 숫자가 고정폭으로 보였고, 글꼴 파일을 불러오지 않아 PC마다 다른 글꼴(대부분 맑은 고딕)로 보였습니다.
- 한글(본고딕 기반)과 영문 · 숫자(Inter 기반)를 한 글꼴 안에서 맞춰 디자인해서, 한글과 영문이 섞인 관리 화면(아이디 · 코드 · 날짜)에서 높이와 굵기가 어긋나지 않습니다.
- 가변 글꼴이라 파일 하나로 400 · 600 · 700 굵기를 모두 씁니다.
- 동적 서브셋이라 화면에 나온 글자가 속한 묶음만 내려받습니다 (한글 글꼴 전체를 받지 않음).
- npm 패키지로 넣어 Vite가 함께 빌드하므로 외부 CDN에 의존하지 않습니다 (사내망 · 오프라인에서도 동작).
- SIL Open Font License라 무료로 쓸 수 있습니다.
- Noto Sans KR도 괜찮지만, 영문 · 숫자 모양이 한글보다 가늘어 보이고 줄 간격이 넓어서 표 · 폼처럼 촘촘한 화면에는 Pretendard가 더 맞습니다.

적용: `main.jsx`에서 글꼴 CSS를 불러오고, `body`와 입력 · 버튼(`button` · `input` · `select` · `textarea`는 원래 글꼴을 물려받지 않음)이 `--font-sans`를 따릅니다. 옛 글꼴 조합을 직접 적었던 6곳(`IconButton.css` 2곳, my/course 화면 4곳)도 `var(--font-sans)`로 바꿨습니다.

### 다음 단계

1. ~~결정 사항을 `index.css`에 CSS 변수로 선언~~ → 완료 (7장)
2. 많이 겹치는 것부터 공통 클래스 + common 컴포넌트를 만들고 샘플 페이지 "표준" 섹션에 추가합니다.
   - ~~1차: 버튼 · 입력 · 배지 · 상태 상자~~ → 완료 (8장)
   - ~~2차: 토스트 · 확인 창 · 모달~~ → 완료 (8장)
   - ~~3차: 표 · 탭 · 패널 · 카드 (+ 페이지 이동 · 안내 상자 · 목록 · 배치)~~ → 완료 (8장)
   - ~~4차: 화면 머리 · 브레드크럼 · 사이드 메뉴 · 선택(pill · 세그먼트 · 스위치 · 켜고 끄는 버튼) · 날짜 · 파일 · 진행 막대~~ → 완료 (8장)
   - 남은 것 (표준 없음): react-select 테마, 시간표, 댓글, 시험 문제 블록, 404 화면. 화면을 옮기면서 필요할 때 만듭니다.
   - 다크 모드: 토큰 · 표준 UI는 대응 완료, 샘플 페이지에서만 켬 (9장)
3. 화면들을 표준으로 옮기면서 카탈로그의 해당 `Variant`를 지웁니다. 카탈로그가 비면 샘플 페이지가 곧 디자인 시스템 페이지가 됩니다.
4. `sample/`의 중복 컴포넌트(`input/`, `Grid`, `Paginator`)를 쓰는 화면을 `common/`으로 옮기고, `Modal`은 `common/`으로 이동합니다.

---

## 7. 디자인 토큰 (`index.css`)

`src/index.css`의 `:root`에 선언되어 있습니다. 샘플 페이지 "토큰" 섹션 맨 위에서 실제 값과 모양을 볼 수 있습니다 (index.css에서 직접 읽어 표시).

### 규칙

- 새 코드는 색 · 글자 크기 · 모서리 · 높이 · 그림자를 **hex나 px로 직접 적지 말고** `var(--토큰)`으로 씁니다.
- 화면 코드는 **의미 토큰**(`--color-*`, `--font-size-*` …)만 씁니다. 팔레트(`--gray-*`, `--indigo-*`, `--green-*`, `--red-*`, `--yellow-*`, `--brown-8`)는 의미 토큰을 정의할 때만 씁니다.
- 맞는 토큰이 없으면 값을 직접 적지 말고 이 문서에 토큰 추가를 먼저 제안합니다.
- 토큰 선언만 추가한 상태라 **기존 화면 모양은 아직 바뀌지 않았습니다.** 화면을 옮기는 작업은 다음 단계 2 · 3번입니다.

```css
.saveButton {
  height: var(--control-height-md);
  padding: 0 var(--control-padding-x-md);
  font-size: var(--font-size-md);
  color: var(--color-on-primary);
  background-color: var(--color-primary);
  border-radius: var(--radius);
}

.saveButton:hover {
  background-color: var(--color-primary-hover);
}
```

### 목록

| 묶음 | 토큰 |
| --- | --- |
| 글자색 | `--color-text` · `-text-secondary` · `-text-muted` · `-text-placeholder` · `-text-disabled` · `-text-inverse` |
| 배경 | `--color-bg-page` · `-bg-surface` · `-bg-subtle`(표 머리글 · 패널 머리 · 줄무늬) · `-bg-hover` · `-bg-disabled` |
| 테두리 | `--color-border`(입력 · 버튼 · 카드) · `-border-light`(표 행 · 구분선) · `-border-strong`(hover) |
| 강조 | `--color-primary`(채움) · `-primary-hover` · `-primary-light`(선택 행) · `-primary-border` · `-primary-text`(연한 배경 위 글자) · `--color-on-primary` · `--color-link` · `--color-focus` |
| 상태 | `--color-{success · danger · warning · info}` + `-bg` · `-border`, `--color-danger-fill` · `-danger-fill-hover`(채운 버튼) · `-danger-border-hover` |
| 사이드바 | `--color-sidebar-bg` · `-sidebar-text` · `-sidebar-muted` · `-sidebar-active` · `-sidebar-active-bg` |
| 오버레이 | `--color-overlay` · `--color-toast-bg` · `--color-toast-error-bg` |
| 글꼴 | `--font-sans` · `--font-mono`, `--font-size-{xs · sm · md · base · lg · xl · 2xl · 3xl}`, `--font-weight-{regular · semibold · bold}`, `--line-height-{tight · base}` |
| 크기 | `--control-height-{sm · md}` · `--control-padding-x-{sm · md}` · `--table-header-height` · `--table-row-height` · `--modal-width-{sm · md · lg}` |
| 모서리 | `--radius` · `--radius-lg` · `--radius-pill` |
| 그림자 | `--shadow-sm`(패널) · `--shadow-md`(토스트) · `--shadow-lg`(모달) |
| 쌓임 순서 | `--z-sticky` · `--z-modal` · `--z-toast` |

### 옮길 때 대응표

| 지금 값 | → 토큰 |
| --- | --- |
| `#333` `#222` `#212529` | `--color-text` |
| `#495057` `#555` `#666` | `--color-text-secondary` |
| `#777` `#888` `#999` `#868e96` | `--color-text-muted` |
| `#adb5bd` `#aaa` (placeholder · 비활성 글자) | `--color-text-placeholder` · `--color-text-disabled` |
| `#e9e9e9` (body) | `--color-bg-page` |
| `#f7f7f7` `#fafafa` `#f8f9fa` `#f5f5f5` | `--color-bg-subtle` |
| `#f2f2f2` `#f1f3f5` `#eee`(배경) | `--color-bg-hover` · `--color-bg-disabled` |
| `#ccc` `#ced4da` `#ddd` | `--color-border` |
| `#e5e5e5` `#e4e4e4` `#eee` `#e9ecef`(선) | `--color-border-light` |
| `#3b5bdb` `#3f6fb5` `#4a7fd8` `#6b9cf6` `rgb(86 151 255)` | `--color-primary` |
| `#eef3fd` `#f3f7ff` `#e8eef7` | `--color-primary-light` |
| `#1c7ed6` `#1a73e8` `#1a5fb4` `#24518b` | `--color-link` |
| `#c62828` `#dc3545` `#d64545` `#b42318` `#e03131` `#d93025` `#d1242f` | `--color-danger` |
| `#2b8a3e` `#1a7f37` `#1e7b34` `#0f5132` | `--color-success` |
| `#8a6100` `#9a6700` `#7a5b00` | `--color-warning` |
| 34 · 35 · 36 · 37 · 38 · 43.5px (입력 · 버튼) | `--control-height-md` |
| 29 · 30px | `--control-height-sm` |
| radius 3 · 4 · 5 · 7px | `--radius` |
| radius 6 · 8 · 10px (큰 상자) | `--radius-lg` |
| radius 12 · 14px (배지 · pill) | `--radius-pill` |
| 15px · 0.9rem · 0.875rem | `--font-size-base` (14px) |
| 0.85rem · 0.8rem | `--font-size-md` (13px) |
| 0.75rem | `--font-size-sm` (12px) |
| 17px · 20px · 1.25rem | `--font-size-lg` · `--font-size-xl` 중 가까운 것 |

### 테마 (예정)

강조색만 테마로 바뀌게 설계했습니다. `<html data-theme="...">`에 따라 `--color-primary*` 네 개만 덮어쓰면 됩니다. 회색 · 상태색 · 정보색은 고정입니다.

```css
:root[data-theme="teal"] {
  --color-primary: #087f5b;
  --color-primary-hover: #066649;
  --color-primary-light: #e6fcf5;
  --color-primary-border: #96f2d7;
}
```

---

## 8. 표준 UI

샘플 페이지 맨 위 **"표준 UI"** 섹션에서 모양과 사용 코드를 같이 볼 수 있습니다.

### 구조

| 층 | 위치 | 역할 |
| --- | --- | --- |
| 토큰 | `src/index.css` `:root` | 색 · 크기 값 (7장) |
| 전역 클래스 | `src/styles/button.css` · `form.css` · `badge.css` · `status.css` · `modal.css` · `toast.css` · `table.css` · `tabs.css` · `panel.css` · `nav.css` · `choice.css` (`index.css`가 `@import`) | **스타일의 원본.** 토큰만 사용 |
| React 컴포넌트 | `src/components/common/ui/` `Button` · `Field` · `Badge` · `StatusBox` · `Modal` · `ConfirmDialog` · `FeedbackProvider` · `Table` · `Pagination` · `Tabs` · `TabPanel` · `Panel` · `StatCard` · `Callout` · `PageHeader` · `Breadcrumb` · `SideNav` · `ChoiceGroup` · `Switch` · `FilePicker` · `FileList` · `Progress` | 클래스를 붙여 주는 얇은 껍데기 + 동작(로딩 · 접근성 · 기본 문구 · 열고 닫기) |
| 훅 | `src/components/common/ui/feedbackContext.js` `useToast` · `useConfirm` | `alert()` · `confirm()` 대신. `main.jsx`의 `FeedbackProvider`가 앱 전체를 감쌈 |

- raw HTML에도 클래스만 붙이면 같은 모양이 됩니다 (`<button className="btn btn-primary">`). 동작이 필요하면 컴포넌트를 씁니다.
- 클래스 이름은 짧은 접두어 + 하이픈(`btn-*`, `form-*`, `field-*`, `badge-*`, `status-box-*`)으로, `.input` · `.section` 같은 일반 단어는 쓰지 않습니다 (전역이라 다른 CSS와 부딪힘).
- 전역 클래스는 `main.jsx`에서 CSS module보다 먼저 불러옵니다. 그래서 화면의 CSS module이 같은 요소에 스타일을 주면 module 쪽이 이깁니다 (화면별로 살짝 조정할 수 있음, 남용은 금지).
- **기존 화면 모양은 바뀌지 않았습니다.** 새 클래스를 쓰는 곳은 샘플 페이지뿐이고, 기존 화면은 다음 단계 3번에서 옮깁니다.

### 버튼

| 클래스 | `Button` props | 쓰는 곳 |
| --- | --- | --- |
| `btn` | (기본) `variant="secondary"` | 대부분의 버튼: 취소 · 수정 · 추가 · 닫기 |
| `btn btn-primary` | `variant="primary"` | 화면의 주 동작 **하나**: 검색 · 저장 · 등록 · 로그인 |
| `btn btn-danger` | `variant="danger"` | 삭제 · 잠금 (테두리만 빨강) |
| `btn btn-danger-solid` | `variant="danger-solid"` | 삭제를 **확정**하는 모달 버튼만 |
| `btn btn-text` | `variant="text"` | 링크처럼 보이는 버튼: 자세히 · [접기] |
| `btn-sm` | `size="sm"` | 30px. 표 행 안 · 툴바처럼 좁은 곳 |
| `btn-block` | `block` | 전체 폭 (로그인 · 폼 제출) |
| `btn-icon` | 글자 없이 `icon`만 | 정사각형. **`aria-label` 필수** |
| — | `loading` | 돌아가는 아이콘 + 비활성. 문구는 "저장 중..."으로 직접 바꿈 |
| `btn-group` · `btn-group-end` | — | 버튼 묶음 (간격 8px), 오른쪽 정렬 |

```jsx
import Button from "../common/ui/Button";
import { icons } from "../common/input/icons";

<div className="btn-group btn-group-end">
  <Button onClick={close}>취소</Button>
  <Button variant="primary" icon={icons.ok} loading={saving} onClick={save}>
    {saving ? "저장 중..." : "저장"}
  </Button>
</div>
```

- 아이콘은 기존 `icons.js`를 그대로 씁니다. 크기는 md 16px · sm 14px로 정해져 있습니다.
- 나머지 props(`onClick`, `type`, `title`, `aria-*` …)는 `<button>`에 그대로 전달됩니다. `type` 기본값은 `"button"` (폼 제출 버튼만 `type="submit"`).

### 입력 · 폼

| 클래스 | 쓰는 곳 |
| --- | --- |
| `form-control` | `input` · `select` · `textarea` 공통 (36px, textarea는 최소 96px) |
| `form-control-sm` | 30px |
| `form-control-mono` | 코드 · ID 입력 (고정폭) |
| `field` · `field-label` · `field-required` · `field-hint` · `field-error` · `field-counter` | 필드 틀 (`Field` 컴포넌트가 붙여 줌) |
| `input-group` + `input-group-text` | 접두어 + 입력 (`ROLE_`) |
| `form-check` · `form-check-group` | 체크박스 · 라디오 + 글자 (네이티브 input, 강조색) |
| `form-row` | 필드 여러 개를 한 줄에 (좁으면 줄바꿈, 버튼은 아래쪽 정렬) |
| `form-stack` | 필드를 세로로 16px 간격 |

```jsx
import Field from "../common/ui/Field";

<Field label="아이디" htmlFor="userId" required hint="영문 · 숫자 4 ~ 20자" error={errors.userId}>
  <input
    id="userId"
    className="form-control"
    value={userId}
    onChange={(e) => setUserId(e.target.value)}
    aria-invalid={!!errors.userId}
    aria-describedby="userId-msg"
  />
</Field>
```

- 오류가 있으면 힌트 대신 오류만 보입니다 (`role="alert"`). 입력 칸은 `aria-invalid="true"`일 때 빨간 테두리가 됩니다.
- 오류 · 힌트 문구의 id는 `${htmlFor}-msg`입니다. 입력의 `aria-describedby`에 넣어 스크린 리더가 함께 읽게 합니다.
- 글자 수: `count={{ current: memo.length, max: 200 }}`
- 상태: `disabled`(회색 배경), `readOnly`(회색 배경 · 글자는 보통), 포커스는 강조색 테두리 + 연한 그림자.
- 기존 `common/input/Input.jsx`의 컴포넌트(`Id` · `Password` · `TextField` · `Checkbox` · `Radio` …)는 그대로 두었습니다. 새 화면은 네이티브 입력 + `form-control`을 씁니다.

### 배지 · 태그

| 클래스 | `Badge` props | 쓰는 곳 |
| --- | --- | --- |
| `badge` | `tone="neutral"` (기본) | 미진단 · 해당 없음 |
| `badge badge-primary` | `tone="primary"` | 진행 중 |
| `badge badge-success` | `tone="success"` | 정상 · 정답 · 상 |
| `badge badge-danger` | `tone="danger"` | 잠김 · 오답 · 하 |
| `badge badge-warning` | `tone="warning"` | 채점 중 · 중 · 주의 |
| `badge badge-info` | `tone="info"` | 부분 정답 · 안내 |
| `tag` | — | 분류 칩 (학습 · 진로), 테두리 없이 작게 |

같은 의미에는 같은 tone을 씁니다. 화면마다 새 배지 색을 만들지 않습니다.

### 상태 상자

| `type` | 기본 문구 | 아이콘 | 스크린 리더 |
| --- | --- | --- | --- |
| `loading` | 불러오는 중... | 돌아가는 아이콘 | `role="status"` |
| `empty` | 데이터가 없습니다. | — | — |
| `error` | 불러오지 못했습니다. (상세는 빨강) | 오류 | `role="alert"` |
| `denied` | 권한이 없습니다. | — | — |

```jsx
import StatusBox from "../common/ui/StatusBox";

if (loading) return <StatusBox type="loading" />;
if (error) return <StatusBox type="error" detail={error.message} onRetry={reload} />;
if (list.length === 0) return <StatusBox type="empty" title="검색 결과가 없습니다." />;
```

- `title`로 기본 문구를 바꾸고, `detail`로 둘째 줄(줄바꿈 유지)을 넣습니다. `onRetry`가 있으면 [다시 시도] 버튼이 나옵니다.
- `size="sm"`: 테두리 없이 작게. 목록 · 표 안의 빈 상태에 씁니다.
- 지금 5곳에 복사된 `.notice`(권한 확인 중 · 권한 없음), 빈 상태 5가지, 로딩 문구들을 옮길 대상입니다.

### 토스트 (`alert()` 대신)

```jsx
import { useToast } from "../common/ui/feedbackContext";

const toast = useToast();

try {
  await saveMember(form);
  toast.success("저장했습니다.");
} catch (error) {
  toast.error(getErrorMessage(error));
}
```

| 함수 | 모양 | 사라지는 시간 |
| --- | --- | --- |
| `toast.success(문구)` | 어두운 배경 + 확인 아이콘 | 2.5초 |
| `toast.error(문구)` | 빨간 배경 + 오류 아이콘, `role="alert"` | 4초 |
| `toast.show(문구)` | 어두운 배경 | 2.5초 |

- 화면 아래 가운데에 뜨고, 누르면 바로 닫힙니다. 한 번에 3개까지 (넘으면 오래된 것부터 사라짐).
- 시간을 바꾸려면 `toast.error(문구, { duration: 6000 })`. 문구의 `\n`은 줄바꿈됩니다.
- 언제 무엇을 쓰나
  - 저장 · 삭제 성공, 요청 실패 → 토스트
  - 입력값 오류 → 필드 아래 문구 (`Field`의 `error`), 토스트 아님
  - 화면을 못 쓰는 상태(권한 없음 · 목록을 못 불러옴) → 상태 상자
- `my/course/MyCourseData`의 자체 토스트는 이것으로 옮길 대상입니다 (모양은 같은 계열).

### 확인 창 (`confirm()` 대신)

```jsx
import { useConfirm } from "../common/ui/feedbackContext";

const confirm = useConfirm();

const handleDelete = async () => {
  const ok = await confirm({
    title: "시험 삭제",
    message: "Java 기초 시험을 삭제할까요?\n삭제하면 되돌릴 수 없습니다.",
    confirmText: "삭제",
    danger: true,
  });
  if (!ok) return;
  // 삭제 요청
};

if (await confirm("변경 내용을 저장할까요?")) save();   // 문구만
```

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `title` | 확인 | |
| `message` | — | `\n` 줄바꿈 유지 |
| `confirmText` · `cancelText` | 확인 · 취소 | 동작을 그대로 적기 ("삭제", "제출") |
| `danger` | false | 확인 버튼 빨강(`danger-solid`), 처음 포커스는 **취소** (Enter 실수 방지) |

- 바깥 클릭 · Esc · 닫기(X)는 모두 취소(`false`)입니다.
- 확인을 누른 뒤 요청이 끝날 때까지 창을 띄워 두려면 `ConfirmDialog`를 상태로 직접 씁니다 (`open` · `loading` · `onConfirm` · `onCancel`).

### 모달

```jsx
import Modal from "../common/ui/Modal";

<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="회원 등록"
  description="초기 비밀번호는 아이디와 같습니다."
  onSubmit={save}
  dismissible={!saving}
  footer={
    <>
      <Button onClick={() => setOpen(false)} disabled={saving}>취소</Button>
      <Button type="submit" variant="primary" loading={saving}>
        {saving ? "등록 중..." : "등록"}
      </Button>
    </>
  }
>
  <div className="form-stack">{/* Field들 */}</div>
</Modal>
```

| props | 설명 |
| --- | --- |
| `open` · `onClose` | 열림 여부 · 닫기. `onClose`가 없으면 닫기(X) 버튼도 없음 |
| `title` · `summary` · `description` | 제목, 제목 오른쪽 요약("문제 8개 · 총 80점"), 본문 맨 위 회색 설명 |
| `size` | `sm` 400px(확인) · `md` 460px(폼, 기본) · `lg` 800px(내용) |
| `footer` | 바닥 버튼 (오른쪽 정렬, 간격 8px). 순서는 **취소 → 주 동작** |
| `onSubmit` | 주면 모달 전체가 `<form>` → Enter · `type="submit"` 버튼으로 제출, 브라우저 `required` 검사도 동작 |
| `dismissible` | `false`면 Esc · X · 바깥 클릭으로 닫히지 않음 (저장 중) |
| `closeOnBackdrop` | 바깥 클릭으로 닫기. **읽기 · 확인용만** `true` (폼은 입력이 날아가므로 기본 `false`) |
| `initialFocusRef` | 처음 포커스할 요소 (기본: 본문의 첫 입력, 없으면 모달 자체) |

- `document.body`에 portal로 그리므로 화면의 스크롤 · `overflow: hidden` 영향을 받지 않습니다.
- 접근성: `role="dialog"` · `aria-modal` · 제목 연결, Tab은 모달 안에서만 돌고, 닫히면 연 버튼으로 포커스가 돌아갑니다.
- 모달 안에서 또 모달(확인 창)을 띄우면 Esc · Tab은 맨 위 것만 처리합니다.
- 본문만 스크롤되고 머리 · 바닥은 고정입니다 (높이는 화면 높이 - 32px까지).
- 옮길 대상: `Member*Modal`(폼, md), `RoleUserMoveModal`(md), `ConfirmModal`(→ `useConfirm`), `Exam*Modal`(lg), `sample/Modal`의 `Alert` · `Confirm`.

### 표 · 페이지 이동

`Table`은 공통 `Grid`를 대신할 표준 표입니다. 칸 내용은 `render`로 자유롭게 넣습니다 (배지 · 버튼).

```jsx
import Table from "../common/ui/Table";
import Pagination from "../common/ui/Pagination";

<Table
  ariaLabel="회원 목록"
  columns={[
    { key: "id", title: "아이디", width: "18%", mono: true, sortable: true },
    { key: "name", title: "이름", sortable: true },
    { key: "score", title: "평균", align: "num", render: (r) => `${r.score}점` },
    { key: "status", title: "상태", align: "center",
      render: (r) => <Badge tone={r.locked ? "danger" : "success"}>{r.locked ? "잠김" : "정상"}</Badge> },
    { key: "actions", title: "작업", align: "actions", width: 170,
      render: (r) => <Button size="sm" icon={icons.edit} onClick={() => edit(r)}>수정</Button> },
  ]}
  rows={members}
  rowKey="id"
  selectedKey={selectedId}
  onRowClick={(row) => setSelectedId(row.id)}
  sort={sort}
  onSortChange={setSort}
  loading={loading}
  emptyText="검색 결과가 없습니다."
/>
<div className="table-footer">
  <span>전체 {total}건</span>
  <Pagination page={page} totalPages={totalPages} onChange={setPage} />
</div>
```

| 기능 | 방법 |
| --- | --- |
| 칸 정렬 | `align`: `num`(오른쪽 · 고정폭 숫자) · `center` · `actions`(오른쪽 버튼 칸) |
| 코드 · 긴 글 | `mono` · `ellipsis`(한 줄 말줄임 + 마우스를 올리면 전체) |
| 선택 행 | `selectedKey` + `onRowClick` → 강조 배경 + 왼쪽 선, 행에 Tab · Enter 가능 |
| 흐린 행 | `isRowMuted={(row) => row.locked}` (미사용 · 보호 행) |
| 정렬 | 열에 `sortable`, `sort` · `onSortChange`. **데이터 정렬은 호출한 쪽**(API 정렬이면 요청만 다시) |
| 빈 · 로딩 | `loading`, `rows=[]` → 표 안에 작은 상태 상자 |
| 모양 | `size="sm"`(행 38px) · `striped` · `maxHeight`(표 안 스크롤 + 머리글 고정) |

- 컴포넌트 없이: `<div className="table-wrap"><table className="table table-hover">…`, 행에 `is-selected` · `is-clickable` · `is-muted`, 칸에 `col-num` · `col-center` · `col-actions` · `cell-mono`.
- `Pagination`의 `page`는 **0부터** (API와 같음). 번호는 10개씩, 처음 · 이전 · 다음 · 끝 버튼, 페이지가 1개면 아무것도 그리지 않습니다.

### 탭

```jsx
import { useId } from "react";
import { Tabs, TabPanel } from "../common/ui/Tabs";

const idBase = useId();

<Tabs
  idBase={idBase}
  ariaLabel="강의실 메뉴"
  items={[
    { id: "timetable", label: "시간표" },
    { id: "data", label: "자료실", count: 12 },
    { id: "survey", label: "설문", disabled: true },
  ]}
  value={tab}
  onChange={setTab}
/>
<TabPanel idBase={idBase} tabId={tab}>{/* 선택된 탭 내용 */}</TabPanel>
```

- `variant="line"`(기본): 화면 · 패널 안의 구역 전환. `variant="pills"`: 같은 목록의 보기 방식 전환 (객관식 / 주관식).
- 키보드: ← → 로 이동하며 바로 선택, Home · End.
- 선택 상태는 부모가 가집니다. 쿼리 파라미터 탭은 `value={searchParams.get("tab")}` · `onChange={(id) => setSearchParams({ tab: id })}`처럼 연결합니다.

### 패널 · 카드

| 무엇 | 쓰는 곳 | 사용 |
| --- | --- | --- |
| `Panel` | 화면의 주요 구역 (상세 · 목록 · 설정) | `title` · `subtitle`(건수) · `badge` · `actions`(머리 버튼) · `footer`(바닥 버튼) · `flush`(표 · 목록을 가장자리까지) |
| `card` | 같은 종류 여러 개를 나열 (과정 · 문제) | `card-header` · `card-title` · `card-meta` · `card-body`, 나열은 `card-grid` |
| `card card-clickable` | 누르는 카드 | `<button>`에 붙이고 `aria-pressed`, 선택이면 `is-selected` |
| `card card-accent` | 화면 맨 위 요약 정보 | 왼쪽 강조선 |
| `StatCard` | 수치 (평균 점수 · 출석률) | `label` · `value` · `unit` · `hint` · `trend`(`"up"` · `"down"`) |

패널과 카드의 차이: 패널은 **화면을 나누는 틀**(보통 한 화면에 1 ~ 3개, 머리 · 바닥 있음), 카드는 **같은 모양의 항목을 여러 개** 늘어놓을 때 씁니다.

### 안내 상자 · 키-값 목록 · 선택 목록 · 타임라인

```jsx
<Callout tone="warning" title="주의">이 역할을 빼면 메뉴 관리에 들어올 수 없습니다.</Callout>
<Callout tone="info" actions={<Button size="sm" variant="primary">저장</Button>}>순서가 변경되었습니다.</Callout>

<dl className="desc-list" style={{ "--desc-label-width": "80px" }}>
  <dt>아이디</dt><dd>user01</dd>
</dl>

<ul className="list-group">
  <li><button type="button" className="list-item" aria-current={selected || undefined}>회원 관리</button></li>
</ul>

<ol className="timeline">
  <li className="timeline-item">
    <div className="timeline-meta">2026-11-10 <span className="tag">학습</span></div>
    <p className="timeline-body">진도 확인</p>
  </li>
</ol>
```

| 무엇 | 메모 |
| --- | --- |
| `Callout` | tone `info` · `success` · `warning` · `danger` · `neutral`. 화면에 **머무는** 안내. 결과 알림은 토스트, 화면을 못 쓰는 상태는 `StatusBox` |
| `desc-list` | 키-값. 라벨 폭은 `--desc-label-width`(기본 120px), 회색 상자는 `desc-list-boxed` |
| `list-group` · `list-item` | 선택 목록 (메뉴 관리 3단 등). 선택은 `aria-current="true"`, 미사용은 `is-muted`, 오른쪽 내용은 `list-item-end` |
| `timeline` | 상담 기록처럼 날짜순 기록 |

### 배치

| 클래스 | 쓰는 곳 |
| --- | --- |
| `toolbar` | 화면 위 검색 · 필터 줄 (왼쪽 `form-row`, 오른쪽 주 동작 버튼) |
| `layout-split` | 목록 \| 상세 (오른쪽 폭 `--layout-aside-width`, 기본 380px) |
| `layout-3col` | 3단 (대 > 중 > 소, 역할 · 허용 · 전체) |
| `form-stack` | 세로로 16px 간격 쌓기 (폼 밖에서도 씀) |

1024px보다 좁으면 `layout-split` · `layout-3col`은 한 줄에 하나씩 쌓입니다. 샘플 "표준 UI 2"의 마지막 예시(회원 관리 화면)가 이 부품들만으로 만든 화면입니다.

### 화면 머리 · 브레드크럼

```jsx
<PageHeader
  crumbs={[{ title: "시스템 관리", to: "/admin/system" }, { title: "회원 관리" }]}
  title="회원 관리"
  description="회원 정보 · 역할 · 잠금 상태를 관리합니다."
  actions={<Button variant="primary" icon={icons.add}>회원 등록</Button>}
/>
<Breadcrumb crumbs={[...]} />   {/* 브레드크럼만 */}
```

- 기존 `common/PageContainer`(`⌂ > 대 > 중`, 22px 제목)를 대신할 모양입니다. `PageContainer`는 아직 그대로이며, 옮길 때 안쪽 머리를 `PageHeader`로 바꾸면 됩니다 (`useBreadcrumbs`의 결과를 `crumbs`로).
- 브레드크럼은 `<ol>`이고 구분자 `›`는 CSS가 그립니다. 마지막 항목(현재 화면)은 링크 없이 `aria-current="page"`.
- `actions`에는 화면 전체에 걸리는 동작만 둡니다 (등록 · 내보내기). 목록 위 검색 · 필터는 `toolbar`.

### 사이드 메뉴

```jsx
<SideNav groups={[{ key, title, items: [{ key, title, icon }] }]} currentKey={current} onSelect={(item) => navigate(item.path)} />
```

- 색은 `--color-sidebar-*` 토큰 (기존 `menu/SideMenu`와 같은 값). 다크 모드와 상관없이 항상 어둡습니다.
- 그룹은 `<details open>`이라 제목을 누르면 접힙니다. 현재 화면 항목은 `aria-current="page"` (빨간 글자 + 왼쪽 선).
- 실제 `menu/SideMenu`는 아직 바꾸지 않았습니다 (다음 단계 3번).

| 비슷한 것 | 쓰는 곳 |
| --- | --- |
| `SideNav` | 화면 이동 (앱 왼쪽) |
| `Tabs` | 화면 안 구역 전환 (회색 탭 바 · 세로 탭 · 폴더 탭 대신) |
| `list-group` | 목록에서 하나 고르기 (3단 메뉴 · `CourseMain` 세로 탭 대신) |
| `ChoiceGroup` · `Switch` | 값 고르기 |

### 선택 (pill · 세그먼트 · 켜고 끄는 버튼 · 스위치)

```jsx
<ChoiceGroup name="counsel-type" legend="상담 유형" options={[{ value: "study", label: "학습" }]} value={type} onChange={setType} />
<ChoiceGroup multiple name="filter" legend="분류" options={options} value={filters} onChange={setFilters} />
<ChoiceGroup variant="segmented" name="period" legend="기간" options={options} value={period} onChange={setPeriod} />

<Button aria-pressed={grade === "Y"} onClick={() => setGrade("Y")}>정답</Button>
<Switch checked={onlyMine} onChange={setOnlyMine}>내 과정만 보기</Switch>
```

| 무엇 | 쓰는 곳 | 메모 |
| --- | --- | --- |
| `ChoiceGroup` (pill) | 상담 유형 · 분류 필터 (`MyCounsel` `.typeGroup` 대신) | 진짜 `radio` · `checkbox`라 키보드 · 폼 제출이 그대로. `multiple`이면 `value`가 배열. `name`은 화면에서 고유하게 |
| `ChoiceGroup variant="segmented"` | 보기 방식 · 기간 | 항상 하나가 골라진 2~4개 |
| `btn` + `aria-pressed` | 선택형 채점 (`ExamGradeModal`) | 눌린 버튼은 강조 배경. 결과 색(정답 초록 · 오답 빨강)은 버튼이 아니라 `Badge`로 |
| `Switch` | 바로 적용되는 설정 | 저장 버튼을 눌러야 적용되는 값은 체크박스(`form-check`) |

### 날짜 · 숫자 · 기간

- `date` · `time` · `number` · `search` 입력도 `.form-control` 하나로 씁니다 (`CourseAdd` · `HomeworkSubmitStatus`의 스타일 없는 입력 대신). 달력 아이콘 색은 다크 모드를 따릅니다.
- 기간은 `input-range`로 묶습니다.

```jsx
<Field label="수강 기간" htmlFor="period-start" required error={rangeError}>
  <div className="input-range">
    <input id="period-start" type="date" className="form-control" aria-invalid={!!rangeError} aria-describedby="period-start-msg" />
    <span className="input-range-sep">~</span>
    <input type="date" className="form-control" aria-label="종료일" />
  </div>
</Field>
```

### 파일

```jsx
<FilePicker accept=".xlsx" onSelect={([file]) => setFile(file)} fileName={file?.name} />
<FilePicker multiple label="첨부 추가" onSelect={addFiles} />
<FileList files={[{ key, name, size, href }]} onRemove={removeFile} />
```

- 숨긴 `input[type=file]`(`visually-hidden`) + 버튼 모양 label입니다. Tab으로 오면 버튼에 포커스 테두리가 생깁니다. `common/input`의 `FileField` · `MyTimetable` 파일 상자를 대신합니다.
- `onSelect`는 `File[]`을 줍니다. 같은 파일을 다시 골라도 불리도록 고른 뒤 input 값을 비웁니다.
- `FileList`: `href`가 있으면 이름이 내려받기 링크(`MyCourseData` 첨부 칩 대신), `onRemove`가 있으면 지우기 버튼. 크기는 `size`(바이트)를 KB · MB로 보여 줍니다.

### 진행 막대

```jsx
<Progress label="진도율" value={42} showValue />
<Progress label="제출률" value={18} max={20} tone="success" showValue />
```

- `tone`: 기본(강조색) · `success`(완료) · `warning` · `danger`(마감 임박). `size="sm"`은 4px.
- `label`은 화면에 안 보이는 이름입니다 (`role="progressbar"`). 과정 카드 안에서 쓰는 예시는 샘플 "표준 UI 3"에 있습니다.

---

## 9. 다크 모드

### 지금 상태

- 토큰 · 표준 UI(8장)는 다크 모드를 지원합니다.
- **샘플 페이지에서만 켤 수 있습니다** (목차 오른쪽 [☾ 다크 모드] 버튼, 이 브라우저에 기억). 페이지를 떠나면 꺼져서 다른 화면은 항상 밝은 모드입니다.
- 샘플의 "통일 전" · "기존 샘플" 영역과 그 모달은 색을 직접 적어서 다크 모드에서도 **밝게 고정**됩니다 (아래 "밝은 섬").

### 구조

```html
<html data-color-scheme="dark">              <!-- 전체 다크 -->
  ...
  <div data-color-scheme="light">...</div>   <!-- 이 안만 밝게 (밝은 섬) -->
```

- `index.css`에서 **색 토큰만** 두 벌입니다: `:root, [data-color-scheme="light"]`(기본)와 `[data-color-scheme="dark"]`. 크기 · 글꼴 · 모서리 토큰은 하나입니다.
- 속성을 붙인 요소 안에서 토큰 값이 바뀌므로, 토큰만 쓴 코드는 **아무것도 고치지 않아도** 다크 모드가 됩니다. hex를 직접 적은 코드는 바뀌지 않습니다.
- `color-scheme`도 함께 바뀌어 네이티브 입력 · 셀렉트 목록 · 날짜 선택기 · 스크롤바가 모드를 따릅니다.
- 모달 · 토스트는 `<body>`에 portal로 그려지므로, 밝은 섬 안에서 연 모달이 밝아야 하면 모달 최상위 요소에도 `data-color-scheme="light"`를 붙입니다 (`sample/Modal.jsx` · 샘플 오버레이 예시가 그렇게 함).

### 다크 모드 색

| 토큰 | 밝은 모드 | 다크 모드 |
| --- | --- | --- |
| `--color-bg-page` · `-bg-surface` · `-bg-subtle` | gray-2 · 흰색 · gray-0 | `#141619` · gray-9 · `#2a2f34` |
| `--color-text` · `-text-secondary` · `-text-muted` | gray-9 · gray-7 · gray-6 | gray-1 · gray-4 · gray-5 |
| `--color-border` · `-border-light` | gray-4 · gray-3 | gray-7 · gray-8 |
| `--color-primary`(채움) | indigo-7 | indigo-7 (흰 글자 명암비를 지키려고 그대로) |
| `--color-primary-text` · `--color-link` | indigo-7 | indigo-3 (어두운 배경 위 글자) |
| `--color-primary-light` | indigo-0 | 반투명 인디고 |
| 상태 글자 (`success` · `danger` · `warning` · `info`) | green-9 · red-8 · `#8a6100` · indigo-7 | green-4 · red-4 · yellow-4 · indigo-3 |
| 상태 배경 · 테두리 | 0단계 · 2단계 | 반투명 (배경 0.14 ~ 0.2, 테두리 0.35) |
| `--color-danger-fill` (채운 위험 버튼) | red-8 | red-8 (그대로) |

"채움"(버튼 배경)과 "글자"(연한 배경 · 어두운 배경 위 글씨)를 다른 토큰으로 나눈 이유가 이것입니다. 어두운 배경 위 글자는 밝은 색이어야 읽히지만, 흰 글자를 올리는 버튼 배경은 진해야 합니다. 새 코드에서 강조색 **글자**는 `--color-primary-text`, 위험 **채운 배경**은 `--color-danger-fill`을 씁니다.

### 앱 전체로 넓히려면

1. 화면들이 토큰을 쓰도록 옮깁니다 (다음 단계 3번). 옮기지 않은 화면은 다크 모드에서 깨지므로, 그 전에는 켜지 않습니다.
2. 사이드바(`menu/SideMenu`)와 `PageContainer` · `Breadcrumb` · `Section`의 색을 토큰으로 바꿉니다.
3. 설정 위치(사이드바 프로필 · 내 정보)에 스위치를 두고, `<html>`에 속성을 붙이는 코드를 `main.jsx` 쪽으로 옮깁니다. "시스템 설정 따르기"(`prefers-color-scheme`)를 기본값으로 둘지도 이때 정합니다.
4. 새로고침 때 밝은 화면이 잠깐 보이지 않게 `index.html`에서 속성을 먼저 붙입니다 (테마와 같은 방법).
