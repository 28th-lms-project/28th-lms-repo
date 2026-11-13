# 프론트 권한 적용 가이드

로그인한 사용자의 권한에 따라 **버튼 · 메뉴 · 화면을 보여줄지 숨길지** 정하는 방법입니다. 권한 조회는 공통 코드가 로그인할 때 자동으로 하므로, 각 화면에서는 훅 하나만 쓰면 됩니다.

## 요약

```jsx
import usePermission from "../../hooks/usePermission"; // 경로는 파일 위치에 맞게

export default function ExamList() {
  const { can } = usePermission();

  return <>{can("EXAM_CREATE") && <button>시험 생성</button>}</>;
}
```

- `can("권한 코드")`: 내 역할에 그 권한이 있으면 `true`, 없으면 `false`입니다. SUPER_ADMIN은 항상 `true`입니다.
- **권한 코드**는 백엔드 컨트롤러의 `@RequireAction(domain, action)`을 `domain_action`으로 붙인 값입니다.
  - 예: `@RequireAction(domain = "EXAM", action = "CREATE")` → `"EXAM_CREATE"`
- 권한 정보를 아직 받아오지 못했을 때(로그인 직후 · 새로고침 직후 잠깐)는 `false`입니다. 버튼은 숨겨져 있다가 권한이 확인되면 나타납니다.
- **화면에서 숨기는 것은 표시용입니다.** 실제 차단은 서버가 합니다. 백엔드 API에도 반드시 `@RequireAction`을 붙이세요 (`backend/docs/access-control-guide.md`).

> **⚠️ 현재 상태: 서버 권한 검사가 켜져 있습니다** (2026-11-10).
>
> 권한이 없는 사용자가 `@RequireAction`이 붙은 API를 호출하면 403(`GLOBAL_FORBIDDEN`)이 응답됩니다. 권한이 걸린 API는 3-2처럼 `can()`이 `true`일 때만 호출하세요. 새로 권한을 붙인 API는 관리자가 등록 · 부여하기 전까지 SUPER_ADMIN만 쓸 수 있습니다 (5장).
>
> **백엔드 API에 권한 어노테이션이 아예 없으면 SUPER_ADMIN만 호출할 수 있습니다.** SUPER_ADMIN이 아닌 계정으로 테스트하다 403이 나면, 먼저 그 API에 `@RequireAction` 등이 붙어 있는지 백엔드 담당자에게 확인하세요.

---

## 1. 동작 방식

```text
[관리자]   ① 접근 관리: 권한 코드(예: EXAM_CREATE) 등록
           ② 권한별 접근 권한 관리: 역할(예: ROLE_TUTOR)에 권한 코드 부여
              ↓
[로그인]   MainLayout이 GET /action-codes/me 호출 (로그인 · 새로고침 시 한 번)
           → { roleId: "ROLE_TUTOR", superAdmin: false, actionCodes: ["EXAM_CREATE", "EXAM_READ"] }
           → Redux(permission)에 저장
              ↓
[화면]     can("EXAM_CREATE") → 저장된 actionCodes에 "EXAM_CREATE"가 있는지 확인 → true
```

- 버튼마다 서버에 묻지 않습니다. 로그인할 때 받은 목록에 코드가 있는지만 봅니다.
- 역할은 토큰이 아니라 **DB의 현재 역할** 기준입니다.
- 로그아웃하면 권한 정보가 지워지고, 다음 로그인 때 다시 받아옵니다.

---

## 2. `usePermission()` 반환값

```jsx
const { can, isSuperAdmin, status } = usePermission();
```

| 값             | 타입                                                | 설명                                                                  |
| -------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| `can(code)`    | `(string) => boolean`                               | SUPER_ADMIN이거나 권한 코드가 부여되어 있으면 `true`                  |
| `isSuperAdmin` | `boolean`                                           | SUPER_ADMIN이면 `true`. `@RequireSuperAdmin` API를 쓰는 기능에만 필요 |
| `status`       | `"idle"` \| `"loading"` \| `"loaded"` \| `"failed"` | 권한 조회 상태. 보통은 쓸 필요 없음                                   |

`status`의 의미는 이렇습니다.

| `status`  | 상황                                  | `can()` · `isSuperAdmin` |
| --------- | ------------------------------------- | ------------------------ |
| `idle`    | 비로그인, 또는 조회 시작 전           | `false`                  |
| `loading` | 조회 중 (로그인 · 새로고침 직후 잠깐) | `false`                  |
| `loaded`  | 조회 완료                             | 실제 권한대로            |
| `failed`  | 조회 실패 (서버 오류 등)              | `false`                  |

**대부분의 화면은 `can`만 쓰면 됩니다.**

---

## 3. 사용 예시

### 3-1. 버튼 숨기기 (가장 흔한 경우)

```jsx
const { can } = usePermission();

return (
  <div>
    {can("EXAM_CREATE") && <button onClick={openCreate}>시험 생성</button>}
    {can("EXAM_DELETE") && <button onClick={removeExam}>삭제</button>}
  </div>
);
```

### 3-2. 권한이 있을 때만 데이터 조회

조회 API에 권한이 걸려 있다면, **권한이 확인된 뒤에만 호출**하세요. 서버 검사가 켜진 뒤 권한 없이 호출하면 403 오류가 나서 오류 창이 뜹니다.

```jsx
const { can } = usePermission();
const canRead = can("EXAM_READ");

useEffect(() => {
  if (!canRead) return; // 권한 확인 전 · 권한 없음 → 호출하지 않음

  const controller = new AbortController();
  getExams({ signal: controller.signal })
    .then(setExams)
    .catch((error) => {
      if (error.name !== "AbortError") alert(error.message);
    });

  return () => controller.abort();
}, [canRead]);
```

`canRead`가 `false`에서 `true`로 바뀌는 순간(권한 조회 완료) effect가 다시 실행되어 조회가 시작됩니다.

### 3-3. 화면 전체를 권한으로 막기

```jsx
export default function ExamManage() {
  const { can, status } = usePermission();

  if (status !== "loaded") return null; // 조회 중에는 아무것도 표시하지 않음
  if (!can("EXAM_READ")) return <p>권한이 없습니다.</p>;

  return <ExamManageContent />; // 실제 화면 (권한이 있을 때만 마운트 → 3-2처럼 조회)
}
```

`status`를 확인하지 않으면, 조회 중에는 `can()`이 `false`라서 "권한이 없습니다."가 잠깐 보였다가 사라집니다.

### 3-4. SUPER_ADMIN 전용 기능

API에 `@RequireSuperAdmin`이 붙은 기능은 권한 코드가 없으므로 `isSuperAdmin`으로 판단합니다. 권한 체계 자체를 다루는 화면(권한 관리의 역할 생성 · 수정 · 삭제 · 순서 변경, 접근 관리, 권한별 접근 권한 관리)에만 해당하며, 이 화면들은 이미 적용되어 있습니다. **그 외 화면은 모두 `can("권한 코드")`를 쓰세요.** 전체 목록은 `backend/docs/access-control-guide.md` 2장을 참고하세요.

```jsx
const { isSuperAdmin } = usePermission();

return (
  <div>
    {isSuperAdmin && <button onClick={saveSettings}>권한 설정 저장</button>}
  </div>
);
```

### 3-5. 조회 중 · 실패 문구 (관리자 화면에서만, 선택)

**일반 사용자 화면에서는 "권한 확인 중..." 같은 문구를 표시하지 마세요.** 사용자에게는 의미가 없는 정보입니다. 버튼은 숨긴 상태로 두면 됩니다.

관리자 전용 화면처럼 화면 전체가 권한에 걸려 있다면 문구를 표시해도 됩니다 (예: 권한 관리 화면).

```jsx
const { can, status } = usePermission();

if (status === "loading") return <p>권한 확인 중...</p>;
if (status === "failed")
  return <p>권한 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.</p>;
if (status !== "loaded") return null; // 비로그인
if (!can("ACCESS_READ")) return <p>권한이 없습니다.</p>;
```

---

## 4. 권한 코드 확인 방법

| 방법                 | 설명                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------- |
| 백엔드 컨트롤러 확인 | 호출하는 API 메서드의 `@RequireAction(domain = "EXAM", action = "CREATE")` → `"EXAM_CREATE"` |
| 권한 코드 목록 API   | `GET /action-codes` (SUPER_ADMIN 전용). 도메인별 전체 코드와 등록 여부                       |
| 접근 관리 화면       | SUPER_ADMIN 계정으로 `시스템 관리 > 접근 관리`의 도메인 · 권한 선택 목록                     |

- **버튼이 호출하는 API의 권한 코드를 그대로 쓰세요.** 예: [시험 생성] 버튼이 `POST /exams`를 호출하고 그 API가 `EXAM_CREATE`라면 `can("EXAM_CREATE")`.
- API에 `@RequireAction`이 아직 없다면 백엔드 담당자에게 먼저 붙여 달라고 요청하세요. 코드가 없으면 SUPER_ADMIN 말고는 아무도 버튼을 볼 수 없습니다.

---

## 5. 확인(테스트) 방법

1. **SUPER_ADMIN 계정**: 모든 버튼이 보이는지 확인
2. **권한을 줄 역할 준비** (SUPER_ADMIN으로 진행)
   - `시스템 관리 > 접근 관리`: 권한 코드 등록 (예: `EXAM_CREATE`)
   - `시스템 관리 > 권한별 접근 권한 관리`: 역할(예: `ROLE_TUTOR`)에 그 코드 부여
3. **그 역할의 계정**으로 로그인: 부여한 버튼만 보이는지 확인
4. **권한이 없는 계정**(예: `ROLE_STUDENT`)으로 로그인: 버튼이 숨겨지는지 확인

- 권한을 바꾼 뒤에는 **새로고침하거나 다시 로그인해야** 화면에 반영됩니다. 메뉴로 다른 페이지에 다녀오는 것만으로는 반영되지 않습니다.- 공유 개발 DB이므로 테스트용으로 부여한 권한은 끝나면 정리하세요.

---

## 6. 하지 말 것

| 하지 말 것                                                                       | 이유 · 대신 할 것                                                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 화면에서 `/action-codes/me`를 직접 호출                                          | 공통 코드(`MainLayout`)가 로그인 시 한 번 조회합니다. `usePermission()`만 쓰세요     |
| 역할 이름으로 판단 (`user.roleName === "ROLE_ADMIN"`)                            | 역할별 권한은 관리자가 화면에서 바꿀 수 있습니다. 항상 권한 코드(`can`)로 판단하세요 |
| 토큰을 디코딩해서 역할 확인                                                      | 토큰의 역할은 로그인 시점 값이라 바뀐 역할이 반영되지 않습니다                       |
| 화면에서 숨겼으니 API 권한은 생략                                                | 화면 숨김은 표시용입니다. API에는 반드시 `@RequireAction`을 붙이세요                 |
| 권한 확인 전에 권한이 걸린 API 호출                                              | 서버 검사가 켜지면 403 오류 창이 뜹니다. 3-2처럼 `can()`이 `true`일 때 호출하세요    |
| 일반 사용자 화면에 "권한 확인 중..." 표시                                        | 3-5 참고. 숨긴 상태로 두면 됩니다                                                    |
| 공통 파일 수정 (`permissionSliceStore.js`, `usePermission.js`, `MainLayout.jsx`) | 수정이 필요하면 ROLE 담당자에게 요청하세요                                           |

---

## 7. 자주 묻는 질문

**Q. 로그인 직후 버튼이 잠깐 안 보였다가 나타나요.**
정상입니다. 권한을 받아오는 동안은 `can()`이 `false`입니다. 응답은 보통 금방 옵니다.

**Q. 관리자가 권한을 바꿨는데 화면이 그대로예요.**
권한은 로그인 · 새로고침 시에만 받아옵니다. 새로고침하세요. 서버는 권한을 저장하는 즉시 반영하므로, 새로고침하면 바뀐 권한이 표시됩니다.

**Q. SUPER_ADMIN인데 `actionCodes`가 비어 있어요.**
정상입니다. SUPER_ADMIN은 모든 권한이 허용되므로 서버가 목록을 보내지 않고 `superAdmin: true`만 보냅니다. `can()`은 항상 `true`입니다.

**Q. 로그인하지 않은 사용자는 어떻게 되나요?**
권한을 조회하지 않으므로 `status`는 `"idle"`이고 `can()`은 항상 `false`입니다.

**Q. 메뉴도 권한에 따라 숨길 수 있나요?**
사이드바는 메뉴 관리 화면에서 역할을 지정한 메뉴만 보여 줍니다 (`GET /menus/me`, 설계: `docs/design/menu-page-design.md` 7장). 이 문서의 권한(`actionCodes`)과는 별개입니다. 다만 아직 주소를 직접 입력해 들어오는 것은 막지 않으므로(메뉴 가드 구현 전), 메뉴 안의 화면에서도 3-3처럼 권한을 확인하세요.

---

## 8. 관련 파일

| 파일                                       | 역할                                                          |
| ------------------------------------------ | ------------------------------------------------------------- |
| `src/hooks/usePermission.js`               | 화면에서 쓰는 훅 (`can`, `isSuperAdmin`, `status`)            |
| `src/store/slices/permissionSliceStore.js` | 권한 상태 저장 · 조회 · 로그아웃 시 초기화                    |
| `src/api/permission/permissionApi.js`      | `GET /action-codes/me` 호출                                   |
| `src/layout/MainLayout.jsx`                | 로그인 상태면 권한 조회                                       |
| `backend/docs/access-control-guide.md`     | 백엔드 API 권한 설정 (`@RequireAction`, `@RequireSuperAdmin`) |
| `frontend/docs/api-client-guide.md`        | API 호출 · 오류 처리 규칙                                     |
