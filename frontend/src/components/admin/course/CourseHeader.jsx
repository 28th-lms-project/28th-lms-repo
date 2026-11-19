import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { courseActions } from "../../../store/slices/courseSliceStore";
import { getCourses } from "../../../api/admin/course/courseApi";

import { useLocation } from "react-router-dom";

import PageHeader from "../../common/ui/PageHeader";
import useBreadcrumbs from "../../../hooks/useBreadcrumbs";

export default function CourseMain() {
    const dispatch = useDispatch();
    const { pathname } = useLocation();
    const crumbs = useBreadcrumbs();

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

    return <PageHeader crumbs={crumbs} title={crumbs.at(-1)?.title} />;
}
