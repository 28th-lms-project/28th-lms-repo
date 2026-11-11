import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  searchTest,
  searchTestSets,
} from "../../../../api/admin/system/test/testApi";
import { testActions } from "../../../../store/slices/testSliceStore";

export default function ExamPage() {
  const { id } = useParams();
  console.log(id);
  const dispatch = useDispatch();
  const { questions } = useSelector((store) => store.test);
  useEffect(() => {
    if (!id) {
      return;
    }
    let ignoreUpdateState = false;

    (async () => {
      const controller = new AbortController();
      const options = { signal: controller.signal };
      try {
        const response = await searchTest(id);
        const searchTestSet = await searchTestSets(id);
        if (!ignoreUpdateState) {
          console.log(response);

          console.log(searchTestSet);
          console.log(questions);
          dispatch(testActions.setTestList(response));
        }
      } catch (e) {
        if (!ignoreUpdateState) {
          alert(e.message);
        }
      }
    })();
    return () => {
      ignoreUpdateState = true;
    };
  }, [dispatch, id]);
}
