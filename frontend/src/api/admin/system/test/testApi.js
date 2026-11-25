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

/** 시험등록  */
export const makeNewTestSet = (courseId, addTestSet) =>
  api.post(`/admin/system/${courseId}/test/addTestSet`, addTestSet);

/** 시험 세트 공개 여부 수정. showYn: "Y" | "N". 수정된 시험 세트 반환 */
export const updateTestSetShowYn = (testSetId, showYn) =>
  api.put(`/admin/system/testSet/${encodeURIComponent(testSetId)}/showYn`, {
    showYn,
  });

/**
 * 채점 완료 확정 (시험 상태 showYn → "C"). 채점 중 답안이 남아 있으면 errorCode EXAM_GRADE_PENDING.
 * 완료 후에는 채점 수정 · 공개 여부 변경이 막히고(EXAM_GRADE_DONE), 학생에게 결과가 공개된다
 */
export const completeGrading = (testSetId) =>
  api.put(`/admin/system/testSet/${encodeURIComponent(testSetId)}/gradeDone`);

/** 채점 완료 취소 (관리자만, showYn "C" → "N" 마감) */
export const cancelGradeDone = (testSetId) =>
  api.delete(`/admin/system/testSet/${encodeURIComponent(testSetId)}/gradeDone`);

/** 시험 삭제 API */
export const deleteTestSet = (testSetId) =>
  api.delete(`admin/system/testSet/${testSetId}`);

/** 시험 세부 화면 출력 API */
export const viewTestSetQuestions = (testSetId) =>
  api.get(`admin/system/${testSetId}/questionlist`);

/** 시험 응시용 문제 API (정답 제외. 수강생 응시 화면용) */
export const viewTestSetQuestionsForTake = (testSetId) =>
  api.get(`my/test/${testSetId}/questions`);

/** 시험 제출 API */
export const createTestAnswers = (testSetId, submitAnswers) =>
  api.post(`my/test/${testSetId}`, { answersList: [...submitAnswers] });

/** 시험 제출자 채점 API */
export const correctStudentTest = (testSetId, userId) =>
  api.get(`admin/${testSetId}/correct/${userId}`);

/** 답안 1건 채점 결과 수정. isCorrect: "Y"(정답) | "N"(오답) | "H"(부분정답). 수정한 답안 ID 반환 */
export const updateAnswerGrade = (answerId, isCorrect) =>
  api.put(`/admin/test/answer/${encodeURIComponent(answerId)}/grade`, {
    isCorrect,
  });
