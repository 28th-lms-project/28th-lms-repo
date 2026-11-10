import { api } from "../../common/apiClient";

export const verifyPassword = (password) =>
  api.post("/members/me/password/verify", { password });

export const updateInfo = ({ name, githubUrl, password }) =>
  api.put("/members/me", { name, githubUrl: githubUrl.trim(), password });

export const getMyInfo = (options) =>
  api.get("/members/me", undefined, options);
