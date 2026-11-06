import { Component, useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import { courseActions } from "../../../../store/slices/courseSliceStore";
import { IconButton } from "../../../sample/input/IconButton";
const TABS = [
  { label: "수강생", Component: <div>수강생</div> },
  { label: "접속시간", Component: <div>접속시간</div> },
  { label: "시간표", Component: <div>시간표</div> },
  { label: "과제", Component: <div>과제</div> },
  { label: "시험", Component: <div>시험</div> },
  { label: "면접일정", Component: <div>면접일정</div> },
  { label: "교육자료", Component: <div>교육자료</div> },
  { label: "설문", Component: <div>설문</div> },
  { label: "상담목록", Component: <div>상담목록</div> },
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
    let ignore = false;
    dispatch(courseActions.startLoading());
    (async () => {
      const fetchResult = await fetch(
        `http://localhost:8080/course/list/${id}`,
      );
      const resultJson = await fetchResult.json();

      if (!ignore) {
        dispatch(courseActions.loadShowCourse(resultJson));

        dispatch(courseActions.finishLoading());
      }
    })();
    return () => {
      // showArticle 제거.
      ignore = true;
    };
  }, [id]);

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
        <ul>
          {TABS.map(({ label }, index) => (
            <li key={label}>
              <IconButton
                className={index === tab ? "active" : undefined}
                onClick={() => setSearchParams({ tab: String(index) })}
              >
                {label}
              </IconButton>
            </li>
          ))}
        </ul>
        {/* <Component courseId={id} /> */}
      </div>
    </>
  );
}
