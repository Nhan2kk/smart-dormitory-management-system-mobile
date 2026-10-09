import { apiRequest } from "../shared/api";
import type { AuthResponse } from "../models/auth.model";

export class AuthService {
  static login(username: string, password: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/auth/login", { username, password });
  }

  static refresh(refreshToken: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/auth/refresh", { refreshToken });
  }

  static logout(refreshToken: string, accessToken: string): Promise<void> {
    return apiRequest<void>("/auth/logout", { refreshToken }, accessToken);
  }
}
