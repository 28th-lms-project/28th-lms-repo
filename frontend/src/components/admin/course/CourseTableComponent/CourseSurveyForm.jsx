import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createNewCourseSurvey } from "../../../../api/admin/system/survey/surveyApi";
import { getCodeOptionList } from "../../../../api/admin/system/code/codeApi";
import Button from "../../../common/ui/Button";
import Field from "../../../common/ui/Field";
import Panel from "../../../common/ui/Panel";
import SelectBox from "../../../common/ui/SelectBox";
import { useToast } from "../../../common/ui/feedbackContext";

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

export default function CourseSurveyForm({ onSuccess, onCancel }) {
  const { id: courseId } = useParams();
  const toast = useToast();
  const [groupOptions, setGroupOptions] = useState([]);
  const [title, setTitle] = useState("");
  const [surveyGroup, setSurveyGroup] = useState(null);
  const [surveySubject, setSurveySubject] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let ignoreUpdateState = false;
    (async () => {
      try {
        const subjects = await getCodeOptionList("TEST_SUBJECT");
        if (!ignoreUpdateState) {
          setGroupOptions(toGroupOptions(subjects));
        }
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [toast]);

  const onChangeGroup = (option) => {
    setSurveyGroup(option);
    setSurveySubject(option.subjectName);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const nextErrors = {};
    if (!title.trim()) {
      nextErrors.title = "설문 제목을 입력해주세요.";
    }
    if (!surveyGroup) {
      nextErrors.surveyGroup = "설문 항목을 선택해주세요.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
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
      toast.error(error.message);
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
    <form onSubmit={onSubmit} noValidate>
      <Panel
        title="설문 등록"
        footer={
          <>
            <Button onClick={onCancel} disabled={submitting}>
              취소
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {submitText}
            </Button>
          </>
        }
      >
        <div className="form-row">
          <Field
            label="설문 제목"
            htmlFor="course-survey-title"
            required
            error={errors.title}
          >
            <input
              id="course-survey-title"
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
              aria-describedby="course-survey-title-msg"
            />
          </Field>
          <Field
            label="설문 항목"
            htmlFor="course-survey-group"
            required
            error={errors.surveyGroup}
          >
            <SelectBox
              inputId="course-survey-group"
              options={groupOptions}
              value={surveyGroup}
              onChange={onChangeGroup}
              placeholder="설문 항목을 선택하세요."
              isSearchable
              aria-invalid={!!errors.surveyGroup}
            />
          </Field>
          <Field label="과목 명" htmlFor="course-survey-subject">
            <input
              id="course-survey-subject"
              type="text"
              className="form-control"
              value={surveySubject}
              onChange={(e) => setSurveySubject(e.target.value)}
            />
          </Field>
          <Field label="설문 유형" htmlFor="course-survey-type">
            <input
              id="course-survey-type"
              type="text"
              className="form-control"
              value={surveyTypeText}
              placeholder="설문 항목을 고르면 정해집니다."
              readOnly
            />
          </Field>
        </div>
      </Panel>
    </form>
  );
}
