import { useDispatch, useSelector } from "react-redux";
import PageContainer from "../../../common/PageContainer";
import { Fragment, useEffect, useRef, useState } from "react";
import { getCourses } from "../../../../api/admin/course/courseApi";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import style from "./Survey.module.css";
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
import Select from "react-select";
import { icons } from "../../../sample/input/icons";
import { IconButton } from "../../../sample/input/IconButton";

export default function Survey() {
  /** 설문 타입에 단일, 다중, 직접입력 3가지가 있어
   *  해당 사항 선택하기 위한 배열
   */
  const options = [
    { value: "radio", label: "단일 선택" },
    { value: "checkBox", label: "다중 선택" },
    { value: "text", label: "직접 입력" },
  ];

  const { courseList } = useSelector((state) => state.courses);
  const { surveyList } = useSelector((state) => state.survey);
  const dispatch = useDispatch();

  const [selectedSubject, setSelectedSubject] = useState("Course");
  const [selectGroup, setSelectGroup] = useState("pre");

  const currentCourse = selectedSubject;

  const surveyRef = useRef();

  const currGroup = currentCourse && `${currentCourse}_${selectGroup}`;
  console.log(currGroup);

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
        alert(e.message);
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [dispatch, courseList.length]);

  useEffect(() => {
    let ignoreUpdateState = false;
    (async () => {
      try {
        const result = await getSurvey(currGroup);
        console.log(result);

        if (!ignoreUpdateState) {
          dispatch(surveyActions.load(result));
        }
      } catch (e) {
        alert(e.message);
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [currGroup, dispatch]);

  const onInputUpdateHandler = (surveyId, e) => {
    if (e.target.value === "" || e.target.value === null) {
      return;
    }
    const modifySurvey = { subject: e.target.value };
    (async () => {
      try {
        const updateResult = await updateSurvey(surveyId, modifySurvey);
        console.log(updateResult);
      } catch (e) {
        alert(e.message);
      }
    })();
  };
  const onInputDataHandler = (surveyId, surveyDataId, e) => {
    if (e.target.value === "" || e.target.value === null) {
      return;
    }
    const updateData = { data: e.target.value };
    (async () => {
      try {
        const updateResult = await updateSurveyData(
          surveyId,
          surveyDataId,
          updateData,
        );
        console.log(updateResult);
      } catch (e) {
        alert(e.message);
      }
    })();
  };

  const onTypeChangeHandler = (survey, option) => {
    const modifySurvey = { type: option.value };

    (async () => {
      try {
        await updateSurvey(survey.id, modifySurvey);

        dispatch(
          surveyActions.updateSurvey({ id: survey.id, type: option.value }),
        );
      } catch (e) {
        alert(e.message);
      }
    })();
  };

  const deleteDataButtonHandler = (surveyId, dataId) => {
    (async () => {
      try {
        const deleteResult = await deletedSurveyData(surveyId, dataId);
        dispatch(surveyActions.deleteSurveyData({ surveyId, dataId }));
        console.log(deleteResult);
      } catch (e) {
        alert(e.message);
      }
    })();
  };

  const deleteButtonHandler = (surveyId) => {
    (async () => {
      try {
        const deleteResult = await deleteSurvey(surveyId);
        dispatch(surveyActions.deleteSurvey({ surveyId }));
      } catch (e) {
        alert(e.message);
      }
    })();
  };

  const onClickAddSurveyHandler = () => {
    const registSurvey = {
      subject: " ",
      group: currGroup,
      type: options[0].value,
    };
    (async () => {
      try {
        const createResult = await createSurvey(registSurvey);
        dispatch(surveyActions.addSurvey(createResult));
      } catch (e) {
        alert(e.message);
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
        alert(e.message);
      }
    })();
  };

  return (
    <PageContainer>
      <div className={style.surveyContainer}>
        <div className={style.surveyHeader}>
          <ul className={style.surveyCourseList}>
            <li
              onClick={() => {
                setSelectedSubject("Course");
              }}
              className={
                (currentCourse === "Course" && style.active) || undefined
              }
            >
              수강
            </li>
            {courseList.map((course) => (
              <li
                key={course.id}
                onClick={() => {
                  setSelectedSubject(course.courseName);
                }}
                className={
                  (currentCourse === course.courseName && style.active) ||
                  undefined
                }
              >
                {course.courseName}
              </li>
            ))}
          </ul>
        </div>
        <div className={style.surveyBody}>
          <div className={style.surveyList}>
            <ul>
              <li
                onClick={() => {
                  setSelectGroup("pre");
                }}
                className={(selectGroup === "pre" && style.active) || undefined}
              >
                사전 설문
              </li>
              <li
                onClick={() => {
                  setSelectGroup("post");
                }}
                className={
                  (selectGroup === "post" && style.active) || undefined
                }
              >
                사후 설문
              </li>
            </ul>
          </div>
          <div className={style.survey}>
            <ul>
              <div onClick={() => onClickAddSurveyHandler()}>추가</div>
              {surveyList.map((survey) => (
                <div className={style.surveyQuestion} key={survey.id}>
                  <li>
                    <div className={style.surveyForm}>
                      <div>
                        <input
                          type="text"
                          className={style.surveySubject}
                          defaultValue={survey.subject}
                          ref={surveyRef}
                          onChange={(e) => onInputUpdateHandler(survey.id, e)}
                        />
                        <IconButton
                          onClick={() => deleteButtonHandler(survey.id)}
                        >
                          삭제
                        </IconButton>
                      </div>
                      <div>
                        <label>설문 종류</label>
                        <Select
                          className={style.surveyType}
                          options={options}
                          defaultValue={options.find(
                            (option) => option.value === survey.type,
                          )}
                          isSearchable
                          onChange={(e) => onTypeChangeHandler(survey, e)}
                        />
                      </div>
                      {!survey.type !== "text" && (
                        <div>
                          {survey.surveyDataList.map((data) => (
                            <Fragment key={data.id}>
                              <input
                                key={data.id}
                                type="text"
                                defaultValue={data.data}
                                onChange={(e) =>
                                  onInputDataHandler(survey.id, data.id, e)
                                }
                                className={style.surveyData}
                              />
                              <IconButton
                                onClick={() =>
                                  deleteDataButtonHandler(survey.id, data.id)
                                }
                              >
                                삭제
                              </IconButton>
                            </Fragment>
                          ))}
                          <IconButton
                            className={style.addData}
                            onClick={() => {
                              onClickAddSurveyDataHandler(survey.id);
                            }}
                          >
                            {" "}
                            추가{" "}
                          </IconButton>
                        </div>
                      )}
                    </div>
                    <div className="surveyPreview">
                      미리보기
                      <div className="title"></div>
                      {survey.type === "radio" && (
                        <>
                          {survey.surveyDataList.map((data) => (
                            <label>
                              <input
                                name={survey.id}
                                type="radio"
                                defaultValue={data.data}
                              />
                              {data.data}
                            </label>
                          ))}
                        </>
                      )}
                      {survey.type === "checkBox" && (
                        <>
                          {survey.surveyDataList.map((data) => (
                            <label key={data.id}>
                              <>
                                <input
                                  name={survey.id}
                                  type="checkbox"
                                  defaultValue={data.data}
                                />
                                {data.data}
                              </>
                            </label>
                          ))}
                        </>
                      )}
                      {survey.type === "text" && (
                        <>
                          {survey.surveyDataList.map((data) => (
                            <label>
                              <input
                                name={survey.id}
                                type="text"
                                defaultValue={data.data}
                              />
                              {data.data}
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  </li>
                </div>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
