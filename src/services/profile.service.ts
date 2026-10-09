import type { ApiClient } from "../shared/api";
import type {
  ChangePasswordRequest,
  StudentProfileResponse,
} from "../models/profile.model";

/** Gọi API hồ sơ cá nhân và tài khoản của sinh viên (không đổi hợp đồng backend). */
export class ProfileService {
  constructor(private readonly request: ApiClient) {}

  /** Hồ sơ sinh viên đang đăng nhập (chỉ xem; BE chưa có API cho sinh viên tự sửa). */
  get(): Promise<StudentProfileResponse> {
    return this.request<StudentProfileResponse>("/student/profile", {
      method: "GET",
    });
  }

  /** Đổi mật khẩu; BE kiểm tra mật khẩu hiện tại và độ dài 8–72 ký tự. */
  changePassword(body: ChangePasswordRequest): Promise<void> {
    return this.request<void>("/auth/change-password", { body });
  }
}
