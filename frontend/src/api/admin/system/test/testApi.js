/** 시험 문제 API. 성공 시 공통 응답의 body를 반환합니다. */
import { api } from "../../../common/apiClient";

/** 문제 목록 반환: { questionCount, examList } */
export const searchTest = (subjectId) =>
  api.get(`/admin/system/tests/${encodeURIComponent(subjectId)}`);

/** 문제 단건 반환. errorCode: EXAM_NOT_EXISTS */
export const searchTestQuestion = (questionId) =>
  api.get(`/admin/system/test/${encodeURIComponent(questionId)}`);

/** 등록된 문제 반환. errorCode: GLOBAL_INVALID_PARAMETER(validations), EXAM_FAILURE_CREATE */
export const createNewQuestion = (registTestQ) =>
  api.post("/admin/system/test", registTestQ);

/** 수정된 문제 반환. errorCode: GLOBAL_INVALID_PARAMETER(validations), EXAM_NOT_EXISTS, EXAM_FAILURE_UPDATE */
export const updateTestQuestion = (questionId, body) =>
  api.put(`/admin/system/test/${encodeURIComponent(questionId)}`, body);

/** 삭제된 문제 ID 반환. errorCode: EXAM_NOT_EXISTS */
export const deleteTestQuestion = (questionId) =>
  api.delete(`/admin/system/test/${encodeURIComponent(questionId)}`);

export const searchTestSets = (courseId) =>
  api.get(`/admin/system/${courseId}/testSet`);
