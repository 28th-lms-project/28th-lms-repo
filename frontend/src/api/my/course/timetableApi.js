
import { api } from "../../common/apiClient.js";

const encode = (value) => encodeURIComponent(value);

// 과정별 전체 시간표 조회
export const getTimetable = (courseId, options) =>
    api.get(
        `/timetable/${encode(courseId)}`,
        undefined,
        options
    );

// 시간표 엑셀 업로드
export const uploadTimetable = (courseId, formData) =>
    api.post(
        `/timetable/${encode(courseId)}/upload`,
        formData
    );

// 과정별 날짜 시간표 조회
export const getDailyTimetable = (courseId, date, options) =>
    api.get(
        `/timetable/${encode(courseId)}/${encode(date)}`,
        undefined,
        options
    );
