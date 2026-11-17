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
 * 과정 진행률 · 출석률 요약 조회 (어제까지 기준)
 * 백엔드: CourseController#readAttendanceSummary → GET /{courseId}/attendance/summary
 * 관리자 · 강사는 과정 전체 수강생, 수강생은 본인만 내려온다.
 * @param {string} courseId
 * @returns {Promise<{ totalClassDays: number, passedClassDays: number, progressRate: number, averageAttendanceRate: number, averageWarning: boolean, students: { userId: string, name: string, presentCount: number, lateCount: number, absentCount: number, attendanceRate: number, warning: boolean }[] }>}
 * errorCode: COURSE_NOT_EXISTS, COURSE_NOT_AUTHORIZED
 */
export const getAttendanceSummary = (courseId, options) =>
  api.get(`/${encode(courseId)}/attendance/summary`, undefined, options);

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

/**
 * 과제 등록 (학생 제외: 관리자는 모든 강의, 강사는 자기 강의만)
 * 백엔드: CourseController#addHomework → POST /{courseId}/addhomework
 * @param {string} courseId 과정 ID
 * @param {{ subject: string, endDate: string, content: string }} data endDate 는 "YYYY-MM-DD"
 * @returns {Promise<{ id: string, courseId: string, subject: string, content: string, endDate: string, crtDt: string, mdfyDt: string }>}
 * errorCode: COURSE_NOT_AUTHORIZED, HOMEWORK_FAILURE_CREATE
 */
export const createHomework = (courseId, data) =>
  api.post(`/${encode(courseId)}/addhomework`, data);

/**
 * 과제 수정 (content, endDate) - 학생 제외: 관리자는 모든 강의, 강사는 자기 강의만
 * 백엔드: CourseController#updateHomework → PUT /{courseId}/{homeworkId}/update
 * @param {string} courseId 과정 ID
 * @param {string} homeworkId 과제 ID
 * @param {{ content: string, endDate: string }} data endDate 는 "YYYY-MM-DD"
 * @returns {Promise<{ id: string, courseId: string, subject: string, content: string, endDate: string, crtDt: string, mdfyDt: string }>}
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), COURSE_NOT_AUTHORIZED, HOMEWORK_NOT_EXISTS
 */
export const updateHomework = (courseId, homeworkId, data) =>
  api.put(`/${encode(courseId)}/${encode(homeworkId)}/update`, data);

/**
 * 과제 댓글 수정 (작성자 본인만)
 * 백엔드: CourseController#updateHomeworkReply → PUT /{courseId}/homeworklist/{homeworkId}/replies/{replyId}
 * @param {string} courseId 과정 ID
 * @param {string} homeworkId 과제 ID
 * @param {string} replyId 댓글 ID
 * @param {{ content: string }} data content(필수, 500자 이하)
 * @returns {Promise<{ id: string, homeworkId: string, content: string, crtDt: string, mdfyDt: string, writer: { id: string, name: string } }>}
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), COURSE_NOT_AUTHORIZED(본인 댓글 아님), HOMEWORK_NOT_EXISTS
 */
export const updateHomeworkReply = (courseId, homeworkId, replyId, data) =>
  api.put(
    `/${encode(courseId)}/homeworklist/${encode(homeworkId)}/replies/${encode(replyId)}`,
    data,
  );

/**
 * 과제 삭제 (DEL_YN = 'Y') - 학생 제외: 관리자는 모든 강의, 강사는 자기 강의만
 * 백엔드: CourseController#deleteHomework → DELETE /{courseId}/homeworklist/{homeworkId}
 * @param {string} courseId 과정 ID
 * @param {string} homeworkId 과제 ID
 * @returns {Promise<string>} 삭제된 과제 ID
 * errorCode: COURSE_NOT_AUTHORIZED, HOMEWORK_NOT_EXISTS
 */
export const deleteHomework = (courseId, homeworkId) =>
  api.delete(`/${encode(courseId)}/homeworklist/${encode(homeworkId)}`);

/**
 * 과제 댓글 삭제 (DEL_YN = 'Y') - 작성자 본인, 관리자, 해당 강의 강사
 * 백엔드: CourseController#deleteHomeworkReply → DELETE /{courseId}/homeworklist/{homeworkId}/replies/{replyId}
 * @param {string} courseId 과정 ID
 * @param {string} homeworkId 과제 ID
 * @param {string} replyId 댓글 ID
 * @returns {Promise<string>} 삭제된 댓글 ID
 * errorCode: COURSE_NOT_AUTHORIZED, HOMEWORK_NOT_EXISTS
 */
export const deleteHomeworkReply = (courseId, homeworkId, replyId) =>
  api.delete(
    `/${encode(courseId)}/homeworklist/${encode(homeworkId)}/replies/${encode(replyId)}`,
  );

/**
 * 과제 댓글 등록 (해당 강의의 수강생 · 강사만 가능)
 * 백엔드: CourseController#addHomeworkReply → POST /{courseId}/homeworklist/{homeworkId}/replies
 * @param {string} courseId 과정 ID
 * @param {string} homeworkId 과제 ID
 * @param {{ content: string }} data content(필수, 500자 이하)
 * @returns {Promise<{ id: string, homeworkId: string, content: string, crtDt: string, writer: { id: string, name: string } }>}
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), COURSE_NOT_AUTHORIZED, HOMEWORK_NOT_EXISTS
 */
export const createHomeworkReply = (courseId, homeworkId, data) =>
  api.post(
    `/${encode(courseId)}/homeworklist/${encode(homeworkId)}/replies`,
    data,
  );

/**
 * 과정 목록 검색 (관리자 과정 목록, 삭제되지 않은 과정만)
 * 백엔드: CourseController#searchCourseList → GET /admin/course/list
 * @param {{ no?: string, courseName?: string, startDate?: string, endDated?: string }} params
 *   빈 값은 쿼리스트링에서 빠짐. 날짜는 "YYYY-MM-DD"
 * @param {{ signal?: AbortSignal }} [options] 요청 취소용 signal
 * @returns {Promise<{ id: string, no: string, courseName: string, startDate: string, endDated: string }[]>}
 * errorCode: GLOBAL_INVALID_PARAMETER(validations)
 */
export const searchCourses = (params, options) =>
  api.get("/admin/course/list", params, options);

/**
 * 과정 정보 수정
 * 백엔드: CourseController#updateCourse → PUT /admin/course/{courseId}
 * @param {string} courseId 과정 ID
 * @param {{ no: string, courseName: string, startDate: string, endDated: string }} data 날짜는 "YYYY-MM-DD"
 * @returns {Promise<string>} 수정된 과정 ID
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), COURSE_NOT_EXISTS
 */
export const updateCourse = (courseId, data) =>
  api.put(`/admin/course/${encode(courseId)}`, data);

/**
 * 과정 삭제 (DEL_YN = 'Y')
 * 백엔드: CourseController#deleteCourse → DELETE /admin/course/{courseId}
 * @param {string} courseId 과정 ID
 * @returns {Promise<string>} 삭제된 과정 ID
 * errorCode: COURSE_NOT_EXISTS
 */
export const deleteCourse = (courseId) =>
  api.delete(`/admin/course/${encode(courseId)}`);

/**
 * 과정 진행중 수강생 추가 api
 */
export const addCourseStudent = (courseId, studentIds) =>
  api.post(`admin/course/list/${courseId}`, studentIds);
