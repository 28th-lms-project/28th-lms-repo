import { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { IconButton } from "../../../sample/input/IconButton";
import CourseStudentList from "../CourseTableComponent/CourseStudentList";
import StudentConnected from "../CourseTableComponent/StudentConnected";
import {
  getCourse,
  getCourseStudents,
  getHomeworks,
} from "../../../../api/admin/course/courseApi";
import HomeWorkList from "../CourseTableComponent/HomeWorkList";
import MyTimetable from "../../../my/course/MyTimetable";
import MyInterview from "../../../my/course/MyInterview.jsx";
const TABS = [
  { label: "수강생", Component: <CourseStudentList /> }, // <CourseStudentList/>
  { label: "접속시간", Component: <StudentConnected /> }, // <StudentConnected/>
  { label: "시간표", Component: <MyTimetable /> }, // courseId 는 URL(:id)에서 읽음
  { label: "과제", Component: <HomeWorkList /> }, //<HomeWorkList/>
  { label: "시험", Component: <div>시험</div> }, //<Exam/>
  { label: "면접일정", Component: <MyInterview /> }, //<InterviewTimeTable/>
  { label: "교육자료", Component: <div>교육자료</div> }, //<EducationMaterialsList/>
  { label: "설문", Component: <div>설문</div> }, //<Survey/>
  { label: "상담목록", Component: <div>상담목록</div> }, //<ConsultationList/>
];
export default function CourseItem() {
  const { showCourse } = useSelector((store) => store.courses);
  const { id } = useParams();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = Number(searchParams.get("tab"));
  const tab = TABS[tabParam] ? tabParam : 0;

  const { Component } = TABS[tab];

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    dispatch(courseActions.startLoading());
    (async () => {
      try {
        const [course, students, homeworks] = await Promise.all([
          getCourse(id, options),
          getCourseStudents(id, options),
          getHomeworks(id, options),
        ]);
        dispatch(courseActions.loadShowCourse(course));
        dispatch(courseActions.showStudents(students));
        dispatch(courseActions.loadhomeworks(homeworks));
        dispatch(courseActions.finishLoading());
      } catch (error) {
        if (error.name !== "AbortError") {
          alert(error.message);
        }
      }
    })();
    return () => {
      controller.abort();
    };
  }, [id, dispatch]);

  const finishCourse = (courseStartDate, courseEndDated) => {
    const today = new Date();
    const startDate = new Date(courseStartDate);
    const endDate = new Date(courseEndDated);

    today.setHours(0, 0, 0, 0);

    const totalDay = endDate - startDate;
    const elapsedDays = today - startDate;

    const progress = Math.min(100, Math.max(0, (elapsedDays / totalDay) * 100));

    if (progress >= 100) {
      return "이미 완료된 과정입니다 ";
    } else {
      return `${Math.round(progress)}% 진행중 `;
    }
  };

  return (
    <>
      <div className="section">
        {!showCourse && <div>..로딩중입니다.</div>}
        {showCourse && (
          <>
            <h3>{showCourse.courseName}</h3>

            <span>
              {showCourse.startDate} ~ {showCourse.endDated}
            </span>

            <div>{finishCourse(showCourse.startDate, showCourse.endDated)}</div>
            <div>{showCourse.name}</div>
          </>
        )}
        <ul className="pageList">
          {TABS.map(({ label }, index) => (
            <li key={label} style={{ display: "inline-block" }}>
              <IconButton
                className={index === tab ? "active" : undefined}
                onClick={() => setSearchParams({ tab: String(index) })}
              >
                {label}
              </IconButton>
            </li>
          ))}
        </ul>
        {Component}
      </div>
    </>
  );
}
