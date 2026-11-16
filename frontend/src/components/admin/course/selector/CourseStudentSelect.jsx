import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { getStudents } from "../../../../api/admin/course/courseApi";

/**
 * 수강생 선택 (여러 명). 선택값은 courseSlice.selectStudents 에 저장된다.
 * @param excludeIds 목록에서 뺄 학생 ID 배열 (예: 이미 수강 중인 학생). 안 넘기면 전체 표시
 */
export default function CourseStudentSelect({ excludeIds = [] }) {
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
        options={options.filter((option) => !excludeIds.includes(option.value))}
        onChange={handleChange}
        placeholder="수강생 선택"
        isMulti
      />
    </div>
  );
}
