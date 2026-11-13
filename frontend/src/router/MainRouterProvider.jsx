import {
  createBrowserRouter,
  Navigate,
  Outlet,
  redirect,
  RouterProvider,
} from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import MenuGuard from "../components/menu/MenuGuard";
import Login from "../components/login/Login";
import Main from "../components/main/Main";
import MyInfo from "../components/my/info/MyInfo";
import MyCourseList from "../components/my/course/MyCourseList";
import MyCourse from "../components/my/course/MyCourse";

import CourseAdd from "../components/admin/course/add/CourseAdd";
import Survey from "../components/admin/survey/survey/Survey";
import Test from "../components/admin/test/test/Test";
import MemberManagement from "../components/admin/system/member/MemberManagement.jsx";
import Menu from "../components/admin/system/menu/Menu";
import Role from "../components/admin/system/role/Role";
import Access from "../components/admin/system/access/Access";
import AccessRole from "../components/admin/system/access-role/AccessRole";
import Code from "../components/admin/system/code/Code";
import Sample from "../components/sample/Sample.jsx";
import CourseMain from "../components/admin/course/CourseMain.jsx";

import CourseItem from "../components/admin/course/list/CourseItem.jsx";
import { getCourses } from "../api/admin/course/courseApi";
import HomeworkDetails from "../components/admin/course/CourseTableComponent/HomeworkDetails.jsx";

/**
 * 라우트 목록. 메뉴 관리 화면이 메뉴 URL 선택지를 만드는 데 사용한다 (routeUtils.getMenuUrlOptions).
 * handle.menu: true → 메뉴 관리에서 메뉴 URL로 고를 수 있는 화면 (파라미터가 없고 화면이 있는 경로)
 * handle.guardAs: "메뉴 URL" → 주소로 메뉴를 찾을 수 없는 라우트(팝업 등)가 속한 메뉴. 메뉴 가드가 이 메뉴로 판정한다.
 *   빠뜨리면 SUPER_ADMIN만 열 수 있다. (설계: frontend/docs/design/menu-page-design.md 5-2)
 */
// eslint-disable-next-line react-refresh/only-export-components
export const routes = [
  {
    // 팝업은 MainLayout 밖이라 가드로 직접 감싼다. 과정 목록 화면에서 여는 팝업이므로 그 메뉴 기준으로 판정
    path: "/popup/homework/:courseId/:homeworkId",
    element: (
      <MenuGuard>
        <HomeworkDetails />
      </MenuGuard>
    ),
    handle: { guardAs: "/admin/course/list" },
  },
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <div>404 Not Found</div>,
    children: [
      { index: true, element: <Main />, handle: { crumb: "Dashboard", menu: true } },
      { path: "login", element: <Login />, handle: { crumb: "로그인" } },
      { path: "sample", element: <Sample />, handle: { crumb: "Sample", menu: true } },
      {
        path: "my",
        handle: { crumb: "My Page" },
        children: [
          {
            path: "info",
            element: <MyInfo />,
            handle: { crumb: "내 정보 수정", menu: true },
          },
          {
            path: "course",
            handle: { crumb: "수강 과정" },
            children: [
              // /my/course는 메뉴가 아니므로, 수강 과정 메뉴 기준으로 판정해야 list로 넘어갈 수 있다
              {
                index: true,
                element: <Navigate to="list" replace />,
                handle: { guardAs: "/my/course/list" },
              },
              { path: "list", element: <MyCourseList />, handle: { menu: true } },
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
            // 과정 버튼 목록(CourseMain)은 과정 관리 화면에서만 표시
            element: (
              <>
                <CourseMain />
                <Outlet />
              </>
            ),
            children: [
              {
                path: "list",
                element: (
                  <>
                    <Outlet />
                  </>
                ),
                handle: { crumb: "과정 목록", menu: true },
                children: [
                  {
                    index: true,
                    element: null,
                    loader: async () => {
                      const courses = await getCourses();
                      if (!courses || courses.length === 0) {
                        return redirect("/admin/course/add");
                      }
                      return redirect(
                        `/admin/course/list/${courses[0].id}?tab=0`,
                      );
                    },
                  },
                  {
                    path: ":id",
                    element: (
                      <>
                        <CourseItem />
                      </>
                    ),
                  },
                ],
              },
              {
                path: "add",
                element: <CourseAdd />,

                handle: { crumb: "과정 등록", menu: true },
              },
            ],
          },
          {
            path: "survey",
            element: <Survey />,
            handle: { crumb: "설문 관리", menu: true },
          },
          {
            path: "test",
            element: <Test />,
            handle: { crumb: "시험 문제 관리", menu: true },
          },
          {
            path: "system",
            handle: { crumb: "시스템 관리" },
            children: [
              {
                path: "member",
                element: <MemberManagement />,
                handle: { crumb: "회원 관리", menu: true },
              },
              {
                path: "menu",
                element: <Menu />,
                handle: { crumb: "메뉴 관리", menu: true },
              },
              {
                path: "role",
                element: <Role />,
                handle: { crumb: "권한 관리", menu: true },
              },
              {
                path: "access",
                element: <Access />,
                handle: { crumb: "접근 관리", menu: true },
              },
              {
                path: "access-role",
                element: <AccessRole />,
                handle: { crumb: "권한별 접근 권한 관리", menu: true },
              },
              {
                path: "code",
                element: <Code />,
                handle: { crumb: "환경 변수 관리", menu: true },
              },
            ],
          },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export default function MainRouterProvider() {
  return <RouterProvider router={router} />;
}
