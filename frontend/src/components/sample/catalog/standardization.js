import { createContext } from "react";

/*
 * 표준화 전 (기록) 탭의 "표준 적용" 표시.
 * 각 예시(Variant)의 source에 적힌 화면 · 부품 이름을 아래 목록과 맞춰서
 *   모두 표준 적용 → [표준 적용], 일부만 → [일부 적용] + 남은 화면, 하나도 안 됨 → 표시 없음.
 *
 * 화면을 표준으로 옮기면 STANDARDIZED에 이름(파일 이름, 확장자 없이)을 추가한다.
 * 표준으로 옮기기 전인 이름은 REMAINING에 둔다. 두 곳 어디에도 없는 이름은 "남은 화면"으로 본다.
 */

/** 표준을 적용한 화면 · 더 이상 화면에서 쓰지 않는 옛 부품 */
export const STANDARDIZED = new Set([
  // 시스템 관리
  "Role", "RoleUserMoveModal", "Menu", "MenuColumn", "MenuGuard", "Access", "AccessRole",
  // 오류 화면
  "NotFound", "RouteError",
  // 과정 관리 (admin/course 전체)
  "course/*", "CourseAdd", "CourseMain", "CourseItem", "CourseStudentList", "StudentConnected",
  "CourseSurvey", "CourseSurveyForm", "CourseSurveyAns", "CourseSurveyResult",
  "ExamPage", "ExamQuestionPicker", "ExamSetTable", "ExamGradeModal", "ExamTakeModal", "ExamQuestionViewModal", "ConfirmModal",
  "HomeWorkList", "HomeworkForm", "HomeworkItem", "HomeworkSubmitStatus", "HomeworkReply", "ReplyForm",
  "CourseTutorSelect", "CourseStudentSelect", "ExamSubjectSelect", "TestSubjectSelect",
  "HomeworkDetails", "CourseSurveyStatistics",
  // 시험 문제 · 설문
  "Test", "AddTest", "UpdateTest", "Survey",
  // 수강 과정 탭
  "MyTimetable", "MyInterview", "MyCourseData", "MyCounsel",
  // 내 정보
  "MyInfo", "MyPassword", "MyInfoForm", "MyPasswordForm",
  // 회원 관리
  "Member", "MemberManagement", "MemberDetail", "MemberCreateModal", "MemberFormModal", "MemberPasswordResetModal",
  // 사이드바 (토큰 · 테마로 바꿈)
  "SideMenu", "UserProfile", "LogoutButton",
  // 화면에서 더 이상 쓰지 않는 옛 부품 (PageContainer는 머리를 표준 PageHeader로 그림)
  "Input", "Breadcrumb", "PageContainer", "Modal",
]);

/** 아직 옮기지 않은 화면 · 아직 화면에서 쓰는 옛 부품 */
export const REMAINING = new Set([
  "Code", "Login", "Main", "MyCourse",
  "IconButton", "Paginator",
]);

/** 화면 이름이 아닌 말 (판정에서 뺌) */
const IGNORED = new Set(["Sample", "여러 화면", "여러 곳"]);

/** source 문자열 → 화면 · 부품 이름 목록 */
export const sourceNames = (source) =>
  source
    .replace(/\(.*?\)/g, "") // (.className · ...) · (인라인) 같은 설명. 안에도 " · "가 있어서 먼저 지움
    .split(" · ")
    .map((part) => part.replace(/\s*(여러 곳|여러 화면)$/, "").trim())
    .map((part) => (part.endsWith("/*") ? part : part.split("/").pop()))
    .map((part) => part.replace(/\.(module\.css|jsx|js|css)$/, ""))
    .filter((name) => name && !IGNORED.has(name));

/** @returns {{ status: "done"|"partial"|"none", remaining: string[] }} */
export const standardizationOf = (source) => {
  const names = sourceNames(source ?? "");
  const remaining = names.filter((name) => !STANDARDIZED.has(name));
  if (names.length === 0 || remaining.length === names.length) return { status: "none", remaining };
  return { status: remaining.length ? "partial" : "done", remaining };
};

/** true인 구역 안의 Variant만 "표준 적용"을 표시 (표준 탭의 Variant에는 표시 안 함) */
export const StandardizationContext = createContext(false);
