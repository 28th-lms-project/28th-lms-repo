import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { getStudents } from "../../../../api/admin/course/courseApi";
import SelectBox from "../../../common/ui/SelectBox";
import { useToast } from "../../../common/ui/feedbackContext";

/**
 * 수강생 선택 (여러 명). 선택값은 courseSlice.selectStudents 에 저장된다.
 * @param excludeIds 목록에서 뺄 학생 ID 배열 (예: 이미 수강 중인 학생). 안 넘기면 전체 표시
 * @param inputId Field 안에서 쓸 때 Field htmlFor 와 맞춘다. 나머지 props 는 SelectBox 로 전달
 */
export default function CourseStudentSelect({
  excludeIds = [],
  inputId,
  ...rest
}) {
  const [options, setOptions] = useState([]);
  const toast = useToast();
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
          toast.error(
            `수강생 목록을 불러오지 못했습니다. ${error.message ?? ""}`.trim(),
          );
        }
      }
    })();
    return () => {
      controller.abort();
    };
  }, [toast]);

  const handleChange = (selectedOption) => {
    dispatch(courseActions.selectStudents(selectedOption));
  };

  return (
    <SelectBox
      {...rest}
      inputId={inputId}
      options={options.filter((option) => !excludeIds.includes(option.value))}
      onChange={handleChange}
      placeholder="수강생 선택"
      isMulti
    />
  );
}
