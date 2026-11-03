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
import Sample from "../components/sample/Sample.jsx";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <div>404 Not Found</div>,
    children: [
      { index: true, element: <Main />, handle: { crumb: "Dashboard" } },
      { path: "sample", element: <Sample />, handle: { crumb: "Sample" } },
      {
        path: "my",
        handle: { crumb: "My Page" },
        children: [
          {
            path: "info",
            element: <MyInfo />,
            handle: { crumb: "내 정보 수정" },
          },
          {
            path: "course",
            handle: { crumb: "수강 과정" },
            children: [
              { index: true, element: <Navigate to="list" replace /> },
              { path: "list", element: <MyCourseList /> },
              // ?tab=0~8 로 탭 전환 (MyCourse 의 TABS 참고)
              {
                path: "list/:courseId",
                element: <MyCourse />,
                handle: { crumb: "과정 상세" },
              },
            ],
          },
        ],
      },
      {
        path: "admin",
        handle: { crumb: "System Management" },
        children: [
          {
            path: "course",
            handle: { crumb: "과정 관리" },
            children: [
              {
                index: true,
                element: <CourseList />,
                handle: { crumb: "과정 목록" },
              },
              {
                path: "add",
                element: <CourseAdd />,
                handle: { crumb: "과정 등록" },
              },
            ],
          },
          {
            path: "survey",
            element: <Survey />,
            handle: { crumb: "설문 관리" },
          },
          {
            path: "test",
            element: <Test />,
            handle: { crumb: "시험 문제 관리" },
          },
          {
            path: "students",
            element: <Students />,
            handle: { crumb: "수강생 관리" },
          },
          {
            path: "system",
            handle: { crumb: "시스템 관리" },
            children: [
              {
                path: "account",
                element: <Account />,
                handle: { crumb: "관리자 관리" },
              },
              {
                path: "tutor",
                element: <Tutor />,
                handle: { crumb: "강사 관리" },
              },
              { path: "menu", element: <Menu />, handle: { crumb: "메뉴 관리" } },
              { path: "role", element: <Role />, handle: { crumb: "권한 관리" } },
              {
                path: "access",
                element: <Access />,
                handle: { crumb: "접근 관리" },
              },
              {
                path: "access-role",
                element: <AccessRole />,
                handle: { crumb: "권한별 접근 권한 관리" },
              },
              {
                path: "code",
                element: <Code />,
                handle: { crumb: "환경 변수 관리" },
              },
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
