# ACCESS / ACCESS_ROLE 모듈 요청 · 협의 문서

- 작성: ROLE 모듈 담당자
- 대상: ACCESS(`/access`) · ACCESS_ROLE(`/access-role`) 모듈 담당자, 그리고 담당자의 Claude Code
- 작성 기준 코드: `feature/role` 브랜치 (ROLE 백엔드 PR → `dev`)
- 최신화 이력
  - 2026-11-06 (1차): `feature/role` 커밋 `644fe80` 기준. R-04, R-05 완료 기록, R-06 현재 상태 수정, R-03에 `@ModelAttribute` 선택 항목 추가
  - 2026-11-06 (2차): `feature/role` 커밋 `cfa0da0` 기준. ACCESS · ACCESS_ROLE 담당자가 **R-01 ~ R-08 전부 처리**(`0014d42`에 포함)하고 **D-01, D-03, D-06을 결정**한 내용을 반영. ROLE 담당자가 코드와 대조해 처리 결과가 실제 코드와 일치함을 확인
  - 2026-11-06 (3차): ROLE 담당자가 **D-01 세부 사항**(`ACTION_ID`를 권한 코드로 사용, `accessChecker`는 ROLE 담당자 구현, 요청자 역할은 DB 조회)과 **D-02**(MENU_ROLE 유지)를 결정. **R-09 추가**, R-03에 `ACTION` 컬럼 길이 답변
  - 2026-11-06 (4차): **D-01 최종 결정**으로 재정리. `ACTION_CODE` 컬럼 추가, `ACTION_ID`는 시퀀스, 권한 코드는 백엔드가 API에 `@RequireAction`으로 정의하고 서버 시작 시 자동 수집, 관리자는 목록에서 선택. DB 상수 테이블 방식은 채택하지 않음. **R-09 재작성**, D-03에 SUPER_ADMIN 전용 표시 보충
  - 2026-11-06 (5차): `ACTION_CODE` `VARCHAR2(40 CHAR)`, `ACTION_ID`는 팀 공통 PK 규칙. ROLE 담당자가 **권한 검사를 구현**(`com.learningworks.common.action`, 검사는 JWT 적용 후 켬). R-09 6번에 드롭다운 동작 확정, **R-10 추가** (캐시 초기화 호출, `@RequireSuperAdmin` 적용)
  - 2026-11-09 (6차): `feature/role` 커밋 `3cee4b1` 기준. ACCESS 담당자의 **R-09 처리**(`6f4b85f`, `5f96007`로 머지)를 코드와 대조해 확인. **JWT 인증 필터 머지**(`878d6c0`)에 따라 권한 검사를 켜기 위한 조건 정리. R-10 2번(ACTION 저장 후 `evictAll`)은 불필요해 삭제. `ROLE_USER_READ`, `ROLE_USER_MOVE` 추가

## 현재 진행 상황

| 구분 | 완료 | 남음 |
| --- | --- | --- |
| 요청 (R) | R-01 ~ R-09 | R-03의 `ACTION_NAME` `@Size(max = 40)`, **R-10** (캐시 초기화 · SUPER_ADMIN 전용 표시) |
| 협의 (D) | D-01(권한 검사 구현 포함), D-02, D-03, D-06 결정 | D-03 구현, D-04 · D-05 결정 |
| 권한 검사 | 구현 · JWT 연동 확인 | **꺼져 있음.** 켜기 전 조건은 아래 "ROLE 담당자" 3번 |

이 디렉토리의 문서는 **"요청"과 "협의"** 두 종류입니다. 담당자(또는 담당자의 Claude Code)가 각 항목을 검토하고, 수락 · 반려 · 보류를 판단해 **각 항목의 `처리 결과`란에 기록**해 주세요.

| 파일 | 내용 | 처리 방식 |
| --- | --- | --- |
| `requests.md` | 코드 변경 요청 (R-xx) | 검증 후 수락하면 바로 수정 가능 |
| `discussions.md` | 설계 결정이 필요한 협의 사항 (D-xx) | **담당자(사람)가 결정**한 뒤 진행 |

---

## Claude Code 처리 규칙

이 문서를 읽고 작업하는 Claude Code는 아래 규칙을 따라주세요.

1. **먼저 검증하세요.** 각 항목의 `현재 상태`는 작성 시점의 코드를 근거로 합니다. 해당 파일을 직접 읽어 사실인지 확인하고, 코드가 이미 바뀌었거나 설명이 틀렸다면 **반려 또는 보류**로 기록하고 근거를 적으세요.
2. **R 항목**은 검증이 끝나고 담당자가 동의하면 수정합니다. 담당자의 동의 없이 대규모 수정을 진행하지 마세요.
3. **D 항목**은 설계 결정입니다. 선택지와 추천안을 담당자에게 설명하고, **담당자가 결정하기 전에는 코드를 수정하지 마세요.**
4. **수정 범위**
   - 수정 가능: `access`, `accessrole` 패키지(백엔드), 해당 페이지 프론트 코드 (`frontend/src/api/admin/system/access*`, `frontend/src/components/admin/system/access*`)
   - 공통 파일 `ErrorCode.java`: **새 enum 상수 추가만** 가능 (기존 상수 변경 · 삭제 금지)
   - 그 외 공통 파일(`ApiResponse`, `GlobalExceptionHandler`, `common.action` 패키지 등)과 `role` 패키지: 사용(주입 · 어노테이션)은 자유, 수정하지 말고, 변경이 필요하면 처리 결과란에 요청 내용을 적어주세요.
5. **의존 관계**를 지켜주세요. 각 항목의 `선행 조건`이 충족되지 않았으면 보류로 기록합니다.
6. 처리 후 `처리 결과`란을 아래 형식으로 채워주세요.

```text
- 상태: 수락 | 반려 | 보류
- 판단 근거: (검증 결과, 반려/보류 사유)
- 변경 내용: (수정한 파일과 요약, 커밋 해시)
- ROLE 담당자에게 요청: (있다면)
```

---

## 공통 응답 처리 기준

모든 요청은 공통 응답 처리 기준을 따릅니다. **반드시 먼저 읽어주세요.**

- 가이드: `backend/docs/api-response-guide.md`
- 핵심 파일
  - `backend/src/main/java/com/learningworks/common/utils/ApiResponse.java` — 응답 형식
  - `backend/src/main/java/com/learningworks/common/utils/ApiResponseStatusAdvice.java` — `ApiResponse.httpStatusCode`로 HTTP 상태 자동 설정
  - `backend/src/main/java/com/learningworks/common/exceptions/handler/GlobalExceptionHandler.java` — 공통 예외 처리
  - `backend/src/main/java/com/learningworks/common/exceptions/enums/ErrorCode.java` — 에러 코드
  - `backend/src/main/java/com/learningworks/common/exceptions/LearningworksException.java` — 의도한 실패를 던지는 예외

응답 형식 요약:

```json
// 성공
{ "httpStatusCode": 200, "httpStatusMessage": "OK", "body": { } }

// 실패
{ "httpStatusCode": 404, "httpStatusMessage": "Not Found",
  "errorCode": "ROLE_NOT_EXISTS", "error": "존재하지 않는 역할입니다." }

// 입력값 검증 실패
{ "httpStatusCode": 400, "httpStatusMessage": "Bad Request",
  "errorCode": "GLOBAL_INVALID_PARAMETER", "error": "입력값을 확인해주세요.",
  "validations": { "roleId": ["역할ID를 입력해주세요."] } }
```

---

## 공유 사항 (ROLE 모듈 변경으로 영향이 있는 부분)

조치가 필요한 항목이 아니라, ACCESS / ACCESS_ROLE 구현 시 알고 있어야 할 사실입니다.

| 내용 | 영향 |
| --- | --- |
| `ROLE` 테이블에 `ROLE_RANK NUMBER(3) NOT NULL` 추가. **작을수록 상위 역할** (SUPER_ADMIN=1, ADMIN=2, TUTOR=3, STUDENT=4) | 역할 목록 정렬은 `ORDER BY ROLE_RANK, ROLE_ID` |
| 역할 삭제(`DELETE /roles/{roleId}`) 시 같은 트랜잭션에서 **`ROLE_ACTION`, `MENU_ROLE`의 해당 역할 행을 물리 삭제** | ACCESS_ROLE 쪽에서 별도 정리 불필요 |
| `ROLE_SUPER_ADMIN`, `ROLE_STUDENT`는 삭제 불가 (보호 역할) | 상수: `com.learningworks.role.RoleConstants` |
| 새 역할은 `ROLE_STUDENT` 바로 위 순위로 추가되며, **ROLE_ACTION이 비어 있는 상태**로 생성됨 | 권한 설정 화면에서 새 역할도 바로 선택 · 설정 가능해야 함 |
| 역할 ID 형식: `^ROLE_[A-Z0-9]+(_[A-Z0-9]+)*$` | 상수: `RoleConstants.ROLE_ID_PATTERN` (빈 값 허용 버전: `ROLE_ID_PATTERN_ALLOW_EMPTY`) |
| 회원에게 역할을 지정할 때는 "자기보다 아래 순위 역할만" 규칙 적용 | `com.learningworks.role.service.RoleAssignPolicy` |
| API 권한은 `@RequireAction` · `@RequireSuperAdmin`으로 지정 (D-01) | 패키지 `com.learningworks.common.action`. 주입 · 어노테이션 사용은 자유, 수정은 ROLE 담당자에게 요청 |
| JWT 인증 필터 적용 (`ValidateJwtAuthenticationFilter`). 인증 객체의 principal은 **회원 ID 문자열**(토큰 `sub`)이며 `LoginUser`가 아님 | 컨트롤러에서 로그인 사용자 ID가 필요하면 `Authentication authentication` 파라미터로 받아 `authentication.getName()` 사용 (비로그인이면 `null`). `@AuthenticationPrincipal LoginUser`는 항상 `null`이 되므로 쓰지 말 것 |
| 프론트 공통 API 클라이언트가 토큰을 자동 첨부하고, 토큰을 보낸 요청이 401이면 로그인 페이지로 이동 | `frontend/docs/api-client-guide.md` 8장. 화면에서 토큰을 직접 다루지 않음 |

ROLE API 목록:

| Method | URL | 설명 | 권한 |
| --- | --- | --- | --- |
| GET | `/roles` | 역할 목록 (상위 역할부터). body: `{ roleCount, roleList: [{ roleId, roleDisplayName }] }` | `ROLE_READ` |
| POST | `/roles` | 역할 생성 | SUPER_ADMIN |
| PUT | `/roles/{roleId}` | 역할 이름 변경 | SUPER_ADMIN |
| PUT | `/roles/order` | 역할 순서 변경 (드래그&드롭) | SUPER_ADMIN |
| DELETE | `/roles/{roleId}` | 역할 삭제 | SUPER_ADMIN |
| GET | `/roles/{roleId}/users` | 역할을 사용 중인 활성 회원 목록 | `ROLE_USER_READ` |
| PUT | `/roles/{roleId}/users` | 역할 사용 회원 일괄 이동 (자기보다 아래 순위만, ROLE_SUPER_ADMIN으로는 이동 불가) | `ROLE_USER_MOVE` |
| GET | `/action-codes` | 권한 코드 목록 (ACTION 등록 드롭다운용) | SUPER_ADMIN |
| GET | `/action-codes/me` | 내 권한: 현재 역할과 허용된 권한 코드 (프론트 버튼 표시용). body: `{ roleId, roleDisplayName, superAdmin, actionCodes }`. SUPER_ADMIN은 `superAdmin: true`, `actionCodes: []` | 로그인 |

---

## 남은 작업 (권장 순서)

### ACCESS · ACCESS_ROLE 담당자

1. **R-10 처리** (권한 저장 후 `evictRole`, 두 저장 API에 `@RequireSuperAdmin`) — **권한 검사를 켜기 전에 필요합니다.** 검사가 꺼져 있는 동안에는 적용해도 동작에 영향 없음
2. **R-03 남은 작업**: `AccessVO.actionName`에 `@Size(max = 40)` 추가 (컬럼 길이 확인 완료, `AccessVO.java`에 TODO 주석 남아 있음)
3. **D-03 구현**
   - `ROLE_SUPER_ADMIN`을 권한 설정 화면 역할 목록에서 숨기기(`GET /roles` 결과에서 프론트가 제외)
   - `/access-role/save`에서 `roleId`가 `ROLE_SUPER_ADMIN`이면 저장 거부 (`ACTION_ROLE_PROTECTED` 추가)
   - 두 저장 API를 `ROLE_SUPER_ADMIN` 전용으로 제한 (R-10과 같은 작업)
4. **R-09 기록 정리**: 처리 결과의 "변경 내용: (미커밋)"을 커밋 해시로 바꾸고, DB에 실행한 `r09-migration.sql`을 저장소에 추가 (현재 저장소에 없음)
5. **D-04** 결정 (선택)

### ROLE 담당자

1. MENU · MENU_ROLE 구현 (D-02 결정: MENU_ROLE 유지, 프론트 라우터에서도 MENU_ROLE 기준으로 화면 접근 제한). **D-05**는 이때 함께 결정
2. ~~권한 코드 체계 구현 (D-01)~~ **완료** — `com.learningworks.common.action` (`@RequireAction`, `@RequireSuperAdmin`, `ActionCodeRegistry`, `GET /action-codes`, `AccessChecker`, 검사 인터셉터). `RoleController` 적용 완료, 캐시 초기화 호출은 R-10으로 요청
3. **권한 검사 켜기** (`application.yml`에 `app.access-check.enabled: true`). JWT 인증 필터가 머지되어(`878d6c0`) 기술적으로는 켤 수 있지만, 지금 켜면 SUPER_ADMIN 외에는 모두 막히므로 아래가 먼저 필요합니다.
   - R-10 처리 (권한을 바꿔도 캐시 때문에 재시작 전까지 반영되지 않음)
   - ACTION 등록: R-09 데이터 정리로 ACTION은 `ROLE_READ` 하나만 남았습니다. `ROLE_USER_READ`, `ROLE_USER_MOVE` 등 코드에 정의된 권한을 ACTION 관리 화면에서 등록
   - 역할별 권한 부여: 권한별 접근 권한 관리 화면에서 ADMIN · TUTOR · STUDENT에 필요한 권한을 다시 부여 (ROLE_ACTION도 함께 삭제됨)
   - 켠 뒤 실제 로그인 사용자(SUPER_ADMIN, ADMIN)로 허용 · 403 동작 확인
