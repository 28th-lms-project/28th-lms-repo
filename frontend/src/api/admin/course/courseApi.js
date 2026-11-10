/**
 * 과정(COURSE) API
 * 백엔드: backend/src/main/java/com/learningworks/course/web/CourseController.java
 */
import { api } from "../../common/apiClient";

const encode = (value) => encodeURIComponent(value);

/**
 * 과정 목록 조회
 * @returns {Promise<{ id: string, courseName: string, startDate: string, endDated: string, no: string, name: string }[]>}
 */
export const getCourses = (options) =>
  api.get("/course/view", undefined, options);

/**
 * 과정 상세 조회
 * @param {string} courseId
 * @returns {Promise<{ id: string, courseName: string, startDate: string, endDated: string, no: string, name: string }>}
 */
export const getCourse = (courseId, options) =>
  api.get(`/course/list/${encode(courseId)}`, undefined, options);

/**
 * 과정 수강생 목록 조회
 * @param {string} courseId
 * @returns {Promise<{ rowNum: string, id: string, name: string }[]>}
 */
export const getCourseStudents = (courseId, options) =>
  api.get(`/${encode(courseId)}/list/student`, undefined, options);

/**
 * 전체 수강생 목록 조회 (과정 등록 시 수강생 선택용)
 * @returns {Promise<{ id: string, name: string }[]>}
 */
export const getStudents = (options) =>
  api.get("/student/list", undefined, options);

/**
 * 전체 강사 목록 조회 (과정 등록 시 강사 선택용)
 * @returns {Promise<{ id: string, name: string }[]>}
 */
export const getTutors = (options) =>
  api.get("/tutor/list", undefined, options);

/**
 * 과정 등록
 * 백엔드가 @ModelAttribute 로 받으므로 FormData(multipart)로 전송합니다.
 * @param {FormData} formData courseName, no, startDate, endDated, tutorId, studentId(여러 개), file
 * errorCode: GLOBAL_INVALID_PARAMETER(validations)
 */
export const createCourse = (formData) =>
  api.post("/admin/course/add", formData);

/**
 * 과정의 과제 전체 목록 조회 (삭제된 과제 제외)
 * 백엔드: CourseController#readHomework → GET /{courseId}/homeworklist
 * @param {string} courseid 과정 ID (예: "CO-20261106-000019")
 * @param {{ signal?: AbortSignal }} [options] 요청 취소용 signal
 * @returns {Promise<{ id: string, courseId: string, subject: string, content: string, endDate: string, crtDt: string, mdfyDt: string }[]>}
 *   과제가 없으면 빈 배열
 */
export const getHomeworks = (courseid, options) =>
  api.get(`/${courseid}/homeworklist`, undefined, options);

/**
 *
 */
export const getOneHomeworks = (courseid, homeworkid, options) =>
  api.get(`/${courseid}/homeworklist/${homeworkid}`, undefined, options);

/**
 *
 */
export const getHomeworkReplies = (courseid, homeworkid, options) =>
  api.get(
    `/${courseid}/homeworklist/${homeworkid}/replies`,
    undefined,
    options,
  );
