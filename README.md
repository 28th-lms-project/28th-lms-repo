# LearningWorks

> 교육 과정 운영에 필요한 수강생 관리, 출결, 과제, 시험, 설문, 상담을 한곳에서 처리하는 학습 관리 시스템(LMS)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/dashboard-main-dark.png">
  <img alt="강사 대시보드" src="docs/images/dashboard-main.png">
</picture>

| 항목      | 내용                                      |
| --------- | ----------------------------------------- |
| 개발 기간 | 2026.11.03 ~ 2026.11.20                   |
| 인원      | 5명 (기능 모듈별 풀스택 분담)             |
| 구성      | React SPA + Spring Boot REST API + Oracle |

## 목차

1. [프로젝트 소개](#프로젝트-소개)
2. [팀원](#팀원)
3. [주요 기능](#주요-기능)
4. [화면](#화면)
5. [시스템 구성 · 권한 구조](#시스템-구성--권한-구조)
6. [사용 기술](#사용-기술)
7. [실행 방법](#실행-방법)
8. [폴더 구조 · 문서](#폴더-구조--문서)
9. [협업 방식](#협업-방식)

---

## 프로젝트 소개

교육 기관에서 과정 하나를 운영하려면 수강생 명단, 출결, 과제, 시험, 설문, 상담 기록을 각각 따로 관리해야 합니다.
LearningWorks는 이 업무를 **과정 단위로 묶어** 한 화면에서 처리할 수 있도록 만든 웹 서비스입니다.

- **관리자 · 강사**는 과정을 만들고 수강생을 배정한 뒤, 과정 화면의 탭에서 출결 · 과제 · 시험 · 설문 · 상담을 운영합니다.
- **수강생**은 "내 강의"에서 시간표와 과제를 확인하고, 시험에 응시하고, 설문에 참여합니다.
- 메뉴와 버튼마다 **권한 코드**를 두고, 역할(관리자 · 강사 · 수강생 등)별로 접근할 수 있는 기능을 관리 화면에서 바로 바꿀 수 있습니다.
- 시험 과목, 문제 유형 같은 선택 항목은 **환경 변수(공통 코드)** 로 관리해서 코드 수정 없이 늘리거나 줄일 수 있습니다.

---

## 팀원

| 이름   | 역할     | GitHub                                      | 주요 작업                                                                                                                                       |
| ------ | -------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 임창진 | **팀장** | [Heboen](https://github.com/Heboen)         | 설문, 시험 문제 관리, 환경 변수 관리                                                                                                            |
| 유동혁 | 팀원     | [eastdh](https://github.com/eastdh)         | 역할 · 메뉴 관리, API 권한 체계 · 화면 권한, 대시보드<br>표준 UI 부품 · 스타일 가이드<br>백엔드 공통 응답 객체 · 프론트엔드 API 호출 클라이언트 |
| 이동욱 | 팀원     | [fustarc](https://github.com/fustarc)       | 회원 관리, 로그인 · 보안, 성적표, 내 정보 수정                                                                                                  |
| 이태훈 | 팀원     | [dlxogns03](https://github.com/dlxogns03)   | 과정 관리, 과제 관리, 시험 출제 · 응시 · 채점, 출결                                                                                             |
| 장규나 | 팀원     | [Jang-s-git](https://github.com/Jang-s-git) | 접근 권한 관리, 공통 컴포넌트<br>시간표, 면접 일정, 교육 자료, 상담                                                                             |

---

## 주요 기능

### 공통

- **로그인 · 인증**: JWT 기반 로그인, 로그인 실패 누적 시 계정 차단
- **대시보드**: 역할이 아니라 **과정에서의 관계와 권한**에 따라 영역을 보여 줌
  - 수강생: 출석률 · 평균 점수 · 오늘 출결과 출석 버튼 · 오늘 시간표 · 응시할 시험 · 마감 임박 과제
  - 강사: 오늘 출석 · 출석 주의 학생 · 채점 대기 · 과제 제출 현황 · 설문 응답률 · 다가오는 면접
  - 관리자: 진행 중 과정 현황 · 데이터 점검(시간표 미등록 · 강사 없음 등) · 역할별 회원 수
  - 슈퍼관리자: 위 내용 + 권한 코드 점검
- **내 정보**: 회원 정보 · 비밀번호 수정 (비밀번호 재확인 후 진입)
- **다크 모드**: 사이드바의 버튼으로 앱 전체를 다크 모드로 전환

### 과정 관리 (관리자 · 강사)

과정을 등록하고, 과정 상세 화면의 탭에서 운영합니다.

| 탭       | 기능                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------- |
| 수강생   | 수강생 배정 · 목록                                                                                                        |
| 출석률   | 수강생별 출석 현황                                                                                                        |
| 시간표   | 날짜별 수업 시간표                                                                                                        |
| 과제     | 과제 등록, 제출 현황, 댓글                                                                                                |
| 시험     | 문제 은행에서 문제를 골라 시험 출제, 공개 여부 설정, 수강생 답안 채점 (객관식 · O/X 자동 채점, 주관식 · 코드는 강사 채점) |
| 면접일정 | 수강생 면접 일정 관리                                                                                                     |
| 교육자료 | 파일 · 링크 자료 등록                                                                                                     |
| 설문     | 설문 출제, 참여 현황, 응답 결과, 문항별 통계                                                                              |
| 상담목록 | 수강생 상담 기록                                                                                                          |
| 성적     | 시험별 점수 · 평균                                                                                                        |

### 내 강의 (수강생)

- 출결, 시간표, 과제 제출, 면접 일정, 교육 자료 확인
- **시험 응시**: 문항 번호 이동, 답한 문항 수 표시, 제출 후 자동 채점
- **설문 참여**: 모달에서 응답, 참여한 설문은 "참여 완료" 표시, 결과는 본인 응답만 확인

### 문제 은행 · 설문 관리 (관리자)

- **시험 문제 관리**: 과목별 문제 등록 · 수정 · 삭제 (객관식 단항 · 다항, O/X, 주관식, 코드 작성), 미리 보기, 진입 시 비밀번호 재확인
- **설문 문항 관리**: 사전 · 사후 설문 문항과 보기 편집, 미리 보기

### 시스템 관리 (관리자)

- **회원 관리**: 회원 등록 · 수정, 비밀번호 초기화, 역할 변경
- **메뉴 관리**: 메뉴 구조 · 순서 · 상위 메뉴 이동 · 메뉴별 접근 역할. 저장하면 사이드바에 바로 반영
- **역할 관리**: 역할 등록 · 순서, 역할 간 회원 이동
- **접근 관리 · 권한별 접근 권한 관리**: 기능별 권한 코드를 역할에 부여
  - 화면 버튼과 서버 API가 같은 권한 코드로 동작하고, 저장하면 서버 검사에 바로 반영
  - 권한을 지정하지 않은 API는 기본으로 막혀 있음 (최고 관리자만 호출 가능)
- **환경 변수 관리**: 시험 과목 · 문제 유형 · 시험 종류 등 공통 코드 관리 (사용 중인 코드는 끌 수 없음)

---

## 화면

| 대시보드 (수강생)                                     | 대시보드 (강사)                                   |
| ----------------------------------------------------- | ------------------------------------------------- |
| ![수강생 대시보드](docs/images/dashboard-student.png) | ![강사 대시보드](docs/images/dashboard-tutor.png) |

| 대시보드 (관리자)                                   |
| --------------------------------------------------- |
| ![관리자 대시보드](docs/images/dashboard-admin.png) |

| 과정 상세 (탭)                              | 시험 응시                               |
| ------------------------------------------- | --------------------------------------- |
| ![과정 상세](docs/images/course-detail.png) | ![시험 응시](docs/images/exam-take.png) |

| 메뉴 관리                                     | 권한별 접근 권한 관리                                 |
| --------------------------------------------- | ----------------------------------------------------- |
| ![메뉴 관리](docs/images/menu-management.png) | ![권한별 접근 권한 관리](docs/images/access-role.png) |

| 로그인                           | 표준 UI (샘플 페이지)                               |
| -------------------------------- | --------------------------------------------------- |
| ![로그인](docs/images/login.png) | ![표준 UI 샘플 페이지](docs/images/sample-page.png) |

### 다크 모드

사이드바의 버튼으로 전환하면 모든 화면이 디자인 토큰을 따라 함께 바뀝니다.

| 대시보드 (수강생)                                                    | 과정 상세                                                  |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| ![수강생 대시보드 다크 모드](docs/images/dashboard-student-dark.png) | ![과정 상세 다크 모드](docs/images/course-detail-dark.png) |

| 메뉴 관리                                                    | 표준 UI (샘플 페이지)                                      |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| ![메뉴 관리 다크 모드](docs/images/menu-management-dark.png) | ![샘플 페이지 다크 모드](docs/images/sample-page-dark.png) |

<details>
<summary>다크 모드 화면 더 보기 (강사 · 관리자 대시보드, 시험 응시, 권한 관리, 로그인)</summary>

| 대시보드 (강사)                                                  | 대시보드 (관리자)                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| ![강사 대시보드 다크 모드](docs/images/dashboard-tutor-dark.png) | ![관리자 대시보드 다크 모드](docs/images/dashboard-admin-dark.png) |

| 시험 응시                                              | 권한별 접근 권한 관리                                         |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| ![시험 응시 다크 모드](docs/images/exam-take-dark.png) | ![접근 권한 관리 다크 모드](docs/images/access-role-dark.png) |

| 로그인                                          |
| ----------------------------------------------- |
| ![로그인 다크 모드](docs/images/login-dark.png) |

</details>

---

## 시스템 구성 · 권한 구조

### 시스템 구성

```mermaid
flowchart LR
    Browser["React SPA"] -->|"JSON · Multipart (Bearer JWT)"| Sec["Spring Security<br/>JWT 필터"]
    Sec --> Interceptor["권한 검사 인터셉터<br/>(@RequireAction)"]
    Interceptor --> Controllers["REST 컨트롤러<br/>+ 공통 예외 처리"]
    Controllers --> Services["서비스<br/>(트랜잭션 · 과정 단위 권한 확인)"]
    Services -->|"MyBatis"| Oracle[("Oracle 21c XE")]
    Services --> Disk["업로드 파일 저장소"]
```

- 모든 API는 공통 응답 형식(`ApiResponse`)으로 응답합니다. 실패하면 `errorCode`와 사용자용 메시지, 입력값 오류면 필드별 `validations`가 함께 옵니다.
- 프론트는 공통 API 호출 함수(`apiClient.js`) 하나로 백엔드를 호출합니다. 응답 해석, 로그인 토큰, 401 처리를 이 함수가 맡습니다.

### 권한 구조

```mermaid
flowchart TB
    Dev["개발자: API에 @RequireAction(domain, action)"] -->|"서버 시작 시 자동 수집"| Codes["권한 코드 목록"]
    Codes -->|"관리자: 접근 관리에서 등록"| Action["ACTION"]
    Action -->|"관리자: 역할에 부여"| RoleAction["ROLE_ACTION"]
    RoleAction --> Server["서버: API 허용 / 403"]
    RoleAction --> Screen["화면: can()으로 버튼 표시"]
    MenuRole["MENU_ROLE (메뉴별 허용 역할)"] --> Sidebar["사이드바 표시 · URL 접근"]
```

| 구분                      | 정하는 것                                                             | 관리 화면                         |
| ------------------------- | --------------------------------------------------------------------- | --------------------------------- |
| 권한 코드 (`ROLE_ACTION`) | API 호출 · 화면 버튼                                                  | 접근 관리 · 권한별 접근 권한 관리 |
| 메뉴 권한 (`MENU_ROLE`)   | 사이드바 표시 · 화면 URL 접근                                         | 메뉴 관리                         |
| 과정 관계                 | 이 과정에서 강사인지 · 수강생인지 (다른 과정의 데이터는 다룰 수 없음) | 과정 관리 (수강생 · 강사 배정)    |

- 요청자의 역할은 토큰이 아니라 **DB의 현재 역할**로 판단하므로, 역할을 바꾸면 다음 요청부터 반영됩니다.
- 자세한 내용은 [API 권한 설정 가이드](backend/docs/access-control-guide.md)와 [권한 체계 결정 기록](backend/docs/design/access-design.md)을 보세요.

### 데이터베이스

테이블 29개를 씁니다. 핵심 관계도(ERD)와 전체 테이블 목록은 [개발 명세서 5장](docs/development-spec.md#5-데이터베이스-설계-사용-29개-테이블--미사용-3종)에 있습니다.

---

## 사용 기술

### Backend

| 구분         | 기술                                                                                 |
| ------------ | ------------------------------------------------------------------------------------ |
| 언어         | Java 21                                                                              |
| 프레임워크   | Spring Boot 4.0.0 (Spring Framework 7.0.1), Spring Security 7.0.0, Spring Validation |
| 데이터 접근  | MyBatis 3.5.19 (mybatis-spring-boot-starter 4.0.1)                                   |
| 데이터베이스 | Oracle Database 21c XE (21.3.0.0.0), JDBC 드라이버 ojdbc17 23.9                      |
| 인증         | JWT (jjwt 0.13.0)                                                                    |
| API 문서     | springdoc-openapi 3.0.3 (Swagger UI)                                                 |
| 기타         | Lombok 1.18.42, Apache POI 5.5.1 (엑셀), jsoup 1.21.1 (링크 미리보기), Gson 2.13.2   |
| 빌드         | Maven 3.10.0 (Maven Wrapper)                                                         |

### Frontend

| 구분               | 기술                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------- |
| 라이브러리         | React 19.3.1                                                                                  |
| 라우팅             | React Router 7.18.5                                                                           |
| 상태 관리          | Redux Toolkit 2.14.0, React Redux 9.3.1                                                       |
| 빌드 · 개발 서버   | Vite 8.3.5                                                                                    |
| Style              | CSS (전역 스타일 + CSS Modules), CSS 변수 디자인 토큰 (다크 모드 지원), Pretendard 1.3.9 글꼴 |
| 그 밖의 라이브러리 | FullCalendar 7.1.3 (시간표), ApexCharts 8.7.0 (차트), react-select 5.10.2                     |
| 코드 검사          | ESLint 10.14.0                                                                                |

### 협업

Git · GitHub (Pull Request 기반)

---

## 실행 방법

### 준비

| 항목    | 버전 · 내용                                                                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| JDK     | 21 (Lombok 때문에 IDE와 명령줄의 JDK 버전을 맞춥니다)                                                                                                                                      |
| Node.js | 20.19 이상 또는 22.12 이상 (Vite 8 요구 사항)                                                                                                                                              |
| DB      | Oracle Database 21c XE. 팀 공용 개발 DB(`LEARNING_WORKS` 스키마)를 씁니다. 스키마 생성 스크립트는 저장소에 없으므로 테이블 구조는 [개발 명세서 5장](docs/development-spec.md)을 참고합니다 |

### 백엔드 (포트 8080)

DB 접속 정보와 JWT 키는 `backend/src/main/resources/application.yml`에서 읽습니다. 자기 환경에 맞게 바꾸거나 환경 변수로 넣습니다.

| 설정                      | 환경 변수                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------- |
| DB 주소 · 계정 · 비밀번호 | `SPRING_DATASOURCE_URL` · `SPRING_DATASOURCE_USERNAME` · `SPRING_DATASOURCE_PASSWORD` |
| JWT 서명 키               | `APP_JWT_SECRETKEY`                                                                   |
| 교육 자료 업로드 경로     | `COURSE_DATA_UPLOAD_DIR` (기본 `~/learningworks/upload/course-data`)                  |

```bash
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

- API 명세(Swagger UI): <http://localhost:8080/swagger-ui.html>
  - `POST /login`으로 받은 토큰을 [Authorize]에 넣으면 로그인한 상태로 호출할 수 있고, API마다 필요한 권한이 표시됩니다.

### 프론트엔드 (포트 5173)

```bash
cd frontend
npm install
npm run dev
```

- 백엔드 주소를 바꾸려면 `frontend/.env.local`에 `VITE_API_BASE_URL=http://localhost:9090`처럼 적습니다 (기본값 `http://localhost:8080`, git에 올리지 않음).

### 테스트 · 검사

```bash
# 백엔드 단위 테스트 (LearningworksApplicationTests는 DB에 접속하므로 뺌)
cd backend
./mvnw test -Dtest='!LearningworksApplicationTests' -Dsurefire.failIfNoSpecifiedTests=false

# 프론트엔드 코드 검사 · 빌드
cd frontend
npm run lint
npm run build
```

### 데모 계정

역할별(슈퍼관리자 · 관리자 · 강사 · 수강생) 데모 계정은 저장소에 공개하지 않습니다. 필요하면 팀원에게 요청하세요.

---

## 폴더 구조 · 문서

```txt
28th-lms-repo
├── docs                 # 요구사항 명세서 · 개발 명세서 (프로젝트 전체)
│   └── images           # README 화면 이미지
├── backend              # Spring Boot API 서버 (com.learningworks.*: 도메인별 web · service · dao · vo)
│   └── docs             # 백엔드 가이드 · 설계 문서
│       └── design
└── frontend             # React 화면 (src/components, src/api, src/store, src/router)
    └── docs             # 프론트엔드 가이드 · 설계 문서
        └── design
```

| 구분       | 문서                                                                   | 내용                                       |
| ---------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| 프로젝트   | [요구사항 명세서](docs/requirements-spec.md)                           | 기능별 요구사항과 구현 상태                |
|            | [개발 명세서](docs/development-spec.md)                                | 아키텍처 · 전체 API · DB · 화면 명세       |
| 백엔드     | [API 공통 응답 · 예외 처리 가이드](backend/docs/api-response-guide.md) | `ApiResponse` · `ErrorCode` 사용법         |
|            | [API 권한 설정 가이드](backend/docs/access-control-guide.md)           | `@RequireAction` 등 권한 어노테이션 사용법 |
|            | [권한 체계 결정 기록](backend/docs/design/access-design.md)            | 권한 체계를 이렇게 정한 이유               |
|            | [메뉴 백엔드 설계](backend/docs/design/menu-design.md)                 | 메뉴 · 메뉴 접근 권한 API · 테이블         |
| 프론트엔드 | [공통 API 호출 가이드](frontend/docs/api-client-guide.md)              | `apiClient.js` 사용법 · 에러 처리          |
|            | [프론트 권한 적용 가이드](frontend/docs/permission-guide.md)           | `usePermission()`으로 버튼 · 화면 숨기기   |
|            | [새 화면 추가 가이드](frontend/docs/page-guide.md)                     | API 권한 · 라우트 · 메뉴 등록 순서         |
|            | [UI 스타일 가이드](frontend/docs/ui-style-guide.md)                    | 디자인 토큰 · 표준 UI 부품 · 다크 모드     |
|            | [메뉴 관리 화면 설계](frontend/docs/design/menu-page-design.md)        | 메뉴 관리 · 사이드바 · URL 접근 가드       |
|            | [역할 관리 화면 설계](frontend/docs/design/role-page-design.md)        | 역할 관리 화면                             |
|            | [대시보드 설계](frontend/docs/design/dashboard-design.md)              | 대시보드 · 과정 단위 권한 원칙             |

---

## 협업 방식

- **브랜치**: `main`(배포) · `dev`(통합) · `feature/*` · `fix/*` · `hotfix/*`. 작업 브랜치에서 `dev`로 Pull Request를 보내고 리뷰 후 병합합니다.
- **커밋 메시지**: `<유형>: <한글 제목>` 형식. 유형은 `Feat` · `Fix` · `Refactor` · `Style` · `Docs` · `Chore` 등입니다.
  - 예: `Feat: 메뉴 상위 메뉴 변경 API 추가`
- **공통 규칙**: 새 API · 새 화면은 위 가이드 문서의 체크리스트를 따릅니다 (공통 응답, 권한 어노테이션, 표준 UI).
