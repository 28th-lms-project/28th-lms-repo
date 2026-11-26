import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../../common/ui/PageHeader";
import useBreadcrumbs from "../../../../hooks/useBreadcrumbs";
import { useEffect, useId, useState } from "react";
import { getCourses } from "../../../../api/admin/course/courseApi";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import {
  createSurvey,
  createSurveyData,
  deletedSurveyData,
  deleteSurvey,
  getSurvey,
  updateSurvey,
  updateSurveyData,
} from "../../../../api/admin/system/survey/surveyApi";
import { surveyActions } from "../../../../store/slices/surveySliceStore";
import { getCodeOptionList } from "../../../../api/admin/system/code/codeApi";
import usePermission from "../../../../hooks/usePermission";
import Button from "../../../common/ui/Button";
import ChoiceGroup from "../../../common/ui/ChoiceGroup";
import Field from "../../../common/ui/Field";
import Panel from "../../../common/ui/Panel";
import StatusBox from "../../../common/ui/StatusBox";
import { Tabs, TabPanel } from "../../../common/ui/Tabs";
import { useConfirm, useToast } from "../../../common/ui/feedbackContext";
import { icons } from "../../../common/input/icons";

/** 설문 타입: 단일 · 다중 · 직접 입력 */
const SURVEY_TYPES = [
  { value: "radio", label: "단일 선택" },
  { value: "checkBox", label: "다중 선택" },
  { value: "text", label: "직접 입력" },
];

const GROUP_TABS = [
  { id: "pre", label: "사전 설문" },
  { id: "post", label: "사후 설문" },
];

export default function Survey() {
  const { can, status } = usePermission();
  const crumbs = useBreadcrumbs();

  if (status === "loaded" && can("SURVEY_READ")) return <SurveyManagement />;

  // idle: 비로그인(조회하지 않음) → 표시 없음
  let content = null;
  if (status === "loading") {
    content = <StatusBox type="loading" title="권한 확인 중..." />;
  } else if (status === "failed") {
    content = (
      <StatusBox
        type="error"
        title="권한 정보를 불러오지 못했습니다."
        detail="새로고침 후 다시 시도해주세요."
      />
    );
  } else if (status === "loaded") {
    content = <StatusBox type="denied" />;
  }
  return (
    <>
      <PageHeader crumbs={crumbs} title={crumbs.at(-1)?.title} />
      {content}
    </>
  );
}

function SurveyManagement() {
  const { courseList } = useSelector((state) => state.courses);
  const crumbs = useBreadcrumbs();
  const { surveyList } = useSelector((state) => state.survey);
  const dispatch = useDispatch();
  const toast = useToast();
  const confirm = useConfirm();
  const subjectTabId = useId();
  const groupTabId = useId();

  const [subjectList, setSubjectList] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectGroup, setSelectGroup] = useState("pre");

  let currGroup = null;
  if (selectedSubject) {
    currGroup = `${selectedSubject}_${selectGroup}`;
  }

  // 환경 변수(TEST_SUBJECT)에서 과목 목록 조회
  useEffect(() => {
    let ignoreUpdateState = false;
    (async () => {
      try {
        const codes = await getCodeOptionList("TEST_SUBJECT");
        if (!ignoreUpdateState) {
          setSubjectList(codes);
          if (codes.length > 0) {
            setSelectedSubject(codes[0].id);
          }
        }
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [toast]);

  useEffect(() => {
    if (courseList.length > 0) {
      return;
    }
    let ignoreUpdateState = false;
    (async () => {
      try {
        const result = await getCourses();
        if (!ignoreUpdateState) {
          dispatch(courseActions.load(result));
        }
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [dispatch, courseList.length, toast]);

  useEffect(() => {
    if (!currGroup) {
      // 과목 목록을 받기 전에는 조회하지 않음
      return;
    }
    let ignoreUpdateState = false;
    (async () => {
      try {
        const result = await getSurvey(currGroup);

        if (!ignoreUpdateState) {
          dispatch(surveyActions.load(result));
        }
      } catch (e) {
        toast.error(e.message);
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [currGroup, dispatch, toast]);

  const onInputUpdateHandler = (surveyId, e) => {
    const subject = e.target.value;
    dispatch(surveyActions.updateSurvey({ id: surveyId, subject }));
    if (subject === "" || subject === null) {
      return;
    }
    const modifySurvey = { subject };
    (async () => {
      try {
        await updateSurvey(surveyId, modifySurvey);
      } catch (e) {
        toast.error(e.message);
      }
    })();
  };
  const onInputDataHandler = (surveyId, surveyDataId, e) => {
    const data = e.target.value;

    dispatch(
      surveyActions.updateSurveyData({ surveyId, dataId: surveyDataId, data }),
    );

    if (data === "" || data === null) {
      return;
    }
    const updateData = { data };
    (async () => {
      try {
        await updateSurveyData(surveyId, surveyDataId, updateData);
      } catch (e) {
        toast.error(e.message);
      }
    })();
  };

  const onTypeChangeHandler = (survey, type) => {
    const modifySurvey = { type };

    (async () => {
      try {
        await updateSurvey(survey.id, modifySurvey);

        dispatch(surveyActions.updateSurvey({ id: survey.id, type }));
      } catch (e) {
        toast.error(e.message);
      }
    })();
  };

  const deleteDataButtonHandler = (surveyId, dataId) => {
    (async () => {
      try {
        await deletedSurveyData(surveyId, dataId);
        dispatch(surveyActions.deleteSurveyData({ surveyId, dataId }));
      } catch (e) {
        toast.error(e.message);
      }
    })();
  };

  const deleteButtonHandler = async (surveyId, index) => {
    const ok = await confirm({
      title: "문항 삭제",
      message: `${index + 1}번 문항을 삭제할까요?`,
      confirmText: "삭제",
      danger: true,
    });
    if (!ok) {
      return;
    }
    try {
      await deleteSurvey(surveyId);
      dispatch(surveyActions.deleteSurvey({ surveyId }));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const onClickAddSurveyHandler = () => {
    const registSurvey = {
      subject: " ",
      group: currGroup,
      type: SURVEY_TYPES[0].value,
    };
    (async () => {
      try {
        const createResult = await createSurvey(registSurvey);
        dispatch(surveyActions.addSurvey(createResult));
      } catch (e) {
        toast.error(e.message);
      }
    })();
  };
  const onClickAddSurveyDataHandler = (surveyId) => {
    const surveyData = { data: " " };
    (async () => {
      try {
        const createResult = await createSurveyData(surveyId, surveyData);
        dispatch(surveyActions.addSurveyData(createResult));
      } catch (e) {
        toast.error(e.message);
      }
    })();
  };

  const subjectTabs = [{ id: "Course", label: "수강" }];
  subjectList.forEach((subject) => {
    subjectTabs.push({ id: subject.id, label: subject.name });
  });

  let questionList;
  if (surveyList.length === 0) {
    questionList = (
      <StatusBox type="empty" size="sm" title="등록된 문항이 없습니다." />
    );
  } else {
    questionList = surveyList.map((survey, index) => (
      <Panel
        key={survey.id}
        title={`문항 ${index + 1}`}
        actions={
          <Button
            size="sm"
            variant="danger"
            icon={icons.delete}
            onClick={() => deleteButtonHandler(survey.id, index)}
          >
            삭제
          </Button>
        }
      >
        <div className="form-stack">
          <Field label="질문" htmlFor={`${survey.id}-subject`}>
            <input
              id={`${survey.id}-subject`}
              type="text"
              className="form-control"
              placeholder="질문을 입력하세요."
              defaultValue={survey.subject}
              onChange={(e) => onInputUpdateHandler(survey.id, e)}
            />
          </Field>
          <div className="field">
            <span className="field-label">설문 종류</span>
            <ChoiceGroup
              variant="segmented"
              name={`${survey.id}-type`}
              legend={`문항 ${index + 1} 설문 종류`}
              options={SURVEY_TYPES}
              value={survey.type}
              onChange={(type) => onTypeChangeHandler(survey, type)}
            />
          </div>
          {survey.type !== "text" && (
            <div className="field">
              <span className="field-label">보기</span>
              {survey.surveyDataList.map((data, dataIndex) => (
                <div className="form-row" key={data.id}>
                  <div className="field">
                    <input
                      type="text"
                      className="form-control"
                      aria-label={`문항 ${index + 1} 보기 ${dataIndex + 1}`}
                      defaultValue={data.data}
                      onChange={(e) =>
                        onInputDataHandler(survey.id, data.id, e)
                      }
                    />
                  </div>
                  <Button
                    variant="danger"
                    icon={icons.delete}
                    onClick={() => deleteDataButtonHandler(survey.id, data.id)}
                  >
                    삭제
                  </Button>
                </div>
              ))}
              <div>
                <Button
                  size="sm"
                  icon={icons.add}
                  onClick={() => {
                    onClickAddSurveyDataHandler(survey.id);
                  }}
                >
                  보기 추가
                </Button>
              </div>
            </div>
          )}
        </div>
      </Panel>
    ));
  }

  return (
    <>
      <PageHeader crumbs={crumbs} title={crumbs.at(-1)?.title} />
      <Tabs
        idBase={subjectTabId}
        ariaLabel="과목"
        items={subjectTabs}
        value={selectedSubject}
        onChange={setSelectedSubject}
      />
      <TabPanel idBase={subjectTabId} tabId={selectedSubject}>
        <div className="form-stack">
          <div className="toolbar">
            <Tabs
              idBase={groupTabId}
              ariaLabel="설문 종류"
              variant="pills"
              items={GROUP_TABS}
              value={selectGroup}
              onChange={setSelectGroup}
            />
            <Button
              variant="primary"
              icon={icons.add}
              onClick={() => onClickAddSurveyHandler()}
            >
              문항 추가
            </Button>
          </div>
          <TabPanel idBase={groupTabId} tabId={selectGroup}>
            <div className="layout-split">
              <div className="form-stack">{questionList}</div>
              <Panel title="미리 보기" subtitle="수강생 화면">
                <SurveyPreview surveyList={surveyList} />
              </Panel>
            </div>
          </TabPanel>
        </div>
      </TabPanel>
    </>
  );
}

// 수강생에게 보이는 모양 (입력은 저장되지 않음)
const SurveyPreview = ({ surveyList }) => {
  if (surveyList.length === 0) {
    return (
      <StatusBox type="empty" size="sm" title="미리 볼 문항이 없습니다." />
    );
  }
  return (
    <div className="form-stack">
      {surveyList.map((survey, index) => (
        <PreviewQuestion key={survey.id} survey={survey} index={index} />
      ))}
    </div>
  );
};

const PreviewQuestion = ({ survey, index }) => {
  const labelId = `preview-${survey.id}-label`;

  let input;
  if (survey.type === "text") {
    input = <textarea className="form-control" aria-labelledby={labelId} />;
  } else {
    let inputType = "radio";
    if (survey.type === "checkBox") {
      inputType = "checkbox";
    }
    input = (
      <div className="form-check-group">
        {survey.surveyDataList.map((data) => (
          <label key={data.id} className="form-check">
            <input type={inputType} name={`preview-${survey.id}`} />
            {data.data}
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="field" role="group" aria-labelledby={labelId}>
      <span className="field-label" id={labelId}>
        {index + 1}. {survey.subject}
      </span>
      {input}
    </div>
  );
};
