import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { getTutors } from "../../../../api/admin/course/courseApi";
import SelectBox from "../../../common/ui/SelectBox";
import { useToast } from "../../../common/ui/feedbackContext";

/**
 * 담당 강사 선택 (한 명). 선택값은 courseSlice.addSelectTutor 에 저장된다.
 * Field 안에서 쓸 때는 inputId 를 Field htmlFor 와 맞춘다. 나머지 props(aria-invalid 등)는 SelectBox 로 전달
 */
export default function CourseTutorSelect({ inputId, ...rest }) {
  const [options, setOptions] = useState([]);
  const toast = useToast();

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
          toast.error(
            `강사 목록을 불러오지 못했습니다. ${error.message ?? ""}`.trim(),
          );
        }
      }
    })();
    return () => {
      controller.abort();
    };
  }, [toast]);

  const handleChange = (selectedOption) => {
    dispatch(courseActions.addSelectTutor(selectedOption));
  };

  return (
    <SelectBox
      {...rest}
      inputId={inputId}
      options={options}
      onChange={handleChange}
      placeholder="강사 선택"
      isSearchable
    />
  );
}
