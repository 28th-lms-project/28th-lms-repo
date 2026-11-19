import { useEffect, useId, useState } from "react";

import CourseScore from "../CourseTableComponent/CourseScore.jsx";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import { courseActions } from "../../../../store/slices/courseSliceStore";
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

import usePermission from "../../../../hooks/usePermission";

import CourseSurvey from "../CourseTableComponent/CourseSurvey.jsx";

import Badge from "../../../common/ui/Badge";
import Progress from "../../../common/ui/Progress";
import StatusBox from "../../../common/ui/StatusBox";
import { Tabs, TabPanel } from "../../../common/ui/Tabs";
import styles from "./CourseItem.module.css";

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
  // 모든 역할에 표시: 과정 성적 권한(SCORE_READ_COURSE)이 있으면 과정 전체 성적, 없으면(수강생) 내 성적 (CourseScore 안에서 나눔)
  { label: "성적", Component: <CourseScore /> }, //<CourseScore/>
];

/** 시작일 ~ 종료일 중 오늘까지 지난 비율 (0 ~ 100, 날짜 기준) */
const getDateProgress = (courseStartDate, courseEndDated) => {
  const today = new Date();
  const startDate = new Date(courseStartDate);
  const endDate = new Date(courseEndDated);

  today.setHours(0, 0, 0, 0);

  const totalDay = endDate - startDate;
  const elapsedDays = today - startDate;

  const progress = Math.min(100, Math.max(0, (elapsedDays / totalDay) * 100));
  return Number.isFinite(progress) ? progress : 0;
};

export default function CourseItem() {
  const { showCourse, showStudents, attendanceSummary } = useSelector(
    (store) => store.courses,
  );
  const { id } = useParams();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabsId = useId();

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
  const tabItems = TABS.map(({ label }, index) => ({
    id: String(index),
    label,
  })).filter((_, index) => isTabVisible(index));

  const canReadStudents = can("COURSE_STUDENT_READ");
  const canReadAttendance = can("COURSE_ATTENDANCE_READ");
  const canReadHomeworks = can("COURSE_HOMEWORK_READ");

  // 과정 정보를 불러오지 못했을 때의 오류 (과정 정보 자리에 StatusBox로 보여 줌)
  // { courseId, error }: 오류가 난 과정을 같이 적어 두고, 지금 과정의 오류일 때만 보여 준다
  // (다른 과정으로 이동하면 따로 비우지 않아도 이전 과정의 오류가 보이지 않음)
  const [courseLoadError, setCourseLoadError] = useState(null);
  const loadError =
    courseLoadError?.courseId === id ? courseLoadError.error : null;

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    // 다른 과정으로 이동했을 때 이전 과정의 정보 · 수강생이 보이지 않도록 비운다 (비어 있는 동안 로딩 표시)
    // isLoading(start/finishLoading)은 왼쪽 과정 목록(CourseMain) 전용이라 여기서는 건드리지 않는다
    dispatch(courseActions.loadShowCourse(undefined));
    dispatch(courseActions.showStudents([]));

    (async () => {
      try {
        const course = await getCourse(id, options);
        dispatch(courseActions.loadShowCourse(course));
        // 다시 불러오기에 성공하면 이전에 이 과정에서 난 오류를 지운다
        setCourseLoadError(null);
      } catch (error) {
        if (error.name !== "AbortError") {
          setCourseLoadError({ courseId: id, error });
        }
      }
    })();
    return () => {
      controller.abort();
    };
  }, [id, dispatch]);

  // 과제 목록: 권한(COURSE_HOMEWORK_READ)이 확인된 뒤에만 호출. 과정 조회와 분리해서, 실패해도 과정 화면은 뜨도록 한다
  useEffect(() => {
    // 다른 과정으로 이동했을 때 이전 과정의 과제가 보이지 않도록 비운다
    dispatch(courseActions.loadhomeworks([]));
    if (!canReadHomeworks) {
      return;
    }
    const controller = new AbortController();
    getHomeworks(id, { signal: controller.signal })
      .then((homeworks) => dispatch(courseActions.loadhomeworks(homeworks)))
      // 실패하면 과제 없이 둔다 (과제 탭이 빈 상태를 보여 줌)
      .catch(() => {});
    return () => controller.abort();
  }, [id, dispatch, canReadHomeworks]);

  // 수강생 목록: 권한(COURSE_STUDENT_READ)이 확인된 뒤에만 호출 (permission-guide 3-2)
  // Promise.all 과 분리해서, 이 API가 실패해도 과정 화면은 뜨도록 한다
  useEffect(() => {
    if (!canReadStudents) {
      return;
    }
    const controller = new AbortController();
    getCourseStudents(id, { signal: controller.signal })
      .then((students) => dispatch(courseActions.showStudents(students)))
      // 실패하면 수강생 목록 없이 둔다 (각 탭이 빈 상태를 보여 줌)
      .catch(() => {});
    return () => controller.abort();
  }, [id, dispatch, canReadStudents]);

  // 출석률 요약: 권한(COURSE_ATTENDANCE_READ)이 확인된 뒤에만 호출. 따로 호출 (실패해도 과정 화면은 뜨도록)
  useEffect(() => {
    // 다른 과정으로 이동했을 때 이전 과정의 출석률이 보이지 않도록 비운다
    dispatch(courseActions.loadAttendanceSummary(null));
    if (!canReadAttendance) {
      dispatch(courseActions.setAttendanceSummaryStatus("idle"));
      return;
    }
    dispatch(courseActions.setAttendanceSummaryStatus("loading"));
    const controller = new AbortController();
    getAttendanceSummary(id, { signal: controller.signal })
      .then((summary) => {
        dispatch(courseActions.loadAttendanceSummary(summary));
        dispatch(courseActions.setAttendanceSummaryStatus("success"));
      })
      // 실패하면 요약 없이 둔다 (과정 진행률은 날짜 기준으로 표시되고, 출석률 탭은 오류를 보여 줌)
      // 다른 과정으로 이동해서 취소된 요청은 무시 (새 요청이 "loading"으로 덮어씀)
      .catch((error) => {
        if (error.name !== "AbortError") {
          dispatch(courseActions.setAttendanceSummaryStatus("error"));
        }
      });
    return () => controller.abort();
  }, [id, dispatch, canReadAttendance]);

  let courseInfo;
  if (loadError) {
    courseInfo = (
      <StatusBox
        type="error"
        title="과정 정보를 불러오지 못했습니다."
        detail={loadError.message}
      />
    );
  } else if (!showCourse) {
    courseInfo = <StatusBox type="loading" />;
  } else {
    const dateProgress = getDateProgress(
      showCourse.startDate,
      showCourse.endDated,
    );
    const finished = dateProgress >= 100;

    // 과정 상세 머리: card(과정명 + desc-list-stacked + Progress). 화면 머리(PageHeader)는 CourseMain이 그린다
    courseInfo = (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{showCourse.courseName}</h3>
        </div>
        <div className="form-stack">
          <dl className={`desc-list-stacked ${styles.summary}`}>
            <div>
              <dt>기간</dt>
              <dd>
                {showCourse.startDate} ~ {showCourse.endDated}
              </dd>
            </div>
            <div>
              <dt>담당 강사</dt>
              <dd>{showCourse.name}</dd>
            </div>
            {/* 수강생 수: 수강생 목록 권한이 있을 때 이미 불러온 목록으로 센다 */}
            {canReadStudents && (
              <div>
                <dt>수강생</dt>
                <dd>{(showStudents ?? []).length}명</dd>
              </div>
            )}
            <div>
              <dt>상태</dt>
              <dd>
                {finished ? (
                  <Badge>완료</Badge>
                ) : (
                  <Badge tone="info">진행 중</Badge>
                )}
              </dd>
            </div>
          </dl>
          {/* 출석률 요약이 있으면 수업일(과정 기간의 평일) 기준 진행률, 아니면 날짜 기준 진행률 */}
          {attendanceSummary?.totalClassDays > 0 ? (
            <div>
              <Progress
                label="과정 진행률"
                value={attendanceSummary.progressRate}
                showValue
              />
              <p className="field-hint">
                {attendanceSummary.passedClassDays} /{" "}
                {attendanceSummary.totalClassDays} 수업일 (평일 기준, 어제까지)
              </p>
            </div>
          ) : (
            <div>
              <Progress label="과정 진행률" value={dateProgress} showValue />
              {attendanceSummary && (
                <p className="field-hint">
                  기간에 평일이 없음 · 날짜 기준 진행률
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="form-stack">
      {courseInfo}
      <div>
        <Tabs
          idBase={tabsId}
          items={tabItems}
          value={String(tab)}
          onChange={(tabId) => setSearchParams({ tab: tabId })}
          ariaLabel="과정 메뉴"
        />
        <TabPanel idBase={tabsId} tabId={String(tab)}>
          {Component}
        </TabPanel>
      </div>
    </div>
  );
}
