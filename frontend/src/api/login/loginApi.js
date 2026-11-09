import { api } from "../common/apiClient";

export const login = (id, password) => api.post("/login", { id, password });
