import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { getOneHomeworks } from "../../../../api/admin/course/courseApi";
import HomeworkItem from "./HomeworkItem";

import StatusBox from "../../../common/ui/StatusBox";

export default function HomeworkDetails() {
  const { courseId, homeworkId } = useParams();
  const dispatch = useDispatch();
  const { showHomework } = useSelector((store) => store.courses);
  // 과제를 불러오지 못했을 때의 오류 (StatusBox로 보여 줌)
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    dispatch(courseActions.startLoading());

    (async () => {
      try {
        const [homeworks] = await Promise.all([
          getOneHomeworks(courseId, homeworkId, options),
        ]);
        dispatch(courseActions.showHomework(homeworks));
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
  }, [dispatch, homeworkId, courseId]);

  if (loadError) {
    return (
      <div className="popup-page">
        <main className="popup-body">
          <StatusBox
            type="error"
            title="과제를 불러오지 못했습니다."
            detail={loadError.message}
          />
        </main>
      </div>
    );
  }
  if (!showHomework) {
    return (
      <div className="popup-page">
        <main className="popup-body">
          <StatusBox type="loading" />
        </main>
      </div>
    );
  }

  return <HomeworkItem />;
}
