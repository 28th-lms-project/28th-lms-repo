import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { courseActions } from "../../../store/slices/courseSliceStore";
import { getCourses } from "../../../api/admin/course/courseApi";

import { useLocation } from "react-router-dom";

import PageContainer from "../../common/PageContainer";

export default function CourseMain() {
    const dispatch = useDispatch();
    const { pathname } = useLocation();

    useEffect(() => {
        const controller = new AbortController();
        dispatch(courseActions.startLoading());
        (async () => {
            try {
                const courses = await getCourses({ signal: controller.signal });
                dispatch(courseActions.load(courses));
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
    }, [dispatch, pathname]);

    return (
        <>
            <PageContainer />
        </>
    );
}
