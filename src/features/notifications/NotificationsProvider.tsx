import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { errorMessage } from "../../shared/api";
import { useToast } from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { useRealtime } from "../realtime/RealtimeProvider";
import { AppNotification, notificationKindMeta, notificationsApi } from "./notificationsApi";

/** Chu kỳ hỏi thông báo mới khi app đang mở nhưng WebSocket chưa kết nối được (dự phòng). */
const POLL_MS = 30_000;

type NotificationsValue = {
  items: AppNotification[] | null;
  unreadCount: number;
  error: string | null;
  /** Thông báo mới nhất vừa xuất hiện kể từ lần tải trước — màn nghiệp vụ dùng để tự tải lại. */
  lastIncoming: AppNotification | null;
  reload: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  acknowledge: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { request } = useAuth();
  const { notify } = useToast();
  const { connected, notifySignal } = useRealtime();
  const api = useMemo(() => notificationsApi(request), [request]);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastIncoming, setLastIncoming] = useState<AppNotification | null>(null);
  const seen = useRef<Set<string> | null>(null);

  const reload = useCallback(async () => {
    try {
      const [list, unread] = await Promise.all([api.list(), api.unreadCount()]);
      // Lần tải đầu chỉ ghi nhận; các lần sau, thông báo chưa đọc chưa từng thấy là "mới đến".
      if (seen.current) {
        const fresh = list.filter((item) => !item.read && !seen.current!.has(item.id));
        if (fresh.length) {
          setLastIncoming(fresh[0]);
          // Cảnh báo IoT (danger/warning) hiện toast cùng màu mức độ.
          notify(fresh[0].title, notificationKindMeta[fresh[0].kind]?.tone ?? "info");
        }
      }
      seen.current = new Set(list.map((item) => item.id));
      setItems(list);
      setUnreadCount(unread);
      setError(null);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }, [api, notify]);

  // Có thông báo mới qua WebSocket (hoặc vừa nối lại) → tải lại danh sách.
  useEffect(() => {
    if (notifySignal > 0) reload();
  }, [notifySignal, reload]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      reload();
      if (!connected) timer ??= setInterval(reload, POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    start();
    const subscription = AppState.addEventListener("change", (state) => (state === "active" ? start() : stop()));
    return () => {
      stop();
      subscription.remove();
    };
  }, [connected, reload]);

  const replace = useCallback((updated: AppNotification) => {
    setItems((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? current);
  }, []);

  const markRead = useCallback(
    async (id: string) => {
      const current = items?.find((item) => item.id === id);
      if (!current || current.read) return;
      replace({ ...current, read: true });
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        replace(await api.markRead(id));
      } catch {
        replace(current);
        setUnreadCount((count) => count + 1);
      }
    },
    [api, items, replace],
  );

  const markAllRead = useCallback(async () => {
    const previous = items;
    setItems((current) => current?.map((item) => ({ ...item, read: true })) ?? current);
    setUnreadCount(0);
    try {
      await api.markAllRead();
    } catch (reason) {
      setItems(previous);
      reload();
      throw reason;
    }
  }, [api, items, reload]);

  const acknowledge = useCallback(
    async (id: string) => {
      const wasUnread = items?.some((item) => item.id === id && !item.read);
      replace(await api.acknowledge(id));
      if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));
    },
    [api, items, replace],
  );

  const value = useMemo(
    () => ({ items, unreadCount, error, lastIncoming, reload, markRead, markAllRead, acknowledge }),
    [items, unreadCount, error, lastIncoming, reload, markRead, markAllRead, acknowledge],
  );
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications phải nằm trong NotificationsProvider");
  return context;
}

/**
 * Gọi `onNotify` khi có thông báo mới trỏ tới một trong các trang `pathPrefixes`
 * (vd. `/student/requests`) — để màn yêu cầu đang mở tự tải lại khi BQL vừa xử lý.
 */
export function useNotifyRefresh(pathPrefixes: string[], onNotify: () => void) {
  const { lastIncoming } = useNotifications();
  const callback = useRef(onNotify);
  const prefixes = useRef(pathPrefixes);

  useEffect(() => {
    callback.current = onNotify;
    prefixes.current = pathPrefixes;
  });

  useEffect(() => {
    const path = lastIncoming?.targetPath;
    if (path && prefixes.current.some((prefix) => path.startsWith(prefix))) callback.current();
  }, [lastIncoming?.id, lastIncoming?.targetPath]);
}
