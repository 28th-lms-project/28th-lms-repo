import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { searchTestSets } from "../../../api/admin/system/test/testApi";
import ExamSetTable from "../../admin/course/CourseTableComponent/ExamSetTable";
import MyScore from "./MyScore";

/**
 * 수강생 시험 목록 (/my/course/list/:courseId?tab=4).
 * 공개(Y)된 시험만 보여준다.
 *
 * 주의: 지금 사용하는 조회 API(GET /admin/system/{courseId}/testSet)는
 * 권한 어노테이션이 없어 SUPER_ADMIN 외에는 403이다. 수강생용 API가 생기면 교체할 것.
 */
export default function MyTest() {
  const { courseId } = useParams();
  const [testSets, setTestSets] = useState([]);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!courseId) {
      return;
    }
    let ignoreUpdateState = false;

    (async () => {
      try {
        const result = await searchTestSets(courseId);
        if (!ignoreUpdateState) {
          setTestSets(result.filter((testSet) => testSet.showYn === "Y"));
          setLoadFailed(false);
        }
      } catch (e) {
        if (!ignoreUpdateState) {
          console.log(e);
          setLoadFailed(true);
        }
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [courseId]);

  return (
    <>
      <MyScore courseId={courseId} />
      {loadFailed && <div>시험 목록을 불러오지 못했습니다.</div>}
      {!loadFailed && <ExamSetTable testSets={testSets} studentView />}
    </>
  );
}
