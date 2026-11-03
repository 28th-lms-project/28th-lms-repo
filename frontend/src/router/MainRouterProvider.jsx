import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import Login from "../components/login/Login";
import Main from "../components/main/Main";
import MyInfo from "../components/my/info/MyInfo";
import MyCourseList from "../components/my/course/MyCourseList";
import MyCourse from "../components/my/course/MyCourse";
import CourseList from "../components/admin/course/list/CourseList";
import CourseAdd from "../components/admin/course/add/CourseAdd";
import Survey from "../components/admin/survey/survey/Survey";
import Test from "../components/admin/test/test/Test";
import Students from "../components/admin/students/students/Students";
import Account from "../components/admin/system/account/Account";
import Tutor from "../components/admin/system/tutor/Tutor";
import Menu from "../components/admin/system/menu/Menu";
import Role from "../components/admin/system/role/Role";
import Access from "../components/admin/system/access/Access";
import AccessRole from "../components/admin/system/access-role/AccessRole";
import Code from "../components/admin/system/code/Code";
import SideMenu from "../components/menu/SideMenu";
import Sample from "../components/sample/Sample.jsx";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <div>404 Not Found</div>,
    children: [
      { index: true, element: <Main /> },
      { path: "sample", index: true, element: <Sample /> },
      {
        path: "my",
        children: [
          { path: "info", element: <MyInfo /> },
          {
            path: "course",
            children: [
              { index: true, element: <Navigate to="list" replace /> },
              { path: "list", element: <MyCourseList /> },
              // ?tab=0~8 로 탭 전환 (MyCourse 의 TABS 참고)
              { path: "list/:courseId", element: <MyCourse /> },
            ],
          },
        ],
      },
      {
        path: "admin",
        children: [
          { path: "course", element: <CourseList /> },
          { path: "course/add", element: <CourseAdd /> },
          { path: "survey", element: <Survey /> },
          { path: "test", element: <Test /> },
          { path: "students", element: <Students /> },
          {
            path: "system",
            children: [
              { path: "account", element: <Account /> },
              { path: "tutor", element: <Tutor /> },
              { path: "menu", element: <Menu /> },
              { path: "role", element: <Role /> },
              { path: "access", element: <Access /> },
              { path: "access-role", element: <AccessRole /> },
              { path: "code", element: <Code /> },
            ],
          },
        ],
      },
    ],
  },
]);

export default function MainRouterProvider() {
  return <RouterProvider router={router} />;
}

export function NavigationBar() {
  return <SideMenu />;
}
