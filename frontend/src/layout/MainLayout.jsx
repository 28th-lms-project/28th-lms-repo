
import { Outlet } from "react-router-dom";
import { NavigationBar } from "../router/MainRouterProvider";

export default function MainLayout() {
    return (
        <div className="main_container">
            <aside className="sidebar_container">
                <NavigationBar />
            </aside>

            <main className="main_content">
                <Outlet />
            </main>
        </div>
    );
}
