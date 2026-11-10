import { Fragment } from "react";
import { useSelector } from "react-redux";

export default function HomeworkItem() {
  const { showHomework } = useSelector((store) => store.courses);
  console.log(showHomework);

  return (
    <Fragment key={showHomework?.Id}>
      <h3>
        {showHomework?.subject} - ({showHomework?.endDate} 제출마감)
      </h3>
      <div
        className="section"
        style={{ flexDirection: "row", border: "1px solid #000" }}
      >
        <div
          style={{
            width: "75%",
            minWidth: "500px",
            minHeight: "300px",
            border: "1px solid #000",
          }}
        >
          111
        </div>
        <div
          style={{
            display: "flex",
            width: "25%",
            minWidth: "200px",
            minHeight: "300px",
            border: "1px solid #000",
          }}
        >
          asdfaaaaaaaaaaaaaaaaaaaaaaaaaa
        </div>
      </div>
    </Fragment>
  );
}
