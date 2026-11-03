import { Outlet } from "react-router-dom";
import SideMenu from "../components/menu/SideMenu";
import styles from "./MainLayout.module.css";

export default function MainLayout() {
  return (
    <div className={styles.container}>
      <SideMenu />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
