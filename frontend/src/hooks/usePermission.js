import { useCallback } from "react";
import { useSelector } from "react-redux";
import { selectCan } from "../store/slices/permissionSliceStore";

/**
 * 권한 코드 확인 함수를 반환한다. 표시 여부 판단용 (실제 차단은 서버가 함)
 *
 * const can = usePermission();
 * can("ROLE_READ"); // SUPER_ADMIN이거나 권한 코드가 있으면 true. 조회 전에는 false
 */
export default function usePermission() {
  const permission = useSelector((state) => state.permission);

  return useCallback(
    (actionCode) => selectCan({ permission }, actionCode),
    [permission],
  );
}
