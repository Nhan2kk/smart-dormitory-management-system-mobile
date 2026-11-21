import { Platform } from "react-native";
import { WebPushEnableResult } from "../enums/web-push.enum";
import type { WebPushPublicKeyResponse, WebPushSubscribeRequest } from "../models/web-push.model";
import type { ApiClient } from "../shared/api";

const SERVICE_WORKER_PATH = "/sw.js";

/**
 * Thông báo đẩy trên thiết bị cho bản web (Web Push): đăng ký service worker, xin quyền, đăng ký với
 * dịch vụ đẩy của trình duyệt rồi gửi đăng ký lên máy chủ. iPhone chỉ hỗ trợ khi mở từ icon ở màn hình
 * chính (iOS 16.4+). Bản iOS/Android gốc không dùng lớp này.
 */
export class WebPushService {
  private static confirmed = false;
  private static listeners = new Set<() => void>();
  static isConfirmed = () => WebPushService.confirmed && WebPushService.granted;
  static observe = (listener: () => void) => {
    WebPushService.listeners.add(listener);
    return () => { WebPushService.listeners.delete(listener); };
  };

  private static confirm(value: boolean) {
    WebPushService.confirmed = value;
    WebPushService.listeners.forEach((listener) => listener());
  }

  constructor(private readonly request: ApiClient) {}

  /** Trình duyệt hiện tại có đủ API để nhận thông báo đẩy. */
  static get supported(): boolean {
    return (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  /** Đã cấp quyền thông báo cho trang này. */
  static get granted(): boolean {
    return WebPushService.supported && Notification.permission === "granted";
  }

  /** Đăng ký service worker (gọi sớm khi mở app; an toàn khi gọi lại). */
  static registerWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!WebPushService.supported) return Promise.resolve(null);
    return navigator.serviceWorker.register(SERVICE_WORKER_PATH);
  }

  /**
   * Bật thông báo đẩy. Phải gọi ngay trong sự kiện bấm của người dùng: iOS chỉ cho xin quyền
   * khi có thao tác trực tiếp, nên việc xin quyền chạy trước mọi lệnh chờ khác.
   */
  async enable(): Promise<WebPushEnableResult> {
    if (!WebPushService.supported) return WebPushEnableResult.Unsupported;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return WebPushEnableResult.Denied;
    return this.subscribe();
  }

  /**
   * Gửi lại đăng ký hiện có của máy này cho người dùng đang đăng nhập (đã cấp quyền từ trước),
   * để đổi tài khoản trên cùng máy thì thông báo về đúng người. Không hỏi quyền.
   */
  async sync(): Promise<void> {
    if (!WebPushService.granted) return WebPushService.confirm(false);
    await this.subscribe().catch(() => WebPushService.confirm(false));
  }

  /** Tắt thông báo đẩy trên máy này: bỏ đăng ký ở máy chủ và ở trình duyệt. */
  async disable(): Promise<void> {
    WebPushService.confirm(false);
    const subscription = await WebPushService.currentSubscription();
    if (!subscription) return;
    await this.request("/notifications/push/unsubscribe", { body: { endpoint: subscription.endpoint } }).catch(
      () => undefined,
    );
    await subscription.unsubscribe().catch(() => false);
  }

  /** Bỏ liên kết máy này với tài khoản ở máy chủ (khi đăng xuất), giữ quyền của trình duyệt. */
  async detach(): Promise<void> {
    WebPushService.confirm(false);
    const subscription = await WebPushService.currentSubscription();
    if (!subscription) return;
    await this.request("/notifications/push/unsubscribe", { body: { endpoint: subscription.endpoint } }).catch(
      () => undefined,
    );
  }

  private async subscribe(): Promise<WebPushEnableResult> {
    const key = await this.request<WebPushPublicKeyResponse>("/notifications/push/public-key");
    if (!key.enabled || !key.publicKey) {
      WebPushService.confirm(false);
      return WebPushEnableResult.ServerDisabled;
    }
    await WebPushService.registerWorker();
    const registration = await navigator.serviceWorker.ready;
    const applicationServerKey = WebPushService.decodeKey(key.publicKey);
    let subscription = await registration.pushManager.getSubscription();
    // Máy chủ đổi khóa VAPID thì đăng ký cũ không dùng được nữa: tạo lại.
    if (subscription && !WebPushService.sameKey(subscription, applicationServerKey)) {
      await subscription.unsubscribe().catch(() => false);
      subscription = null;
    }
    subscription ??= await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
    await this.request("/notifications/push/subscribe", { body: WebPushService.toRequest(subscription) });
    WebPushService.confirm(true);
    return WebPushEnableResult.Enabled;
  }

  private static async currentSubscription(): Promise<PushSubscription | null> {
    if (!WebPushService.supported) return null;
    const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH).catch(() => undefined);
    return (await registration?.pushManager.getSubscription().catch(() => null)) ?? null;
  }

  private static toRequest(subscription: PushSubscription): WebPushSubscribeRequest {
    const json = subscription.toJSON();
    return {
      endpoint: subscription.endpoint,
      keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
    };
  }

  private static sameKey(subscription: PushSubscription, key: Uint8Array): boolean {
    const current = subscription.options.applicationServerKey;
    if (!current) return true;
    const bytes = new Uint8Array(current);
    return bytes.length === key.length && bytes.every((value, index) => value === key[index]);
  }

  /** base64url → byte. */
  private static decodeKey(base64Url: string): Uint8Array<ArrayBuffer> {
    const padded = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded);
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }
}
