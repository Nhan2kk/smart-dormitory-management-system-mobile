import { apiRequest } from "../../shared/api";

export type AuthUser = {
  id: string;
  username: string;
  fullName: string;
  role: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export const authApi = {
  login: (username: string, password: string) =>
    apiRequest<AuthResponse>("/auth/login", { username, password }),
  refresh: (refreshToken: string) =>
    apiRequest<AuthResponse>("/auth/refresh", { refreshToken }),
  logout: (refreshToken: string, accessToken: string) =>
    apiRequest<void>("/auth/logout", { refreshToken }, accessToken),
};
