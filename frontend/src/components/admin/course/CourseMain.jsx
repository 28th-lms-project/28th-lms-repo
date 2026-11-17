import { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { courseActions } from "../../../store/slices/courseSliceStore";
import { getCourses } from "../../../api/admin/course/courseApi";

import { IconButton } from "../../sample/input/IconButton";
import { icons } from "../../sample/input/icons";
import { useLocation, useNavigate } from "react-router-dom";

import PageContainer from "../../common/PageContainer";
import usePermission from "../../../hooks/usePermission";

export default function CourseMain() {
  const dispatch = useDispatch();
  const { courseList } = useSelector((store) => store.courses);
  const { pathname } = useLocation();
  const isAddActive = pathname === "/admin/course/add";
  // 같은 컴포넌트를 과정 관리(/admin/course/...)와 수강 과정(/my/course/...)에서 같이 쓰므로
  // 지금 있는 화면 기준으로 이동 · 선택 강조 주소를 정한다
  const basePath = pathname.startsWith("/my/")
    ? "/my/course/list"
    : "/admin/course/list";

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
      } catch (error) {
        if (error.name !== "AbortError") {
          alert(error.message);
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
  return (
    <>
      <PageContainer />
      {/* 과정 등록: 등록 API(COURSE_CREATE) + 강사 · 학생 선택 목록 API(COURSE_MEMBER_READ) */}
      {canAddCourse && (
        <IconButton
          backgroundColor={isAddActive ? "#fff" : "buttonface"}
          icon={icons.add}
          onClick={onClickAddGroupButtonHandler}
          style={{ border: "1px 1px 1px 0px solid #000" }}
        />
      )}
      {courseList.map((course) => {
        return (
          <Fragment key={course.id}>
            <IconButton
              backgroundColor={
                pathname === `${basePath}/${course.id}` ? "#fff" : "buttonface"
              }
              style={{
                borderTop: "1px  solid #000",
                borederBotton: "0px",
                borderTopLeftRadius: "0px",
                borderTopRightRadius: "0px",
                borderBottomLeftRadius: "0px",
                borderBottomRightRadius: "0px",
              }}
              onClick={clickCourseIdButtonHandler.bind(this, course.id)}
            >
              {course.courseName}
            </IconButton>
          </Fragment>
        );
      })}
    </>
  );
}
