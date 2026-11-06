import { useEffect, useState } from "react";
import Select from "react-select";

export default function CourseStudentSelect() {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const getCourseList = async () => {
      const response = await fetch("http://localhost:8080/student/list");

      const result = await response.json();
      console.log(result);
      const mappedOptions = result.map((student) => ({
        value: student.name,
        label: student.name,
      }));

      setOptions(mappedOptions);
    };

    getCourseList();
  }, []);

  const handleChange = (selectedOption) => {
    console.log("선택한 과정 ID:", selectedOption.value);
  };

  return (
    <div
      style={{
        display: "inline-block",
        width: " 150px",
        verticalAlign: "middle",
      }}
    >
      <Select
        options={options}
        onChange={handleChange}
        placeholder="과정 선택"
        isSearchable
      />
    </div>
  );
}
