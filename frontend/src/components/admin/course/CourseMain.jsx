import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { courseActions } from "../../../store/slices/courseSliceStore";
import { getCourses } from "../../../api/admin/course/courseApi";

import { useLocation, useNavigate } from "react-router-dom";

import Button from "../../common/ui/Button";
import PageHeader from "../../common/ui/PageHeader";
import Panel from "../../common/ui/Panel";
import StatusBox from "../../common/ui/StatusBox";
import { icons } from "../../common/input/icons";
import useBreadcrumbs from "../../../hooks/useBreadcrumbs";
import usePermission from "../../../hooks/usePermission";

export default function CourseMain() {
  const dispatch = useDispatch();
  const { courseList, isLoading } = useSelector((store) => store.courses);
  // 과정 목록을 불러오지 못했을 때의 오류 (목록 자리에 StatusBox로 보여 줌)
  const [loadError, setLoadError] = useState(null);
  const { pathname } = useLocation();
  // 같은 컴포넌트를 과정 관리(/admin/course/...)와 수강 과정(/my/course/...)에서 같이 쓰므로
  // 지금 있는 화면 기준으로 이동 · 선택 강조 주소를 정한다
  const basePath = pathname.startsWith("/my/")
    ? "/my/course/list"
    : "/admin/course/list";

  const crumbs = useBreadcrumbs();
  const navigate = useNavigate();
  const { can } = usePermission();
  const canAddCourse = can("COURSE_CREATE") && can("COURSE_MEMBER_READ");

  useEffect(() => {
    const controller = new AbortController();
    dispatch(courseActions.startLoading());
    (async () => {
      try {
        const courses = await getCourses({ signal: controller.signal });
        dispatch(courseActions.load(courses));
        dispatch(courseActions.finishLoading());
        setLoadError(null);
      } catch (error) {
        if (error.name !== "AbortError") {
          setLoadError(error);
        }
      }
    })();
    return () => {
      controller.abort();
    };
  }, [dispatch, pathname]);

  const onClickAddGroupButtonHandler = () => {
    navigate("/admin/course/add");
  };
  const clickCourseIdButtonHandler = (urlId) => {
    navigate(`${basePath}/${urlId}?tab=0`);
  };

  let body;
  if (loadError) {
    body = (
      <StatusBox
        type="error"
        size="sm"
        title="과정 목록을 불러오지 못했습니다."
        detail={loadError.message}
      />
    );
  } else if (isLoading) {
    body = <StatusBox type="loading" size="sm" />;
  } else if (courseList.length === 0) {
    body = <StatusBox type="empty" size="sm" title="과정이 없습니다." />;
  } else {
    body = (
      <ul className="list-group">
        {courseList.map((course) => (
          <li key={course.id}>
            <button
              type="button"
              className="list-item"
              aria-current={
                pathname === `${basePath}/${course.id}` || undefined
              }
              onClick={() => clickCourseIdButtonHandler(course.id)}
            >
              {course.courseName}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <PageHeader crumbs={crumbs} title={crumbs.at(-1)?.title} />
      <Panel
        title="과정"
        flush
        actions={
          // 과정 등록: 등록 API(COURSE_CREATE) + 강사 · 학생 선택 목록 API(COURSE_MEMBER_READ)
          canAddCourse && (
            <Button
              size="sm"
              icon={icons.add}
              onClick={onClickAddGroupButtonHandler}
            >
              추가
            </Button>
          )
        }
      >
        {body}
      </Panel>
    </>
  );
}
