import { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { IconButton } from "../../../sample/input/IconButton";
import CourseStudentList from "../CourseTableComponent/CourseStudentList";
import StudentConnected from "../CourseTableComponent/StudentConnected";
import {
  deleteCourse,
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
import usePermission from "../../../../hooks/usePermission";

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
  // 상담 목록 API(COURSE_COUNSEL_READ) 권한이 있을 때만 탭 표시 (수강생에게는 숨김)
  {
    label: "상담목록",
    Component: <MyCounsel />,
    permission: "COURSE_COUNSEL_READ",
  }, //<ConsultationList/>
];
export default function CourseItem() {
  const { showCourse, attendanceSummary } = useSelector(
    (store) => store.courses,
  );
  const { id } = useParams();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // 버튼 · 조회 권한 (백엔드 @RequireAction 의 권한 코드)
  const { can } = usePermission();

  // 권한이 필요한 탭은 권한이 있을 때만 보인다 (?tab= 번호는 TABS 기준 그대로 유지)
  const isTabVisible = (index) =>
    Boolean(TABS[index]) &&
    (!TABS[index].permission || can(TABS[index].permission));

  const tabParam = Number(searchParams.get("tab"));
  // 권한 없는 탭을 주소로 직접 열면 첫 탭으로
  const tab = isTabVisible(tabParam) ? tabParam : 0;

  const { Component } = TABS[tab];
  const canReadStudents = can("COURSE_STUDENT_READ");
  const canReadAttendance = can("COURSE_ATTENDANCE_READ");
  const canUpdateCourse = can("COURSE_UPDATE");
  // 수정: 강사 · 관리자 (강사는 담당 과정만 — 서버가 검사), 삭제: 관리자에게만 부여
  const canDeleteCourse = can("COURSE_DELETE");

  // 과정 수정 모달 / 삭제 확인창 열림 여부
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  // 삭제 확인창 [확인]: DEL_YN = 'Y' 로 삭제 → 과정 목록으로 이동 (첫 번째 과정으로 다시 이동됨)
  const onConfirmDeleteCourse = async () => {
    setShowDeleteConfirm(false);
    try {
      await deleteCourse(id);
      alert("과정이 삭제되었습니다.");
      // 수강 과정(/my/...) 화면에서 열었으면 그 목록으로, 아니면 과정 관리 목록으로
      navigate(
        pathname.startsWith("/my/") ? "/my/course/list" : "/admin/course/list",
      );
    } catch (error) {
      alert(error.message || "과정 삭제에 실패했습니다.");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    dispatch(courseActions.startLoading());
    // 다른 과정으로 이동했을 때 이전 과정의 출석률이 보이지 않도록 비운다
    dispatch(courseActions.showStudents([]));

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

  // 수강생 목록: 권한(COURSE_STUDENT_READ)이 확인된 뒤에만 호출 (permission-guide 3-2)
  // Promise.all 과 분리해서, 이 API가 실패해도 과정 화면은 뜨도록 한다
  useEffect(() => {
    if (!canReadStudents) {
      return;
    }
    const controller = new AbortController();
    getCourseStudents(id, { signal: controller.signal })
      .then((students) => dispatch(courseActions.showStudents(students)))
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.log(error);
        }
      });
    return () => controller.abort();
  }, [id, dispatch, canReadStudents]);

  // 출석률 요약: 권한(COURSE_ATTENDANCE_READ)이 확인된 뒤에만 호출. 따로 호출 (실패해도 과정 화면은 뜨도록)
  useEffect(() => {
    // 다른 과정으로 이동했을 때 이전 과정의 출석률이 보이지 않도록 비운다
    dispatch(courseActions.loadAttendanceSummary(null));
    if (!canReadAttendance) {
      return;
    }
    const controller = new AbortController();
    getAttendanceSummary(id, { signal: controller.signal })
      .then((summary) => dispatch(courseActions.loadAttendanceSummary(summary)))
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.log(error);
        }
      });
    return () => controller.abort();
  }, [id, dispatch, canReadAttendance]);

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
            {canUpdateCourse && (
              <button type="button" onClick={() => setShowEditCourse(true)}>
                수정
              </button>
            )}
            {canDeleteCourse && (
              <button type="button" onClick={() => setShowDeleteConfirm(true)}>
                삭제
              </button>
            )}
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
          {TABS.map(({ label }, index) =>
            !isTabVisible(index) ? null : (
              <li key={label} style={{ display: "inline-block" }}>
                <IconButton
                  className={index === tab ? "active" : undefined}
                  onClick={() => setSearchParams({ tab: String(index) })}
                >
                  {label}
                </IconButton>
              </li>
            ),
          )}
        </ul>
        {Component}
      </div>
    </>
  );
}
