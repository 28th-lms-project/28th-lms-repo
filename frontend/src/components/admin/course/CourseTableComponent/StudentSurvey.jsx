import { useState } from "react";
import { Grid } from "../../../common/Grid";
import { IconButton } from "../../../sample/input/IconButton";
import { icons } from "../../../common/input/icons";

const CODE_HEADER = [
  { id: "id", title: "ID" },
  { id: "name", title: "이름" },
  { id: "order", title: "정렬" },
];

const GRID_COLUMN_STYLE = "minmax(0, 1fr) minmax(0, 2fr) 60px";

export default function StudentSurvey() {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <>
      {!isAdding && (
        <IconButton onClick={() => setIsAdding(!isAdding)}> 추가 </IconButton>
      )}
      {isAdding && (
        <IconButton icon={icons.close} onClick={() => setIsAdding(!isAdding)}>
          {" "}
          취소
        </IconButton>
      )}
    </>
  );
}
