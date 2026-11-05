import { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { courseActions } from "./store/slice/courseSliceStore";
import CourseList from "./list/CourseList";
import CourseAdd from "./add/CourseAdd";
import { IconButton } from "../../sample/input/IconButton";
import { icons } from "../../sample/input/icons";
import { useNavigate, useParams } from "react-router-dom";
import CourseItem from "./list/CourseItem";

export default function CourseMain() {
  const dispatch = useDispatch();
  const { courseList } = useSelector((store) => store.courses);

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

  const click = (urlId) => {
    console.log(urlId);
    navigate(`/admin/course/list/${urlId}`);
  };
  return (
    <>
      <IconButton
        color="#666"
        icon={icons.add}
        // onClick={onClickAddGroupButtonHandler}
      />
      {courseList.map((course) => {
        return (
          <Fragment key={course.id}>
            <IconButton color="#666" onClick={click.bind(this, course.id)}>
              {course.id}
            </IconButton>
          </Fragment>
        );
      })}
    </>
  );
}
