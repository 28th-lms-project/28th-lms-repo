import { useEffect, useState } from "react";
import { icons } from "../../../common/input/icons";
import { useParams } from "react-router-dom";
import {
  deleteCourseSurvey,
  getCourseSurvey,
} from "../../../../api/admin/system/survey/surveyApi";
import CourseSurveyForm from "./CourseSurveyForm";
import usePermission from "../../../../hooks/usePermission";
import Button from "../../../common/ui/Button";
import StatusBox from "../../../common/ui/StatusBox";
import Table from "../../../common/ui/Table";
import { useConfirm, useToast } from "../../../common/ui/feedbackContext";

export default function StudentSurvey() {
  const { id: courseId } = useParams();
  const [surveys, setSurveys] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const { can } = usePermission();
  const toast = useToast();
  const confirm = useConfirm();

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
          setLoadError(null);
        }
      } catch (e) {
        if (!ignoreUpdateState) {
          setLoadError(e);
        }
      } finally {
        if (!ignoreUpdateState) {
          setLoading(false);
        }
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [courseId, reloadKey]);

  // 목록 다시 불러오기
  const reloadSurveys = () => {
    setLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  const onSuccessAdd = () => {
    setIsAdding(false);
    toast.success("설문을 등록했습니다.");
    reloadSurveys();
  };

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

  const onClickStatistics = (courseSurveyId) => {
    window.open(
      `/survey/statistics/${courseId}/${courseSurveyId}`,
      "courseSurveyStatistics",
      "width=1620,height=1080",
    );
  };

  const onClickDelete = async (survey) => {
    const ok = await confirm({
      title: "설문 삭제",
      message: `'${survey.title}' 설문을 삭제할까요?`,
      confirmText: "삭제",
      danger: true,
    });
    if (!ok) {
      return;
    }
    try {
      await deleteCourseSurvey(courseId, survey.id);
      toast.success("설문을 삭제했습니다.");
      reloadSurveys();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const columns = [
    { key: "no", title: "번호", width: 70, align: "center", render: (row, index) => index + 1 },
    {
      key: "title",
      title: "설문 명",
      render: (survey) => (
        <Button
          variant="text"
          onClick={() => onClickName(survey.id, survey.courseId)}
        >
          {survey.title}
        </Button>
      ),
    },
    { key: "surveySubject", title: "과목 명", width: 120 },
    { key: "surveyType", title: "설문 유형", width: 110 },
    { key: "count", title: "항목 수", width: 80, align: "num" },
    {
      key: "participation",
      title: "참여 수",
      width: 100,
      align: "num",
      render: (survey) => `${survey.answerCount} / ${survey.studentCount}`,
    },
    {
      key: "result",
      title: "결과",
      width: 100,
      align: "center",
      render: (survey) => (
        <Button size="sm" onClick={() => onClickResult(survey.id)}>
          결과보기
        </Button>
      ),
    },
  ];

  // 통계 권한이 있는 사람에게만 통계 칸을 보여준다
  if (can("COURSE_SURVEY_STAT_READ")) {
    columns.push({
      key: "statistics",
      title: "통계",
      width: 100,
      align: "center",
      render: (survey) => (
        <Button size="sm" onClick={() => onClickStatistics(survey.id)}>
          통계보기
        </Button>
      ),
    });
  }

  columns.push({
    key: "delete",
    title: "삭제",
    width: 90,
    align: "center",
    render: (survey) => (
      <Button
        size="sm"
        variant="danger"
        icon={icons.delete}
        onClick={() => onClickDelete(survey)}
      >
        삭제
      </Button>
    ),
  });

  let list;
  if (loadError) {
    list = (
      <StatusBox
        type="error"
        detail={loadError.message}
        onRetry={reloadSurveys}
      />
    );
  } else {
    list = (
      <Table
        ariaLabel="과정 설문 목록"
        columns={columns}
        rows={surveys}
        rowKey="id"
        loading={loading}
        emptyText="등록된 설문이 없습니다."
      />
    );
  }

  return (
    <div className="form-stack">
      <div className="toolbar">
        <span className="field-hint">설문 {surveys.length}건</span>
        {!isAdding && (
          <Button
            variant="primary"
            icon={icons.add}
            onClick={() => setIsAdding(true)}
          >
            설문 추가
          </Button>
        )}
      </div>
      {isAdding && (
        <CourseSurveyForm
          onSuccess={onSuccessAdd}
          onCancel={() => setIsAdding(false)}
        />
      )}
      {list}
    </div>
  );
}
