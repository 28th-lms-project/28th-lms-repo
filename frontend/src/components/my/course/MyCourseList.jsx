import { Link } from "react-router-dom";
import PageContainer from "../../common/PageContainer";

export default function MyCourseList() {
  // TODO: course/add 에서 등록된 과정(기수) 목록을 API로 조회
  const courses = [];

  return (
    <PageContainer>
      <div>
        <ul>
          {courses.map((course) => (
            <li key={course.id}>
              <Link to={`/my/course/list/${course.id}?tab=0`}>
                {course.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageContainer>
  );
}
