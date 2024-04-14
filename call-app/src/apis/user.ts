import api, { Method } from "./api";

export const updateUser = (
  id,
  params?: {},
  config?: {},
  method: Method = "put"
) => api(`users/${id}`, params, method, config);

export const login = (params?: {}) => api("login", params, "post");
export const register = (params?: {}) => api("register", params, "post");
