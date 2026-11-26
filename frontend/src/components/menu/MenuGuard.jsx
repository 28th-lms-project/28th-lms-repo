import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation, useMatches } from "react-router-dom";
import { selectUser } from "../../store/slices/loginSliceStore";
import {
  fetchMyMenus,
  refreshMyMenus,
  selectGuardUrls,
  selectIsMenuSuperAdmin,
  selectMyMenus,
  selectMyMenuStatus,
} from "../../store/slices/menuSliceStore";
import { findGuardUrl, getGuardTarget } from "../../router/routeUtils";
import StatusBox from "../common/ui/StatusBox";

// 항상 열리는 경로 (대시보드 · 로그인)
const OPEN_PATHS = ["/", "/login"];

/**
 * 메뉴 가드. 내 메뉴(GET /menus/me)에 없는 화면을 주소로 직접 열지 못하게 한다.
 * 설계: frontend/docs/design/menu-page-design.md 5-3, 5-4
 *
 * - MainLayout의 <Outlet />과 팝업 라우트(MainLayout 밖)를 감싼다.
 * - 화면만 막는다. 데이터는 API 권한(@RequireAction)이 막으므로 화면 안의 권한 확인(can)은 그대로 필요하다.
 * - 라우트 loader는 가드보다 먼저 실행된다 (loader가 부르는 API는 API 권한으로 막힘).
 */
export default function MenuGuard({ children }) {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const matches = useMatches();
  const user = useSelector(selectUser);
  const status = useSelector(selectMyMenuStatus);
  const superAdmin = useSelector(selectIsMenuSuperAdmin);
  const myMenus = useSelector(selectMyMenus);
  const guardUrls = useSelector(selectGuardUrls);

  // 없는 주소(404 라우트, handle.notFound)도 권한과 상관없으므로 통과시킨다
  const isOpenPath =
    OPEN_PATHS.includes(pathname) || matches.some((match) => match.handle?.notFound);

  // 팝업은 MainLayout 밖이라 가드가 조회를 시작한다. idle일 때만 실행되므로 MainLayout과 겹쳐도 한 번만 조회한다.
  useEffect(() => {
    if (!isOpenPath && user?.id && status === "idle") {
      dispatch(fetchMyMenus());
    }
  }, [dispatch, isOpenPath, user?.id, status]);

  // 1. 대시보드 · 로그인 · 없는 주소는 통과
  if (isOpenPath) return children;

  // 2. 비로그인이면 로그인 화면으로
  if (!user) return <Navigate to="/login" replace />;

  // 3. 내 메뉴를 받는 중이면 안내, 실패하면 오류 + [다시 시도] (사이드바와 같은 refreshMyMenus)
  if (status === "idle" || status === "loading") {
    return <StatusBox type="loading" title="메뉴 정보를 불러오는 중..." />;
  }
  if (status === "failed") {
    return (
      <StatusBox
        type="error"
        title="메뉴 정보를 불러오지 못했습니다."
        onRetry={() => dispatch(refreshMyMenus())}
      />
    );
  }

  // 4. SUPER_ADMIN은 통과
  if (superAdmin) return children;

  // 5 ~ 8. 이 주소가 속한 메뉴를 찾고, 그 메뉴가 내 메뉴에 있을 때만 통과
  const menuUrl = findGuardUrl(guardUrls, getGuardTarget(matches, pathname));
  if (menuUrl && myMenus.some((menu) => menu.menuUrl === menuUrl)) return children;

  return <StatusBox type="denied" />;
}
