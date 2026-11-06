import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { courseActions } from "../../../../store/slices/courseSliceStore";

export default function CourseStudentSelect() {
  const [options, setOptions] = useState([]);
  const dispatch = useDispatch();
  useEffect(() => {
    const getCourseList = async () => {
      const response = await fetch("http://localhost:8080/student/list");

      const result = await response.json();

      const mappedOptions = result.map((student) => ({
        value: student.id,
        label: student.name,
      }));

      setOptions(mappedOptions);
    };

    getCourseList();
  }, []);

  const handleChange = (selectedOption) => {
    dispatch(courseActions.selectStudents(selectedOption));
  };

  return (
    <div
      style={{
        display: "inline-block",
        width: " 400px",
        verticalAlign: "middle",
      }}
    >
      <Select
        options={options}
        onChange={handleChange}
        placeholder="수강생 선택"
        isMulti
      />
    </div>
  );
}
