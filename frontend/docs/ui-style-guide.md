# UI 스타일 가이드 (현황 · 카탈로그)

프론트엔드 화면들이 쓰는 UI를 **현재 모양 그대로** 모아 둔 문서입니다. 공통 스타일(`index.css`)과 디자인 시스템을 정하기 위한 출발점입니다.

- 실제 모양: 샘플 페이지 `/sample` (사이드바 메뉴 "Sample", 맨 위 목차 버튼으로 이동)
- 코드: `src/components/sample/catalog/` (스타일은 `Catalog.module.css` 하나에 모음)
- 기준: 2026-11-16 `dev` 브랜치

> 이 문서와 카탈로그는 **"지금 이렇게 되어 있다"** 를 보여 줍니다. "앞으로 이렇게 쓴다"는 6장(통일 방향)에서 정한 뒤 이 문서를 고쳐 나갑니다.

---

## 1. 샘플 페이지 구성

| 목차 | 내용 | 파일 |
| --- | --- | --- |
| 토큰 | 색 · 글자 크기 · 모서리 · 컨트롤 높이 · 포커스 · 비활성 | `TokenCatalog.jsx` |
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

| 컴포넌트 | 위치 | 주요 props · 메모 |
| --- | --- | --- |
| `PageContainer` | `common/PageContainer.jsx` | 브레드크럼 + 22px 제목 + 본문. `title`을 안 넘기면 브레드크럼 마지막 항목 |
| `Breadcrumb` | `common/Breadcrumb.jsx` | `crumbs: {key, title}[]`. 항목 계산은 `useBreadcrumbs` |
| `Section` | `components/Section.jsx` | 흰 카드 + 1.2rem 제목. `title`, `nopadding`, `nomargin`, `direction`, `itemGap` |
| `Grid` | `common/Grid.jsx` | CSS grid 표. `header`, `content`, `columnStyle`, `checkable`, `editable`, `clickableColumn`, `activeRows`, `footer` |
| `Paginator` | `common/Paginator.jsx` | `start`, `countPerPageGroup`, `activePage`, `setActivePage`, `totalPageCount` |
| `IconButton` | `common/input/IconButton.jsx` | `icon`, `iconSize`(기본 20, 화면에서는 주로 16), `backgroundColor`, `disabled`, `hoverIconRotate`, `alwaysIconRotate`, `style`. **`className`은 받지 않음** |
| `icons` | `common/input/icons.js` | edit, close, add, setting, fullStar, star, login, logout, download, downloadDone, progress, delete, refresh, sort, unchecked, checked, radioUnChecked, radioChecked, home, arrowRight, error, ok, full, exitFull |
| `Id` · `Password` · `TextField` · `NativeSelect` · `Textarea` · `Checkbox` · `Radio` · `FileField` · `Button` | `common/input/Input.jsx` | `NativeSelect` · `Textarea`는 스타일 클래스가 정의되어 있지 않아 브라우저 기본 모양 |
| `Editor` | `common/Editor.jsx` | 리치 텍스트 에디터 (MyCourseData에서 사용). 카탈로그에는 넣지 않음 |
| `NotFound` · `RouteError` | `common/error/` | 404 · 라우트 오류 화면 |
| `Alert` · `Confirm` | `sample/Modal.jsx` | `ref.current.open()`. **common에는 아직 모달이 없음** |
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
- CSS 변수는 하나도 정의되어 있지 않습니다. `App.css`의 `var(--accent)` 등은 Vite 템플릿 잔재이고 아무 데서도 쓰지 않습니다.

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
- **IconButton에 넘긴 `className`이 무시됨**: `admin/course/list/CourseItem.jsx`(탭 선택 표시가 안 보임), `admin/survey/survey/Survey.jsx`
- **`.section` 전역 클래스**는 `Section.jsx`를 import한 화면에서만 로드됩니다. `CourseItem` · `CourseAdd` · `HomeworkItem`은 `className="section"`만 쓰고 있어서, 샘플 페이지를 먼저 열었는지에 따라 모양이 달라집니다.
- `CourseMain.jsx`의 `borederBotton` 오타 (스타일이 적용되지 않음)

### 정리 대상

- `App.jsx` · `App.css`: Vite 템플릿 잔재입니다. `App.css`는 `App.jsx`만 import하고, `App.jsx`는 아무 데서도 쓰지 않습니다.
- `index.css`의 `.main_container` · `.sidebar_container` · `.main_content`: 쓰는 곳이 없습니다 (`MainLayout.module.css`가 대신함).
- 같은 CSS 복사본: `.notice`(5곳), 모달 인라인 스타일 객체(`overlayStyle` · `boxStyle` · `headerStyle` … 4개 모달)
- `@fullcalendar/*` 패키지: 설치만 되어 있고 쓰는 곳이 없습니다.

### 결정이 필요한 것 (디자인 시스템)

| 항목 | 선택지 |
| --- | --- |
| 회색 팔레트 | Bootstrap 계열(`#212529` · `#495057` · `#ced4da` · `#f8f9fa`) vs 단순 회색(`#333` · `#666` · `#ccc` · `#f7f7f7`) |
| 강조색 | `#3b5bdb` · `#3f6fb5` · `#4a7fd8` 중 하나 (+ hover 한 단계 진하게) |
| 상태색 | 성공 · 오류 · 경고 · 정보 각각 글자 / 배경 / 테두리 3단계 (배지 · 경고 상자 · 오류 문구 공용) |
| 글자 크기 단위 | px 또는 rem 하나로. 단계 후보: 11 · 12 · 13 · 14 · 16 · 18 · 22 |
| 컨트롤 높이 | sm 30 · md 36 · lg 38 정도의 3단계 |
| radius | 4px 기본, 6px 큰 상자(패널 · 툴바 · 모달), 999px pill(배지 · 칩) |
| 버튼 종류 | primary · secondary · danger · text(link) + 크기 sm · md, IconButton과의 관계 |
| 모달 | 공통 Modal 컴포넌트 하나로 (폼 · 확인 · 큰 내용 크기 변형, 바깥 클릭 · Esc 규칙 통일) |
| 피드백 | alert() 대신 토스트, 빈 상태 · 로딩 · 오류 상자 각각 하나로 |

### 다음 단계

1. 6장의 "결정이 필요한 것"을 정해 `index.css`에 CSS 변수(`--color-*`, `--font-size-*`, `--radius-*`, `--control-height-*`)로 선언합니다.
2. 버튼 · 입력 · 배지 · 안내 상자 · 모달처럼 많이 겹치는 것부터 공통 클래스(또는 common 컴포넌트)를 만들고, 샘플 페이지에 "표준" 섹션을 추가합니다.
3. 화면들을 표준으로 옮기면서 카탈로그의 해당 `Variant`를 지웁니다. 카탈로그가 비면 샘플 페이지가 곧 디자인 시스템 페이지가 됩니다.
4. `sample/`의 중복 컴포넌트(`input/`, `Grid`, `Paginator`)를 쓰는 화면을 `common/`으로 옮기고, `Modal`은 `common/`으로 이동합니다.
