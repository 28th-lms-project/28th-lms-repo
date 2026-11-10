import { Fragment, useState } from "react";
import { useSelector } from "react-redux";

export default function HomeworkReply() {
  const { homeworkReplies } = useSelector((store) => store.courses);
  const [view, setView] = useState(false);
  const onClickReply = () => {
    setView(!view);
  };
  console.log(homeworkReplies);
  return (
    <Fragment>
      <div>
        {homeworkReplies &&
          homeworkReplies.map((homework) => {
            return (
              <div
                key={homework.id}
                style={{ fontSize: "12px", width: "100%" }}
                onClick={onClickReply}
              >
                {homework.writer.name}
                <div
                  style={{
                    fontSize: "10px",
                    borderBottom: "0.1px solid #333 ",
                  }}
                >
                  <div>등록일 : {homework.crtDt}</div>
                  <div>수정일 : {homework.mdfyDt}</div>
                  {homework.content && view && <div>{homework.content}</div>}
                </div>
              </div>
            );
          })}
      </div>
    </Fragment>
  );
}
