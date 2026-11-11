import { api } from "../../common/apiClient";

const encode = (value) => encodeURIComponent(value);

// 과정의 면접 일정 목록 조회
export const getInterviewList = (courseId, options) =>
  api.get(`/interview/${encode(courseId)}`, undefined, options);

// 면접 일정 등록용 과정 수강생 목록 조회
export const getCourseStudentList = (courseId, options) =>
  api.get(`/interview/${encode(courseId)}/students`, undefined, options);

// 면접 일정 등록
// data: { courseStudentId, interviewDateTime: "yyyy-MM-ddTHH:mm", interviewCompany }
export const insertInterview = (courseId, data) =>
  api.post(`/interview/${encode(courseId)}`, data);
