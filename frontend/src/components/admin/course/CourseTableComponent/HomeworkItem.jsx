import { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import HomeworkReply from "./HomeworkReply.jsx/HomeworkReply";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { getHomeworkReplies } from "../../../../api/admin/course/courseApi";
import { useParams } from "react-router-dom";

export default function HomeworkItem() {
  const { showHomework } = useSelector((store) => store.courses);
  const { courseId, homeworkId } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const controller = new AbortController();

    const options = { signal: controller.signal };
    dispatch(courseActions.startLoading());
    (async () => {
      try {
        const [replyList] = await Promise.all([
          getHomeworkReplies(courseId, homeworkId, options),
        ]);

        dispatch(courseActions.loadHomeworkReplies(replyList.homeworkReplies));
        dispatch(courseActions.finishLoading());
        console.log(replyList.homeworkReplies);
      } catch (error) {
        if (error.name !== "AbortError") {
          alert(error.message);
        }
      }
    })();
  }, []);

  return (
    <Fragment key={showHomework?.Id}>
      <h3 style={{ marginLeft: "10px" }}>
        {showHomework?.subject} - ({showHomework?.endDate} 제출마감)
      </h3>
      <div
        className="section"
        style={{
          flexDirection: "row",
          border: "0.3px solid #000",
          margin: "10px",
          padding: "10px",
        }}
      >
        <div
          style={{
            width: "72%",
            minWidth: "500px",
            minHeight: "300px",
            borderRight: "0.3px solid #000f",
          }}
        >
          {showHomework?.content}
        </div>
        <div
          style={{
            display: "flex",
            width: "28%",
            minWidth: "200px",
            minHeight: "300px",
            marginRight: "10px",
            padding: "3px",
            flexDirection: "column",
          }}
        >
          <HomeworkReply />
        </div>
      </div>
    </Fragment>
  );
}
