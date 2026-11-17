import { useDispatch } from "react-redux";
import { SUBJECTS } from "../../test/test/subjects";
import { testActions } from "../../../../store/slices/testSliceStore";
import SelectBox from "../../../common/ui/SelectBox";

/**
 * 시험 과목 선택. 선택값은 testSlice.selectSubjectId 에 저장된다.
 * Field 안에서 쓸 때는 inputId 를 Field htmlFor 와 맞춘다. 나머지 props(aria-invalid 등)는 SelectBox 로 전달
 */
export default function TestSubjectSelect({ inputId, ...rest }) {
  const dispatch = useDispatch();
  const handleChange = (selectedOption) => {
    dispatch(testActions.selectSubjectId(selectedOption));
  };
  return (
    <SelectBox
      {...rest}
      inputId={inputId}
      options={SUBJECTS}
      onChange={handleChange}
      placeholder="과목 선택"
      isSearchable
    />
  );
}
