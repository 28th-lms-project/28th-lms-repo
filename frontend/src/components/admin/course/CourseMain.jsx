import { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { courseActions } from "./store/slice/courseSliceStore";

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
    let ignore = false;
    dispatch(courseActions.startLoading());
    (async () => {
      const fetchResult = await fetch("http://localhost:8080/course/view");
      const result = await fetchResult.json();
      if (!ignore) {
        dispatch(courseActions.load(result));

        dispatch(courseActions.finishLoading());
      }
    })();
    return () => {
      // showArticle 제거.
      ignore = true;
    };
  }, [dispatch]);

  const onClickAddGroupButtonHandler = () => {
    navigate("/admin/course/add");
  };
  const clickCourseIdButtonHandler = (urlId) => {
    navigate(`/admin/course/list/${urlId}`);
  };
  return (
    <>
      <PageContainer />
      <IconButton
        backgroundColor={isAddActive ? "#fff" : "buttonface"}
        icon={icons.add}
        onClick={onClickAddGroupButtonHandler}
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
              onClick={clickCourseIdButtonHandler.bind(this, course.id)}
            >
              {course.id}
            </IconButton>
          </Fragment>
        );
      })}
    </>
  );
}
