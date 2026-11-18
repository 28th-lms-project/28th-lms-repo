import { useEffect, useState } from "react";
import { Grid } from "../../../common/Grid";
import { IconButton } from "../../../common/input/IconButton";
import { icons } from "../../../common/input/icons";
import { useParams } from "react-router-dom";
import {
  deleteCourseSurvey,
  getCourseSurvey,
} from "../../../../api/admin/system/survey/surveyApi";
import CourseSurveyForm from "./CourseSurveyForm";

const SURVEY_HEADER = [
  { id: "no", title: "번호" },
  { id: "title", title: "설문 명" },
  { id: "surveySubject", title: "과목 명" },
  { id: "surveyType", title: "설문 유형" },
  { id: "count", title: "항목 수" },
  { id: "participation", title: "참여 수" },
  { id: "result", title: "결과" },
  { id: "delete", title: "삭제" },
];

const GRID_COLUMN_STYLE = "80px 5fr 120px 120px 80px 100px 90px 70px";

export default function StudentSurvey() {
  const { id: courseId } = useParams();
  const [surveys, setSurveys] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignoreUpdateState = false;
    (async () => {
      try {
        const result = await getCourseSurvey(courseId);
        if (!ignoreUpdateState) {
          if (result) {
            setSurveys(result);
          } else {
            setSurveys([]);
          }
        }
      } catch (e) {
        if (!ignoreUpdateState) {
          alert(e.message);
        }
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [courseId, reloadKey]);

  // 목록 다시 불러오기
  const reloadSurveys = () => {
    setReloadKey((prev) => prev + 1);
  };

  const onSuccessAdd = () => {
    setIsAdding(false);
    reloadSurveys();
  };

  const content = surveys.map((survey, index) => {
    const values = {
      no: index + 1,
      title: (
        <div onClick={() => onClickName(survey.id, survey.courseId)}>
          {survey.title}
        </div>
      ),
      surveySubject: survey.surveySubject,
      surveyType: survey.surveyType,
      count: survey.count,
      participation: `${survey.answerCount} / ${survey.studentCount}`,
      result: <div onClick={() => onClickResult(survey.id)}>결과보기</div>,
      delete: <div onClick={() => onClickDelete(survey)}>삭제</div>,
    };
    return SURVEY_HEADER.map((col) => ({
      id: `${survey.id}-${col.id}`,
      value: values[col.id],
    }));
  });

  const onClickName = (courseSurveyId, courseId) => {
    window.open(
      `/survey/answer/${courseId}/${courseSurveyId}`,
      "courseSurvey",
      "width=1620,height=1080",
    );
  };

  const onClickResult = (courseSurveyId) => {
    window.open(
      `/survey/result/${courseId}/${courseSurveyId}`,
      "courseSurveyResult",
      "width=1620,height=1080",
    );
  };

  const onClickDelete = async (survey) => {
    if (!confirm(`'${survey.title}' 설문을 삭제할까요?`)) {
      return;
    }
    try {
      await deleteCourseSurvey(courseId, survey.id);
      reloadSurveys();
    } catch (e) {
      alert(e.message);
    }
  };

  let addIcon = icons.add;
  let addText = "설문 추가";
  if (isAdding) {
    addIcon = icons.close;
    addText = "취소";
  }

  return (
    <>
      <IconButton icon={addIcon} onClick={() => setIsAdding((prev) => !prev)}>
        {addText}
      </IconButton>
      {isAdding && <CourseSurveyForm onSuccess={onSuccessAdd} />}
      <Grid
        header={SURVEY_HEADER}
        content={content}
        columnStyle={GRID_COLUMN_STYLE}
      />
    </>
  );
}
