import { useParams, useSearchParams } from "react-router-dom";
import MyStudent from "./MyStudent";
import MyAttendence from "./MyAttendence";
import MyTimetable from "./MyTimetable";
import MyWorks from "./MyWorks";
import MyTest from "./MyTest";
import MyInterview from "./MyInterview";
import MyCourseData from "./MyCourseData.jsx";
import MySurvey from "./MySurvey";
import MyCounsel from "./MyCounsel";
import PageContainer from "../../common/PageContainer";

// 배열 인덱스 = URL 의 ?tab 값
const TABS = [
  { label: "수강생", Component: MyStudent },
  { label: "출결", Component: MyAttendence },
  { label: "시간표", Component: MyTimetable },
  { label: "과제", Component: MyWorks },
  { label: "시험", Component: MyTest },
  { label: "면접일정", Component: MyInterview },
  { label: "교육자료", Component: MyCourseData },
  { label: "설문", Component: MySurvey },
  { label: "상담목록", Component: MyCounsel },
];

export default function MyCourse() {
  const { courseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = Number(searchParams.get("tab"));
  const tab = TABS[tabParam] ? tabParam : 0;
  const { Component } = TABS[tab];

  return (
    <PageContainer>
      <div>
        <ul className="tab-list">
          {TABS.map(({ label }, index) => (
            <li key={label}>
              <button
                type="button"
                className={index === tab ? "active" : undefined}
                onClick={() => setSearchParams({ tab: String(index) })}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
        <Component courseId={courseId} />
      </div>
    </PageContainer>
  );
}
