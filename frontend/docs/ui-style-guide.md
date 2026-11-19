# UI 스타일 가이드 (표준 UI · 현황)

프론트엔드의 디자인 시스템(표준 UI)과, 표준을 만들기 전 화면들의 모양을 함께 모아 둔 문서입니다. 화면을 표준으로 옮길 때 이 문서만 보고 따라 할 수 있게 씁니다.

- 실제 모양: 샘플 페이지 `/sample` (사이드바 메뉴 "Sample", 맨 위 목차 버튼으로 이동)
- 코드: `src/components/sample/catalog/` (스타일은 `Catalog.module.css` 하나에 모음)
- 기준: 2026-11-17 `dev` 브랜치

> **따를 기준은 7장(토큰) · 8장(표준 UI) · 9장(다크 모드)입니다.** 6장은 결정 사항과 화면 옮기는 순서 · 화면별 대응을 다룹니다. 1 ~ 5장과 표준화 전 카탈로그는 **"표준화 전에는 이렇게 되어 있었다"** 를 남긴 기록이라 따라 만들지 않습니다.

---

## 1. 샘플 페이지 구성

페이지는 큰 구역 셋을 **탭**으로 나눕니다. 맨 위 고정 상자의 탭으로 구역을 고르고, 그 아래 버튼으로 구역 안 섹션으로 이동합니다. 고른 탭은 주소에 남습니다 (`/sample?part=legacy` · `?part=old`, 표준은 `/sample`). 구역마다 `PartHeader`(`CatalogParts.jsx`)로 큰 제목과 왼쪽 색 선을 달았습니다.

| 구역 | 색 | 내용 |
| --- | --- | --- |
| PART 1 **표준** | 강조색 | 새 화면이 쓰는 UI. 다크 모드를 따름 |
| PART 2 **표준화 전 (기록)** | 경고색 | 표준으로 옮기기 전 화면들의 모양 (기록). 표준을 적용한 화면은 [표준 적용] · [일부 적용] 표시. 다크 모드에서도 밝게 고정 |
| PART 3 **기존 샘플** | 회색 | 처음부터 있던 `sample/` 컴포넌트 예시 (기록. 컴포넌트는 `components/archive/sample/`) |

표준 탭은 **부품의 역할**로 일곱 묶음으로 나눕니다 (만든 순서가 아님). 기초 → 동작 · 입력 → 표시 · 상태 → 데이터 → 배치 · 탐색 → 내용 → 화면 예시 순서이고, 8장도 같은 순서입니다.

- **동작 · 입력**: 사용자가 누르거나 값을 넣는 것
- **표시 · 상태**: 상태 · 결과 · 알림을 보여 주는 것 (값을 넣지 않음)
- **데이터**: 여러 행을 보여 주고 고르는 것
- **배치 · 탐색**: 화면의 틀과 이동
- **내용**: 글 · 문제 · 기록처럼 읽는 내용을 담는 블록
- **화면 예시**: 위 부품만으로 만든 화면. 화면을 옮길 때 따라 만드는 본

| 목차 | 내용 | 파일 |
| --- | --- | --- |
| **기초** | 표준 토큰(index.css, 7장. 실제 값을 index.css에서 읽어 표시) · 확정한 강조색(인디고) · 테마(네이비, 7장). 표준 탭 사용법 안내 | `TokenCatalog.jsx` (`TokenCatalog`) |
| **동작 · 입력** | 버튼 · 입력 · 폼 · 검색 셀렉트 · 선택(pill · 세그먼트 · 켜고 끄는 버튼 · 스위치) · 날짜 · 숫자 · 기간 · 검색 · 파일 · 반복 입력 행 | `StandardInputCatalog.jsx` |
| **표시 · 상태** | 배지 · 태그 · 안내 상자 · 상태 상자 · 진행 막대 · 토스트 · 확인 창 · 모달 | `StandardFeedbackCatalog.jsx` |
| **데이터** | 표 · 페이지 이동 · 표 확장(체크 선택 · 편집 · 순서 바꾸기 · 시간표) · 두 목록 사이 옮기기 | `StandardDataCatalog.jsx` |
| **배치 · 탐색** | 화면 머리 · 브레드크럼 · 사이드 메뉴 · 탭 · 패널 · 카드 · 선택 목록 · 3단 배치 · 팝업 창 틀 | `StandardLayoutCatalog.jsx` |
| **내용** | 시험 문제 · 댓글 · 키-값 목록 · 타임라인 · 인용 · 세로 키-값 · 상자 목록 | `StandardContentCatalog.jsx` |
| **화면 예시** | 부품을 조합한 화면: 목록 \| 상세 · 상세 · 대시보드 · 오류 화면 · 과정 등록 · 과정 상세 · 시험 문제 고르기 · 채점 · 시험 응시 · 시험지 보기 · 문제 은행 목록 · 문제 은행 문제 추가 · 수정 · 과제 상세(보기 ↔ 수정) · 주간 접속 기록 · 날짜별 시간표 · 목록 위 추가 폼 · 댓글 수정 · 설문 편집기 · 설문 결과(집계) · 메뉴 관리(순서 바꾸기) · 접근 관리 · 권한별 접근 권한 관리 · 환경 변수 관리 · 로그인 · 비밀번호 다시 확인 · 상담 기록 | `StandardScreenCatalog.jsx` + `ScreenStudyCatalog.jsx` · `ScreenSystemCatalog.jsx` · `ScreenMyCatalog.jsx` |
| 토큰 (통일 전 값) | **표준화 전 탭** 맨 앞. 화면에 직접 적힌 색 · 글자 크기 · 모서리 · 컨트롤 높이 · 포커스 · 비활성 | `archive/LegacyTokenCatalog.jsx` |
| 버튼 | 공통 컴포넌트 + 화면별 raw 버튼 13종 | `archive/ButtonCatalog.jsx` |
| 입력 · 폼 | 공통 Input 컴포넌트, 검색 툴바, 폼 필드 4종, textarea, 라디오 · 체크박스, react-select, 파일 | `archive/FormCatalog.jsx` |
| 리스트 · 표 | Grid, native table 3종, 3단 컬럼 리스트, 키-값 목록 4종, 타임라인, 문제 블록, 댓글 | `archive/ListCatalog.jsx` |
| 내비게이션 | 브레드크럼 · 화면 제목, 탭 5종, 사이드 메뉴, Paginator | `archive/NavigationCatalog.jsx` |
| 피드백 | 배지 · 태그, 안내 · 빈 상태 · 로딩, 오류 · 성공 · 힌트 문구, 경고 상자, 토스트, 오류 화면 | `archive/FeedbackCatalog.jsx` |
| 레이아웃 | 패널 · 카드 6종, 화면 배치 (목록 \| 상세, 3패널) | `archive/LayoutCatalog.jsx` |
| 오버레이 | 폼 모달, 확인 모달, 큰 내용 모달 (열어 볼 수 있음) | `archive/OverlayCatalog.jsx` |
| 과정 · 시험 · 문제 은행 · 과제 · 설문 화면 | admin/course · test · survey의 과정 머리 · 탭, 등록 폼, 문제 고르기(Grid 둘), 문제 은행 문제 추가 폼(`AddTest` · `UpdateTest`), 과제 상세, 설문 편집, 과정 설문 목록 + 추가 폼(`CourseSurvey` · `CourseSurveyForm`), 설문 응답 팝업(`CourseSurveyAns`), 설문 결과(`CourseSurveyResult`) | `archive/CourseLegacyCatalog.jsx` |
| 기존 샘플 | 원래 있던 Buttons · Modals · FileInput · Grids · Paginator · Chart · Poll | `Sample.jsx` 아래쪽 |

파일 위치 (2026-11-18부터):

- 표준 탭 카탈로그: `sample/catalog/` (`TokenCatalog.jsx` · `Standard*Catalog.jsx` · `Screen*Catalog.jsx`)
- 표준화 전 탭 카탈로그: `sample/catalog/archive/` (위 표의 `archive/…`)
- 표준화 전 · 기존 샘플 탭이 쓰는 **옛 컴포넌트**: `components/archive/` (원래 경로 그대로, 예: `archive/common/Breadcrumb.jsx`). **새 코드에서 import 금지**이고 lint 오류가 납니다 (`eslint.config.js`). 안내와 대체 부품은 `components/archive/README.md`
- 섹션 틀은 `CatalogParts.jsx`의 `CatalogSection` (샘플 전용 틀, 표준 UI 아님)

카탈로그의 칸 하나는 `Variant`입니다. 칸 머리 오른쪽 회색 글자(`source`)는 부품 예시에서는 **원본 파일**(`src/components` 기준), 화면 예시에서는 그 화면이 **쓰는 부품 목록**이고, 클래스 이름은 `Catalog.module.css`의 주석에 원본 CSS 위치가 적혀 있습니다.

### 새 UI가 필요할 때

1. **표준(8장)에서 찾습니다.** 8장 "어떤 걸 쓰나" 표와 샘플 표준 탭을 봅니다.
2. 없으면 **비슷한 부품을 조합**합니다 (8장 "화면 예시"가 조합하는 본).
3. 그래도 없으면 **새 표준 부품을 제안**합니다. 위 묶음 중 역할이 맞는 표준 카탈로그 파일에 그룹 컴포넌트(`GroupTitle` + `Variants`, 상태는 그 그룹 안에)로 넣고 8장의 같은 묶음에 설명을 씁니다. 승인은 6장 "팀이 정할 것"을 따릅니다.
4. 표준화 전 카탈로그와 5장은 기록용입니다. 새 코드의 모양을 여기에 추가하지 않습니다.

카탈로그 칸(`Variant`)의 형식은 아래와 같습니다.

```jsx
<Variant name="이름" source="원본 경로" note="설명 (선택)">
    {/* 실제 모양 */}
</Variant>
```

---

## 2. 공통 컴포넌트

표준 UI 컴포넌트(`common/ui/`)의 전체 목록은 8장 "구조" 표에 있습니다. 아래는 그 전부터 있던 컴포넌트이고, 표준으로 바꾸는 법은 6장 "기존 컴포넌트 → 표준 대응"에 있습니다.

2026-11-18에 화면에서 쓰지 않는 옛 컴포넌트는 `components/archive/`(기록, import 금지)로 옮겼고, `Grid` · `Paginator` · `IconButton`도 마지막 화면(환경 변수 · 회원 관리)을 옮겨서 2026-11-19에 옮겼습니다. 아직 화면이 쓰는 것은 `PageContainer` 하나이고 `@deprecated`를 붙여 두었습니다. 3 ~ 5장의 위치는 옮기기 전 경로입니다.

| 컴포넌트 | 위치 | 주요 props · 메모 |
| --- | --- | --- |
| `PageContainer` | `common/PageContainer.jsx` | 호환용 틀. 안쪽은 표준 `PageHeader` (2026-11-17). `title`을 안 넘기면 브레드크럼 마지막 항목. 새 화면은 `PageHeader`를 직접 씀 |
| `Section` | `archive/Section.jsx` (기록) | 흰 카드 + 1.2rem 제목. `title`, `nopadding`, `nomargin`, `direction`, `itemGap` |
| `Grid` | `archive/common/Grid.jsx` (기록) | CSS grid 표. `header`, `content`, `columnStyle`, `checkable`, `editable`, `clickableColumn`, `activeRows`, `footer` |
| `Paginator` | `archive/common/Paginator.jsx` (기록) | `start`, `countPerPageGroup`, `activePage`, `setActivePage`, `totalPageCount` |
| `IconButton` | `archive/common/input/IconButton.jsx` (기록) | `icon`, `iconSize`(기본 20, 화면에서는 주로 16), `backgroundColor`, `disabled`, `hoverIconRotate`, `alwaysIconRotate`, `style`. `className` · 그 밖의 props(`aria-label` 등)는 `<button>`에 전달 (2026-11-16 수정, sample 복사본도 같음). 모양은 아직 그대로 — 표준 `Button`으로 바꾸는 법은 6장 "기존 컴포넌트 → 표준 대응" |
| `icons` | `common/input/icons.js` | edit, close, add, setting, fullStar, star, login, logout, download, downloadDone, progress, delete, refresh, sort, unchecked, checked, radioUnChecked, radioChecked, home, arrowRight, error, ok, full, exitFull |
| `Id` · `Password` · `TextField` · `NativeSelect` · `Textarea` · `Checkbox` · `Radio` · `FileField` · `Button` | `archive/common/input/Input.jsx` (기록) | `NativeSelect` · `Textarea`는 스타일 클래스가 정의되어 있지 않아 브라우저 기본 모양 |
| `Editor` | `common/Editor.jsx` | 리치 텍스트 에디터 (MyCourseData에서 사용). 카탈로그에는 넣지 않음 |
| `NotFound` · `RouteError` | `common/error/` | 404 · 라우트 오류 화면. 표준 `StatusBox size="lg"`로 옮김 (2026-11-17) |
| `Alert` · `Confirm` | `archive/sample/Modal.jsx` (기록) | `ref.current.open()`. 새 코드는 `common/ui/Modal` · `useConfirm()`을 씀 (8장). 메뉴 관리는 2026-11-17에 옮겨서 화면에서 쓰는 곳은 없음. 기존 샘플 탭만 씀 |
| `Chart` · `PollList` | `archive/sample/` (기록) | 기존 샘플 탭 전용. 화면용 차트는 `common/Chart.jsx`(2026-11-18 성적 화면에서 추가, 표준 아님). `DataGrid`는 아무도 쓰지 않아 삭제 (2026-11-18) |

### sample / common 중복

| 파일 | 차이 |
| --- | --- |
| `input/` (IconButton, Input, icons), `Paginator` | 두 폴더가 완전히 같음 |
| `Grid.jsx` | common만 `activeRows`(선택 행 배경)가 있고, `clickableColumn` 콜백이 `(value, rowIndex)` (sample은 `(value)`) |
| `Modal.jsx` | sample에만 있음. 화면에서 쓰는 곳은 없음 (메뉴 관리는 2026-11-17에 `useConfirm`으로 옮김) |

2026-11-18 기준 `sample/` 컴포넌트를 가져다 쓰는 화면은 없습니다. `sample/`의 컴포넌트는 모두 `archive/sample/`(기록)로 옮겼고, `sample/`에는 샘플 페이지(`Sample.jsx` · `catalog/`)만 남았습니다.

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
| 줄무늬 점선 표 | `.../ExamSetTable` (인라인) | 14px, 점선 `#e5e5e5` |
| 시간표 | `my/course/MyTimetable` | 11px, 머리글 `#bfd4fa`, 오늘 `#e3f6d0` |
| 상세 목록 (점선) | `admin/system/member/MemberDetail` | 110px \| 1fr |
| 상세 목록 (회색 상자) | `my/info/MyInfoForm` | 80px \| 1fr |
| 3열 정보 | `my/course/MyCounsel` | dt 12px 위, dd 14px 아래 |
| 타임라인 | `my/course/MyCounsel` | 왼쪽 선 `#d6dfec`, 점 `#3f6fb5` |
| 보기 선택 목록 | `admin/test/test/Test` | 선택 `#bbfdbb` |
| 시험 문제 블록 | `Exam*Modal` (인라인) | 제목 15px, 문제 상자 `#f7f7f7` |
| 댓글 | `.../HomeworkReply` (인라인) | 12px · 10px |

### 내비게이션

| 패턴 | 원본 | 핵심 값 |
| --- | --- | --- |
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
| 안내 상자 (권한 확인 · 권한 없음) | `Access` · `AccessRole` | 같은 CSS가 2곳에 복사됨 |
| 빈 상태 | `MemberManagement`(점선) · `AccessRole`(가운데) · my/course(12px 문구) | 3가지 이상 |
| 로딩 | `MyInfoForm`(.loadingText) · my/course(.loading) · 버튼 문구 "저장 중..." | |
| 오류 + 다시 시도 | `SideMenu` | 오류 상세 12px `#d64545` + refresh 버튼 |
| 필드 오류 문구 | `MyInfoForm` · `AddTest` · `MyCourseData` · `MyCounsel` · `HomeworkItem` | 5가지 (색 · 크기 다름) |
| 성공 메시지 | `my/info/*Form` | `#d1e7dd` / `#0f5132` |
| 힌트 문구 | `MyCounsel` | 13px `#555` |
| 경고 상자 | `MyCounsel` (.notice) | 노랑 배경, 점선 |
| 토스트 | `my/course/MyCourseData` | 아래 가운데, 어두운 배경, 오류는 빨강 |
| 건수 표시 | `AccessRole` · `MyCourseData` | 12px |
| 브라우저 alert / confirm | Member · Code · course 여러 곳 | 토스트 · 모달로 바꿀 후보 |

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
| 3패널 | `AccessRole` · `Code` | grid 3열 |
| 대시보드 카드 | `main/Main` | Section과 같은 제목 여백 |

### 오버레이

| 패턴 | 원본 | 핵심 값 | 닫기 |
| --- | --- | --- | --- |
| 폼 모달 | `admin/system/member/Member*Modal` (MemberModal.module.css) | 460px, radius 6, 머리 · 바닥 구분선 | 버튼만 |
| 확인 모달 | `.../ConfirmModal` (인라인) | min 300px, radius 8, 가운데 정렬 | 바깥 클릭 = 취소 |
| 큰 내용 모달 | `ExamQuestionViewModal` · `ExamTakeModal` · `ExamGradeModal` (인라인) | 800 · 900px, 88 · 90vh | 모달마다 다름 |
| Alert · Confirm | `sample/Modal.jsx` | radius 10, 제목 1.4rem, 배경 `#000d` | 버튼 |
| 팝업 창 | `.../HomeWorkList` | `window.open` 1620×1080 | |

---

## 6. 통일할 때 볼 점

### 바로 고칠 문제 (모양이 의도와 다름)

- **정의되지 않은 클래스**: `tab-list`(MyCourse), `codeButtons` · `inputForm` · `codeInput` · `fieldError`(Code), `gridContainer`, `surveyPreview`, `repliesFooter`, `access-role-layout`, `pageList`(CourseItem, Paginator 모듈 안에만 있음), MyTimetable의 `loading` · `dateHeader` · `dateSelect`, Survey의 `surveyQuestion`
- ~~IconButton에 넘긴 `className`이 무시됨~~ → IconButton은 수정됨. 하지만 넘기던 클래스 자체가 없어서 아직 모양 변화는 없습니다: `admin/course/list/CourseItem.jsx`의 `"active"`(전역 `.active` 없음 → 탭 선택 표시가 여전히 안 보임), `admin/survey/survey/Survey.jsx`의 `style.addData`(Survey.module.css에 없음)
- **`.section` 전역 클래스**는 `Section.jsx`를 import한 화면에서만 로드됩니다. `CourseItem` · `CourseAdd` · `HomeworkItem`은 `className="section"`만 쓰고 있어서, 샘플 페이지를 먼저 열었는지에 따라 모양이 달라집니다. → 2026-11-18 기준 이 클래스를 쓰는 화면은 없음 (표준화 전 카탈로그만 `archive/Section.css`를 직접 불러 씀).
- `CourseMain.jsx`의 `borederBotton` 오타 (스타일이 적용되지 않음)

### 정리 대상

- `App.jsx` · `App.css`: Vite 템플릿 잔재입니다. `App.css`는 `App.jsx`만 import하고, `App.jsx`는 아무 데서도 쓰지 않습니다.
- `index.css`의 `.main_container` · `.sidebar_container` · `.main_content`: 쓰는 곳이 없습니다 (`MainLayout.module.css`가 대신함).
- 같은 CSS 복사본: `.notice`(2곳: `Access` · `AccessRole`), 모달 인라인 스타일 객체(`overlayStyle` · `boxStyle` · `headerStyle` … 4개 모달)
- `@fullcalendar/*` 패키지: 설치만 되어 있고 쓰는 곳이 없습니다.

### 결정 사항 (2026-11-16)

기준: 가장 정돈된 화면(회원 관리 · 로그인 · 내 정보 · 사이드바)이 이미 [Open Color](https://yeun.github.io/open-color/) 값을 쓰고 있어서(`#495057` `#ced4da` `#3b5bdb` `#2b8a3e` `#e03131` `#fff5f5` `#ffc9c9` `#ebfbee` `#b2f2bb`), 나머지를 이 체계로 맞춥니다. 명암비는 흰 배경 기준 어림값입니다.

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| 회색 팔레트 | Open Color gray 0 ~ 9 (= Bootstrap 계열) | 단순 회색은 테두리색만 6가지인 즉흥 값. 10단계 스케일이라 "테두리는 4번"처럼 규칙으로 말할 수 있고, 옮겨도 눈에 띄는 차이가 거의 없음 |
| 강조색 | indigo 7 `#3b5bdb`, hover indigo 8, 연한 배경 indigo 0 | 명암비 약 5.7:1 (`#4a7fd8`은 약 3.9:1로 AA 미달). 스케일에 속해 hover · 선택 배경이 따라옴. 지금 선택 행 `#eef3fd` ≒ indigo 0 |
| 상태색 | 성공 green · 오류 red · 정보 blue (처음엔 강조색과 같은 indigo였으나, 강조색(primary) 후보를 넣으며 강조색을 바꿔도 뜻이 같도록 분리), 각각 글자 / 배경 / 테두리 3단계. 경고 글자만 `#8a6100` | MemberDetail 배지가 이미 이 값. 오류 빨강 7가지 → red 8 하나. Open Color 노랑 · 주황은 명암비 4.5:1 미만이라 경고 글자만 예외 |
| 글자 크기 단위 | px, 8단계 (11 · 12 · 13 · 14 · 16 · 18 · 22 · 28) | 높이 · 여백이 모두 px이라 글자만 rem이면 확대 시 깨짐. 변수로 묶었으니 나중에 rem 전환은 한 곳만 고치면 됨 |
| 컨트롤 높이 | sm 30px · md 36px (표 머리글 40 · 행 48은 별도) | 36px이 가장 많고 34 · 35 · 37 · 38은 1 ~ 2px 차이. 단계가 적을수록 규칙이 단순함 |
| radius | 4px 기본 · 6px 큰 상자 · 999px pill | 4px이 ×59로 압도적. 배지 12 · pill 14는 "높이 절반"을 노린 값이라 pill이 의도를 유지 |
| 버튼 | variant primary · secondary(기본) · danger · text × size sm · md. IconButton은 같은 스타일에 아이콘 옵션 | 초록 "등록"은 primary로 합침 (강조색은 화면당 하나). IconButton이 가장 많이 쓰여 API는 유지하고 스타일만 교체. `buttonface` → 토큰, hover 굵기 변화(폭 흔들림) → 배경 변화, `className` · 나머지 props 전달 |
| 모달 | `common/ui/Modal` 하나, 크기 sm 400 · md 460 · lg 800, `open` prop. 기본은 Esc · X로 닫힘, 바깥 클릭은 `closeOnBackdrop`일 때만 (확인 · 읽기 모달). 예외: 저장 중은 `dismissible={false}`, 시험 응시처럼 [제출]로만 닫혀야 하면 `onClose`를 넘기지 않음. 모달 안 셀렉트 목록에서 Esc를 누르면 목록만 닫힘 | RoleUserMoveModal(portal · Esc · 바깥 클릭 · `role="dialog"`)을 기반으로 MemberModal 스타일. `sample/Modal`의 ref 명령형 API · 항상 렌더링 · z-index 999999는 버림 |
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
   - ~~5차: 표 확장(체크 선택 · 편집 · 순서 바꾸기 · 시간표) · react-select 테마 · 시험 문제 · 댓글 · 인용 · 세로 키-값 · 상자 목록 · 오류 화면 + 화면 예시(상세 · 대시보드)~~ → 완료 (8장)
   - ~~6차 (admin/course · survey): 두 목록 사이 옮기기 · 반복 입력 행 · 답안 상자 · 팝업 창 틀 + 화면 예시 7개(과정 등록 · 과정 상세 · 문제 고르기 · 채점 · 과제 상세 · 설문 편집기 · 팝업), 통일 전 탭에 같은 화면의 지금 모양~~ → 완료 (8장)
   - ~~표준 탭 재구성: 만든 차수(1 ~ 5차)로 나뉘던 섹션을 역할별 일곱 묶음(기초 · 동작 · 입력 · 표시 · 상태 · 데이터 · 배치 · 탐색 · 내용 · 화면 예시)으로~~ → 완료 (1장 · 8장)
   - ~~7차 (문제 은행): 문제 은행 문제 추가 · 수정 폼 + `ListEditor` `renderMarker`(줄 앞 정답 표시) + 통일 전 탭에 `AddTest`~~ → 완료 (8장)
   - ~~8차 (화면 전체 점검): 화면 파일마다 표준 대응을 분류(아래 "화면별 표준 대응")하고, 조합 규칙이 필요하거나 부품이 모자란 화면 13개의 예시와 부품(문항 번호 이동 · 가운데 카드 · 강조 행 · 왼쪽 좁은 배치)을 만듦~~ → 완료 (8장)
   - ~~9차 (PR 전 점검): 공통 부품 버그 · 접근성 수정(`Button` `loading` · `Modal` Esc · Tab · `Field` 자동 연결 · `SelectBox` 메뉴 · `Table` · `Tabs` · `TransferList` · 토스트 · `ListEditor`, 8장 각 부품) + 문서 보강(화면 옮기는 순서 · 기존 컴포넌트 대응 · 어떤 걸 쓰나 · 공통 규칙 · 팀이 정할 것)~~ → 완료
   - ~~10차 (보류 정리): 메뉴 관리 순서 바꾸기 예시(`Table` 순서 + 저장 바), 작은 화면 사이드바 서랍(실제 `SideMenu`), 설문 결과 집계 예시. 보류였던 세 가지를 모두 결정함~~ → 완료
3. 화면들을 표준으로 옮기면 표준화 전 카탈로그에 [표준 적용]이 붙도록 `sample/catalog/standardization.js`의 `STANDARDIZED`에 화면 이름을 추가합니다 (아래 "화면 옮기는 순서"). 예시는 지우지 않고 기록으로 남깁니다.
4. ~~`sample/`의 중복 컴포넌트(`input/`, `Grid`, `Paginator`)를 쓰는 화면을 `common/`(가능하면 표준)으로 옮깁니다. `sample/Modal`은 쓰는 곳을 `common/ui/Modal` · `useConfirm`으로 바꾼 뒤 삭제합니다.~~ → 화면은 모두 옮김. 지우지 않고 `components/archive/`(기록)로 모음 (2026-11-18, 아래 "정한 것")

차수 밖의 현황:

- 표준을 만들지 않기로 한 것: TextField 떠 있는 라벨(라벨은 위), 팝업 창(`window.open`, UI 아님), 기존 샘플 Chart · Poll(샘플 밖에서 안 씀. 차트를 쓰게 되면 그때 색을 토큰으로), 리치 텍스트 `Editor`(외부 에디터, 옮길 때 테두리 · 높이만 맞춤)
- 다크 모드: 앱 전체에서 켤 수 있음 (사이드바 [☾] 버튼, 2026-11-17). 2026-11-19 기준 `MainLayout` 안의 모든 라우트가 `darkReady`입니다 (9장 "지금 상태")
- 강조색(primary)과 테마(brand): 강조색은 **인디고**, 테마(사이드바 색)는 **네이비**로 확정 (2026-11-17). 고르는 기능(샘플 페이지 강조색 후보 · 사이드바 테마 견본)은 지움 (7장 "강조색 (primary) 과 테마 (brand)")

### 팀이 정할 것

정한 것: 강조색 인디고 · 테마(사이드바) 네이비 (7장), 다크 모드는 앱 전체 · 기본 밝은 모드 · 화면별로 옮기면 켜짐 (9장). 모두 2026-11-17.
표준화 전 예시는 지우지 않고 기록으로 남김: 탭 이름 "표준화 전 (기록)", 표준을 적용한 화면은 [표준 적용] 표시 (2026-11-18). 2026-11-17에 지웠던 메뉴 관리 · 권한 관리 · 404 · 오류 · 화면 틀 예시도 되살림.
옛 컴포넌트도 지우지 않음 (2026-11-18): 화면이 쓰지 않는 것은 `components/archive/`(원래 경로 그대로, README, lint로 import 금지)로, 아직 쓰는 것은 `@deprecated`를 붙여 두고 마지막 사용 화면을 옮기는 PR에서 `archive/`로 옮김. `Grid` · `Paginator` · `IconButton`은 2026-11-19에 옮겼고, 남은 것은 `PageContainer` 하나. 표준화 전 카탈로그는 `sample/catalog/archive/`.

1. **새 표준 부품 · 토큰 승인**: 누가 어떻게 승인할지 (예: PR 리뷰 1명 이상 + 8장 · 7장에 추가).
2. **메뉴 아이콘**: 메뉴 데이터에 아이콘을 넣을지. 넣으면 접힌 사이드바를 "아이콘 띠 + 올리면 펼쳐지는 메뉴"로 바꿀 수 있습니다 (지금은 접힌 상태에서 메뉴를 표시하지 않음, 8장 "사이드 메뉴").

### 화면 옮기는 순서

한 화면을 표준으로 옮길 때 이 순서로 합니다.

1. 아래 "화면별 표준 대응" 표에서 화면을 찾고, 분류에 맞는 예시 · 부품을 확인합니다.
2. 옛 컴포넌트(`@deprecated` 표시: 지금은 `PageContainer`만 남음) import를 표준 부품으로 바꿉니다 (아래 "기존 컴포넌트 → 표준 대응"). `components/archive/`는 import할 수 없습니다.
3. 틀을 바꿉니다: `PageContainer` → `PageHeader`, 흰 카드 → `Panel`.
4. 화면 CSS의 hex · px 값을 토큰으로 바꿉니다 (7장 "옮길 때 대응표").
5. `alert()` · `confirm()`을 토스트(`useToast`) · `useConfirm`으로 바꿉니다.
6. 불러오는 중 · 빈 목록 · 오류 · 권한 없음 상태를 `StatusBox`로 넣습니다.
7. 화면 CSS module에서 표준 클래스와 겹치는 규칙을 지웁니다 (8장 "공통 규칙").
8. 사이드바 [☾]로 다크 모드를 켜고 확인한 뒤, 그 화면 라우트의 `handle`에 `darkReady: true`를 넣습니다 (`router/MainRouterProvider.jsx`). 넣기 전에는 다크 모드여도 그 화면은 밝게 보입니다 (9장).
9. `sample/catalog/standardization.js`의 `STANDARDIZED`에 옮긴 화면 이름(파일 이름, 확장자 없이)을 넣고, `REMAINING`에 있었으면 뺍니다. 표준화 전 탭의 그 화면 예시에 [표준 적용]이 붙습니다. 예시는 지우지 않습니다. 아래 "화면별 표준 대응" 표의 그 화면 분류 뒤에도 **표준 적용 (날짜)** 를 붙입니다.
10. 이 화면이 어떤 옛 컴포넌트의 **마지막 사용처**였으면, 그 컴포넌트를 `components/archive/`로 옮깁니다 (원래 경로 그대로, 맨 위 기록용 한 줄, `archive/README.md` 표에 추가). 샘플 표준화 전 탭이 그 컴포넌트를 쓰면 그쪽 import 경로도 바꿉니다.

### 기존 컴포넌트 → 표준 대응

#### `IconButton` → `Button`

| `IconButton` | `Button` |
| --- | --- |
| `icon` | `icon` 그대로 |
| `iconSize` (20 · 16) | 크기는 정해져 있음 (md 16px). 작게는 `size="sm"` (14px) |
| `backgroundColor` · `color` | `variant` (`primary` · `secondary` · `danger` · `text`) |
| `hoverIconRotate` · `alwaysIconRotate` | `icons.refresh`면 자동, 다른 아이콘은 `className="btn-icon-rotate"`. 계속 도는 것은 `loading` |
| `disabled` · `style` · 그 밖의 props | 그대로 (`style`은 지우고 클래스로) |

#### `Paginator` → `Pagination`

| `Paginator` (`common` · `sample`) | `Pagination` |
| --- | --- |
| `activePage` · `setActivePage` | `page` · `onChange` |
| `totalPageCount` | `totalPages` |
| `countPerPageGroup` (기본 10) | `groupSize` (기본 10) |
| `start` (지금 묶음의 첫 페이지, 화면이 계산) | 없음 (`page`로 직접 계산) |
| `id` | 없음 |

- 둘 다 페이지 번호는 **0부터**입니다 (화면에는 +1해서 보임). 값을 바꾸지 않고 그대로 넘기면 됩니다.
- 화면에 있던 `start` 계산 코드는 지웁니다. 페이지가 1개면 `Pagination`은 아무것도 그리지 않습니다.

#### `common/input/Input.jsx` (지금은 `archive/`) → `Field` + 네이티브 입력

| 기존 | 표준 |
| --- | --- |
| `Id` · `Password` · `TextField` | `Field` + `<input className="form-control">` (`type="password"` 등) |
| `NativeSelect` · `Textarea` | `Field` + `select.form-control` · `textarea.form-control` |
| `Checkbox` · `Radio` | `form-check` (여러 개는 `form-check-group`), pill 모양은 `ChoiceGroup` |
| `FileField` | `FilePicker` (+ `FileList`) |
| `Button` (positive · negative) | `common/ui/Button` |

- `Input.jsx`도 `Button`을 내보냅니다. 표준 `common/ui/Button`과 이름이 같으므로 한 파일에서는 하나만 import합니다.

#### 틀 · 표

| 기존 | 표준 | 메모 |
| --- | --- | --- |
| `Grid` | `Table` | props 대응은 8장 "표 · 페이지 이동" |
| `Section` (`title` · `nopadding` · `direction` · `itemGap`) | `Panel` (`title` · `flush`) + 안쪽 `form-stack` · `form-row` | `nopadding` → `flush`. 방향 · 간격은 props 대신 배치 클래스 |
| `PageContainer` (`title`) | `PageHeader` (`crumbs` · `title` · `description` · `actions`) | `crumbs`는 `useBreadcrumbs()` 결과를 넘김. `title`을 안 넘기던 화면은 브레드크럼 마지막 항목의 `title`을 넘김 |
| `sample/Modal` (`Alert` · `Confirm`) | `Modal` · `useConfirm` | 8장 "모달" · "확인 창" |

### 화면별 표준 대응 (2026-11-18, 2026-11-19 갱신)

화면 파일(`components`의 `sample` · `common` 밖)마다 표준으로 옮길 때 무엇을 보면 되는지 분류했습니다. 새 화면을 만들거나 옮길 때 이 표에서 찾고, 표에 없는 화면이 생기면 같은 기준으로 한 줄 추가합니다. 2026-11-17에 `dev`를 합치며 과정 설문 화면을, 2026-11-18에 설문 통계 팝업을 추가했습니다.

분류 뒤의 **표준 적용 (날짜)** 는 그 화면에 표준 UI를 적용한 날입니다 (git 기록 기준). 샘플 표준화 전 탭의 [표준 적용] 배지와 같은 목록(`sample/catalog/standardization.js`의 `STANDARDIZED`)이라, 화면에 표준을 적용하면 두 곳을 함께 고칩니다. 표시가 없는 화면이 남은 작업입니다.

| 분류 | 뜻 | 할 일 |
| --- | --- | --- |
| **예시** | 샘플 "화면 예시"에 같은 화면이 있음 | 그 예시를 따라 옮김 |
| **부품** | 부품만 조합하면 됨 (새로 정할 것 없음) | 메모의 부품을 씀 |
| **예시 (8차)** | 조합할 때 정할 것이 있어 이번에 예시를 만듦 | 그 예시를 따라 옮김 |
| **부품 + 예시 (8차)** | 표준 부품이 모자라 부품도 새로 만듦 | 새 부품 + 예시 |
| 보류 · 제외 | 이유 참고 | - |

한 화면에 두 분류가 섞이면 같이 적습니다. "부품 · 보류 1"은 부품으로 옮기되 보류한 것이 1개, "예시 · 제외 1"은 예시를 따르되 표준 밖으로 둔 것이 1개라는 뜻이고, 메모의 **보류** · **제외**에 그 내용이 있습니다.

| 화면 | 분류 | 메모 |
| --- | --- | --- |
| `admin/course/add/CourseAdd` · `list/CourseItem` | 예시 · **표준 적용 (2026-11-17, `CourseItem` 2026-11-18)** | 과정 등록 · 과정 상세 |
| `admin/course/CourseMain` | 부품 · **표준 적용 (2026-11-17)** | 과정 목록: `list-group`(현재 과정 `aria-current`) + 머리 [추가] |
| `CourseTableComponent/ExamPage` · `ExamQuestionPicker` | 예시 · **표준 적용 (2026-11-17)** | 시험 문제 고르기 |
| `ExamGradeModal` | 예시 · **표준 적용 (2026-11-17)** | 채점 |
| `ExamTakeModal` · `ExamQuestionViewModal` | 부품 + 예시 (8차) · **표준 적용 (2026-11-17)** | 시험 응시 · 시험지 보기. 새 부품 `question-nav` |
| `ExamSetTable` · `my/course/MyTest` | 부품 · **`ExamSetTable` 표준 적용 (2026-11-17)** | `Table`. 역할마다 다른 칸은 `columns` 배열을 걸러서 (칸을 숨기는 CSS 아님), 공개 Y/N은 `Badge` + 바꿀 때 `useConfirm`. 규칙: 목록에서 바로 바꾸면 `Badge` · 버튼 + `useConfirm`, 폼 안에서 저장과 함께 바꾸면 체크박스(`form-check`, 시험 문제 고르기 예시) |
| `CourseTableComponent/CourseSurvey` · `CourseSurveyForm` | 예시 · **표준 적용 (2026-11-17)** | 목록 위 추가 폼 (+ `SelectBox`, 읽기 전용 값은 `readOnly` 입력 또는 `hint`). 목록은 `Table`, 눌러서 여는 칸(설문 명 · 결과 보기)은 링크 · 버튼처럼 보이게 (`btn-text`), 삭제는 `useConfirm` |
| `CourseSurveyAnsModal` (설문 응답) | 부품 · **표준 적용 (2026-11-18)** | `Modal lg` + `question-nav` + `Progress` + `QuestionBlock`(보기 radio · checkbox, 배점 없음, 주관식은 textarea). 시험 응시(`ExamTakeModal`)와 같은 모양. 답이 있으면 닫을 때 `useConfirm`, [제출]도 `useConfirm`, 결과는 토스트. 목록(`CourseSurvey`)의 설문 명 옆에 "참여 완료" `Badge`. 예전 팝업 `CourseSurveyAns`(`popup-page`)는 2026-11-18에 이 모달로 바뀜 (팝업 파일 · `/survey/answer` 라우트 삭제) |
| `CourseSurveyResult` (설문 결과 팝업) | 예시 (10차) · **표준 적용 (2026-11-17)** | 설문 결과 (문항별 집계 \| 학생별 응답). 지금 화면에 없는 집계(보기별 응답 수 · 비율)는 설문 담당자가 만들 예정 → 이 예시를 따름 |
| `CourseSurveyStatistics` (설문 통계 팝업) | 부품 · **표준 적용 (2026-11-17)** | `popup-page` + `Panel` + `Progress`(보기별 응답 비율) + `StatusBox`. 설문 결과 예시의 문항별 집계와 같은 모양 |
| `HomeworkItem` · `HomeworkSubmitStatus` · `HomeworkDetails` | 예시 · **표준 적용 (2026-11-17)** | 과제 상세 |
| `HomeWorkList` · `HomeworkForm` · `CourseStudentList` | 예시 (8차) · **표준 적용 (2026-11-17)** | 목록 위 추가 폼 |
| `HomeworkReply` · `ReplyForm` | 예시 (8차) · **표준 적용 (2026-11-17)** | 댓글 같은 자리 수정 · 권한 · 마감 잠금. 주소 자동 링크는 로직이라 표준 밖 |
| `StudentConnected` | 예시 (8차) · **표준 적용 (2026-11-17)** | 주간 접속 기록 |
| `ConfirmModal` | 부품 · **삭제 (2026-11-18, `useConfirm`으로 바꿈)** | `useConfirm` |
| `admin/course/selector/*` | 부품 · **표준 적용 (2026-11-17 ~ 18)** | `SelectBox` (하나 · 여러 개) |
| `admin/survey/survey/Survey` | 예시 · **표준 적용 (2026-11-17)** | 설문 편집기. 표준화 전 탭은 `dev`를 합친 뒤 그때 모양으로 다시 맞춤 (문항별 인라인 입력 + `PollItem` 미리보기, 입력마다 서버 저장, 저장 표시 없음). 표준 예시는 편집 \| 미리 보기 + [저장] |
| `admin/test/test/AddTest` · `UpdateTest` | 예시 · **표준 적용 (2026-11-17)** | 문제 은행 문제 추가 · 수정 |
| `admin/test/test/Test` | 예시 (8차) · **표준 적용 (2026-11-17)** | 문제 은행 목록 (문항마다 펼치기 · 출제 통계). 권한 확인 중 · 오류 · 권한 없음 안내(`dev`에서 추가)는 `StatusBox` (`loading` · `error` · `type="denied"`) |
| `admin/system/member/*` | 예시 · **표준 적용 (2026-11-18)** | 목록 \| 상세. 등록 · 수정 · 비밀번호 초기화는 폼 모달, 역할 바꾸기는 `desc-list` 안 select + [역할 변경] + `useConfirm` |
| `admin/system/role/Role` | 부품 · **표준 적용 (2026-11-17)** | `input-group`(접두어) + `Table` 순서 바꾸기(잠긴 행) · 칸 편집 + "순서가 변경되었습니다" `Callout` |
| `role/RoleUserMoveModal` | 부품 · **표준 적용 (2026-11-17)** | `Modal` + `list-boxed` + `SelectBox` + `Callout`. 결과(일부만 성공 포함)는 토스트 |
| `admin/system/access/Access` | 예시 (8차) · **표준 적용 (2026-11-17)** | 접근 관리 (연쇄 선택 · 같은 폼으로 추가 · 수정) |
| `access-role/AccessRole` | 예시 (8차) · **표준 적용 (2026-11-17)** | 권한별 접근 권한 관리 (저장 전 변경 표시). 새 클래스 `layout-split-start` |
| `admin/system/code/*` | 예시 (8차) · **표준 적용 (2026-11-18)** | 환경 변수 관리 (패널 하나가 보기 · 수정 · 추가). 권한 확인 중 · 오류 · 권한 없음 안내(`dev`에서 추가)는 `StatusBox` (`loading` · `error` · `type="denied"`) |
| `admin/system/menu/Menu` · `MenuColumn` | 예시 (10차) · **표준 적용 (2026-11-17)** | 메뉴 관리 (3단 `Table` + 순서 바꾸기 + 순서 저장 바). 상세는 `desc-list` + 역할 체크박스 + 보기 ↔ 수정 규칙. 지금 화면의 "놓자마자 저장" 대신 저장 바로 한 번에 (역할 관리와 같게), 키보드(↑ ↓)로도 옮길 수 있게 됨 |
| `my/course/MyCourse` | 보류 | 라우트(`/my/course/list/:courseId`)가 앞의 `list`(과정 상세 `CourseItem`)에 가려 열리지 않습니다. 같은 일은 `CourseItem`이 표준으로 함. 지울지 팀에서 정함 (아직 `PageContainer`를 씀) |
| `my/course/MyCourseData` | 예시 · 제외 1 · **표준 적용 (2026-11-17)** | 목록 \| 상세 · 상세 화면. **제외**: 리치 텍스트 `Editor` (6장 "표준을 만들지 않기로 한 것") |
| `my/course/MyTimetable` | 부품 + 예시 (8차) · **표준 적용 (2026-11-17)** | 날짜별 시간표 (새 클래스 `tr.is-highlight`). 하루 보기는 `Table bordered`, 업로드는 `FilePicker` |
| `my/course/MyInterview` | 예시 (8차) · **표준 적용 (2026-11-17)** | 목록 위 추가 폼 (`datetime-local`) |
| `my/course/MyCounsel` | 예시 (8차) · **표준 적용 (2026-11-17)** | 상담 기록 (기본 정보 먼저 · 구역별 수정 · 수준 배지 · 고칠 수 없는 기록) |
| `my/info/MyInfo` · `MyPassword` · `login/Login` | 부품 + 예시 (8차) · **표준 적용 (2026-11-18)** | 로그인 · 비밀번호 다시 확인. 새 부품 `auth-page` · `auth-card` |
| `my/info/MyInfoForm` · `MyPasswordForm` | 부품 · **표준 적용 (2026-11-18)** | `Field` + `form-stack` + `desc-list`(읽기 전용 값). 성공은 토스트, 비밀번호 규칙(8~20자)은 처음부터 `hint`로 |
| `main/Main` · `TutorDashboard` · `AdminDashboard` | 예시 · **표준 적용 (2026-11-18 ~ 19)** | 대시보드. `StatCard` · `Panel` · `Table` · `Progress` · `Badge` · `StatusBox`. 무엇을 보여 주는지는 `frontend/docs/design/dashboard-design.md` |
| `my/course/MyScore` · `CourseTableComponent/CourseScore` | 부품 · **표준 적용 (2026-11-18)** | 성적 (`Panel` · `Badge` · `StatusBox` + 차트). 강사가 성적 탭을 열면 `CourseScore`, 수강생은 `MyScore` |
| `menu/SideMenu` · `UserProfile` · `LogoutButton` | 부품 · **표준 적용 (2026-11-17, `LogoutButton` 2026-11-18)** | 사이드바 자체가 기준 (토큰 · 테마 · 작은 화면 서랍 완료, 2026-11-18에 글자 크기 · 굵기 · 모서리 토큰 · 포커스 · 로그아웃 `sidebar-btn`). 접힌 상태에서는 메뉴를 표시하지 않음 (8장 "사이드 메뉴") |
| `menu/MenuGuard` · `login/IsLogin` | 부품 · **`MenuGuard` 표준 적용 (2026-11-17)** | 로직. 화면은 `StatusBox` (loading · error · denied) |
| `Section.jsx` | 부품 | `Panel`. 쓰는 화면이 없어 `archive/Section.jsx`(기록)로 옮김 (2026-11-18) |
| `my/course/MyCourseList` · `MyAttendence` · `MyStudent` · `MySurvey` · `MyWorks` | 제외 | 아직 화면이 없음 (빈 파일 · 준비 중). 만들 때 이 표에 추가. `MyCourseList`는 `MyCourse`처럼 라우트가 가려져 열리지 않음 |

### PR에서 바뀌는 앱 전체 영향

표준 UI를 넣으면서 샘플 페이지 밖에도 닿는 변경은 아래뿐입니다.

- 본문 글꼴이 Pretendard(`--font-sans`, `main.jsx`에서 불러옴)로 바뀌고, 입력 · 버튼도 글꼴을 물려받습니다. 모든 화면의 글자 폭이 조금 바뀝니다.
- `FeedbackProvider`가 앱 전체를 감쌉니다 (`useToast` · `useConfirm`을 어디서나 쓸 수 있음).
- 일부 화면 CSS module의 `font-family` 한 줄을 `var(--font-sans)`로 바꿨습니다 (위 "글꼴을 Pretendard로 정한 이유").
- 사이드바(`menu/SideMenu` · `UserProfile`)는 색을 토큰으로 바꾸고, **배경을 차콜(`#212529`)에서 네이비(`#1b2440`)로, 현재 메뉴 색을 빨강에서 연한 파랑(`#91a7ff`)으로** 바꿨습니다 (7장 "테마").
- **다크 모드**: 사이드바 머리(로고와 접기 버튼 사이)에 [☾] 버튼이 생깁니다. 켜면 사이드바 · 샘플 페이지(그리고 `darkReady`를 넣은 화면)만 어두워지고, 아직 옮기지 않은 화면은 지금처럼 밝게 보입니다. 기본은 밝은 모드입니다.
- 본문 배경(`body`)을 토큰(`--color-bg-page` = gray-2 `#e9ecef`)으로 바꿨습니다. 예전 `#e9e9e9`와 거의 같습니다.
- 화면 폭 768px 이하에서는 사이드바가 숨고 왼쪽 위 [☰ 메뉴] 버튼으로 여는 서랍이 됩니다. 본문 여백도 그 폭에서 `64px 16px 24px`로 바뀝니다 (`layout/MainLayout.module.css`).
- **화면 머리 (2026-11-17)**: `common/PageContainer`의 안쪽 머리를 표준 `PageHeader`로 바꿨습니다. 아직 옮기지 않은 화면(`PageContainer`를 쓰는 화면)도 머리가 표준 모양이 됩니다: 집 아이콘 + `›` 구분자 브레드크럼(URL이 있는 메뉴는 링크), 토큰 색 · 크기, 아래 회색 선 없음, 머리 아래 간격 24px → 20px. 제목 크기(22px)와 제목을 정하는 규칙은 그대로입니다. 각 화면 파일은 바뀌지 않았습니다.
- 그 밖의 기존 화면 모양은 그대로입니다. 표준 클래스는 새 코드(샘플 페이지 · 옮긴 화면)에서만 씁니다.

---

## 7. 디자인 토큰 (`index.css`)

`src/index.css`의 `:root`에 선언되어 있습니다. 샘플 페이지 표준 탭 "기초"에서 실제 값과 모양을 볼 수 있습니다 (`index.css`에서 직접 읽어 표시).

### 규칙

- 새 코드는 색 · 글자 크기 · 모서리 · 높이 · 그림자를 **hex나 px로 직접 적지 말고** `var(--토큰)`으로 씁니다.
- 화면 코드는 **의미 토큰**(`--color-*`, `--font-size-*` …)만 씁니다. 팔레트(`--gray-*`, `--indigo-*`, `--blue-*`, `--green-*`, `--red-*`, `--yellow-*`, `--brown-8`)는 의미 토큰을 정의할 때만 씁니다.
- 맞는 토큰이 없으면 값을 직접 적지 말고 이 문서에 토큰 추가를 먼저 제안합니다.
- 토큰 선언만 추가한 상태라 **기존 화면 모양은 아직 바뀌지 않았습니다** (예외는 6장 "PR에서 바뀌는 앱 전체 영향"). 화면을 옮기는 작업은 6장 다음 단계 3 · 4번이고, 순서는 6장 "화면 옮기는 순서"입니다.
- 글자 크기는 8단계(`xs` 11 · `sm` 12 · `md` 13 · `base` 14 · `lg` 16 · `xl` 18 · `2xl` 22 · `3xl` 28px)입니다. `md`가 `base`보다 작은 것은 쓰임이 달라서입니다: `md`는 표 · 입력 · 버튼 같은 UI 글자, `base`는 본문처럼 읽는 글입니다.

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
| 배경 | `--color-bg-page` · `-bg-surface` · `-bg-subtle`(표 머리글 · 패널 머리 · 줄무늬) · `-bg-hover` · `-bg-disabled` · `-bg-raised`(모달 · 드롭다운 메뉴처럼 떠 있는 표면. 밝은 모드는 `-bg-surface`와 같고 다크에서만 한 단계 밝음) |
| 테두리 | `--color-border`(입력 · 버튼 · 카드) · `-border-light`(표 행 · 구분선) · `-border-strong`(hover) |
| 강조 | `--color-primary`(채움) · `-primary-hover` · `-primary-light`(선택 행) · `-primary-border` · `-primary-text`(연한 배경 위 글자) · `--color-on-primary` · `--color-link` · `--color-focus` |
| 상태 | `--color-{success · danger · warning · info}` + `-bg` · `-border`, `--color-danger-fill` · `-danger-fill-hover`(채운 버튼) · `-danger-border-hover` |
| 사이드바 | `--color-sidebar-bg` · `-sidebar-text` · `-sidebar-text-strong`(hover) · `-sidebar-text-secondary`(그룹 이름) · `-sidebar-muted`(링크 · 로고) · `-sidebar-subtle`(대분류 제목) · `-sidebar-border` · `-sidebar-hover` · `-sidebar-active` · `-sidebar-active-bg`. 배경 · 현재 메뉴는 테마(`--brand-*`)를 따름 |
| 오버레이 | `--color-overlay` · `--color-toast-bg` · `--color-toast-error-bg` |
| 글꼴 | `--font-sans` · `--font-mono`, `--font-size-{xs · sm · md · base · lg · xl · 2xl · 3xl}`, `--font-weight-{regular · semibold · bold}`, `--line-height-{tight · base}` |
| 크기 | `--control-height-{sm · md}` · `--control-padding-x-{sm · md}` · `--table-header-height` · `--table-row-height` · `--modal-width-{sm · md · lg}` |
| 모서리 | `--radius` · `--radius-lg` · `--radius-pill` |
| 그림자 | `--shadow-sm`(패널) · `--shadow-md`(토스트) · `--shadow-lg`(모달). 다크에서는 밝은 1px 링 + 진한 그림자 (9장) |
| 쌓임 순서 | `--z-sticky`(10) · `--z-drawer`(900, 작은 화면 사이드바 서랍) · `--z-modal`(1000) · `--z-toast`(1100) |

### 옮길 때 대응표

| 지금 값 | → 토큰 |
| --- | --- |
| `#333` `#222` `#212529` | `--color-text` |
| `#495057` `#555` `#666` | `--color-text-secondary` |
| `#777` `#888` `#999` `#868e96` | `--color-text-muted` |
| `#adb5bd` `#aaa` (placeholder · 비활성 글자) | placeholder면 `--color-text-placeholder`, 비활성 입력 · 버튼 글자면 `--color-text-disabled` |
| `#e9e9e9` (body) | `--color-bg-page` |
| `#f7f7f7` `#fafafa` `#f8f9fa` `#f5f5f5` | `--color-bg-subtle` |
| `#f2f2f2` `#f1f3f5` `#eee`(배경) | 마우스를 올렸을 때 배경이면 `--color-bg-hover`, 비활성 · 읽기 전용 칸 배경이면 `--color-bg-disabled` |
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
| 17px · 20px · 1.25rem | 카드 · 패널 제목이면 `--font-size-lg`, 모달 제목이면 `--font-size-xl` (화면 제목은 `--font-size-2xl`) |

- 같은 값이 두 줄에 있으면(`#eee` 등) 쓰인 속성으로 고릅니다: `background`면 배경 줄, `border` · 구분선이면 테두리 줄입니다.
- 테두리 중에서는 입력 · 버튼 · 카드의 바깥 테두리가 `--color-border`, 표 행 · 목록 사이 구분선이 `--color-border-light`입니다.
- 크기 값이 애매하면 숫자가 가까운 쪽이 아니라 **쓰임**(토큰 주석, 위 "목록")으로 고릅니다.

### 강조색 (primary) 과 테마 (brand)

둘 다 **확정**했습니다 (2026-11-17). 고르는 기능은 없고, 바꿀 때는 `index.css`의 값만 고칩니다. 둘은 서로 다른 토큰을 쓰고, 어느 쪽도 회색 · 상태색(성공 · 위험 · 경고 · 정보)은 바꾸지 않습니다.

| | **강조색 (primary)** | **테마 (brand)** |
| --- | --- | --- |
| 값 | 인디고 (`#3b5bdb`) | 네이비 (배경 `#1b2440` · 현재 메뉴 `#91a7ff`) |
| 닿는 곳 | 주 버튼 · 선택 행 · 탭 · 체크 · 스위치 · 포커스 · 링크 | **사이드바 배경 · 현재 메뉴만** |
| 닿지 않는 곳 | 상태 표시 (진행 중 · 오류 등은 의미색) | 버튼 · 입력 · 표 · 배지 · 상태색 전부 |
| 토큰 | `--primary-*` 8개 → `--color-primary*` · `--color-focus` · `--color-link` | `--brand-bg` · `--brand-accent` → `--color-sidebar-*` |

사이드바 색을 버튼 색과 따로 두는 이유: 장식 영역(사이드바 · 나중의 헤더) 색과 동작 · 의미 색을 섞지 않기 위해서입니다. 사이드바 색을 바꿔도 "저장" · "삭제" · "완료"의 색 구분은 그대로입니다.

#### 강조색 (primary): 인디고

`--primary-*` 8개를 밝은 · 다크 의미 토큰이 읽습니다 (다크의 반투명 값은 `color-mix`).

```css
:root {
  --primary-fill: var(--indigo-7);      /* 채운 배경: 주 버튼 · 현재 페이지 · 스위치 · 체크 (흰 글자 4.5:1 이상) */
  --primary-fill-hover: var(--indigo-8);
  --primary-text: var(--indigo-7);      /* 밝은 모드: 연한 배경 위 글자 (선택 탭 · 배지) */
  --primary-light: var(--indigo-0);     /* 밝은 모드: 연한 배경 (선택 행) */
  --primary-border: var(--indigo-2);
  --primary-dark-text: var(--indigo-3); /* 다크 모드: 글자 */
  --primary-dark-focus: var(--indigo-4);/* 다크 모드: 포커스 테두리 · 연한 테두리(45%)의 바탕 */
  --primary-dark-tint: var(--indigo-6); /* 다크 모드: 연한 배경(18%)의 바탕 */
}
```

- 흰 글자 · 연한 배경 위 글자 · 다크 글자가 모두 4.5:1 이상입니다.
- **바꿀 때**: 위 8개 값만 바꿉니다 (같은 명암비 기준 확인). 상태색과 헷갈리는 빨강 · 핑크 · 초록 · 틸 · 노랑 · 주황 계열은 쓰지 않습니다.
- **정보색(info)은 파랑 고정**(blue-8, 다크 blue-3)입니다. 강조색이 바뀌어도 안내 상자(`Callout tone="info"`) · `badge-info`의 뜻이 같도록 분리했습니다.
- **상태 표시에 강조색을 쓰지 않습니다.** "진행 중 · 수강 중"처럼 상태를 뜻하는 배지는 `tone="info"` 등 의미색을 씁니다. 강조색은 "누를 수 있는 것 · 고른 것"을 뜻합니다.

#### 테마 (brand): 네이비, 사이드바에만

```css
:root {
  --brand-bg: #1b2440;          /* 사이드바 배경: 어두운 색만 */
  --brand-accent: #91a7ff;      /* 현재 메뉴 글자 · 왼쪽 선 */
}

/* 사이드바 토큰: 배경 · 현재 메뉴만 brand를 읽고, 글자 · 선은 어떤 배경에서도 읽히는 회색 · 반투명 흰색 */
--color-sidebar-bg: var(--brand-bg);
--color-sidebar-active: var(--brand-accent);
--color-sidebar-active-bg: color-mix(in srgb, var(--brand-accent) 10%, transparent);
```

- 사이드바의 모든 글자 단계(대분류 제목 gray-6까지)와 현재 메뉴 색이, 배경과 현재 메뉴 배경(10%) 위에서 모두 4.5:1 이상입니다.
- **바꿀 때**: 위 2개 값만 바꾸고 같은 명암비 기준을 확인합니다. 배경은 어두운 색만 씁니다 (사이드바 글자가 밝은 색이라).
- **헤더**가 생기면 `--color-sidebar-*`처럼 `--brand-*`를 읽는 헤더 토큰을 만들어 씁니다. 버튼 · 표 · 배지 CSS에서는 `--brand-*`를 읽지 않습니다.
- 예전에 있던 고르는 기능(사이드바 테마 견본 · 샘플 페이지 강조색 후보, `theme/brandTheme.js` · `SwatchPicker`)은 지웠습니다. 그때 저장된 브라우저 값(`localStorage`의 `lms-brand`)은 더 이상 읽지 않으므로 그대로 두어도 됩니다.

---

## 8. 표준 UI

샘플 페이지 **표준 탭**에서 모양과 사용 코드를 같이 볼 수 있습니다. 아래 설명은 표준 탭과 같은 묶음 · 순서입니다 (1장).

### 구조

| 층 | 위치 | 역할 |
| --- | --- | --- |
| 토큰 | `src/index.css` `:root` | 색 · 크기 값 (7장) |
| 전역 클래스 | `src/styles/button.css` · `form.css` · `badge.css` · `status.css` · `modal.css` · `toast.css` · `table.css` · `tabs.css` · `panel.css` · `nav.css` · `choice.css` · `content.css` (`index.css`가 `@import`). react-select만 `common/ui/selectStyles.js` (라이브러리가 CSS 대신 styles 객체를 받음) | **스타일의 원본.** 토큰만 사용 |
| React 컴포넌트 | `src/components/common/ui/` `Button` · `Field` · `Badge` · `StatusBox` · `Modal` · `ConfirmDialog` · `FeedbackProvider` · `Table` · `Pagination` · `Tabs` · `TabPanel` · `Panel` · `StatCard` · `Callout` · `PageHeader` · `Breadcrumb` · `ChoiceGroup` · `Switch` · `FilePicker` · `FileList` · `Progress` · `SelectBox` · `QuestionBlock` · `Comment` · `TransferList` · `ListEditor` | 클래스를 붙여 주는 얇은 껍데기 + 동작(로딩 · 접근성 · 기본 문구 · 열고 닫기) |
| 훅 | `src/components/common/ui/feedbackContext.js` `useToast` · `useConfirm` | `alert()` · `confirm()` 대신. `main.jsx`의 `FeedbackProvider`가 앱 전체를 감쌈 |
| 앱에 하나뿐인 틀 | 사이드바 `src/components/menu/` (`SideMenu` · `UserProfile` · `LogoutButton`), `src/layout/MainLayout.jsx` | 표준 토큰 · 클래스(`--color-sidebar-*` · `sidebar-btn`)를 쓰지만 **`common/ui`에 넣지 않음**. `common/ui`는 여러 화면이 다시 쓰는 부품(props로만 데이터를 받고 store · API를 쓰지 않음)만 둠. 표준 적용 여부는 폴더가 아니라 `sample/catalog/standardization.js` · 6장 "화면별 표준 대응" 표로 관리 |

- raw HTML에도 클래스만 붙이면 같은 모양이 됩니다 (`<button className="btn btn-primary">`). 동작이 필요하면 컴포넌트를 씁니다.
- 클래스 이름은 짧은 접두어 + 하이픈(`btn-*`, `form-*`, `field-*`, `badge-*`, `status-box-*`)으로, `.input` · `.section` 같은 일반 단어는 쓰지 않습니다 (전역이라 다른 CSS와 부딪힘).
- 전역 클래스는 `main.jsx`에서 CSS module보다 먼저 불러옵니다. 그래서 화면의 CSS module이 같은 요소에 스타일을 주면 module 쪽이 이깁니다 (화면별로 살짝 조정할 수 있음, 남용은 금지).
- **기존 화면 모양은 바뀌지 않았습니다** (예외는 6장 "PR에서 바뀌는 앱 전체 영향"). 새 클래스를 쓰는 곳은 샘플 페이지뿐이고, 기존 화면은 6장 다음 단계 3번에서 "화면 옮기는 순서"대로 옮깁니다.

#### 어떤 걸 쓰나

| 상황 | 쓰는 것 | 언제 |
| --- | --- | --- |
| 알림 | 토스트 (`useToast`) | 결과 알림 · 잠깐 보이고 사라짐 (저장 · 삭제 성공, 요청 실패) |
| | `Callout` | 화면에 머무는 안내. 폼 위 제출 오류를 계속 보여야 할 때 (로그인 등) |
| | `StatusBox` | 화면 · 목록을 쓸 수 없는 상태 (불러오는 중 · 빈 목록 · 오류 · 권한 없음) |
| | `Field` `error` | 칸 하나의 입력 오류 |
| 입력 받는 곳 | 목록 위 추가 폼 (`Panel`) | 칸 4개 이하 |
| | 폼 모달 (`Modal size="md"`) | 칸이 그보다 많거나, 펼치면 목록이 가려 · 밀려서 안 될 때 |
| | 별도 화면 | 긴 글 · 에디터 |
| 못 하는 동작의 버튼 | 숨김 | 권한이 없음 |
| | 비활성 + 이유 (`hint` · `title` · `Callout`) | 순서 · 조건 때문에 지금만 못 함 |
| | 숨기고 위에 한 번 안내 | 화면 전체가 잠김 (마감 등) |
| 전환 | `Tabs` (line) | 화면의 구역 |
| | `Tabs variant="pills"` | 같은 영역 안 작은 내용 전환 (패널을 바꿈) |
| | `ChoiceGroup variant="segmented"` | 폼 값 · 필터 값 (2~4개) |
| | `list-group` | 고른 항목의 상세를 옆에 보여 줄 때 |
| | 사이드바 (`menu/SideMenu`, 앱에 하나) | 화면 이동 |
| 목록 | `Table` | 칸이 있는 데이터 |
| | 원시 `table.table` | 한 묶음이 여러 줄 (rowSpan) |
| | `list-group` | 이름만 있는 선택 목록 |
| | `card` | 내용이 많은 항목 |
| 상태 표시 | `Badge` | 상태 · 수준 · 결과. 진행 중 · 수강 중 같은 상태는 `info`, `primary`는 역할 · 선택 표시(강사 · 내 글)에만 |
| | `tag` | 분류 (문제 유형 · 상담 유형 · 자료 종류) |
| | `Switch` | 바로 적용되는 설정 |
| | 체크박스 (`form-check`) | 저장 버튼과 함께 적용되는 값 |

#### 공통 규칙

**CSS module 쓰는 범위**

- 화면 CSS module에는 그 화면만의 배치(칸 폭 · 열 수 · 간격)만 둡니다.
- 색 · 글자 크기 · 테두리 · 그림자는 토큰을 씁니다. 버튼 · 표 · 배지 같은 표준 모양을 module에 다시 만들지 않습니다.
- 표준 클래스를 덮어써야 할 것 같으면, 먼저 표준을 고치자고 제안합니다 (6장 "팀이 정할 것").

**클래스 이름**

- 전역 클래스는 짧은 접두어 + 하이픈입니다 (위 내용 그대로).
- 상태는 `is-*` (`is-selected` · `is-muted` · `is-highlight` 등), 표 칸은 `col-*` · `cell-*`입니다.
- 폭 · 높이처럼 화면마다 다른 값은 클래스를 새로 만들지 않고 CSS 변수로 조절합니다 (`--layout-aside-width` · `--desc-label-width` · `--list-max-height` · `--swatch-*`).

**id**

- 한 화면에 두 번 쓸 수 있는 컴포넌트 안에서는 id를 `useId()`로 만듭니다. 샘플의 `std-…` 고정 id는 예시용입니다.

**반응형**

- 표준 구간은 둘입니다: 1024px(배치가 한 줄로 쌓임) · 768px(두 목록 옮기기처럼 좁은 부품).
- 화면 module에 다른 구간을 새로 만들지 않습니다.

**글 · 형식**

| 무엇 | 형식 |
| --- | --- |
| 날짜 · 날짜 시간 · 기간 | `2026-11-17` · `2026-11-17 14:20` · `시작 ~ 끝` (날짜 기간은 `~` 앞뒤를 띄어 씀) |
| 숫자 단위 | 붙여 씀: `5점` · `3건` · `12명` |
| 숫자 범위 | 붙여 씀: `1~4점` · `2~5개` |
| 토스트 문장 | "~했습니다." 실패는 "~하지 못했습니다. 이유" |
| 진행 중 버튼 | "저장 중..." · "등록 중..." |
| 버튼 동사 | 등록(새로 만들기) · 저장(고친 것) · 추가(목록에 한 줄) · 삭제 · 취소 · 닫기 · 확인 |
| 확인 창 버튼 | 동작 이름 그대로 ("삭제", "제출"). 묻는 말도 "삭제할까요?" |
| 고르라는 안내 | "~을 고르세요." ("선택하세요" 대신) |

**버튼 · 배치**

- `primary`는 한 줄(툴바 · 바닥 버튼 줄)에 하나입니다. 툴바의 [검색]은 기본 버튼, [회원 등록]처럼 화면의 주 동작만 `primary`.
- 아이콘은 무언가를 **여는** 버튼([회원 등록] · [문제 추가] · [일정 등록] · 패널 머리 [추가])과 [수정] · [삭제] · [새로고침]에만 붙입니다. 폼 제출 버튼(`type="submit"`, 폼 바닥의 [저장] · [등록])에는 붙이지 않습니다.
- 바닥 버튼 줄(`Panel` · `Modal` `footer`)에 [삭제] · [잠금]처럼 되돌리기 어려운 버튼이 [취소] · [저장]과 같이 있으면, 그 버튼을 **맨 앞**에 두고 `className="btn-start"`로 왼쪽에 떼어 둡니다 (`style={{ marginRight: "auto" }}` 대신).
- 툴바 안에서 오른쪽에 둘 것(주 동작 버튼 · 기준 안내)은 `toolbar-end`로 묶습니다 (`style={{ marginLeft: "auto" }}` 대신). 하나뿐이면 그 요소에 `className="toolbar-end"`.
- 툴바와 그 아래 내용 사이 간격은 `marginBottom` 대신 둘을 `form-stack`으로 감쌉니다.
- 저장 전 변경 안내 바는 `Callout tone="info"` + [되돌리기] [저장]. 순서 바꾸기면 버튼은 [순서 저장].

**접근성 최소**

- 아이콘만 있는 버튼은 `aria-label`을 넣습니다. 입력은 `Field htmlFor` = 입력 `id`로 연결합니다.
- 지금 고른 항목은 `aria-current`로 표시합니다. 포커스 테두리를 지우지 않습니다.
- 글자 대비는 4.5:1 이상입니다 (토큰은 맞춰 둠). 색만으로 뜻을 전하지 않습니다 (배지 글자 · 아이콘을 같이).

**제출 실패**

- 서버 검증 오류(필드별)는 `Field` `error`, 그 밖의 실패는 토스트 오류입니다.
- 한 가지 일만 하는 화면(로그인 · 비밀번호 다시 확인)은 카드 위 `Callout` 하나로 알립니다.

### 기초

토큰과 테마는 7장에 있습니다. 샘플은 표준 탭 "기초" (`TokenCatalog.jsx`).

### 동작 · 입력

샘플 파일: `StandardInputCatalog.jsx`

#### 버튼

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
| — | `loading` | 돌아가는 아이콘(`.spin`, 0.5초에 한 바퀴 ease, 기존 IconButton `alwaysIconRotate`와 같은 움직임) + 누를 수 없음. `disabled`가 아니라 `aria-disabled`라서 누른 버튼에 포커스가 남고, 그동안의 클릭 · 제출은 무시됨. 모양은 비활성과 같음. 문구는 "저장 중..."으로 직접 바꿈. 상태 상자 로딩 아이콘도 같은 `.spin` |
| — | `icon={icons.refresh}` | 새로고침 · 다시 시도. 올리면(키보드 포커스 포함) 아이콘이 한 바퀴 (`btn-icon-rotate`, 0.4초, 기존 `hoverIconRotate`와 같음). Button이 자동으로 붙이고, 다른 버튼에는 `className="btn-icon-rotate"` |
| `btn-group` · `btn-group-end` | — | 버튼 묶음 (간격 8px), 오른쪽 정렬 |
| `btn-start` | `className="btn-start"` | 바닥 버튼 줄에서 왼쪽으로 떼어 둠 ([삭제] · [잠금]처럼 되돌리기 어려운 동작, 맨 앞에 둠) |

```jsx
import Button from "../common/ui/Button";
import { icons } from "../common/input/icons";

<div className="btn-group btn-group-end">
  <Button onClick={close}>취소</Button>
  <Button variant="primary" loading={saving} onClick={save}>
    {saving ? "저장 중..." : "저장"}
  </Button>
</div>
```

- 아이콘은 기존 `icons.js`를 그대로 씁니다. 크기는 md 16px · sm 14px로 정해져 있습니다.
- 나머지 props(`onClick`, `type`, `title`, `aria-*` …)는 `<button>`에 그대로 전달됩니다. `type` 기본값은 `"button"` (폼 제출 버튼만 `type="submit"`).

#### 입력 · 폼

| 클래스 | 쓰는 곳 |
| --- | --- |
| `form-control` | `input` · `select` · `textarea` 공통 (36px, textarea는 최소 96px) |
| `form-control-sm` | 30px |
| `form-control-mono` | 코드 · ID 입력 (고정폭) |
| `field` · `field-label` · `field-required` · `field-hint` · `field-error` · `field-counter` | 필드 틀 (`Field` 컴포넌트가 붙여 줌) |
| `input-group` + `input-group-text` | 접두어 + 입력 (`ROLE_`). 접두어는 `<label htmlFor="입력 id">`로 써서 눌러도 입력 칸에 포커스가 가게 함 |
| `form-check` · `form-check-group` | 체크박스 · 라디오 + 글자 (네이티브 input, 강조색) |
| `form-row` | 필드 여러 개를 한 줄에 (좁으면 줄바꿈). 필드는 **위(라벨)에 맞춤**이라 힌트 · 오류가 있는 필드와 없는 필드가 섞여도 라벨 · 입력 칸 줄이 같음. 필드 옆 버튼처럼 라벨 없는 것은 라벨 높이만큼 내려 입력 칸과 같은 줄. 필드 옆 `form-check`(공개 · 사용 등)는 입력 칸 높이에서 세로 가운데 |
| `form-stack` | 필드를 세로로 16px 간격 |

```jsx
import Field from "../common/ui/Field";

<Field label="아이디" htmlFor="userId" required hint="영문 · 숫자 4~20자" error={errors.userId}>
  <input id="userId" className="form-control" value={userId} onChange={(e) => setUserId(e.target.value)} />
</Field>
```

- 오류가 있으면 힌트 대신 오류만 보입니다 (`role="alert"`). 입력 칸은 `aria-invalid="true"`일 때 빨간 테두리가 됩니다.
- **자동 연결**: 입력의 `id`(`SelectBox`는 `inputId`)를 `htmlFor`와 같게 하면, `Field`가 그 입력에 `aria-invalid`(오류일 때) · `aria-describedby`(힌트 · 오류 문구)를 붙입니다. `SelectBox`에는 `aria-errormessage`를 붙입니다. 직접 넘긴 값이 있으면 그 값을 씁니다.
- 직접 연결은 입력이 다른 요소 안에 있을 때(`input-range` · `input-group` 안)만 합니다. 문구의 id는 `${htmlFor}-msg`입니다: `aria-invalid={!!error} aria-describedby="period-start-msg"`.
- **여러 입력 묶음**: 체크 · 라디오 · `ChoiceGroup` · `ListEditor`처럼 입력이 여럿이면 `htmlFor` 대신 `<Field group label="상담 유형">`. 바깥이 `role="group"`이 되고 라벨 · 힌트 · 오류가 `aria-labelledby` · `aria-describedby`로 연결됩니다.
- 글자 수: `count={{ current: memo.length, max: 200 }}`
- 상태: `disabled`(회색 배경), `readOnly`(회색 배경 · 글자는 보통), 포커스는 강조색 테두리 + 연한 그림자.
- 기존 `common/input/Input.jsx`의 컴포넌트(`Id` · `Password` · `TextField` · `Checkbox` · `Radio` …)는 쓰는 화면이 없어 `archive/common/input/Input.jsx`(기록)로 옮겼습니다 (2026-11-18). 새 화면은 네이티브 입력 + `form-control`을 씁니다 (대응은 6장 "기존 컴포넌트 → 표준 대응").

#### 검색 셀렉트 (react-select)

```jsx
import SelectBox from "../common/ui/SelectBox";

<Field label="담당 강사" htmlFor="tutor" required error={error}>
  <SelectBox inputId="tutor" options={tutors} value={tutor} onChange={setTutor} isClearable />
</Field>
<SelectBox isMulti options={students} value={picked} onChange={setPicked} />
```

- `SelectBox`는 react-select에 `selectStyles`(`common/ui/selectStyles.js`)를 넣어 둔 것입니다. 높이 36px · 테두리 · 포커스 · 다중 선택 칩이 표준 입력과 같고, 값이 모두 토큰이라 다크 모드를 따릅니다.
- props는 react-select 그대로입니다. 추가로 `size="sm"`(30px), `aria-invalid`(오류 테두리, `Field` 안에서 `inputId`를 맞추면 자동).
- 목록(메뉴)은 항상 `body`로 띄웁니다. 모달 · 표 · `overflow` 상자 안에서도 잘리지 않습니다. 예전 `inModal` prop은 받기만 하고 무시합니다 (호환용, 새 코드에서는 넘기지 않음).
- 모달 안에서 목록이 열린 채 Esc를 누르면 목록만 닫히고 모달은 그대로입니다.
- 이미 `Select`를 직접 쓰는 화면(`admin/course/selector/*` · `Survey`)은 `import Select` → `SelectBox`로 바꾸거나, `styles={selectStyles}`만 넣어도 됩니다. 폭을 정하던 감싸는 div는 `Field` · `form-row`로.
- 짧은 고정 목록은 `<select className="form-control">`을 씁니다.

#### 선택 (pill · 세그먼트 · 켜고 끄는 버튼 · 스위치)

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

#### 날짜 · 숫자 · 기간 · 검색

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

#### 파일

```jsx
<FilePicker accept=".xlsx" onSelect={([file]) => setFile(file)} fileName={file?.name} />
<FilePicker multiple label="첨부 추가" onSelect={addFiles} />
<FileList files={[{ key, name, size, href }]} onRemove={removeFile} />
```

- 숨긴 `input[type=file]`(`visually-hidden`) + 버튼 모양 label입니다. Tab으로 오면 버튼에 포커스 테두리가 생깁니다. `common/input`의 `FileField` · `MyTimetable` 파일 상자를 대신합니다.
- `onSelect`는 `File[]`을 줍니다. 같은 파일을 다시 골라도 불리도록 고른 뒤 input 값을 비웁니다.
- `FileList`: `href`가 있으면 이름이 내려받기 링크(`MyCourseData` 첨부 칩 대신), `onRemove`가 있으면 지우기 버튼. 크기는 `size`(바이트)를 KB · MB로 보여 줍니다.

#### 반복 입력 행 (ListEditor)

```jsx
import ListEditor from "../common/ui/ListEditor";
import { newListItem } from "../common/ui/listEditorItem";

const [options, setOptions] = useState([newListItem(), newListItem()]);
<ListEditor label="보기" items={options} onChange={setOptions} min={2} max={8} addLabel="보기 추가" />
// 저장할 때: options.map((o) => o.value)
```

- `Survey`의 보기 입력(입력 + 삭제 · 추가 버튼)을 대신합니다. 줄에서 Enter → 바로 아래에 새 줄, 빈 줄에서 Backspace → 그 줄을 지웁니다 (한글 입력 중 Enter는 무시).
- 줄을 더하면 새 줄로, 지우면 바로 앞 줄로 포커스가 옮겨 갑니다 (`autoFocus`가 아니라 ref로 옮김).
- `renderMarker(item, index)`: 입력 칸 앞에 넣을 것. 시험 보기의 정답 표시처럼 줄마다 붙는 작은 입력에 씁니다. `<label className="list-editor-mark">` 안에 radio(하나) · checkbox(여러 개)를 넣으면 고른 줄의 입력 칸이 초록이 됩니다 (`styles/content.css`).
- 줄마다 `id`가 있어야 지우거나 끼워 넣어도 입력이 섞이지 않습니다. 새 줄은 `newListItem()`, 서버에서 받은 값은 `{ id: 서버 id, value }`로 바꿔 넣습니다.

### 표시 · 상태

샘플 파일: `StandardFeedbackCatalog.jsx`

#### 배지 · 태그

| 클래스 | `Badge` props | 쓰는 곳 |
| --- | --- | --- |
| `badge` | `tone="neutral"` (기본) | 미진단 · 해당 없음 |
| `badge badge-success` | `tone="success"` | 정상 · 정답 · 상 |
| `badge badge-info` | `tone="info"` | 진행 중 · 수강 중 · 부분 정답 · 중 · 안내 |
| `badge badge-warning` | `tone="warning"` | 채점 중 · 주의 · 하 |
| `badge badge-danger` | `tone="danger"` | 잠김 · 오답 (수준에는 쓰지 않음) |
| `badge badge-primary` | `tone="primary"` | 상태가 아닌 선택 · 역할 표시만: 강사 · 내 글 · 담당 |
| `tag` | — | 분류 칩 (학습 · 진로 · 문제 유형), 테두리 없이 작게 |

같은 의미에는 같은 tone을 씁니다. 화면마다 새 배지 색을 만들지 않습니다. 상태(진행 중 등)에는 강조색(`primary`)을 쓰지 않습니다 (7장 "강조색 (primary): 팀 결정용").

#### 안내 상자 (Callout)

```jsx
<Callout tone="warning" title="주의">이 역할을 빼면 메뉴 관리에 들어올 수 없습니다.</Callout>
<Callout tone="info" actions={<Button size="sm" variant="primary">순서 저장</Button>}>순서가 변경되었습니다.</Callout>
```

- tone `info` · `success` · `warning` · `danger` · `neutral`. 화면에 **머무는** 안내.
- 결과 알림은 토스트, 화면을 못 쓰는 상태는 `StatusBox`.
- 저장 전 변경 안내(순서 · 권한 변경)는 언제나 `info`. 순서 바꾸기면 버튼은 [순서 저장], 그 밖에는 [저장].

#### 수준 배지 (상 · 중 · 하)

역량 진단처럼 단계가 있는 값은 `Badge` tone을 고정합니다: 상 `success` · 중 `info` · 하 `warning` · 미진단 기본(회색). 위험 빨강(`danger`)은 수준에 쓰지 않습니다 (오류 · 삭제와 헷갈림).

#### 상태 상자

| `type` | 기본 문구 | 아이콘 | 스크린 리더 |
| --- | --- | --- | --- |
| `loading` | 불러오는 중... | 돌아가는 아이콘 | `role="status"` |
| `empty` | 데이터가 없습니다. | — | — |
| `error` | 불러오지 못했습니다. (상세는 빨강) | 오류 | `role="alert"` |
| `denied` | 권한이 없습니다. | — | — |
| `notFound` | 페이지를 찾을 수 없습니다. | 큰 "404" | — |

```jsx
import StatusBox from "../common/ui/StatusBox";

if (loading) return <StatusBox type="loading" />;
if (error) return <StatusBox type="error" detail={error.message} onRetry={reload} />;
if (list.length === 0) return <StatusBox type="empty" title="검색 결과가 없습니다." />;
```

- `title`로 기본 문구를 바꾸고, `detail`로 둘째 줄(줄바꿈 유지)을 넣습니다. `onRetry`가 있으면 [다시 시도] 버튼이 나옵니다.
- `size="sm"`: 테두리 없이 작게. 목록 · 표 안의 빈 상태에 씁니다.
- `size="lg"`: 화면 전체 (404 · 라우트 오류, `common/error/*` 대신). `code`로 큰 숫자("500" 등), `actions`로 아래 버튼(뒤로 · 홈으로).
- 지금 5곳에 복사된 `.notice`(권한 확인 중 · 권한 없음), 빈 상태 5가지, 로딩 문구들을 옮길 대상입니다.

#### 진행 막대

```jsx
<Progress label="진도율" value={42} showValue />
<Progress label="제출률" value={18} max={20} tone="success" showValue />
```

- `tone`: 기본(강조색) · `success`(완료) · `warning` · `danger`(마감 임박). `size="sm"`은 4px.
- `label`은 화면에 안 보이는 이름입니다 (`role="progressbar"`). 과정 카드 안에서 쓰는 예시는 샘플 "표시 · 상태"의 진행 막대에 있습니다.

#### 토스트 (`alert()` 대신)

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
| `toast.error(문구)` | 빨간 배경 + 오류 아이콘 | 4초 |
| `toast.show(문구)` | 어두운 배경 | 2.5초 |

- 화면 아래 가운데에 뜨고, 아무 데나 누르면 바로 닫힙니다. 토스트마다 [×] 닫기 버튼이 있어 키보드로도 닫을 수 있습니다. 한 번에 3개까지 (넘으면 오래된 것부터 사라짐).
- 스크린 리더: 안내 · 성공은 polite 영역(`role="status"`, 읽던 것을 끊지 않음), 오류는 alert 영역(`role="alert"`)에 따로 넣어 두 번 읽히지 않습니다.
- 시간을 바꾸려면 `toast.error(문구, { duration: 6000 })`. 문구의 `\n`은 줄바꿈됩니다.
- 언제 무엇을 쓰나
  - 저장 · 삭제 성공, 요청 실패 → 토스트
  - 입력값 오류 → 필드 아래 문구 (`Field`의 `error`), 토스트 아님
  - 화면을 못 쓰는 상태(권한 없음 · 목록을 못 불러옴) → 상태 상자
- `my/course/MyCourseData`의 자체 토스트는 이것으로 옮길 대상입니다 (모양은 같은 계열).

#### 확인 창 (`confirm()` 대신)

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

#### 모달

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
- 닫기 규칙: 기본은 Esc · X로 닫히고, 바깥 클릭은 `closeOnBackdrop`일 때만입니다. 저장 중에는 `dismissible={false}`, 시험 응시처럼 [제출]로만 닫혀야 하면 `onClose`를 넘기지 않습니다 (X 버튼도 없음).
- 모달 안에서 이미 처리한 Esc(셀렉트 목록 닫기 등)로는 모달이 닫히지 않습니다.
- 접근성: `role="dialog"` · `aria-modal` · 제목 연결, Tab은 모달 안에서만 돌고(포커스가 밖으로 빠져 있었으면 안으로 되돌림), 닫히면 연 버튼으로 포커스가 돌아갑니다. Tab 순서에는 `summary` · `contenteditable`도 들어갑니다.
- 모달 안에서 또 모달(확인 창)을 띄우면 Esc · Tab은 맨 위 것만 처리합니다.
- 본문만 스크롤되고 머리 · 바닥은 고정입니다 (높이는 화면 높이 - 32px까지).
- 옮길 대상: `Member*Modal`(폼, md), `RoleUserMoveModal`(md), `ConfirmModal`(→ `useConfirm`), `Exam*Modal`(lg), `sample/Modal`의 `Alert` · `Confirm`(`common/ui/Modal` · `useConfirm`으로 바꾼 뒤 `sample/Modal` 삭제).

### 데이터

샘플 파일: `StandardDataCatalog.jsx`

#### 표 · 페이지 이동

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
| 모양 | `size="sm"`(행 38px) · `striped` · `bordered`(세로 칸선) · `maxHeight`(표 안 스크롤 + 머리글 고정) |
| 열 · 행 클래스 | 열에 `className`(머리글 · 칸 모두, 예: `col-highlight` 오늘 열), `rowClassName={(row) => ...}`(예: `is-break` 쉬는 시간 행) |
| 체크 선택 | `checkedKeys` · `onCheckedChange` → 맨 앞 체크박스 칸 + 머리글 전체 선택(이 페이지만, 일부면 `-`). 못 고르는 행은 `isRowCheckable`. 체크박스 이름은 `rowLabel={(row) => row.name}` → "홍길동 선택" (없으면 key) |
| 편집 표 | 칸을 `render`로 `<input className="cell-input">`, `rowStatus={(row) => row.status}`(`"added"` · `"modified"` · `"deleted"`) → 왼쪽 선 + 배경 (삭제 예정은 취소선) |
| 순서 바꾸기 | `onReorder(from, to)` → 맨 앞 손잡이 칸. 손잡이를 잡고 끌거나 손잡이에서 ↑ ↓ 키 (행의 다른 곳은 끌리지 않아 글자 선택 · 클릭 · 입력이 그대로). 못 옮기는 행은 `isRowLocked` ("고정" 표시, 그 자리로 놓기도 막음). 잠긴 행을 건너가는 이동도 막음. **저장은 바로 하지 않고** 위에 "순서가 변경되었습니다 [되돌리기] [순서 저장]" `Callout`으로 한 번에 (역할 관리 · 메뉴 관리). 목록처럼 보이는 곳(메뉴 3단)도 작은 `Table`로 만들어 이 기능을 씀 (`list-group`에는 끌기가 없음) |

- 컴포넌트 없이: `<div className="table-wrap"><table className="table table-hover">…`, 행에 `is-selected` · `is-clickable` · `is-muted`, 칸에 `col-num` · `col-center` · `col-actions` · `cell-mono`.
- 공통 `Grid`와 대응: `checkable` → `checkedKeys`, 편집 모드(`type: add · modify · del`) → `rowStatus` + `cell-input`, `activeRows` → `selectedKey`. `Grid`처럼 표가 데이터를 들고 있지 않고, **바뀐 목록은 화면이 state로 들고 있다가 저장할 때 보냅니다** (샘플 표준 탭 "데이터"의 편집 표 예시).
- 우선순위: hover · 줄무늬와 칸 기본값(`th` · `td`의 여백 · 정렬)은 `:where()`로 우선순위가 0입니다. 그래서 선택 · 편집 상태 색이 항상 이기고, 열의 `className`에 화면 CSS module 클래스를 넘기면 여백 · 정렬을 바꿀 수 있습니다.
- 시간표: `bordered` + 오늘 열 `className: "col-highlight"` + 쉬는 시간 `rowClassName` → `is-break`. 머리글 파랑 · 오늘 초록 같은 직접 색은 쓰지 않습니다.
- `Pagination`의 `page`는 **0부터** (API와 같음). 번호는 10개씩, 처음 · 이전 · 다음 · 끝 버튼, 페이지가 1개면 아무것도 그리지 않습니다.

#### 한 묶음이 여러 줄인 표

날짜마다 과목 줄 · 내용 줄처럼 한 묶음이 두 줄 이상이면 `Table` 컴포넌트 대신 같은 클래스의 `<table className="table table-bordered">`를 씁니다.

- 묶음마다 `<tbody>`, 묶음 머리는 `<th scope="rowgroup" rowSpan={줄 수}>`.
- 강조(오늘)는 묶음의 모든 `tr`에 `is-highlight` (열 강조 `col-highlight`와 같은 색).
- **쉬는 날**(휴강 · 공휴일)은 그 날짜를 한 줄 `tr.is-off`로 합치고 칸 하나(`colSpan`)에 사유를 적습니다 ("쉬는 날 · 학원 행사"). 빗금 회색이라 빈 칸('-') · 쉬는 시간(`is-break`, 점심)과 구별됩니다.
- 날짜가 **열**인 표(출석 · 접속 기록)에서 쉬는 날은 머리에 "쉬는 날", 열 전체 `col-off`, 칸은 "쉼". 결석으로 세지 않습니다.
- 예시: 샘플 "화면 예시" → 날짜별 시간표.

#### 두 목록 사이 옮기기 (TransferList)

```jsx
import TransferList from "../common/ui/TransferList";

<TransferList
  items={questions}                 // 전체
  selectedKeys={picked}             // 고른 것 (오른쪽, 이 순서로 보임)
  onChange={setPicked}
  leftTitle="Java 문제"
  rightTitle="시험 문제"
  rightSummary={`총 ${total}점`}
  filter={(q, text) => q.question.includes(text)}   // 있으면 왼쪽 검색 칸
  renderItem={(q) => q.question}
/>
```

- `ExamQuestionPicker`(Grid 둘, 행을 누르면 바로 옮겨짐)를 대신합니다. 체크한 뒤 가운데 [추가 →] · [← 빼기]로 옮기고, 두 번 누르면 바로 옮깁니다. 머리 체크박스는 그 목록 모두 체크입니다.
- 체크박스라서 키보드(Tab · 스페이스)로도 고를 수 있습니다. 768px 이하에서는 위아래로 쌓입니다.
- [추가 →] · [← 빼기]는 보이는 글자를 그대로 이름으로 쓰고, 체크한 개수는 화면에 안 보이는 글자(`visually-hidden`)로 덧붙여 스크린 리더만 읽습니다.
- 양쪽 뜻이 반대일 때(권한 허용 · 미허용)는 `leftTone="danger"`(붉은 머리 · 흐린 글자) · `rightTone="success"`(초록 머리)로 한눈에 구분합니다. 고르기만 하는 곳(시험 문제)에는 색을 넣지 않습니다.
- 과정 수강생 추가(`CourseStudentList`)처럼 "전체 중 일부를 고르는" 곳에도 씁니다. 고를 것이 수백 개면 왼쪽을 검색 + `Table` 체크 선택으로 바꾸는 편이 낫습니다.

### 배치 · 탐색

샘플 파일: `StandardLayoutCatalog.jsx`

#### 화면 머리 · 브레드크럼

```jsx
<PageHeader
  crumbs={[{ title: "시스템 관리" }, { title: "회원 관리" }]}   // 실제 화면은 crumbs={useBreadcrumbs()}
  title="회원 관리"
  description="회원 정보 · 역할 · 잠금 상태를 관리합니다."
  actions={<Button variant="primary" icon={icons.add}>회원 등록</Button>}
/>
<Breadcrumb crumbs={[...]} />   {/* 브레드크럼만 */}
```

- `common/PageContainer`(`⌂ > 대 > 중`, 22px 제목)를 대신하는 모양입니다. 2026-11-17부터 `PageContainer`도 안에서 이 `PageHeader`를 그리므로 아직 옮기지 않은 화면도 머리 모양은 같습니다. `PageContainer`는 호환용으로 남겨 둔 것이고, 화면을 옮길 때는 `PageHeader`를 직접 씁니다 (`useBreadcrumbs`의 결과를 `crumbs`로, 필요하면 `description` · `actions`).
- 브레드크럼은 `<ol>`이고 구분자 `›`는 CSS가 그립니다. 마지막 항목(현재 화면)은 링크 없이 `aria-current="page"`.
- **`to`는 실제로 열 수 있는 화면에만** 넘깁니다 (URL이 있는 소메뉴 · 상세 화면의 목록). URL이 없는 대 · 중메뉴는 `to` 없이 글자라 마우스를 올려도 반응하지 않습니다. 링크 항목은 평소에도 글자 항목보다 조금 진합니다(`--color-text-secondary`).
- `useBreadcrumbs()`는 이 규칙대로 URL이 있는 메뉴에만 `to`를 붙여 줍니다. 그대로 `crumbs`에 넘기면 됩니다. 라우트로만 만든 항목(메뉴에 없는 화면의 중간 단계)은 열 수 있는 화면인지 알 수 없어 `to`를 붙이지 않습니다. 기존 `common/Breadcrumb`(글자만, `to`를 쓰지 않음)은 샘플의 표준화 전 기록만 써서 `archive/common/Breadcrumb.jsx`로 옮겼습니다 (2026-11-18).
- `actions`에는 화면 전체에 걸리는 동작만 둡니다 (등록 · 내보내기). 목록 위 검색 · 필터는 `.toolbar` 클래스 (PageHeader 아래에 따로).

#### 사이드 메뉴

사이드바는 앱에 하나(`components/menu/SideMenu.jsx`, `MainLayout`이 그림)이고, 다른 화면에서 다시 쓰지 않습니다. 샘플 예시는 실제 사이드바의 CSS(`SideMenu.module.css` · `UserProfile.module.css`)를 그대로 import해서 그리므로, 실제를 고치면 예시도 같이 바뀝니다. 예전 표준 부품 `SideNav`(`<details>` 접기 · 아이콘 · 왼쪽 선)는 실제 사이드바와 모양이 달랐고 쓰는 곳이 없어 지웠습니다 (2026-11-18).

- 색은 `--color-sidebar-*` 토큰이고, 글자 크기 · 굵기 · 모서리도 표준 토큰입니다 (2026-11-18). 다크 모드와 상관없이 항상 어둡고, 배경 · 현재 메뉴 색은 테마 네이비(7장 "강조색 (primary) 과 테마 (brand)")입니다.
- **구조**: 머리 → 프로필(역할 · 이름 · [로그아웃]) → 대분류 제목(작은 대문자) > 중분류 버튼(누르면 접힘, `aria-expanded`, 화살표 ›) > 화면 링크. 현재 화면 링크는 강조 글자 + 옅은 배경(`NavLink`의 `active` · `aria-current="page"`).
- **사이드바 안 버튼**: [로그아웃] · [다시 시도](메뉴를 못 불러왔을 때)는 `sidebar-btn`(`styles/nav.css`)입니다. 밝은 배경용 `.btn`은 어두운 사이드바에서 색이 맞지 않아 따로 둡니다. 아이콘 없이 글자만.
- **키보드**: 로고 · 머리 버튼 · 중분류 버튼 · 화면 링크 · `sidebar-btn` 모두 포커스 테두리(`--color-focus`)가 보입니다.

```jsx
<button type="button" className="sidebar-btn">로그아웃</button>
```
- **머리**: 로고 | [☾ 다크 모드] [‹ 접기]. 로고는 첫 화면(`/`, 대시보드)으로 가는 링크입니다 (작은 화면 서랍에서 누르면 이동하며 닫힘). 다크 모드 버튼은 `aria-pressed`(켜짐 상태)이고 아이콘은 지금 상태의 반대(밝은 모드면 ☾, 다크면 ☀)입니다. 접으면 로고를 숨기고 [접기] 아래에 [다크 모드]를 세로로 둡니다.
- **접기 (큰 화면)**: [‹]로 60px까지 접어 본문을 넓힙니다. 접힌 상태에서는 메뉴를 **표시하지 않습니다**. 메뉴에 아이콘이 없어서 약어("회" · "과")나 작은 글자는 겹치거나 잘려 결국 다시 펼쳐야 알 수 있기 때문입니다. 메뉴 데이터에 아이콘이 생기면 "아이콘 띠 + 올리면 펼쳐지는 메뉴"로 바꿉니다 (6장 "팀이 정할 것").
- **서랍 (768px 이하)**: 사이드바를 숨기고 왼쪽 위 [☰ 메뉴] 버튼(`aria-expanded`)으로 화면 위에 덮어 엽니다 (`--z-drawer`, 배경 `--color-overlay`). 배경 누르기 · Esc · 메뉴를 눌러 이동하면 닫히고, 열리면 [×]에, 닫히면 [☰]에 포커스가 갑니다. 이 폭에서는 접기 버튼을 쓰지 않습니다.

| 비슷한 것 | 쓰는 곳 |
| --- | --- |
| 사이드바 (`menu/SideMenu`) | 화면 이동 (앱 왼쪽, 하나) |
| `Tabs` | 화면 안 구역 전환 (회색 탭 바 · 세로 탭 · 폴더 탭 대신) |
| `list-group` | 목록에서 하나 고르기 (3단 메뉴 · `CourseMain` 세로 탭 대신) |
| `ChoiceGroup` · `Switch` | 값 고르기 |

전체 기준은 8장 "어떤 걸 쓰나"의 "전환" 줄입니다.

#### 탭

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

- `variant="line"`(기본): 화면 · 패널 안의 구역 전환. `variant="pills"`: 같은 영역 안 작은 내용 전환 (객관식 / 주관식처럼 아래 패널을 바꿈). 패널을 바꾸지 않고 폼 · 필터 값만 고르면 `ChoiceGroup variant="segmented"`입니다.
- 키보드: ← → 로 이동하며 바로 선택, Home · End.
- `aria-controls`는 선택된 탭에만 붙습니다 (그려진 패널이 그 탭의 것뿐이라서).
- 선택 상태는 부모가 가집니다. 쿼리 파라미터 탭은 `value={searchParams.get("tab")}` · `onChange={(id) => setSearchParams({ tab: id })}`처럼 연결합니다.

#### 패널 · 카드

| 무엇 | 쓰는 곳 | 사용 |
| --- | --- | --- |
| `Panel` | 화면의 주요 구역 (상세 · 목록 · 설정) | `title` · `subtitle`(건수) · `badge` · `actions`(머리 버튼) · `footer`(바닥 버튼) · `flush`(표 · 목록을 가장자리까지) |
| `card` | 같은 종류 여러 개를 나열 (과정 · 문제) | `card-header` · `card-title` · `card-meta` · `card-body`, 나열은 `card-grid` |
| `card card-clickable` | 누르는 카드 | `<button>`에 붙이고 `aria-pressed`, 선택이면 `is-selected` |
| `card card-accent` | 화면 맨 위 요약 정보 | 왼쪽 강조선 |
| `StatCard` | 수치 (평균 점수 · 출석률) | `label` · `value` · `unit` · `hint` · `trend`(`"up"` · `"down"`) |

패널과 카드의 차이: 패널은 **화면을 나누는 틀**(보통 한 화면에 1 ~ 3개, 머리 · 바닥 있음), 카드는 **같은 모양의 항목을 여러 개** 늘어놓을 때 씁니다.

#### 배치

| 클래스 | 쓰는 곳 |
| --- | --- |
| `toolbar` | 화면 위 검색 · 필터 줄 (왼쪽 `form-row`, 오른쪽 주 동작 버튼) |
| `toolbar-end` | 툴바 안 오른쪽 묶음 (주 동작 버튼 · 기준 안내). `style={{ marginLeft: "auto" }}` 대신 |
| `layout-split` | 목록 \| 상세 (오른쪽 폭 `--layout-aside-width`, 기본 380px) |
| `layout-3col` | 3단 (앞 단을 고르면 다음 단이 바뀜). 부품 예시는 과정 › 과제 › 제출 현황, 실제 3단 화면은 "화면 예시"의 메뉴 관리 · 환경 변수 관리를 따름 |
| `form-stack` | 세로로 16px 간격 쌓기 (폼 밖에서도 씀) |

`layout-split layout-split-start`: 좁은 쪽이 **왼쪽** (역할 목록 | 내용처럼 고르는 쪽이 먼저일 때). 폭은 같은 `--layout-aside-width`(기본 240px).

1024px보다 좁으면 `layout-split` · `layout-3col`은 한 줄에 하나씩 쌓입니다. 샘플 "화면 예시"의 첫 예시(목록 | 상세, 회원 관리 화면)가 이 부품들만으로 만든 화면입니다.

#### 선택 목록

```jsx
<ul className="list-group">
  <li><button type="button" className="list-item" aria-current={selected || undefined}>회원 관리</button></li>
</ul>
```

| 무엇 | 메모 |
| --- | --- |
| `list-group` · `list-item` | **고르기만 하는** 선택 목록 (과정 · 역할 · 코드 그룹 등). 순서를 바꿔야 하면 `list-group` 대신 작은 `Table`(`onReorder`, 화면 예시 › 메뉴 관리). 선택은 `aria-current="true"`, 미사용은 `is-muted`, 오른쪽 내용은 `list-item-end` |

#### 가운데 카드 (로그인 · 비밀번호 다시 확인)

```jsx
<div className="auth-page">
  <form className="auth-card" onSubmit={submit}>
    <h2 className="auth-title">LMS 로그인</h2>
    <p className="auth-description">설명 (선택)</p>
    {error && <Callout tone="danger" icon={null}>{error}</Callout>}
    <div className="form-stack">{/* Field들 */}</div>
    <Button type="submit" variant="primary" block loading={loading}>로그인</Button>
    <p className="auth-footer">도움말 · 돌아가기</p>
  </form>
</div>
```

- 사이드바 없는 한 가지 일만 하는 화면 (로그인, 개인 정보 앞 비밀번호 다시 확인).
- 오류는 카드 위 `Callout` 하나 (어느 칸이 틀렸는지 알려 주지 않음). 틀리면 비밀번호만 비움.

#### 팝업 창 틀

| 클래스 | 쓰는 곳 | 메모 |
| --- | --- | --- |
| `popup-page` · `popup-header` · `popup-title` · `popup-actions` · `popup-body` | `window.open`으로 연 창 (`/popup/homework`) | 사이드바 없는 화면 틀. 머리는 위에 붙고 본문만 스크롤 |

팝업 창은 차단 · 권한 조회(MainLayout 밖) · 뒤로 가기 문제가 있어서, 새로 만들 때는 먼저 큰 모달(`Modal size="lg"`)이나 같은 창의 상세 화면으로 될지 검토합니다.

### 내용

샘플 파일: `StandardContentCatalog.jsx`

#### 시험 문제 · 보기

```jsx
import QuestionBlock from "../common/ui/QuestionBlock";

<QuestionBlock no={1} title="기본형이 아닌 것은?" score={5} options={options} value={answer} onChange={setAnswer} />
<QuestionBlock no={2} title="..." multiple options={options} value={answers} onChange={setAnswers} />
<QuestionBlock no={1} title="..." options={options} value={submitted} answer={correct} showResult />
<QuestionBlock no={3} title="출력 결과는?" code={source}>
  <textarea className="form-control form-control-mono" aria-label="3번 답안" />
</QuestionBlock>
```

- `Exam*Modal`(인라인 문제 블록) · `admin/test`(보기 선택 `#bbfdbb`) · 잠긴 정답 표시를 대신합니다.
- 보기 전체가 눌리는 칸이고 진짜 `radio` · `checkbox`입니다 (방향키 · 스페이스). 고른 보기는 강조색, `showResult`면 정답 초록 · 고른 오답 빨강이고 고칠 수 없습니다.
- `onChange`가 없으면 읽기 전용 (문제 미리 보기). 주관식 · 코드 답안은 `children`.
- 컴포넌트 없이: `question` · `question-head` · `question-no` · `question-title` · `question-score` · `question-body` · `question-code`, 보기는 `option-list > li > label.option`(`is-answer` · `is-wrong`).

#### 문항 번호 이동 (시험 응시)

```jsx
<nav className="question-nav-bar" aria-label="문항 이동">
  <ol className="question-nav">
    <li><button type="button" className="question-nav-item is-done" aria-current="step" aria-label="1번 (답함)">1</button></li>
  </ol>
</nav>
```

- 답한 문항은 `is-done`(강조색 옅은 배경), 지금 문항은 `aria-current="step"`(테두리). 누르면 그 문항으로 스크롤.
- `question-nav-bar`는 모달 본문 맨 위에 붙어(sticky) 스크롤해도 보입니다. 문항 상자에는 `scroll-margin-top`(막대 높이만큼)을 줘서 이동했을 때 막대에 가리지 않게 합니다.
- 바닥에 "답함 n / N" + `Progress size="sm"`.

#### 답안 상자

| 클래스 | 쓰는 곳 | 메모 |
| --- | --- | --- |
| `answer-box` | 채점 · 문제 보기의 학생 답안 | `answer-box-label`(이름 + 결과 배지), `answer-box-code`(코드 답안 고정폭) |
| `answer-box-model` | 모범 답안 · 정답 | 초록 상자 |
| `answer-box-empty` | 미제출 | 점선 · 흐린 글자. 이때 채점 버튼은 비활성 |

#### 댓글

```jsx
import Comment from "../common/ui/Comment";

<ul className="comment-list">
  <Comment author="홍길동" time="2026-11-16 14:20" body={text} actions={<Button variant="text">답글</Button>}>
    <Comment author="김강사" badge={<Badge tone="primary">강사</Badge>} time="..." body="..." />
  </Comment>
</ul>
```

- `HomeworkReply` · `ReplyForm`의 인라인 댓글을 대신합니다. 120자를 넘는 글은 3줄로 접고 [더 보기]가 붙습니다.
- 답글은 `children`으로 넣으면 왼쪽 선으로 들여 씁니다.
- 입력 칸은 `comment-form`: `<div className="comment-form"><textarea className="form-control" /><div className="btn-group btn-group-end">[등록]</div></div>` (세로 8px 간격, textarea 최소 64px). 과제 제출 칸도 같음.

#### 키-값 목록 · 타임라인

```jsx
<dl className="desc-list" style={{ "--desc-label-width": "80px" }}>
  <dt>아이디</dt><dd>user01</dd>
</dl>

<ol className="timeline">
  <li className="timeline-item">
    <div className="timeline-meta">2026-11-10 <span className="tag">학습</span></div>
    <p className="timeline-body">진도 확인</p>
  </li>
</ol>
```

| 무엇 | 메모 |
| --- | --- |
| `desc-list` | 키-값. 라벨 폭은 `--desc-label-width`(기본 120px), 회색 상자는 `desc-list-boxed` |
| `timeline` | 상담 기록처럼 날짜순 기록 |

#### 인용 · 세로 키-값 · 상자 목록

| 클래스 | 대신하는 것 | 메모 |
| --- | --- | --- |
| `quote` | `MyCounsel` 의견 인용 상자 | `<blockquote className="quote"><p>…</p><footer>이름</footer></blockquote>` |
| `desc-list-stacked` | `MyCounsel` 3열 정보 | 라벨 위 · 값 아래. 항목마다 `<div><dt/><dd/></div>`, 열 수 `--desc-columns`(기본 3, 768px 이하 2) |
| `list-boxed` | `RoleUserMoveModal` 회색 상자 목록 | `<ul>`. 길면 `--list-max-height`로 높이 제한 + 스크롤 |

### 화면 예시

샘플 파일: `StandardScreenCatalog.jsx` · `ScreenStudyCatalog.jsx` · `ScreenSystemCatalog.jsx` · `ScreenMyCatalog.jsx`. 목록 | 상세 예시는 "배치" 설명을 참고합니다.

#### 상세 · 대시보드 · 오류 화면

샘플 "화면 예시"에 표준 부품만으로 만든 화면 세 가지가 있습니다. 화면을 옮길 때 그대로 따라 만들면 됩니다.

| 예시 | 부품 | 대신하는 것 |
| --- | --- | --- |
| 상세 화면 | `PageHeader`(브레드크럼 + 수정 · 삭제) + `Panel`(제목 · 태그) + `card-meta` + `card-body` + `FileList` | `MyCourseData` 상세 머리 · 메타 · 첨부 칩 |
| 대시보드 | `card-grid` + `StatCard` → 과정 `card` + `Progress` → `Panel flush` + `list-group` | `main/Main` 대시보드 카드 |
| 오류 화면 | `StatusBox type="notFound" size="lg"` · `StatusBox type="error" size="lg" code="500"` | `common/error/*` 404 · 라우트 오류 상자 |

#### 과정 · 시험 · 문제 은행 · 과제 · 설문 (admin/course · test · survey)

샘플 "화면 예시"에 있습니다. 표준화 전 탭 "과정 · 시험 · 문제 은행 · 과제 · 설문 화면"에 같은 화면의 옮기기 전 모양이 있어 나란히 비교할 수 있습니다.

| 예시 | 부품 | 대신하는 것 | 메모 |
| --- | --- | --- | --- |
| 과정 등록 폼 | `form` + `Panel`(바닥 버튼) + `Field` · `form-row` + `SelectBox` + `input-range` + `FilePicker` | `CourseAdd` (h3 라벨 · 스타일 없는 입력) | 빈 채로 제출하면 오류, 저장 중 `loading` |
| 과정 상세 | `PageHeader` + `card`(`desc-list-stacked` + `Progress`) + `Tabs` 9개 | `CourseItem` (글자 진행률 · IconButton 탭) | 탭이 많으면 탭 줄이 가로 스크롤. 상태는 `Badge tone="info"` (강조색 아님) |
| 시험 문제 고르기 | `Panel` + `Field` + `form-check`(공개 체크박스) + `TransferList` | `ExamPage` 추가 화면 · `ExamQuestionPicker` | 유형은 `tag` (분류), 총 배점은 `rightSummary`. 공개는 저장과 함께 적용되므로 `Switch`가 아니라 체크박스 |
| 문제 은행: 문제 추가 · 수정 | `form` + `Panel`(수정이면 바닥 맨 앞에 삭제 `btn-start`) + `ChoiceGroup`(유형) + `Field` + `ListEditor renderMarker`(보기 + 정답 표시) · `ChoiceGroup variant="segmented"`(O/X 정답) · `Callout`(주관식 · 코드) + 미리 보기 `QuestionBlock showResult` | `AddTest` · `UpdateTest` | 추가와 수정은 같은 폼. 보기 개수 · 정답 번호 숫자 칸 대신 줄 수 = 보기 개수(`answerCount`), 줄 순서 = `answerSheet1~5`, 표시한 줄 번호 = `correctAnswer`(여러 개는 "1,3"). 유형을 바꾸면 정답 표시만 초기화 |
| 채점 | `Modal size="lg"` + `Tabs`(수강생, 건수 = 채점한 문항) + `question` + `answer-box` + `btn[aria-pressed]` + `Badge` | `ExamGradeModal` | 미제출이면 채점 버튼 비활성 |
| 과제 상세 | `PageHeader`(보기: 수정 · 삭제 / 수정: 취소 · 저장) + `toolbar`(미제출 · 랜덤 뽑기) + `layout-split`(본문 \| 댓글 `Panel`, 바닥에 입력) | `HomeworkItem` · `HomeworkSubmitStatus` | 고친 채로 취소하면 `useConfirm`. 마감 후에는 [수정] · 입력 대신 `Callout tone="warning"` |
| 설문 편집기 | `Tabs`(사전 · 사후) + `layout-split`(문항 `Panel` 목록 \| 미리 보기 `Panel`) + `ChoiceGroup variant="segmented"`(답하는 방식) + `ListEditor`(보기) | `Survey` | 미리 보기가 입력을 바로 따라감. 문항 삭제는 확인 창 |
| 팝업 창 | `popup-page` + `Table` | `/popup/homework` | 위 메모 참고 |

**보기 ↔ 수정 전환 규칙** (과제 상세 예시):

- 같은 자리에서 바꿉니다. 제목 줄의 값(마감일)과 본문이 입력 칸으로 바뀌고, 머리 버튼이 [수정 · 삭제] → [취소 · 저장]으로 바뀝니다.
- [저장]은 바뀐 것이 있을 때만 켜지고, 저장 중에는 `loading`("저장 중...")입니다.
- 고친 채로 [취소]하면 `useConfirm`으로 한 번 묻습니다. 바뀐 것이 없으면 바로 돌아갑니다.
- 수정할 수 없는 상태(마감 후 등)에서는 [수정] 버튼을 숨기고 이유를 안내합니다.

#### 강의실 · 시스템 관리 · 로그인 · 상담 (8차)

샘플 "화면 예시"에 있습니다. 6장 "화면별 표준 대응"에서 **예시 (8차)** · **부품 + 예시 (8차)**인 화면입니다.

| 예시 | 부품 | 대신하는 것 | 정한 것 |
| --- | --- | --- | --- |
| 시험 응시 · 시험지 보기 | `Modal size="lg" dismissible={false}` + `question-nav` + `QuestionBlock` + `Progress` · `answer-box` | `ExamTakeModal` · `ExamQuestionViewModal` | 응시는 [제출]로만 닫힘. 안 푼 문항 수를 알려 주고 확인. 유형별 답 칸 (주관식 textarea · 코드 고정폭) |
| 문제 은행 목록 | `Tabs`(건수) + `card` + `tag`(유형) + `card-meta` + `QuestionBlock showResult` | `Test` | 통계는 이름 붙인 한 줄 글자 (목록 카드 안에 `StatCard` 안 씀). 펼침은 문항마다 따로 (`aria-expanded`) |
| 주간 접속 기록 | `toolbar`(지난주 · 기간 · 다음 주 · 이번 주) + `Table bordered` + `col-highlight` · `col-off` + `Badge` | `StudentConnected` | 칸은 첫 접속 시각, 없으면 '결석', 기준 넘으면 '지각', 안 온 날은 흐린 '-', 쉬는 날은 열 전체 '쉼' |
| 날짜별 시간표 | `table.table-bordered`(rowSpan) + `tr.is-highlight` + `Panel`(접기) | `MyTimetable` | 위 "한 묶음이 여러 줄인 표" |
| 목록 위 추가 폼 | `toolbar` + `Panel`(form) + `Field` + `SelectBox` + `datetime-local` + `Table` | `MyInterview` · `HomeWorkList` · `CourseStudentList` | 아래 "목록 위 추가 폼 vs 모달" |
| 댓글 수정 | `Comment`(actions · badge) + 같은 자리 textarea + `Callout`(마감) | `HomeworkReply` | 아래 "할 수 없는 동작" |
| 메뉴 관리 | `layout-3col` + `Panel`(flush) + `Table`(`onReorder` · `isRowLocked` · `selectedKey` · `isRowMuted`) + `Callout`(actions) | `Menu` · `MenuColumn` | 각 단은 작은 `Table`: 행을 누르면 선택, 손잡이를 끌거나 ↑ ↓ 키로 순서. 여러 단 · 여러 번 옮긴 뒤 "순서가 변경되었습니다: 바뀐 목록 이름" 바에서 [순서 저장]으로 한 번에. 옮길 수 없는 메뉴는 `isRowLocked`(고정) |
| 접근 관리 | `Panel`(form) + 연쇄 select(`input-range`) + `form-row`(도메인 · 권한 · 이름) + `Table`(선택 행) | `Access` | 연쇄 선택: 위를 고르기 전 아래 비활성 + 안내, 위를 바꾸면 아래 비움. 권한은 원래 화면처럼 서버가 준 목록에서 "설명 (동작)"으로 고르고(등록된 것은 비활성), 고르면 이름을 채움. 결과 코드는 권한 칸 힌트로 (사이 기호 · 따로 상자 없음). 표의 [수정] → 위 폼이 수정 모드(제목 · 배지 · 버튼 문구), 못 바꾸는 값은 잠금 + 이유 |
| 권한별 접근 권한 관리 | `layout-split-start` + `list-group` + 연쇄 select(필터) + `TransferList`(`leftTone` · `rightTone`) + `Callout`(actions) | `AccessRole` | 미허용 붉은색 · 허용 초록색. 옮긴 것은 바로 저장하지 않고 "저장하지 않은 변경 +n · -n" + [되돌리기] [저장]. 변경이 있는데 다른 역할을 고르면 확인 |
| 환경 변수 관리 | `layout-3col` + `list-group` + `Table`(선택 · 흐린 행) + `Panel` + `desc-list` · `Field` · `form-check`(사용) | `Code` · `AddCode` · `UpdateCode` · `CodeForm` | 상세 패널 하나가 보기 · 수정 · 추가. [저장]은 바뀐 게 있을 때만. 추가한 뒤 코드(ID)는 못 바꿈 |
| 로그인 · 비밀번호 다시 확인 | `auth-page` + `auth-card` + `Field` + `Callout` + `Button block` | `Login` · `MyPassword` | 위 "가운데 카드" |
| 상담 기록 | `Callout`(actions) + `desc-list` + `Panel`(actions) + `card-grid` + `Badge`(수준) + `ChoiceGroup` + `Field count` + `timeline` + `StatCard` | `MyCounsel` | 기본 정보가 없으면 위에 안내 + 아래 구역 잠금(버튼 비활성 + 이유). 구역마다 [수정] → [취소] [저장]. 고칠 수 없는 기록은 등록 전에 확인 |
| 설문 결과 (집계) | `popup-page` + 응답률(`progress-row` + `Progress`) + `Tabs`(문항별 집계 · 학생별 응답) + `Panel` + `Table`(보기 · 비율 막대 · 응답 수) · `list-boxed`(주관식) / `layout-split-start` + `list-group` + 읽기 전용 `QuestionBlock` · `answer-box` | `CourseSurveyResult` (+ 담당자가 만들 집계) | 객관식은 보기마다 응답 수 + 비율 막대. 여러 개 고르기는 응답자 기준이라 합이 100%를 넘는다고 안내. 주관식은 빈 답을 빼고 목록. 학생별은 응답자 목록 \| 그 학생의 답 (빈 답은 `answer-box-empty`) |

**목록 위 추가 폼 vs 모달**

- 입력 칸 4개 이하이고 목록을 보면서 넣는 게 편하면 목록 위에 펼치는 폼 (`Panel`). 열리면 [등록] 버튼은 숨기고, 저장하면 닫고 목록에 바로 넣고 토스트.
- 칸이 많거나, 펼치면 목록이 크게 밀리면 폼 모달 (`Modal size="md"`). 긴 글(에디터)은 별도 화면.

**할 수 없는 동작**

- 권한이 없어서 못 하는 동작(남의 댓글 수정 등)은 버튼을 **숨깁니다**.
- 순서 · 조건 때문에 지금만 못 하는 동작(기본 정보 등록 전 수정, 저장할 변경 없음)은 버튼을 **비활성**으로 두고 이유를 `hint` · `title` · `Callout`으로 알립니다.
- 마감처럼 화면 전체가 잠기면 버튼을 숨기고 이유를 위에 한 번만 안내합니다.

---

## 9. 다크 모드

### 지금 상태

- 토큰 · 표준 UI(8장)는 다크 모드를 지원합니다.
- **앱 전체에서 켭니다**: 사이드바 머리의 [☾] 버튼 (샘플 페이지 목차의 버튼도 같은 값). 이 브라우저에 기억하고(`localStorage`의 `lms-color-scheme`), 기본은 밝은 모드입니다. 시스템 설정은 따르지 않습니다.
- **화면별로 켜짐**: 표준으로 옮긴 화면만 다크를 따릅니다. `MainLayout`이 본문(`<main>`)을 밝은 섬으로 감싸고, 지금 라우트의 `handle`에 `darkReady: true`가 있으면 섬을 풉니다. 라우트 오류 화면(`errorElement`)은 라우트가 아니라서 오류가 난 화면의 설정을 따릅니다.
- **2026-11-19 기준 `MainLayout` 안의 모든 라우트가 `darkReady`** 입니다 (대시보드 · 로그인 · 샘플 · 내 정보 · 수강 과정 · 과정 관리 · 설문 · 시험 문제 · 시스템 관리 전부, 404). `MainLayout` 밖의 팝업(`/popup/homework`, 설문 결과 · 통계)은 `popup-page`라 토큰을 따릅니다.
- 아직 색을 직접 적은 곳: 리치 텍스트 `Editor`(`common/Editor.module.css` · `editor/editorContent.css`, 표준 밖이라 다크에서도 밝은 상자), 밝은 섬의 글자색(`layout/MainLayout.module.css`, 섬과 함께 지울 것).
- 사이드바는 원래 어두운 색이라 모드와 상관없이 같습니다.
- 샘플의 "표준화 전" · "기존 샘플" 영역과 그 모달은 색을 직접 적어서 다크 모드에서도 **밝게 고정**됩니다 (아래 "밝은 섬").

```js
// theme/colorScheme.js
const [scheme, setColorScheme] = useColorScheme(); // "light" | "dark"

// router/MainRouterProvider.jsx: 다크 모드를 확인한 화면
{ path: "member", element: <MemberManagement />, handle: { crumb: "회원 관리", menu: true, darkReady: true } }
```

### 구조

```html
<html data-color-scheme="dark">              <!-- 전체 다크 -->
  ...
  <div data-color-scheme="light">...</div>   <!-- 이 안만 밝게 (밝은 섬) -->
```

- `index.css`에서 **색 토큰만** 두 벌입니다: `:root, [data-color-scheme="light"]`(기본)와 `[data-color-scheme="dark"]`. 크기 · 글꼴 · 모서리 토큰은 하나입니다.
- 속성을 붙인 요소 안에서 토큰 값이 바뀌므로, 토큰만 쓴 코드는 **아무것도 고치지 않아도** 다크 모드가 됩니다. hex를 직접 적은 코드는 바뀌지 않습니다.
- `color-scheme`도 함께 바뀌어 네이티브 입력 · 셀렉트 목록 · 날짜 선택기 · 스크롤바가 모드를 따릅니다.
- 모달 · 토스트는 `<body>`에 portal로 그려지므로, 밝은 섬 안에서 연 모달이 밝아야 하면 모달 최상위 요소에도 `data-color-scheme="light"`를 붙입니다 (`archive/sample/Modal.jsx` · 샘플 오버레이 예시가 그렇게 함).

### 다크 모드 색

| 토큰 | 밝은 모드 | 다크 모드 |
| --- | --- | --- |
| `--color-bg-page` · `-bg-surface` · `-bg-subtle` | gray-2 · 흰색 · gray-0 | `#141619` · gray-9 · `#2a2f34` |
| `--color-bg-raised` (모달 · 드롭다운 메뉴) | 흰색 (`-bg-surface`와 같음) | `#2b3035` (카드보다 한 단계 밝게) |
| `--color-text` · `-text-secondary` · `-text-muted` · `-text-placeholder` | gray-9 · gray-7 · gray-6 · gray-5 | gray-0 · gray-5 · `#9ca3aa` · gray-6 |
| `--color-primary` · `-primary-hover` (채움) | `--primary-fill` · `-fill-hover` (기본 indigo-7 · 8) | 같음 (흰 글자 명암비를 지키려고 그대로) |
| `--shadow-*` | 검정 그림자 | 밝은 1px 링 + 진한 검정 그림자 |
| `--color-overlay` (모달 뒤) | 검정 0.4 | 검정 0.65 |
| `--color-border` · `-border-light` | gray-4 · gray-3 | gray-7 · gray-8 |
| `--color-primary-text` · `--color-link` · `--color-focus` | `--primary-text` · 채움 | `--primary-dark-text` · `--primary-dark-focus` (기본 indigo-3 · 4) |
| `--color-primary-light` | indigo-0 | 반투명 강조색 (`color-mix` 18%) |
| 상태 글자 (`success` · `danger` · `warning` · `info`) | green-9 · red-8 · `#8a6100` · blue-8 | green-4 · red-4 · yellow-4 · blue-3 |
| 상태 배경 · 테두리 | 0단계 · 2단계 | 반투명 (배경 0.14 ~ 0.2, 테두리 0.35) |
| `--color-danger-fill` (채운 위험 버튼) | red-8 | red-8 (그대로) |

**글자 단계**: 다크 글자는 눈부심을 줄이려고 순백을 쓰지 않습니다 (배경도 순검정이 아님). 대신 단계 사이를 넓혀(카드 위 명암비 본문 14.6 · 보조 7.4 · 흐림 6.1 · placeholder 4.6) 본문이 앞으로 나오게 했습니다. 흐린 글자는 모달 · 회색 배경 위에서도 4.5:1을 넘도록 gray-5와 gray-6 사이 값(`#9ca3aa`)입니다.

**높이(떠 있는 정도)**: 어두운 배경에서는 그림자가 잘 안 보여서, 높이를 밝기로 나타냅니다: 페이지 < 카드(`bg-surface`) < 모달 · 메뉴(`bg-raised`). 그림자에는 밝은 1px 링을 더해 경계를 그립니다 (Material Design · GitHub · Linear와 같은 방식). 떠 있는 요소를 새로 만들면 배경을 `--color-bg-raised`로 둡니다.

**강조 배경 위 글자**: 성공 · 위험색 채움 위의 글자(시험 보기 번호)는 `--white` 대신 `--color-bg-surface`를 씁니다. 다크의 밝은 초록 · 빨강 위 흰 글자는 읽히지 않기 때문입니다.

"채움"(버튼 배경)과 "글자"(연한 배경 · 어두운 배경 위 글씨)를 다른 토큰으로 나눈 이유가 이것입니다. 어두운 배경 위 글자는 밝은 색이어야 읽히지만, 흰 글자를 올리는 버튼 배경은 진해야 합니다. 새 코드에서 강조색 **글자**는 `--color-primary-text`, 위험 **채운 배경**은 `--color-danger-fill`을 씁니다.

### 화면을 다크 모드에 맞추려면

1. 화면을 표준으로 옮깁니다 (6장 "화면 옮기는 순서"). 색을 hex로 직접 적은 곳이 남아 있으면 다크에서 깨집니다 (흰 상자 위 밝은 글자 등).
2. 사이드바 [☾]로 켜고 화면 · 모달 · 빈 목록 · 오류 상태를 한 번씩 봅니다.
3. 라우트 `handle`에 `darkReady: true`를 넣습니다. 하위 라우트도 같은 화면이면 부모 하나에만 넣어도 됩니다 (지금 라우트 중 하나라도 `darkReady`면 켜짐).
4. 모든 화면이 `darkReady`가 되면 `MainLayout`의 밝은 섬과 `darkReady` 표시를 지웁니다. 2026-11-19에 모든 라우트가 `darkReady`가 되어 이제 지울 수 있습니다 (다음 단계: 섬 · `darkReady` 표시 · 섬 글자색을 지우고, 새 화면은 처음부터 토큰으로).

- 흰 카드를 hex로 적은 화면은 `Panel`로 바꾼 뒤 `darkReady`를 넣습니다 (`Section`은 쓰는 화면이 없어 기록 폴더로 옮김). `PageContainer`는 2026-11-17부터 안쪽이 표준 `PageHeader`라 다크 모드를 따릅니다 (화면의 나머지 부분만 확인하면 됨).
- 표준 `Modal` · 토스트는 `<body>`에 그려져서, 다크 모드에서 밝은 섬 안(아직 안 옮긴 화면)에서 열어도 어둡게 보입니다. 옮기기 전 화면에서 밝게 보여야 하면 모달 최상위에 `data-color-scheme="light"`를 붙입니다.
