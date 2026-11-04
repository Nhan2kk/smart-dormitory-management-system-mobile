import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState } from "react-native";
import type { ChatInfo } from "../../models/chat.model";
import { ChatService } from "../../services/chat.service";
import { useAuth } from "../auth/AuthProvider";
import { useRealtime } from "../realtime/RealtimeProvider";

type SupportChatState = {
  unread: number;
  info: ChatInfo | null;
  allowed: boolean;
  reload: () => Promise<void>;
};
const SupportChatContext = createContext<SupportChatState | null>(null);
export function SupportChatProvider({ children }: { children: ReactNode }) {
  const { request, user } = useAuth();
  const { lastChat, connected, reconnectSignal } = useRealtime();
  const allowed = !!user?.permissions?.includes("tin_nhan.su_dung");
  const service = useMemo(() => new ChatService(request), [request]);
  const [unread, setUnread] = useState(0);
  const [info, setInfo] = useState<ChatInfo | null>(null);
  const reload = useCallback(async () => {
    if (!allowed) return;
    const [count, currentInfo] = await Promise.all([
      service.unread(),
      service.info(),
    ]);
    setUnread(count.unreadCount);
    setInfo(currentInfo);
  }, [service, allowed]);
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    void Promise.all([service.unread(), service.info()])
      .then(([count, currentInfo]) => {
        if (active) {
          setUnread(count.unreadCount);
          setInfo(currentInfo);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [service, allowed, connected, reconnectSignal, lastChat]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void reload().catch(() => undefined);
    });
    const timer = setInterval(() => {
      if (AppState.currentState === "active")
        void reload().catch(() => undefined);
    }, 60000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [reload]);
  const value = useMemo(
    () => ({ unread: allowed ? unread : 0, info, allowed, reload }),
    [unread, info, allowed, reload],
  );
  return (
    <SupportChatContext.Provider value={value}>
      {children}
    </SupportChatContext.Provider>
  );
}
export function useSupportChatState() {
  const value = useContext(SupportChatContext);
  if (!value) throw new Error("SupportChatProvider is required");
  return value;
}
