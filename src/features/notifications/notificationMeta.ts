import type { Href } from "expo-router";
import type { Tone } from "../../shared/theme";
import type { IconName } from "../../shared/ui";
import type { NotificationKind } from "../../enums/notification.enum";

export const notificationKindMeta: Record<NotificationKind, { icon: IconName; tone: Tone }> = {
  info: { icon: "megaphone-outline", tone: "info" },
  success: { icon: "checkmark-done-outline", tone: "success" },
  warning: { icon: "time-outline", tone: "warning" },
  danger: { icon: "alert-circle-outline", tone: "danger" },
  system: { icon: "sparkles-outline", tone: "violet" },
  chat: { icon: "chatbubbles-outline", tone: "primary" },
};

/** Các trang yêu cầu của sinh viên mà thông báo nghiệp vụ trỏ tới. */
export const REQUEST_PATH_PREFIXES = ["/student/requests", "/student/check-in", "/student/register-dorm", "/student/debts", "/student/residency-record"];

/**
 * Chuyển `targetPath` (đường dẫn trang web) sang màn hình tương ứng trong app.
 * `null` nếu app không có màn hình phù hợp.
 */
export function notificationHref(targetPath: string | null): Href | null {
  if (!targetPath) return null;
  const [path, query = ""] = targetPath.split("?");
  const params = new URLSearchParams(query);
  switch (path.replace(/\/$/, "")) {
    case "/chat":
      return "/chat";
    case "/student/requests": {
      const id = params.get("id");
      const kind = params.get("kind");
      return id ? { pathname: "/request/[id]", params: kind ? { id, kind } : { id } } : "/requests";
    }
    case "/student/register-dorm":
      return "/register-dorm";
    case "/student/check-in":
      return "/check-in";
    case "/student/debts":
      return "/debts";
    case "/student/residency-record":
      return "/residency-record";
    case "/student/utilities":
      return "/utilities";
    default:
      return null;
  }
}
