import { apiRequest } from "../shared/api";
import type { AuthResponse } from "../models/auth.model";
import type { PasswordResetConfirm, PasswordResetStart } from "../models/password-reset.model";

export class AuthService {
  /** `client: "mobile"`: server cấp phiên 365 ngày, tự gia hạn mỗi lần làm mới (web chỉ 8 giờ). */
  static login(username: string, password: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/auth/login", { username, password, client: "mobile" });
  }

  static refresh(refreshToken: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/auth/refresh", { refreshToken });
  }

  static logout(refreshToken: string, accessToken: string): Promise<void> {
    return apiRequest<void>("/auth/logout", { refreshToken }, accessToken);
  }

  /**
   * Quên mật khẩu: server kiểm tra email đúng là email của tài khoản {@code username} (sai thì báo
   * RESET_ACCOUNT_MISMATCH) rồi gửi mã 6 số tới email đó.
   */
  static startPasswordReset(email: string, username: string): Promise<PasswordResetStart> {
    return apiRequest<PasswordResetStart>("/auth/password-reset/request", { email, username });
  }

  /** Xác nhận mã và đặt mật khẩu mới; server đăng xuất mọi thiết bị của tài khoản. */
  static confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    return apiRequest<void>("/auth/password-reset/confirm", data);
  }
}
