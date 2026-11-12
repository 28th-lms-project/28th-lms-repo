/**
 * 환경 변수 API
 * 백엔드 : /backend/src/main/java/com/learningworks/code/web/CodeController.java
 */

import { api } from "../../../common/apiClient";

export const getCodeList = (parentId) =>
  api.get("/admin/system/code", { parentId: parentId });

export const getCode = (id) =>
  api.get(`/admin/system/code/${encodeURIComponent(id)}`);

export const createCode = (param) => api.post("/admin/system/code", param);

export const modifyCode = (id, param) =>
  api.put(`/admin/system/code/${encodeURIComponent(id)}`, param);

export const getCodeExist = (id) =>
  api.get(`/admin/system/code/${encodeURIComponent(id)}/exists`);

export const getCodeOptionList = (parentId) =>
  api.get(`/codes/${encodeURIComponent(parentId)}/codelist`);
