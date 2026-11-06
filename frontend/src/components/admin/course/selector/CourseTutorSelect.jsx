import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { courseActions } from "../../../../store/slices/courseSliceStore";

export default function CourseTutorSelect() {
  const [options, setOptions] = useState([]);

  const dispatch = useDispatch();
  useEffect(() => {
    const getCourseList = async () => {
      const response = await fetch("http://localhost:8080/tutor/list");

      const result = await response.json();

      const mappedOptions = result.map((course) => ({
        value: course.id,
        label: course.name,
      }));

      setOptions(mappedOptions);
    };

    getCourseList();
  }, []);

  const handleChange = (selectedOption) => {
    dispatch(courseActions.addSelectTutor(selectedOption));
  };

  return (
    <div
      style={{
        display: "inline-block",
        width: " 300px",
        verticalAlign: "middle",
      }}
    >
      <Select
        options={options}
        onChange={handleChange}
        placeholder="강사 선택를 선택하세요"
        isSearchable
      />
    </div>
  );
}
