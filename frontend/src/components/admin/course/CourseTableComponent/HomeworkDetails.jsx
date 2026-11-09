import { useEffect } from "react";
import { useParams } from "react-router-dom";

export default function HomeworkDetails() {
  const { id, homeworkid } = useParams();
  console.log(id);
  console.log(homeworkid);
  useEffect(() => {}, []);

  return (
    <>
      <div>ttt</div>
    </>
  );
}
