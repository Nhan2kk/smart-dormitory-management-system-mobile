/** Các bước của luồng quên mật khẩu. */
export enum PasswordResetStep {
  /** Nhập email để nhận mã. */
  Email = 0,
  /** Nhập mã 6 số đã gửi về email. */
  Code = 1,
  /** Đặt mật khẩu mới. */
  Password = 2,
}
