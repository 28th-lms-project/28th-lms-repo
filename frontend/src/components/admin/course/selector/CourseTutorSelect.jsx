import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Select from "react-select";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { getTutors } from "../../../../api/admin/course/courseApi";

export default function CourseTutorSelect() {
  const [options, setOptions] = useState([]);

  const dispatch = useDispatch();
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const tutors = await getTutors({ signal: controller.signal });
        const mappedOptions = (tutors ?? []).map((tutor) => ({
          value: tutor.id,
          label: tutor.name,
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
