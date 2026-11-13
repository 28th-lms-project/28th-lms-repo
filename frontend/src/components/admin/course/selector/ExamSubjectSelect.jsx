import Select from "react-select";

export default function ExamSubjectSelect() {
  const ExamSubject = [
    { value: "역량평가", label: "역량평가" },
    { value: "정규시험", label: "정규시험" },
    { value: "종합시험", label: "종합시험" },
    { value: "비정규시험", label: "비정규시험" },
  ];

  const handleChange = (selectedOption) => {
    console.log(selectedOption);
  };
  return (
    <Select
      options={ExamSubject}
      onChange={handleChange}
      placeholder="시험과목을 선택하세요"
      isSearchable
    />
  );
}
