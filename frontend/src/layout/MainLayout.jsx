import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import SideMenu from "../components/menu/SideMenu";
import { selectUser } from "../store/slices/loginSliceStore";
import {
  fetchMyPermission,
  selectPermissionStatus,
} from "../store/slices/permissionSliceStore";
import styles from "./MainLayout.module.css";

export default function MainLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector(selectUser);
  const permissionStatus = useSelector(selectPermissionStatus);

  // 내 권한 조회: 로그인 직후(navigate("/"))와 새로고침 모두 여기서 처리.
  // 로그아웃하면 status가 "idle"로 초기화되어 다음 로그인 때 다시 조회된다.
  useEffect(() => {
    if (user?.id && permissionStatus === "idle") {
      dispatch(fetchMyPermission());
    }
  }, [dispatch, user?.id, permissionStatus]);

  // 비로그인 상태에서 /login 이외의 경로로 접근 시 로그인 페이지로 리다이렉트
  if (!user && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.container}>
      <SideMenu />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
