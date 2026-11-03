import { Link } from "react-router-dom";

export default function MyCourseList() {
  // TODO: course/add 에서 등록된 과정(기수) 목록을 API로 조회
  const courses = [];

  return (
    <div>
      <h3>수강 과정</h3>
      <ul>
        {courses.map((course) => (
          <li key={course.id}>
            <Link to={`/my/course/list/${course.id}?tab=0`}>{course.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
