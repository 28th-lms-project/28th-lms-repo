import { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { courseActions } from "../../../../store/slices/courseSliceStore";

export default function CourseItem() {
  const { showCourse } = useSelector((store) => store.courses);
  const { id } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    let ignore = false;
    dispatch(courseActions.startLoading());
    (async () => {
      const fetchResult = await fetch(
        `http://localhost:8080/course/list/${id}`,
      );
      const resultJson = await fetchResult.json();
      console.log(resultJson);
      if (!ignore) {
        dispatch(courseActions.loadShowCourse(resultJson));

        dispatch(courseActions.finishLoading());
      }
    })();
    return () => {
      // showArticle 제거.
      ignore = true;
    };
  }, [id]);

  const finishCourse = (courseStartDate, courseEndDated) => {
    const today = new Date();
    const startDate = new Date(courseStartDate);
    const endDate = new Date(courseEndDated);

    today.setHours(0, 0, 0, 0);

    const totalDay = endDate - startDate;
    const elapsedDays = today - startDate;

    const progress = Math.min(100, Math.max(0, (elapsedDays / totalDay) * 100));

    if (progress >= 100) {
      return "이미 완료된 과정입니다 ";
    } else {
      return `${Math.round(progress)}% 진행중 `;
    }
  };

  return (
    <>
      <div className="section">
        {!showCourse && <div>..로딩중입니다.</div>}
        {showCourse && (
          <>
            <h3>{showCourse.courseName}</h3>

            <span>
              {showCourse.startDate} ~ {showCourse.endDated}
            </span>

            <div>{finishCourse(showCourse.startDate, showCourse.endDated)}</div>
            <div>{showCourse.name}</div>
          </>
        )}
      </div>
    </>
  );
}
