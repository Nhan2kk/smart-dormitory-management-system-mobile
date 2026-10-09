import { apiRequest } from "../shared/api";
import type { AuthResponse } from "../models/auth.model";

export class AuthService {
  /** `client: "mobile"`: server cấp phiên 30 ngày, tự gia hạn mỗi lần làm mới (web chỉ 8 giờ). */
  static login(username: string, password: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/auth/login", { username, password, client: "mobile" });
  }

  static refresh(refreshToken: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/auth/refresh", { refreshToken });
  }

  static logout(refreshToken: string, accessToken: string): Promise<void> {
    return apiRequest<void>("/auth/logout", { refreshToken }, accessToken);
  }
}
