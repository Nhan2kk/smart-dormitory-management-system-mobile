import { Client, ReconnectionTimeMode, type IMessage } from "@stomp/stompjs";
import { Platform } from "react-native";

/** Bản web (trình duyệt) dùng WebSocket chuẩn; các bản vá khung STOMP chỉ dành cho React Native. */
const isNative = Platform.OS !== "web";

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
/**
 * Header `Origin` gửi khi mở WebSocket. Backend chỉ nhận các origin trong `CORS_ALLOWED_ORIGINS`;
 * React Native tự gửi origin theo chính địa chỉ socket nên mặc định có thể bị từ chối (403).
 * Đặt `EXPO_PUBLIC_WS_ORIGIN` bằng domain web đã được cho phép, hoặc thêm origin của API vào CORS backend.
 */
const origin = process.env.EXPO_PUBLIC_WS_ORIGIN?.replace(/\/$/, "");
const STOMP_PROTOCOLS = ["v12.stomp", "v11.stomp", "v10.stomp"];

export type RealtimeSubscription = {
  destination: string;
  onMessage: (body: unknown) => void;
};

export type RealtimeHandlers = {
  onConnected?: (connected: boolean) => void;
  /** Kết nối lại sau khi rớt: nơi gọi nên tải lại dữ liệu có thể đã lỡ. */
  onReconnect?: () => void;
  /** Server từ chối (thường do access token hết hạn): nơi gọi làm mới token rồi mở lại. */
  onAuthError?: () => void;
};

/**
 * Kết nối STOMP tới `{EXPO_PUBLIC_API_URL}/ws` cho mobile, tự kết nối lại (lùi dần tới 30 giây).
 * WebSocket của React Native khác trình duyệt nên ép khung nhị phân và bù ký tự NULL kết thúc khung.
 */
export class RealtimeConnection {
  private readonly client: Client;
  private connectedOnce = false;

  private constructor(
    token: string,
    subscriptions: RealtimeSubscription[],
    handlers: RealtimeHandlers,
  ) {
    const url = RealtimeConnection.url();
    this.client = new Client({
      webSocketFactory: () => {
        // Trình duyệt tự gửi Origin và không nhận tham số header.
        if (!isNative) return new WebSocket(url, STOMP_PROTOCOLS);
        // React Native nhận tham số thứ ba để đặt header (không có trong WebSocket của trình duyệt).
        const NativeWebSocket = WebSocket as unknown as new (
          url: string,
          protocols: string[],
          options?: { headers: Record<string, string> },
        ) => WebSocket;
        return new NativeWebSocket(
          url,
          STOMP_PROTOCOLS,
          origin ? { headers: { Origin: origin } } : undefined,
        );
      },
      connectHeaders: { Authorization: `Bearer ${token}` },
      forceBinaryWSFrames: isNative,
      appendMissingNULLonIncoming: isNative,
      connectionTimeout: 10_000,
      reconnectDelay: 2_000,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
      maxReconnectDelay: 30_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      onConnect: () => {
        handlers.onConnected?.(true);
        if (this.connectedOnce) handlers.onReconnect?.();
        this.connectedOnce = true;
        for (const subscription of subscriptions) {
          this.client.subscribe(
            subscription.destination,
            (message: IMessage) => {
              try {
                subscription.onMessage(JSON.parse(message.body));
              } catch {
                // Bỏ qua khung lỗi, giữ kênh tiếp tục chạy.
              }
            },
          );
        }
      },
      onDisconnect: () => handlers.onConnected?.(false),
      onWebSocketClose: () => handlers.onConnected?.(false),
      onStompError: () => {
        handlers.onConnected?.(false);
        handlers.onAuthError?.();
      },
    });
  }

  static get configured(): boolean {
    return !!apiUrl;
  }

  /** Mở kết nối; trả về hàm đóng (dùng làm cleanup của `useEffect`). */
  static open(
    token: string,
    subscriptions: RealtimeSubscription[],
    handlers: RealtimeHandlers = {},
  ): () => void {
    const connection = new RealtimeConnection(token, subscriptions, handlers);
    connection.client.activate();
    return () => {
      void connection.client.deactivate();
    };
  }

  private static url(): string {
    return `${(apiUrl ?? "").replace(/^http/, "ws")}/ws`;
  }
}
