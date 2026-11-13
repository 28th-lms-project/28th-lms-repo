import { api } from "../../common/apiClient.js";

const encode = (value) => encodeURIComponent(value);

const studentUrl = (courseId, courseStudentId) =>
  `/counsel/${encode(courseId)}/students/${encode(courseStudentId)}`;

// 과정의 수강생-종합의견 목록 조회
export const getCounselList = (courseId, options) =>
  api.get(`/counsel/${encode(courseId)}`, undefined, options);

// 교육생 기본 정보 조회
export const getCounselDetail = (courseId, courseStudentId, options) =>
  api.get(studentUrl(courseId, courseStudentId), undefined, options);

// 상담 기본 정보 등록
// data: { gender: 1 | 2, contact }
export const insertCounsel = (courseId, courseStudentId, data) =>
  api.post(studentUrl(courseId, courseStudentId), data);

// 역량 수준 진단 조회
export const getCapability = (courseId, courseStudentId, options) =>
  api.get(`${studentUrl(courseId, courseStudentId)}/capability`, undefined, options);

// 역량 수준 진단 수정
// data: { capabilityStartLevel, capabilityStartDesc, capabilityMidLevel, ... } (수준 0: 상, 1: 중, 2: 하)
export const updateCapability = (courseId, courseStudentId, data) =>
  api.put(`${studentUrl(courseId, courseStudentId)}/capability`, data);

// 과목별 성적 조회
export const getScoreList = (courseId, courseStudentId, options) =>
  api.get(`${studentUrl(courseId, courseStudentId)}/scores`, undefined, options);

// 평균 점수 조회 (성적이 없으면 null)
export const getAverageScore = (courseId, courseStudentId, options) =>
  api.get(`${studentUrl(courseId, courseStudentId)}/scores/average`, undefined, options);

// 상담내용 목록 조회
export const getConsultDataList = (courseId, courseStudentId, options) =>
  api.get(`${studentUrl(courseId, courseStudentId)}/consults`, undefined, options);

// 상담내용 등록
// data: { consultType, consultDesc }
export const insertConsultData = (courseId, courseStudentId, data) =>
  api.post(`${studentUrl(courseId, courseStudentId)}/consults`, data);

// 종합의견 조회
export const getOpinion = (courseId, courseStudentId, options) =>
  api.get(`${studentUrl(courseId, courseStudentId)}/opinion`, undefined, options);

// 종합의견 수정
// data: { opinion }
export const updateOpinion = (courseId, courseStudentId, data) =>
  api.put(`${studentUrl(courseId, courseStudentId)}/opinion`, data);
