import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { IconButton } from "../../../common/input/IconButton";
import Select from "react-select";
import style from "./CourseSurveyForm.module.css";
import { createNewCourseSurvey } from "../../../../api/admin/system/survey/surveyApi";
import { getCodeOptionList } from "../../../../api/admin/system/code/codeApi";

const GROUP_TYPES = [
  { value: "pre", label: "사전 설문" },
  { value: "post", label: "사후 설문" },
];

const toGroupOptions = (subjects) => {
  const options = [];
  subjects.forEach((subject) => {
    GROUP_TYPES.forEach((groupType) => {
      options.push({
        value: `${subject.id}_${groupType.value}`,
        label: `${subject.name} ${groupType.label}`,
        subjectName: subject.name,
        typeLabel: groupType.label,
      });
    });
  });
  return options;
};

export default function CourseSurveyForm({ onSuccess }) {
  const { id: courseId } = useParams();
  const [groupOptions, setGroupOptions] = useState([]);
  const [title, setTitle] = useState("");
  const [surveyGroup, setSurveyGroup] = useState(null);
  const [surveySubject, setSurveySubject] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignoreUpdateState = false;
    (async () => {
      try {
        const subjects = await getCodeOptionList("TEST_SUBJECT");
        if (!ignoreUpdateState) {
          setGroupOptions(toGroupOptions(subjects));
        }
      } catch (e) {
        alert(e.message);
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, []);

  const onChangeGroup = (option) => {
    setSurveyGroup(option);
    setSurveySubject(option.subjectName);
  };

  const onClickSubmitButton = async () => {
    if (submitting) {
      return;
    }

    if (!title.trim()) {
      alert("설문 제목을 입력해주세요");
      return;
    }
    if (!surveyGroup) {
      alert("설문 항목을 선택해주세요");
      return;
    }
    setSubmitting(true);
    try {
      await createNewCourseSurvey(courseId, {
        title,
        surveyGroup: surveyGroup.value,
        surveySubject,
        surveyType: surveyGroup.typeLabel,
      });
      onSuccess();
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  let submitText = "등록";
  if (submitting) {
    submitText = "등록 중...";
  }

  let surveyTypeText = "";
  if (surveyGroup) {
    surveyTypeText = surveyGroup.typeLabel;
  }

  return (
    <div className={style.form}>
      <input
        type="text"
        className={style.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="설문 제목"
      />
      <Select
        options={groupOptions}
        value={surveyGroup}
        onChange={onChangeGroup}
        placeholder="설문 항목을 선택하세요."
        isSearchable
      />
      <input
        type="text"
        className={style.input}
        value={surveySubject}
        onChange={(e) => setSurveySubject(e.target.value)}
        placeholder="과목 명"
      />
      <input
        type="text"
        className={`${style.input} ${style.readOnly}`}
        value={surveyTypeText}
        placeholder="설문 유형"
        readOnly
      />
      <div className={style.buttons}>
        <IconButton onClick={onClickSubmitButton} disabled={submitting}>
          {submitText}
        </IconButton>
      </div>
    </div>
  );
}
