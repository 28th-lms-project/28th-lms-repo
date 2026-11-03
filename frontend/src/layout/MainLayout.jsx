import { Outlet } from "react-router-dom";
import { NavigationBar } from "../router/MainRouterProvider";

export default function MainLayout() {
  return (
    <div className="main_container">
      <div>
        <NavigationBar />
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
