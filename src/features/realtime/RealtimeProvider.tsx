import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { RealtimeConnection } from "../../shared/realtime";
import type {
  RoomIncident,
  TelemetryUpdate,
} from "../../models/realtime.model";
import type { RegistrationPaymentEvent } from "../../models/registration-payment.model";
import { useAuth } from "../auth/AuthProvider";

type RealtimeValue = {
  connected: boolean;
  /** Tăng mỗi khi có thông báo mới qua WebSocket — NotificationsProvider dựa vào để tải lại. */
  notifySignal: number;
  lastIncident: RoomIncident | null;
  lastTelemetry: TelemetryUpdate | null;
  lastRegistrationPayment: RegistrationPaymentEvent | null;
};

const RealtimeContext = createContext<RealtimeValue | null>(null);

/**
 * WebSocket của sinh viên khi app đang mở: thông báo, cảnh báo IoT của phòng và tín hiệu số đo giờ mới.
 * Ngắt khi app vào nền, mở lại khi quay lại; token hết hạn thì làm mới rồi kết nối lại.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { accessToken, refresh } = useAuth();
  const [active, setActive] = useState(AppState.currentState === "active");
  const [connected, setConnected] = useState(false);
  const [notifySignal, setNotifySignal] = useState(0);
  const [lastIncident, setLastIncident] = useState<RoomIncident | null>(null);
  const [lastTelemetry, setLastTelemetry] = useState<TelemetryUpdate | null>(
    null,
  );
  const [lastRegistrationPayment, setLastRegistrationPayment] =
    useState<RegistrationPaymentEvent | null>(null);
  /** Token đã thử làm mới: lỗi STOMP lặp lại với token mới thì không làm mới nữa (tránh vòng lặp). */
  const refreshedFor = useRef<string | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Đóng kết nối (cleanup) sẽ gọi onConnected(false) nên không cần đặt lại trạng thái ở đây.
    if (
      !active ||
      !accessToken ||
      accessToken === "mock" ||
      !RealtimeConnection.configured
    )
      return;
    const bump = () => setNotifySignal((value) => value + 1);
    return RealtimeConnection.open(
      accessToken,
      [
        { destination: "/user/queue/notifies", onMessage: bump },
        {
          destination: "/user/queue/registration-payments",
          onMessage: (body) =>
            setLastRegistrationPayment(body as RegistrationPaymentEvent),
        },
        {
          destination: "/user/queue/iot/incidents",
          onMessage: (body) => setLastIncident(body as RoomIncident),
        },
        {
          destination: "/user/queue/iot/telemetry",
          onMessage: (body) => setLastTelemetry(body as TelemetryUpdate),
        },
      ],
      {
        onConnected: setConnected,
        // Rớt mạng rồi nối lại: có thể đã lỡ thông báo nên tải lại một lượt.
        onReconnect: bump,
        onAuthError: () => {
          if (refreshedFor.current === accessToken) return;
          refreshedFor.current = accessToken;
          // Token mới làm `accessToken` đổi → effect tự mở kết nối mới.
          void refresh();
        },
      },
    );
  }, [active, accessToken, refresh]);

  // App ở nền thì coi như chưa kết nối (để thông báo quay về hỏi định kỳ khi mở lại cho tới lúc nối xong).
  const live = connected && active;
  const value = useMemo(
    () => ({
      connected: live,
      notifySignal,
      lastIncident,
      lastTelemetry,
      lastRegistrationPayment,
    }),
    [live, notifySignal, lastIncident, lastTelemetry, lastRegistrationPayment],
  );
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtime phải nằm trong RealtimeProvider");
  return context;
}
