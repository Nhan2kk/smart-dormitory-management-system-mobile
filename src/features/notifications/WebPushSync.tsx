import { useEffect, useMemo } from "react";
import { WebPushService } from "../../services/web-push.service";
import { usePreferences } from "../../shared/preferences";
import { useAuth } from "../auth/AuthProvider";

/**
 * Bản web: đăng ký service worker khi vào app, và nếu máy này đã bật thông báo đẩy thì gửi lại đăng ký
 * cho tài khoản đang đăng nhập (đổi tài khoản trên cùng máy vẫn nhận đúng người). Không hiển thị gì.
 */
export function WebPushSync() {
  const { user, request } = useAuth();
  const { push, ready } = usePreferences();
  const service = useMemo(() => new WebPushService(request), [request]);
  const userId = user?.id;

  useEffect(() => {
    if (!WebPushService.supported || !userId || !ready) return;
    if (!push) return;
    const sync = () => {
      if (document.visibilityState === "visible") void service.sync();
    };
    sync();
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", sync);
    };
    // Chỉ chạy lại khi đổi người dùng hoặc bật/tắt, không theo mỗi lần làm mới token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, push, ready]);

  return null;
}
