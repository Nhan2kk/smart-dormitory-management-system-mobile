/** Phản hồi khi yêu cầu mã đặt lại mật khẩu (`POST /auth/password-reset/request`). */
export interface PasswordResetStart {
  /** Mã phiên đặt lại, gửi kèm khi xác nhận. */
  requestId: string;
  /** Email nhận mã đã che bớt, vd. "ng***@gmail.com". */
  maskedDestination: string;
  /** Thời hạn của mã (giây). */
  expiresInSeconds: number;
}

/** Dữ liệu xác nhận mã và đặt mật khẩu mới (`POST /auth/password-reset/confirm`). */
export interface PasswordResetConfirm {
  requestId: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}
