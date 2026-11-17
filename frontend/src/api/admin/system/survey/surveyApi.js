/**
 *  설문 관리 API
 *  백엔드: backend\src\main\java\com\learningworks\survey\web\SurveyController.java
 */

import { api } from "../../../common/apiClient";

export const getSurvey = (group) =>
  api.get(`/admin/system/survey/${encodeURIComponent(group)}`);

export const createSurvey = (registSurvey) =>
  api.post("/admin/system/survey", registSurvey);

export const createSurveyData = (surveyId, registSurveyD) =>
  api.post(
    `/admin/system/survey/${encodeURIComponent(surveyId)}/data`,
    registSurveyD,
  );

export const updateSurvey = (surveyId, body) =>
  api.put(`/admin/system/survey/${encodeURIComponent(surveyId)}`, body);

export const updateSurveyData = (surveyId, surveyDataId, body) =>
  api.put(
    `/admin/system/survey/${encodeURIComponent(surveyId)}/data/${encodeURIComponent(surveyDataId)}`,
    body,
  );

export const deleteSurvey = (surveyId) =>
  api.delete(`/admin/system/survey/${encodeURIComponent(surveyId)}`);

export const deletedSurveyData = (surveyId, surveyDataId) =>
  api.delete(
    `/admin/system/survey/${encodeURIComponent(surveyId)}/data/${encodeURIComponent(surveyDataId)}`,
  );

export const getCourseSurvey = (courseId) =>
  api.get(`/survey/${encodeURIComponent(courseId)}`);

export const createNewCourseSurvey = (courseId, body) =>
  api.post(`/survey/${encodeURIComponent(courseId)}`, body);

export const deleteCourseSurvey = (courseId, courseSurveyId) =>
  api.delete(
    `/survey/${encodeURIComponent(courseId)}/${encodeURIComponent(courseSurveyId)}`,
  );

// 설문 답변 팝업용: 과정 설문 정보 + 문항/보기 (수강생 로그인만 필요)
export const getCourseSurveyQuestions = (courseId, courseSurveyId) =>
  api.get(
    `/survey/${encodeURIComponent(courseId)}/${encodeURIComponent(courseSurveyId)}`,
  );

export const createCourseSurveyAnswers = (courseId, courseSurveyId, answers) =>
  api.post(
    `/survey/${encodeURIComponent(courseId)}/${encodeURIComponent(courseSurveyId)}/response`,
    answers,
  );

export const getMySurveyAnswered = (courseId, courseSurveyId) =>
  api.get(
    `/survey/${encodeURIComponent(courseId)}/${encodeURIComponent(courseSurveyId)}/response`,
  );

// 설문 결과 팝업: 과정 설문 정보 + 문항/보기 + 응답한 학생 목록
export const getCourseSurveyResult = (courseId, courseSurveyId) =>
  api.get(
    `/survey/${encodeURIComponent(courseId)}/${encodeURIComponent(courseSurveyId)}/result`,
  );

// 설문 결과 팝업: 한 학생의 답변
export const getCourseSurveyStudentAnswers = (
  courseId,
  courseSurveyId,
  courseStudentId,
) =>
  api.get(
    `/survey/${encodeURIComponent(courseId)}/${encodeURIComponent(courseSurveyId)}/result/${encodeURIComponent(courseStudentId)}`,
  );
