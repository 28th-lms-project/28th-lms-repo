import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation, useMatches } from "react-router-dom";
import SideMenu from "../components/menu/SideMenu";
import MenuGuard from "../components/menu/MenuGuard";
import { selectUser, setUser } from "../store/slices/loginSliceStore";
import { getMyInfo } from "../api/my/info/myInfoApi";
import {
  fetchMyPermission,
  selectPermissionStatus,
} from "../store/slices/permissionSliceStore";
import { fetchMyMenus, selectMyMenuStatus } from "../store/slices/menuSliceStore";
import styles from "./MainLayout.module.css";

export default function MainLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector(selectUser);
  const permissionStatus = useSelector(selectPermissionStatus);
  const menuStatus = useSelector(selectMyMenuStatus);
  // 다크 모드: 표준으로 옮긴 화면(라우트 handle.darkReady)만 따른다. 나머지는 "밝은 섬"으로 감싸 지금 모양 그대로 (가이드 9장)
  const darkReady = useMatches().some((match) => match.handle?.darkReady);

  // 내 권한 조회: 로그인 직후(navigate("/"))와 새로고침 모두 여기서 처리.
  // 로그아웃하면 status가 "idle"로 초기화되어 다음 로그인 때 다시 조회된다.
  useEffect(() => {
    if (user?.id && permissionStatus === "idle") {
      dispatch(fetchMyPermission());
    }
  }, [dispatch, user?.id, permissionStatus]);

  // 내 메뉴 조회 (사이드바용): 권한 조회와 같은 방식. 로그아웃하면 "idle"로 초기화되어 다음 로그인 때 다시 조회된다.
  // 메뉴 가드(MenuGuard)도 같은 조회를 호출한다 (idle일 때만 실행되므로 한 번만 조회됨).
  useEffect(() => {
    if (user?.id && menuStatus === "idle") {
      dispatch(fetchMyMenus());
    }
  }, [dispatch, user?.id, menuStatus]);

  // 내 이름 조회 (사이드바 프로필용): 로그인 직후 · 새로고침 모두 토큰에는 이름이 없어 여기서 채운다.
  // 사용자가 바뀌거나 로그아웃하면 이전 요청을 취소해, 이전 사용자의 이름이 들어가지 않게 한다.
  // 실패하면 이름 대신 아이디를 보여 준다 (UserProfile).
  const userId = user?.id;
  const hasName = Boolean(user?.name);
  useEffect(() => {
    if (!userId || hasName) {
      return;
    }
    const controller = new AbortController();
    getMyInfo({ signal: controller.signal })
      .then((info) => {
        if (info?.name) dispatch(setUser({ name: info.name }));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [dispatch, userId, hasName]);

  // 비로그인 상태에서 /login 이외의 경로로 접근 시 로그인 페이지로 리다이렉트
  if (!user && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.container}>
      {/* 로그아웃 · 다른 계정 로그인 시 사이드바를 새로 만들어, 이전 사용자가 펼치거나 접은 그룹 상태를 버린다 */}
      <SideMenu key={user?.id ?? "guest"} />
      <main className={styles.content} data-color-scheme={darkReady ? undefined : "light"}>
        {/* 내 메뉴에 없는 화면은 "권한이 없습니다" (사이드바는 그대로) */}
        <MenuGuard>
          <Outlet />
        </MenuGuard>
      </main>
    </div>
  );
}
