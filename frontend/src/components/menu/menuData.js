export const MENU = [
  {
    section: "Main",
    groups: [
      { title: "Home", items: [{ to: "/", label: "Dashboard", end: true }] },
    ],
  },
  {
    section: "My Page",
    groups: [
      {
        title: "수강 과정",
        items: [{ to: "/my/course/list", label: "수강 과정" }],
      },
      {
        title: "내 정보 수정",
        items: [{ to: "/my/info", label: "내 정보 수정" }],
      },
    ],
  },
  {
    section: "System Management",
    groups: [
      {
        title: "과정 관리",
        items: [
          { to: "/admin/course", label: "과정 목록", end: true },
          { to: "/admin/course/add", label: "과정 등록" },
        ],
      },
      {
        title: "설문 관리",
        items: [{ to: "/admin/survey", label: "설문 관리" }],
      },
      {
        title: "시험 문제 관리",
        items: [{ to: "/admin/test", label: "시험 문제 관리" }],
      },
      {
        title: "수강생 관리",
        items: [{ to: "/admin/students", label: "수강생 관리" }],
      },
      {
        title: "시스템 관리",
        items: [
          { to: "/admin/system/account", label: "관리자 관리" },
          { to: "/admin/system/tutor", label: "강사 관리" },
          { to: "/admin/system/menu", label: "메뉴 관리" },
          { to: "/admin/system/role", label: "권한 관리" },
          { to: "/admin/system/access", label: "접근 관리" },
          { to: "/admin/system/access-role", label: "권한별 접근 권한 관리" },
          { to: "/admin/system/code", label: "환경 변수 관리" },
          { to: "/admin/system/db", label: "DB 관리" },
        ],
      },
    ],
  },
];
