/** Khóa công khai VAPID của máy chủ; `enabled=false` khi máy chủ chưa bật thông báo đẩy. */
export interface WebPushPublicKeyResponse {
  enabled: boolean;
  publicKey: string | null;
}

/** Đăng ký của trình duyệt gửi lên máy chủ (đúng dạng `PushSubscription.toJSON()`). */
export interface WebPushSubscribeRequest {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}
