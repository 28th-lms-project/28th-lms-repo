import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  selectCan,
  selectIsSuperAdmin,
  selectPermissionStatus,
} from "../store/slices/permissionSliceStore";

/**
 * 내 권한. 화면의 버튼 · 기능 표시 여부를 판단하는 데 사용한다 (실제 차단은 서버가 함).
 * 권한 조회는 MainLayout이 로그인 시 자동으로 하므로, 화면에서는 꺼내 쓰기만 하면 된다.
 *
 * @example
 * // 대부분의 화면: 권한 코드로 판단
 * const { can } = usePermission();
 * {can("EXAM_CREATE") && <button>시험 생성</button>}
 *
 * // SUPER_ADMIN 전용 기능(@RequireSuperAdmin) · 조회 상태가 필요한 화면
 * const { can, isSuperAdmin, status } = usePermission();
 *
 * @returns {{
 *   can: (actionCode: string) => boolean,
 *   isSuperAdmin: boolean,
 *   status: "idle" | "loading" | "loaded" | "failed",
 * }}
 *   - can: SUPER_ADMIN이거나 권한 코드가 부여되어 있으면 true
 *   - isSuperAdmin: SUPER_ADMIN이면 true
 *   - status: 권한 조회 상태 (idle = 비로그인 · 조회 전)
 *   - "loaded" 전에는 can · isSuperAdmin 모두 false
 */
export default function usePermission() {
  // 권한 상태 전체를 한 번만 구독하고, 판단은 slice의 셀렉터에 맡긴다
  const permission = useSelector((state) => state.permission);

  // 권한 상태가 바뀔 때만 새 객체를 만든다
  return useMemo(() => {
    const rootState = { permission };
    return {
      can: (actionCode) => selectCan(rootState, actionCode),
      isSuperAdmin: selectIsSuperAdmin(rootState),
      status: selectPermissionStatus(rootState),
    };
  }, [permission]);
}
