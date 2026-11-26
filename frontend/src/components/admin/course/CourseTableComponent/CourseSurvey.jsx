import { useEffect, useState } from "react";
import { icons } from "../../../common/input/icons";
import { useParams } from "react-router-dom";
import {
  deleteCourseSurvey,
  getCourseSurvey,
  getMySurveyAnswered,
} from "../../../../api/admin/system/survey/surveyApi";
import CourseSurveyForm from "./CourseSurveyForm";
import CourseSurveyAnsModal from "./CourseSurveyAnsModal";
import usePermission from "../../../../hooks/usePermission";
import useCourseRelation from "../../../../hooks/useCourseRelation";
import Badge from "../../../common/ui/Badge";
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
  // 응답 모달에 띄울 과정 설문 ID (null이면 닫힘)
  const [answeringId, setAnsweringId] = useState(null);
  const { can } = usePermission();
  // 버튼별 권한 (백엔드 SurveyController 의 @RequireAction). 권한이 없으면 버튼을 숨김 (가이드 8장)
  const canCreate = can("COURSE_SURVEY_CREATE");
  const canDelete = can("COURSE_SURVEY_DELETE");
  // 응답: 권한 코드 + 이 과정의 수강생. 아니면 설문 이름을 누를 수 없게 글자로만 보여 준다
  // (강사 역할에도 응답 권한이 있을 수 있어서, 가르치는 과정에서는 응답 창을 열지 않음)
  const relation = useCourseRelation(courseId);
  const canAnswer = can("COURSE_SURVEY_ANSWER") && relation === "STUDENT";
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

  // 설문 명 클릭: 참여 여부를 서버에 한 번 더 확인한 뒤 응답 모달을 연다
  // (수강생이 아니면 서버가 "수강중인 수강생이 아닙니다."를 돌려줌)
  const onClickName = async (survey) => {
    if (survey.answeredYn === "Y") {
      toast.error("이미 참여한 설문입니다.");
      return;
    }
    try {
      const answered = await getMySurveyAnswered(courseId, survey.id);
      if (answered) {
        toast.error("이미 참여한 설문입니다.");
        reloadSurveys();
        return;
      }
      setAnsweringId(survey.id);
    } catch (e) {
      toast.error(e.message);
    }
  };

  // 제출 성공: 모달 닫고 목록(참여 수 · 참여 완료) 다시 불러오기
  const onSubmittedAnswer = () => {
    setAnsweringId(null);
    reloadSurveys();
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
      render: (survey) => {
        // 응답할 수 없는 사람(강사 · 관리자 등)에게는 이름만 보여 준다
        if (!canAnswer) {
          return survey.title;
        }
        // 이미 참여한 설문은 다시 열 수 없음 (서버도 제출 때 중복을 막음)
        const answered = survey.answeredYn === "Y";
        let blockedReason;
        if (answered) {
          blockedReason = "이미 참여한 설문입니다.";
        }
        return (
          <div className="btn-group">
            {/* 비활성 버튼은 마우스 이벤트가 없어 title 을 감싸는 span 에 둔다 */}
            <span title={blockedReason}>
              <Button
                variant="text"
                disabled={answered}
                onClick={() => onClickName(survey)}
              >
                {survey.title}
              </Button>
            </span>
            {answered && <Badge tone="success">참여 완료</Badge>}
          </div>
        );
      },
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

  // 삭제 권한이 있는 사람에게만 삭제 칸을 보여준다
  if (canDelete) {
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
  }

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
        {canCreate && !isAdding && (
          <Button
            variant="primary"
            icon={icons.add}
            onClick={() => setIsAdding(true)}
          >
            설문 추가
          </Button>
        )}
      </div>
      {canCreate && isAdding && (
        <CourseSurveyForm
          onSuccess={onSuccessAdd}
          onCancel={() => setIsAdding(false)}
        />
      )}
      {list}
      {answeringId && (
        <CourseSurveyAnsModal
          courseId={courseId}
          courseSurveyId={answeringId}
          onClose={() => setAnsweringId(null)}
          onSubmitted={onSubmittedAnswer}
        />
      )}
    </div>
  );
}
