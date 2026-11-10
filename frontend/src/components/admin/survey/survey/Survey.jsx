import { useDispatch, useSelector } from "react-redux";
import PageContainer from "../../../common/PageContainer";
import { useEffect, useRef, useState } from "react";
import { getCourses } from "../../../../api/admin/course/courseApi";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import style from "./Survey.module.css";
import { getSurvey } from "../../../../api/admin/system/survey/serveyApi";
import { surveyActions } from "../../../../store/slices/surveySliceStore";
import Select from "react-select";

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

  const survetRef = useRef();

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

  // const onChangeTitleHandler = (subject, surveyId) => {};

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
                className={(selectGroup === "pre" && style.active) || undefined}
              >
                사후 설문
              </li>
            </ul>
          </div>
          <div className="survey">
            <ul>
              {surveyList.map((survey) => (
                <div className={style.surveyQuestion} key={survey.id}>
                  <li>
                    <div className={style.surveyForm}>
                      <div>
                        <input
                          type="text"
                          className={style.surveysubject}
                          defaultValue={survey.subject}
                          onChange={() => {}}
                        />
                      </div>
                      <div>
                        <label>설문 종류</label>
                        <Select
                          className={style.surveyType}
                          options={options}
                          defaultValue={survey.type}
                          isSearchable
                        />
                      </div>
                      <div>
                        {survey.surveyDataList.map((data) => (
                          <input
                            type="text"
                            defaultValue={data.data}
                            onChange={() => {}}
                          />
                        ))}
                      </div>
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
                            <label>
                              <input
                                name={survey.id}
                                type="checkbox"
                                defaultValue={data.data}
                              />
                              {data.data}
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
