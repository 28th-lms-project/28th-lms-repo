// import { useState } from "react";
import { useDispatch } from "react-redux";
import { SUBJECTS } from "../../test/test/subjects";
import Select from "react-select";
import { testActions } from "../../../../store/slices/testSliceStore";
export default function TestSubjectSelect() {
  const dispatch = useDispatch();
  //   const [JAVA, TEST, CSS, FRONTEND, DATABASE] = SUBJECTS;
  //   const [subject, setSubject] = useState("JAVA");
  //   ()();
  const handleChange = (selectedOption) => {
    // setSubject(selectedOption);
    dispatch(testActions.selectSubjectId(selectedOption));
    console.log(selectedOption);
  };
  return (
    <>
      <Select
        options={SUBJECTS}
        onChange={handleChange}
        placeholder="시험과목을 선택하세요"
        isSearchable
      />
      {/* <div key={SUBJECTS.keys}>{subject}</div> */}
    </>
  );
}
