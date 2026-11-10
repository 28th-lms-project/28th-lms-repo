import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { getOneHomeworks } from "../../../../api/admin/course/courseApi";

export default function HomeworkDetails() {
  const { id, homeworkid } = useParams();
  const dispatch = useDispatch();
  console.log(id);
  console.log(homeworkid);
  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    dispatch(courseActions.startLoading());

    (async () => {
      try {
        const [homeworks] = await Promise.all([getOneHomeworks(id, options)]);

        dispatch(courseActions.loadhomeworks(homeworks));
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
  }, []);

  return (
    <>
      <div>ttt</div>
    </>
  );
}
