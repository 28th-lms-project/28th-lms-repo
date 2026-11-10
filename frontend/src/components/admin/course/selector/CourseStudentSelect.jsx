import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { getStudents } from "../../../../api/admin/course/courseApi";

export default function CourseStudentSelect() {
  const [options, setOptions] = useState([]);
  const dispatch = useDispatch();
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const students = await getStudents({ signal: controller.signal });
        const mappedOptions = (students ?? []).map((student) => ({
          value: student.id,
          label: student.name,
        }));
        setOptions(mappedOptions);
      } catch (error) {
        if (error.name !== "AbortError") {
          alert(error.message);
        }
      }
    })();
    return () => {
      controller.abort();
    };
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
