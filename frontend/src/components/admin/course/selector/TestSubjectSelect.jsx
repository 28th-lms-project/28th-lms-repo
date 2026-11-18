import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { testActions } from "../../../../store/slices/testSliceStore";
import { getCodeOptionList } from "../../../../api/admin/system/code/codeApi";
import SelectBox from "../../../common/ui/SelectBox";
import { useToast } from "../../../common/ui/feedbackContext";

/**
 * 시험 과목 선택. 과목 목록은 공통 코드(TEST_SUBJECT)에서 불러오고,
 * 선택값은 testSlice.selectSubjectId 에 저장된다.
 * Field 안에서 쓸 때는 inputId 를 Field htmlFor 와 맞춘다. 나머지 props(aria-invalid 등)는 SelectBox 로 전달
 */
export default function TestSubjectSelect({ inputId, ...rest }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const [subjectOptions, setSubjectOptions] = useState([]);

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
        if (!ignore) {
          toast.error(`시험 과목을 불러오지 못했습니다. ${e.message ?? ""}`.trim());
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [toast]);

  const handleChange = (selectedOption) => {
    dispatch(testActions.selectSubjectId(selectedOption));
  };
  return (
    <SelectBox
      {...rest}
      inputId={inputId}
      options={subjectOptions}
      onChange={handleChange}
      placeholder="과목 선택"
      isSearchable
    />
  );
}
