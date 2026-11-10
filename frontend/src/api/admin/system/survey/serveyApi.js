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

export const deltedSurveyData = (surveyId, surveyDataId) =>
  api.delete(
    `/admin/system/survey/${encodeURIComponent(surveyId)}/data/${encodeURIComponent(surveyDataId)}`,
  );
