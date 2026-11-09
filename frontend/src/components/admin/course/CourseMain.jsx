import { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { courseActions } from "../../../store/slices/courseSliceStore";
import { getCourses } from "../../../api/admin/course/courseApi";

import { IconButton } from "../../sample/input/IconButton";
import { icons } from "../../sample/input/icons";
import { useLocation, useNavigate } from "react-router-dom";

import PageContainer from "../../common/PageContainer";

export default function CourseMain() {
  const dispatch = useDispatch();
  const { courseList } = useSelector((store) => store.courses);
  const { pathname } = useLocation();
  const isAddActive = pathname === "/admin/course/add";

  const navigate = useNavigate();

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
    navigate(`/admin/course/list/${urlId}?tab=0`);
  };
  return (
    <>
      <PageContainer />
      <IconButton
        backgroundColor={isAddActive ? "#fff" : "buttonface"}
        icon={icons.add}
        onClick={onClickAddGroupButtonHandler}
        style={{ border: "1px 1px 1px 0px solid #000" }}
      />
      {courseList.map((course) => {
        return (
          <Fragment key={course.id}>
            <IconButton
              backgroundColor={
                pathname === `/admin/course/list/${course.id}`
                  ? "#fff"
                  : "buttonface"
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
