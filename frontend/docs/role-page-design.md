# 역할 관리(권한 관리) 화면 설계

- 대상 화면: `시스템 관리 > 권한 관리` (`/admin/system/role`)
- 담당: ROLE 모듈 담당자
- 작성일: 2026-11-09
- 상태: 설계 확정, 구현 전. 백엔드는 완료 (이 문서 작성 시점에 회원 이동 제한 1건 추가)

이 문서는 프론트 구현을 시작할 때 참고하는 설계입니다. API 호출 규칙은 `frontend/docs/api-client-guide.md`, 권한 체계는 `backend/docs/access-control-guide.md`를 함께 보세요.

---

## 1. 확정된 결정

| 항목           | 결정                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| 드래그&드롭    | **브라우저 기본 Drag and Drop API**(HTML5 `draggable`)로 구현. 라이브러리 추가 없음                              |
| 회원 이동 대상 | **ROLE_SUPER_ADMIN은 이동 대상에서 제외.** 화면 선택지에서 빼고, 백엔드도 거부 (`ROLE_MOVE_TO_SUPER_ADMIN`)      |
| 작업 순서      | **화면 먼저, 내 권한(버튼 표시) 연동은 나중에** (8장). 서버 권한 검사가 꺼져 있어 화면만으로 모든 기능 확인 가능 |

---

## 2. 현재 상태

| 대상                                        | 상태                                                              |
| ------------------------------------------- | ----------------------------------------------------------------- |
| 백엔드 `RoleController` (`/roles`)          | 완료. API 7개                                                     |
| `src/api/admin/system/role/roleApi.js`      | 완료. 함수 7개. errorCode 주석 일부 보완 필요 (3장 끝)            |
| `src/components/admin/system/role/Role.jsx` | 빈 화면 (`PageContainer`만 있음)                                  |
| 라우트 · 메뉴                               | 등록 완료 (`MainRouterProvider.jsx`, `menuData.js`의 "권한 관리") |

---

## 3. API

모두 `roleApi.js` 함수로 호출합니다. 성공하면 `body`가 반환되고, 실패하면 `ApiError { httpStatusCode, errorCode, message, validations }`가 throw 됩니다.

| 함수                                      | 요청                        | 반환 (`body`)                                                          | 주요 errorCode                                                                                                                                                |
| ----------------------------------------- | --------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getRoles(options)`                       | `GET /roles`                | `{ roleCount, roleList: [{ roleId, roleDisplayName }] }` 상위 역할부터 | —                                                                                                                                                             |
| `createRole({ roleId, roleDisplayName })` | `POST /roles`               | `{ roleId, roleDisplayName }`                                          | `GLOBAL_INVALID_PARAMETER`(validations), `ROLE_ID_USED`(409)                                                                                                  |
| `modifyRole(roleId, roleDisplayName)`     | `PUT /roles/{roleId}`       | `{ roleId, roleDisplayName }`                                          | `GLOBAL_INVALID_PARAMETER`, `ROLE_NOT_EXISTS`(404)                                                                                                            |
| `modifyRoleOrder(roleIds)`                | `PUT /roles/order`          | `{ roleCount, roleList }` (변경 후 목록)                               | `ROLE_ORDER_INVALID`(400), `ROLE_ORDER_OUTDATED`(409)                                                                                                         |
| `deleteRole(roleId)`                      | `DELETE /roles/{roleId}`    | `{ roleId, roleDisplayName }` (삭제된 역할)                            | `ROLE_PROTECTED`(409), `ROLE_NOT_EXISTS`, `ROLE_IN_USE`(409)                                                                                                  |
| `getRoleUsers(roleId, options)`           | `GET /roles/{roleId}/users` | `[{ id, name }]` 활성 회원                                             | `ROLE_NOT_EXISTS`                                                                                                                                             |
| `moveRoleUsers(roleId, replaceRoleId)`    | `PUT /roles/{roleId}/users` | `{ fromRoleId, toRoleId, movedCount }`                                 | `ROLE_MOVE_SAME`(400), `ROLE_MOVE_TO_SUPER_ADMIN`(400), `ROLE_NOT_EXISTS`, `ROLE_TARGET_FORBIDDEN` · `ROLE_ASSIGN_FORBIDDEN`(403), `GLOBAL_UNAUTHORIZED`(401) |

공통: 서버 권한 검사가 켜지면 모든 함수에서 `GLOBAL_UNAUTHORIZED`(401) · `GLOBAL_FORBIDDEN`(403)이 날 수 있습니다. 401은 공통 함수가 로그인 페이지로 이동시킵니다.

### 입력값 규칙 (백엔드 검증과 동일)

| 필드              | 규칙                                             | 백엔드 메시지                                                                                                       |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `roleId`          | 필수, 20자 이하, `^ROLE_[A-Z0-9]+(_[A-Z0-9]+)*$` | "역할ID는 'ROLE*'로 시작하고, 대문자·숫자와 단어 구분용 언더스코어(*)만 사용할 수 있습니다. (예: ROLE_SUPER_ADMIN)" |
| `roleDisplayName` | 필수, 100자 이하                                 | "역할 이름을 입력해주세요." / "역할 이름은 100자 이하로 입력해주세요."                                              |

### 서버 동작 중 화면에 영향이 있는 것

- 새 역할은 **ROLE_STUDENT 바로 위**에 추가됩니다.
- 보호 역할(삭제 불가, 순서 고정): `ROLE_SUPER_ADMIN`(항상 맨 위), `ROLE_STUDENT`(항상 맨 아래).
- 순서 변경은 **전체 역할 ID 목록**을 보내야 하며, 서버 목록과 개수 · 구성이 다르면 `ROLE_ORDER_OUTDATED`입니다 (다른 사용자가 역할을 추가 · 삭제한 경우).
- 회원 이동은 **요청한 본인을 제외**하고 이동합니다 (`movedCount`에 본인 미포함).
- 역할 삭제 시 탈퇴 회원의 역할은 서버가 ROLE_STUDENT로 바꿉니다 (화면 처리 불필요).

### `roleApi.js` 주석 보완 (구현 시 함께)

- `getRoleUsers`: `ROLE_NOT_EXISTS` 추가
- `moveRoleUsers`: `ROLE_MOVE_TO_SUPER_ADMIN`, `ROLE_NOT_EXISTS`, `GLOBAL_FORBIDDEN`(요청자 회원 정보 없음) 추가

---

## 4. 화면 구성

```text
┌ 권한 관리 ─────────────────────────────────────────────────┐
│ 역할 ID ROLE_[_________]  역할 이름 [__________]  [추가]      │
│   └ 입력칸 아래에 검증 메시지                                  │
├────────────────────────────────────────────────────────────┤
│      순위 │ 역할 ID            │ 역할 이름        │            │
│  ≡    1   │ ROLE_SUPER_ADMIN   │ 최고 관리자       │ [수정]      │  ← 보호 역할 (회색)
│  ≡    2   │ ROLE_ADMIN         │ 관리자           │ [수정][삭제] │
│  ≡    3   │ ROLE_TUTOR         │ 강사             │ [수정][삭제] │
│  ≡    4   │ ROLE_STUDENT       │ 학생             │ [수정]      │  ← 보호 역할 (회색)
├────────────────────────────────────────────────────────────┤
│  순서가 변경되었습니다.                 [순서 되돌리기] [순서 저장] │  ← 순서 변경 시에만 표시
└────────────────────────────────────────────────────────────┘
```

- `≡`: 드래그 손잡이. 보호 역할도 같은 `≡`를 표시하되 드래그는 되지 않습니다.
- 보호 역할 행(`ROLE_SUPER_ADMIN`, `ROLE_STUDENT`)은 비활성처럼 보이게 합니다.
  - 회색 배경(`#f2f2f2`), 옅은 검은색 글씨(`rgba(0, 0, 0, 0.4)`)
  - 마우스를 올리면 금지 커서(`cursor: not-allowed`)
  - 이름 수정은 가능하므로, 행 안의 버튼 · 입력칸은 원래 커서를 유지합니다.
- 수정: 행의 역할 이름이 입력칸으로 바뀌고 [저장] [취소] 표시
- **공통 `Grid` 컴포넌트는 사용하지 않습니다.** 행 드래그와 행별 버튼을 지원하지 않기 때문입니다. 이 화면의 표는 `Role.module.css`로 직접 만들고, 버튼 · 입력은 `components/common/input`(`IconButton`, `Input`)을 쓸 수 있으면 사용합니다.

---

## 5. 상태 설계

| state                          | 내용                                                                 |
| ------------------------------ | -------------------------------------------------------------------- |
| `roles`                        | 서버에서 받은 목록 (`roleList`)                                      |
| `orderedRoles`                 | 화면에 보이는 순서. 드래그로 바뀜. 저장 · 되돌리기 시 `roles`로 맞춤 |
| `isOrderChanged`               | `orderedRoles`와 `roles`의 roleId 순서가 다른지 (계산값으로 충분)    |
| `newRole`                      | 생성 폼 `{ roleId, roleDisplayName }`                                |
| `createErrors`                 | 생성 검증 메시지 `{ roleId: [], roleDisplayName: [] }`               |
| `editingRoleId`, `editingName` | 이름 수정 중인 행과 입력값                                           |
| `draggingRoleId`               | 드래그 중인 역할                                                     |
| `moveTarget`                   | 회원 이동 모달 대상 역할 (`null`이면 모달 닫힘)                      |
| `loading`                      | 요청 중 버튼 비활성화용                                              |

- 저장 · 생성 · 삭제 · 이름 변경이 성공하면 **서버 응답으로 목록을 갱신**합니다 (`modifyRoleOrder`는 변경 후 목록을 반환하고, 나머지는 `getRoles()`로 다시 조회).
- **순서를 바꾼 상태에서** 생성 · 삭제 · 이름 변경을 하면 화면 순서가 서버 목록으로 초기화됩니다. 순서 변경이 저장되지 않았으면 "저장하지 않은 순서 변경이 사라집니다" 확인창을 띄웁니다.

---

## 6. 기능별 상세

### 6-1. 목록

- 화면 진입 시 `getRoles({ signal })` (useEffect 정리 함수에서 `abort`)
- 순위 열은 화면 순서(1부터)를 표시

### 6-2. 생성

1. 입력 중: 역할 ID는 **`ROLE_` 뒤의 값만 입력**받습니다. 입력칸 왼쪽에 `ROLE_`을 고정 표시하고, [추가] 시 접두어를 붙여 `roleId`로 보냅니다.
   - 입력값은 **대문자로 자동 변환**합니다.
   - `ROLE_TUTOR`처럼 접두어째 붙여넣으면 앞의 `ROLE_`을 떼어냅니다 (`ROLE_ROLE_TUTOR` 방지).
   - 입력칸은 최대 15자입니다 (역할 ID 전체 20자 − 접두어 5자). `maxLength` 속성은 접두어를 떼기 전에 잘라버리므로 쓰지 않고, 입력 처리에서 자릅니다.
2. [추가] 클릭 시 프론트에서 3장 규칙을 먼저 검사해 입력칸 아래에 표시 (서버 요청 줄이기용, 서버 검증이 최종).
3. `createRole` 호출
   - 성공: 폼 초기화, "역할이 추가되었습니다." 안내, `getRoles()` 재조회
   - `GLOBAL_INVALID_PARAMETER`: `error.validations`를 필드별로 입력칸 아래에 표시
   - `ROLE_ID_USED`: 역할 ID 입력칸 아래에 `error.message`
   - 그 외: `alert(error.message)`

### 6-3. 이름 변경

- [수정] → 입력칸(기존 이름) + [저장] [취소]. 동시에 한 행만 수정
- Enter = 저장, Esc = 취소
- 이름이 바뀌지 않았으면 요청하지 않고 수정 모드 종료
- `modifyRole` 성공 시 재조회. `ROLE_NOT_EXISTS`면 "이미 삭제된 역할입니다." 안내 후 재조회
- 역할 ID는 수정할 수 없습니다.

### 6-4. 순서 변경 (HTML5 Drag and Drop)

- 보호 역할이 아닌 행에만 `draggable={true}`
- 이벤트
  - `onDragStart`: `draggingRoleId` 설정, `event.dataTransfer.effectAllowed = "move"` (Firefox는 `dataTransfer.setData("text/plain", roleId)`가 있어야 드래그가 시작됨)
  - `onDragOver`: 놓을 수 있는 행이면 `event.preventDefault()` (호출해야 drop 가능)
  - `onDrop`: `orderedRoles`에서 드래그한 역할을 대상 위치로 이동
  - `onDragEnd`: `draggingRoleId` 초기화
- **놓을 수 있는 위치 제한**: SUPER_ADMIN 위, STUDENT 아래로는 이동 불가. 보호 역할 행에 drop하면 무시 (`preventDefault`를 호출하지 않으면 drop 자체가 안 됨)
- 드래그 중인 행 · 놓을 위치는 CSS로 표시 (예: 반투명, 위/아래 테두리)
- [순서 저장]: `modifyRoleOrder(orderedRoles.map(r => r.roleId))`
  - 성공: 응답 `roleList`로 `roles` · `orderedRoles` 갱신, "순서가 저장되었습니다."
  - `ROLE_ORDER_OUTDATED`: "다른 사용자가 역할을 변경했습니다. 목록을 다시 불러옵니다." 안내 후 재조회
  - `ROLE_ORDER_INVALID`: 보호 역할 위치 오류. 정상 흐름에서는 나오지 않아야 함 → `alert(error.message)` 후 되돌리기
- [순서 되돌리기]: `orderedRoles`를 `roles`로 복원
- 순서가 바뀐 상태에서 화면을 벗어나는 경우의 경고는 하지 않습니다 (범위 외).

### 6-5. 삭제와 회원 이동

```text
[삭제] → confirm("ROLE_TUTOR(강사) 역할을 삭제하시겠습니까?")
   → deleteRole(roleId)
      ├ 성공 → "역할이 삭제되었습니다." → getRoles()
      ├ ROLE_IN_USE → 회원 이동 모달 열기 (moveTarget = 해당 역할)
      └ 그 외 → alert(error.message)
```

**회원 이동 모달 (`RoleUserMoveModal.jsx`)**

```text
┌ 역할 사용 회원 이동 ──────────────────────────┐
│ ROLE_TUTOR(강사) 역할을 사용 중인 회원 3명       │
│  - tutor01 (김강사)                           │
│  - tutor02 (이강사)                           │
│  - tutor03 (박강사)                           │
│                                              │
│ 이동할 역할 [ROLE_STUDENT (학생)        ▼]     │
│                                              │
│ 회원을 이동한 뒤 역할을 삭제합니다.              │
│                        [취소] [이동 후 삭제]   │
└──────────────────────────────────────────────┘
```

1. 열릴 때 `getRoleUsers(roleId)`로 회원 목록 표시
2. 이동할 역할 선택지: 전체 역할에서 **삭제할 역할 자신과 ROLE_SUPER_ADMIN 제외**. 기본값 `ROLE_STUDENT`
3. [이동 후 삭제]: `moveRoleUsers(roleId, replaceRoleId)` → `deleteRole(roleId)` 순서로 호출
   - 둘 다 성공: "N명을 OO 역할로 이동하고 역할을 삭제했습니다." → 모달 닫기 → `getRoles()`
   - 이동 후 삭제가 다시 `ROLE_IN_USE`: 요청한 본인이 그 역할인 경우입니다 (본인은 이동되지 않음). "본인의 역할은 변경할 수 없어 삭제하지 못했습니다." 안내
   - 이동 실패: `alert(error.message)`, 모달 유지
4. 회원 목록이 0명이면(그 사이 다른 사용자가 처리함) 바로 `deleteRole` 재시도

### 6-6. 오류 표시 규칙

기존 화면(`Access.jsx`, `AccessRole.jsx`)과 같은 방식을 따릅니다.

```js
const getErrorMessage = (error) =>
  error.validations
    ? Object.values(error.validations).flat().join("\n")
    : error.message;
```

- 생성 폼만 `validations`를 입력칸 아래에 표시하고, 나머지는 `alert(getErrorMessage(error))`
- 요청 취소(`AbortError`)는 무시
- 메시지 문자열이 아니라 `errorCode`로 분기

---

## 7. 파일 구성

| 파일                                                     | 작업                                                |
| -------------------------------------------------------- | --------------------------------------------------- |
| `src/components/admin/system/role/Role.jsx`              | 페이지 (목록 · 생성 · 이름 변경 · 순서 변경 · 삭제) |
| `src/components/admin/system/role/Role.module.css`       | 새로 작성                                           |
| `src/components/admin/system/role/RoleUserMoveModal.jsx` | 새로 작성 (회원 이동 모달)                          |
| `src/api/admin/system/role/roleApi.js`                   | 주석 보완만 (3장 끝)                                |

`Role.jsx`가 길어지면 행 컴포넌트(`RoleRow.jsx`)나 생성 폼(`RoleCreateForm.jsx`)으로 나눠도 됩니다.

### 지킬 것

- API는 `roleApi.js` 함수만 호출. `fetch` 직접 사용 금지
- 화면에서 토큰 · 권한을 직접 다루지 않음 (8장의 내 권한 slice로 처리)
- 공통 파일(`apiClient.js`, `common/` 컴포넌트) 수정 금지

---

## 8. 2단계: 내 권한 연동 (화면 완성 후)

화면이 동작한 뒤 권한에 따라 버튼을 숨깁니다. 서버는 이미 막고 있으므로 표시 문제입니다.

### API (백엔드 완료)

`GET /action-codes/me` → `{ roleId, roleDisplayName, superAdmin, actionCodes: string[] }`

- SUPER_ADMIN이면 `superAdmin: true`, `actionCodes: []` (모든 권한 허용으로 처리)
- 로그인 필요 (비로그인 401)

### 만들 파일

| 파일                                       | 내용                                                                                                                                                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/api/permission/permissionApi.js`      | `getMyActionCodes = (options) => api.get("/action-codes/me", undefined, options)`                                                                                                                                                                                  |
| `src/store/slices/permissionSliceStore.js` | 상태 `{ status: "idle" \| "loading" \| "loaded" \| "failed", roleId, roleDisplayName, superAdmin, actionCodes }`. 셀렉터 `selectCan(state, code)` = `superAdmin \|\| actionCodes.includes(code)`. `logout` 액션(`loginSliceStore`)을 `extraReducers`로 받아 초기화 |
| `src/hooks/usePermission.js` (선택)        | `const can = usePermission(); can("ROLE_READ")`                                                                                                                                                                                                                    |
| `src/store/slices/StoreProvider.jsx`       | `permission` 리듀서 등록 (한 줄)                                                                                                                                                                                                                                   |
| `src/layout/MainLayout.jsx`                | 로그인 상태이고 `status === "idle"`이면 `getMyActionCodes()` 호출. 로그인 직후(`navigate("/")`)와 새로고침 모두 여기서 처리                                                                                                                                        |

- `loginSliceStore.js`, `Login.jsx`는 로그인 담당자 파일이므로 수정하지 않습니다.
- 응답 전(`loading`)에는 `can()`이 `false`이므로 버튼이 늦게 나타납니다. 처음 한 번은 로딩 표시를 하거나 숨긴 상태로 시작합니다.

### 이 화면의 표시 규칙

| 요소                                                | 표시 조건                                                                          | 서버 권한        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------- |
| 목록                                                | `can("ROLE_READ")` (없으면 "권한이 없습니다" 표시)                                 | `ROLE_READ`      |
| 생성 폼, [수정], [삭제], 드래그 손잡이, [순서 저장] | `superAdmin`                                                                       | SUPER_ADMIN 전용 |
| 회원 이동 모달의 회원 목록                          | `can("ROLE_USER_READ")`                                                            | `ROLE_USER_READ` |
| [이동 후 삭제]                                      | `can("ROLE_USER_MOVE")` (삭제 자체가 SUPER_ADMIN 전용이므로 실제로는 `superAdmin`) | `ROLE_USER_MOVE` |

---

## 9. 확인 시나리오 (수동 테스트)

| #   | 시나리오                                                                | 기대 결과                                                                              |
| --- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | 화면 진입                                                               | SUPER_ADMIN 맨 위, STUDENT 맨 아래로 목록 표시                                         |
| 2   | 역할 ID 칸에 `test` 입력 / `ROLE_TEST` 붙여넣기 / `test-1` 입력 후 추가 | `TEST`로 변환 / `TEST`만 남음 / 형식 오류 메시지                                       |
| 3   | 이미 있는 역할 ID로 추가                                                | 역할 ID 입력칸 아래 "이미 사용 중인 역할 ID입니다."                                    |
| 4   | 정상 추가                                                               | STUDENT 바로 위에 새 역할                                                              |
| 5   | 이름 수정 후 Enter / Esc                                                | 저장 / 취소                                                                            |
| 6   | 일반 역할 드래그 → 순서 저장                                            | 저장 후 새로고침해도 순서 유지                                                         |
| 7   | 일반 역할을 SUPER_ADMIN 위나 STUDENT 아래로 드래그                      | 놓이지 않음                                                                            |
| 8   | 보호 역할 드래그 시도                                                   | 드래그되지 않음                                                                        |
| 9   | 순서 변경 후 [순서 되돌리기]                                            | 원래 순서                                                                              |
| 10  | 다른 탭에서 역할 추가 후 이 탭에서 순서 저장                            | "다른 사용자가 역할을 변경했습니다" 후 재조회                                          |
| 11  | 회원이 없는 역할 삭제                                                   | 바로 삭제                                                                              |
| 12  | 회원이 있는 역할 삭제                                                   | 이동 모달, 이동 대상에 SUPER_ADMIN과 자기 자신 없음                                    |
| 13  | 모달에서 이동 후 삭제                                                   | "N명 이동 · 삭제" 안내, 목록에서 사라짐                                                |
| 14  | 보호 역할 행                                                            | 삭제 버튼 없음. 회색 배경 · 옅은 글씨, 마우스를 올리면 금지 커서 (버튼 위는 원래 커서) |

테스트 데이터는 공유 개발 DB에 들어가므로, 확인용으로 만든 역할은 끝나면 삭제하세요.
