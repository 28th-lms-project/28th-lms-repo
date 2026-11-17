import SelectBox from "../../../common/ui/SelectBox";

const EXAM_TYPES = [
  { value: "역량평가", label: "역량평가" },
  { value: "정규시험", label: "정규시험" },
  { value: "종합시험", label: "종합시험" },
  { value: "비정규시험", label: "비정규시험" },
];

/**
 * 시험 종류 선택.
 * TODO 고른 값은 아직 어디에도 저장 · 전송하지 않음 (담당자 확인 필요)
 * Field 안에서 쓸 때는 inputId 를 Field htmlFor 와 맞춘다.
 */
export default function ExamSubjectSelect({ inputId, ...rest }) {
  return (
    <SelectBox
      {...rest}
      inputId={inputId}
      options={EXAM_TYPES}
      placeholder="종류 선택"
      isSearchable
    />
  );
}
