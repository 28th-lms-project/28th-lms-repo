import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { getOneHomeworks } from "../../../../api/admin/course/courseApi";
import HomeworkItem from "./HomeworkItem";

export default function HomeworkDetails() {
  const { courseId, homeworkId } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    dispatch(courseActions.startLoading());

    (async () => {
      try {
        const [homeworks] = await Promise.all([
          getOneHomeworks(courseId, homeworkId, options),
        ]);
        console.log(homeworks);
        dispatch(courseActions.showHomework(homeworks));
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
  }, [dispatch, homeworkId, courseId]);

  return (
    <>
      <HomeworkItem />
    </>
  );
}
