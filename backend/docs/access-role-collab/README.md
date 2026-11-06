# ACCESS / ACCESS_ROLE 모듈 요청 · 협의 문서

- 작성: ROLE 모듈 담당자
- 대상: ACCESS(`/access`) · ACCESS_ROLE(`/access-role`) 모듈 담당자, 그리고 담당자의 Claude Code
- 작성 기준 코드: `feature/role` 브랜치 (ROLE 백엔드 PR → `dev`)
- 최신화: 2026-11-06, `feature/role` 커밋 `644fe80` 기준 (`feature/access-role`의 `fafc7bc`, `a6961c3`과 `dev`의 `0e71877`까지 반영)
  - R-04, R-05는 이미 반영되어 **완료**로 기록했습니다.
  - R-06의 현재 상태(행 번호 등)를 최신 코드에 맞게 수정했습니다.
  - R-03에 검색 조건을 `@ModelAttribute`로 받는 선택 항목을 추가했습니다.
  - D 항목은 변동 없습니다.

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
   - 그 외 공통 파일(`ApiResponse`, `GlobalExceptionHandler` 등)과 `role` 패키지: 수정하지 말고, 변경이 필요하면 처리 결과란에 요청 내용을 적어주세요.
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

ROLE API 목록:

| Method | URL | 설명 |
| --- | --- | --- |
| GET | `/roles` | 역할 목록 (상위 역할부터). body: `{ roleCount, roleList: [{ roleId, roleDisplayName }] }` |
| POST | `/roles` | 역할 생성 |
| PUT | `/roles/{roleId}` | 역할 이름 변경 |
| PUT | `/roles/order` | 역할 순서 변경 (드래그&드롭) |
| DELETE | `/roles/{roleId}` | 역할 삭제 |
| GET | `/roles/{roleId}/users` | 역할을 사용 중인 활성 회원 목록 |
| PUT | `/roles/{roleId}/users` | 역할 사용 회원 일괄 이동 (로그인 필요) |

---

## 권장 처리 순서

1. `discussions.md`의 **D-01, D-02** 결정 (나머지 항목의 방향이 여기서 정해짐)
2. ~~`requests.md`의 **R-04, R-05** (버그)~~ — 완료
3. `requests.md`의 **R-01 ~ R-03** (공통 응답 · 예외 · 검증 전환)
4. `requests.md`의 **R-06** (프론트 전환. 공통 API 클라이언트는 제공 완료: `frontend/src/api/common/apiClient.js`, 가이드 `frontend/docs/api-client-guide.md`)
5. 나머지 R · D 항목

R-01과 R-06은 **함께 진행**해 주세요. 백엔드 응답 형식만 먼저 바꾸면 기존 프론트가 `responseCode`를 찾지 못해 화면이 동작하지 않습니다.
