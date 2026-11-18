import { useCallback, useEffect, useState } from "react";
import { getCourses } from "../../api/admin/course/courseApi.js";

/**
 * 대시보드가 쓰는 내 과정 목록 (GET /course/view). 과정마다 myRelation(TUTOR · STUDENT · null)이 온다.
 * 대시보드는 역할 ID가 아니라 이 관계와 권한으로 보여 줄 영역을 고른다 (access-control-guide 9장과 같은 이유).
 *
 * @param {boolean} enabled  false면 부르지 않음 (권한 조회 전 · 과정 조회 권한 없음)
 * @returns {{ status: "loading"|"loaded"|"failed", courses: object[], reload: () => void }}
 */
export default function useMyCourses(enabled) {
  const [state, setState] = useState({ status: "loading", courses: [] });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const controller = new AbortController();
    getCourses({ signal: controller.signal })
      .then((list) => {
        if (controller.signal.aborted) return;
        setState({ status: "loaded", courses: list ?? [] });
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === "AbortError") return;
        setState({ status: "failed", courses: [] });
      });
    return () => controller.abort();
  }, [enabled, reloadKey]);

  const reload = useCallback(() => {
    setState({ status: "loading", courses: [] });
    setReloadKey((key) => key + 1);
  }, []);

  return { ...state, reload };
}
