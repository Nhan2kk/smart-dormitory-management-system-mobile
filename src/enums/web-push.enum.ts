/** Kết quả bật thông báo đẩy trên web. */
export enum WebPushEnableResult {
  Enabled = "enabled",
  /** Trình duyệt / thiết bị không hỗ trợ (vd. iPhone mở trong Safari, chưa thêm vào màn hình chính). */
  Unsupported = "unsupported",
  /** Người dùng đã từ chối quyền thông báo. */
  Denied = "denied",
  /** Máy chủ chưa cấu hình khóa VAPID. */
  ServerDisabled = "server-disabled",
}
