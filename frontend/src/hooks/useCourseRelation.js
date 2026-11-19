import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

/**
 * 과정 화면(/my/course/list/:id)에서 "이 과정에서 내 관계".
 * 과정 목록(/course/view, CourseMain이 store.courses.courseList에 넣음)의 myRelation을 그대로 쓴다.
 *
 * 권한 코드(usePermission)는 "이 종류의 기능을 쓸 수 있는가"만 알려 준다. 수강생 기능(시험 응시 · 설문 응답)은
 * 강사 역할에도 권한이 있을 수 있으므로, 버튼은 권한 코드와 함께 이 관계로 판단한다
 * (서버도 같은 기준으로 막음: CourseAccessChecker, frontend/docs/design/dashboard-design.md 3-1).
 *
 * @param {string} [courseId]  생략하면 주소의 :id
 * @returns {"TUTOR" | "STUDENT" | null}  과정 목록을 아직 못 받았거나 등록되지 않은 과정이면 null
 */
export default function useCourseRelation(courseId) {
  const { id } = useParams();
  const targetId = courseId ?? id;
  const courseList = useSelector((store) => store.courses.courseList);
  return courseList.find((course) => course.id === targetId)?.myRelation ?? null;
}
