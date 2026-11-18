// import { useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { testActions } from "../../../../store/slices/testSliceStore";
import { useEffect, useState } from "react";
import { getCodeOptionList } from "../../../../api/admin/system/code/codeApi";
export default function TestSubjectSelect() {
  const dispatch = useDispatch();
  const [subjectOptions, setSubjectOptions] = useState();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const codes = await getCodeOptionList("TEST_SUBJECT");
        if (!ignore) {
          setSubjectOptions(
            codes.map((code) => ({ value: code.id, label: code.name })),
          );
        }
      } catch (e) {
        alert(e.message);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  //   const [JAVA, TEST, CSS, FRONTEND, DATABASE] = SUBJECTS;
  //   const [subject, setSubject] = useState("JAVA");
  //   ()();
  const handleChange = (selectedOption) => {
    // setSubject(selectedOption);
    dispatch(testActions.selectSubjectId(selectedOption));
  };
  return (
    <>
      <Select
        options={subjectOptions}
        onChange={handleChange}
        placeholder="시험과목을 선택하세요"
        isSearchable
      />
      {/* <div key={SUBJECTS.keys}>{subject}</div> */}
    </>
  );
}
