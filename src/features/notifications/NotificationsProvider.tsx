import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { ApiError, errorMessage } from "../../shared/api";
import { useToast } from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { useRealtime } from "../realtime/RealtimeProvider";
import { AppNotification } from "../../models/notification.model";
import { notificationKindMeta } from "./notificationMeta";
import { NotificationService } from "../../services/notification.service";
import { useI18n } from "../../shared/i18n/I18nProvider";

/** Chu kỳ hỏi thông báo mới khi app đang mở nhưng WebSocket chưa kết nối được (dự phòng). */
const POLL_MS = 30_000;
/** Khoảng cách tối thiểu giữa hai lượt tải danh sách (server cho tối đa 5 lượt / 2 giây). */
const MIN_RELOAD_GAP_MS = 2_000;

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
  const { t } = useI18n();
  const { request } = useAuth();
  const { notify } = useToast();
  const { connected, notifySignal } = useRealtime();
  const api = useMemo(() => new NotificationService(request), [request]);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastIncoming, setLastIncoming] = useState<AppNotification | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const alive = useRef(true);
  /** Lượt tải đang chạy, lượt đang chờ chạy (gộp mọi lần gọi trong lúc chờ) và thời điểm bắt đầu lượt gần nhất. */
  const running = useRef<Promise<void> | null>(null);
  const queued = useRef<Promise<void> | null>(null);
  const lastStartedAt = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const fetchNow = useCallback(async () => {
    try {
      const [list, unread] = await Promise.all([api.list(), api.unreadCount()]);
      // Lần tải đầu chỉ ghi nhận; các lần sau, thông báo chưa đọc chưa từng thấy là "mới đến".
      if (seen.current) {
        const fresh = list.filter((item) => !item.read && !seen.current!.has(item.id));
        if (fresh.length) {
          setLastIncoming(fresh[0]);
          // Cảnh báo IoT (danger/warning) hiện toast cùng màu mức độ.
          notify(fresh[0].kind === "chat" ? t("chat.notificationTitle") : fresh[0].title, notificationKindMeta[fresh[0].kind]?.tone ?? "info");
        }
      }
      seen.current = new Set(list.map((item) => item.id));
      setItems(list);
      setUnreadCount(unread);
      setError(null);
    } catch (reason) {
      // Bị giới hạn tần suất (429): giữ danh sách đang có, không hiện lỗi, tự thử lại ở lượt sau.
      if (reason instanceof ApiError && reason.status === 429) return true;
      setError(errorMessage(reason));
    }
    return false;
  }, [api, notify, t]);

  /**
   * Tải lại có gộp: đang tải hoặc vừa tải chưa đủ MIN_RELOAD_GAP_MS thì các lần gọi dồn lại thành một lượt chạy sau.
   * Tránh WebSocket nối/rớt liên tục hoặc nhiều tín hiệu cùng lúc làm gọi API dồn dập (server trả 429).
   */
  const reload = useCallback((): Promise<void> => {
    if (queued.current) return queued.current;
    // Gán trước lần `await` đầu tiên nên bên trong luôn đọc được `task`.
    let task!: Promise<void>;
    task = (async () => {
      for (;;) {
        await running.current;
        const wait = lastStartedAt.current + MIN_RELOAD_GAP_MS - Date.now();
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        // Rời hàng chờ trước khi gọi API: tín hiệu mới đến trong lúc tải sẽ xếp một lượt mới.
        if (queued.current === task) queued.current = null;
        if (!alive.current) return;
        lastStartedAt.current = Date.now();
        let rateLimited = false;
        const current = fetchNow().then((limited) => {
          rateLimited = limited;
        });
        running.current = current;
        await current;
        if (running.current === current) running.current = null;
        // Bị 429 thì thử lại sau một khoảng giãn cách, trừ khi đã có lượt mới xếp hàng thay.
        if (!rateLimited || queued.current || !alive.current) return;
        queued.current = task;
      }
    })();
    queued.current = task;
    return task;
  }, [fetchNow]);

  // Tải lần đầu, và mỗi khi app quay lại trước màn hình.
  useEffect(() => {
    void reload();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void reload();
    });
    return () => subscription.remove();
  }, [reload]);

  // Có thông báo mới qua WebSocket (hoặc vừa nối lại) → tải lại danh sách.
  useEffect(() => {
    if (notifySignal > 0) void reload();
  }, [notifySignal, reload]);

  // Vừa kết nối WebSocket: tải bù phần có thể đã lỡ. Chưa kết nối: hỏi định kỳ làm dự phòng.
  useEffect(() => {
    if (connected) {
      void reload();
      return;
    }
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void reload();
    }, POLL_MS);
    return () => clearInterval(timer);
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
    () => {
      const localized = (item: AppNotification) => item.kind === "chat" ? { ...item, title: t("chat.notificationTitle"), content: t("chat.notificationBody") } : item;
      return { items: items?.map(localized) ?? null, unreadCount, error, lastIncoming: lastIncoming ? localized(lastIncoming) : null, reload, markRead, markAllRead, acknowledge };
    },
    [items, unreadCount, error, lastIncoming, reload, markRead, markAllRead, acknowledge, t],
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
