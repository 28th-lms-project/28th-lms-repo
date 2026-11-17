import { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { IconButton } from "../../../sample/input/IconButton";
import CourseStudentList from "../CourseTableComponent/CourseStudentList";
import StudentConnected from "../CourseTableComponent/StudentConnected";
import {
  getAttendanceSummary,
  getCourse,
  getCourseStudents,
  getHomeworks,
} from "../../../../api/admin/course/courseApi";
import HomeWorkList from "../CourseTableComponent/HomeWorkList";
import MyTimetable from "../../../my/course/MyTimetable";
import MyInterview from "../../../my/course/MyInterview.jsx";
// import MyStudyFiles from "../../../my/course/MyStudyFiles.jsx";
import ExamPage from "../CourseTableComponent/ExamPage.jsx";
import MyCourseData from "../../../my/course/MyCourseData.jsx";
import MyCounsel from "../../../my/course/MyCounsel.jsx";

import CourseEditModal from "./CourseEditModal";
import ConfirmModal from "../CourseTableComponent/ConfirmModal";
import PeriodBar from "../CourseTableComponent/PeriodBar";

import CourseSurvey from "../CourseTableComponent/CourseSurvey.jsx";

const TABS = [
  { label: "수강생", Component: <CourseStudentList /> }, // <CourseStudentList/>
  { label: "출석률", Component: <StudentConnected /> }, // <StudentConnected/>
  { label: "시간표", Component: <MyTimetable /> }, // courseId 는 URL(:id)에서 읽음
  { label: "과제", Component: <HomeWorkList /> }, //<HomeWorkList/>
  { label: "시험", Component: <ExamPage /> }, //<Exam/>
  { label: "면접일정", Component: <MyInterview /> }, //<InterviewTimeTable/>
  { label: "교육자료", Component: <MyCourseData /> }, //<EducationMaterialsList/>
  { label: "설문", Component: <CourseSurvey /> }, //<Survey/>
  { label: "상담목록", Component: <MyCounsel /> }, //<ConsultationList/>
];
export default function CourseItem() {
  const { showCourse, attendanceSummary } = useSelector(
    (store) => store.courses,
  );
  const { id } = useParams();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = Number(searchParams.get("tab"));
  const tab = TABS[tabParam] ? tabParam : 0;

  const { Component } = TABS[tab];

  // 과정 수정 모달 / 삭제 확인창 열림 여부
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const onConfirmDeleteCourse = () => {
    setShowDeleteConfirm(false);
    // TODO(API): 과정 삭제 API 호출 (지금은 확인창만 띄우고 아무것도 삭제하지 않음)
    //   예) await deleteCourse(id);
    //   성공하면 navigate("/admin/course/list"), 실패하면 alert("과정 삭제에 실패했습니다.");
  };

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    dispatch(courseActions.startLoading());
    // 다른 과정으로 이동했을 때 이전 과정의 출석률이 보이지 않도록 비운다
    dispatch(courseActions.loadAttendanceSummary(null));
    dispatch(courseActions.showStudents([]));

    // 수강생 목록도 따로 호출 — 수강생 역할에는 목록 조회 권한(COURSE_STUDENT_READ)이 없어
    // 403 이 나도 과정 화면은 뜨도록. 실패하면 빈 목록으로 둔다
    getCourseStudents(id, options)
      .then((students) => dispatch(courseActions.showStudents(students)))
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.log(error);
        }
      });

    // 출석률 요약은 따로 호출 (이 API만 실패해도 과정 화면은 뜨도록)
    getAttendanceSummary(id, options)
      .then((summary) => dispatch(courseActions.loadAttendanceSummary(summary)))
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.log(error);
        }
      });

    (async () => {
      try {
        const [course, homeworks] = await Promise.all([
          getCourse(id, options),
          getHomeworks(id, options),
        ]);
        dispatch(courseActions.loadShowCourse(course));
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

            {/* 출석률 요약이 있으면 수업일 기준 막대, 없으면 기존 날짜 기준 문구 */}
            {attendanceSummary ? (
              <div style={{ maxWidth: "480px", margin: "8px 0" }}>
                <PeriodBar
                  label="과정 진행률"
                  progressRate={attendanceSummary.progressRate}
                />
                <div style={{ fontSize: "12px", color: "#888" }}>
                  {attendanceSummary.passedClassDays} /{" "}
                  {attendanceSummary.totalClassDays} 수업일 (어제 기준)
                </div>
              </div>
            ) : (
              <div>
                {finishCourse(showCourse.startDate, showCourse.endDated)}
              </div>
            )}
            <div>{showCourse.name}</div>
            <button type="button" onClick={() => setShowEditCourse(true)}>
              수정
            </button>
            <button type="button" onClick={() => setShowDeleteConfirm(true)}>
              삭제
            </button>
            {showEditCourse && (
              <CourseEditModal
                course={showCourse}
                onClose={() => setShowEditCourse(false)}
              />
            )}
            {showDeleteConfirm && (
              <ConfirmModal
                message="과정을 삭제하시겠습니까?"
                onConfirm={onConfirmDeleteCourse}
                onCancel={() => setShowDeleteConfirm(false)}
              />
            )}
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
