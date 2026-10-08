import type { Href } from "expo-router";
import type { ApiClient } from "../../shared/api";
import type { Tone } from "../../shared/theme";
import type { IconName } from "../../shared/ui";

export type NotificationKind = "info" | "success" | "warning" | "danger" | "system";
export type NotificationPriority = "NORMAL" | "IMPORTANT" | "URGENT";
export type NotificationSource = "ANNOUNCEMENT" | "MANUAL" | "SYSTEM";

/** DTO của `POST /notifications` (NotifyResponse). */
type NotifyDto = {
  id: string;
  title: string;
  content: string;
  kind: string;
  priority: NotificationPriority;
  sourceType: NotificationSource;
  sourceId: string;
  createdByName: string | null;
  targetPath: string | null;
  requiresAcknowledgement: boolean;
  readAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
};

type PageResponse<T> = { content: T[]; last: boolean };

export type AppNotification = {
  id: string;
  title: string;
  content: string;
  kind: NotificationKind;
  priority: NotificationPriority;
  source: NotificationSource;
  sender: string | null;
  sentAt: string;
  read: boolean;
  requiresAcknowledgement: boolean;
  acknowledgedAt: string | null;
  /** Đường dẫn web do BE gửi kèm (vd. `/student/requests?kind=roomTransfer&id=...`). */
  targetPath: string | null;
};

export const notificationKindMeta: Record<NotificationKind, { icon: IconName; tone: Tone }> = {
  info: { icon: "megaphone-outline", tone: "info" },
  success: { icon: "checkmark-done-outline", tone: "success" },
  warning: { icon: "time-outline", tone: "warning" },
  danger: { icon: "alert-circle-outline", tone: "danger" },
  system: { icon: "sparkles-outline", tone: "violet" },
};

const KINDS: NotificationKind[] = ["info", "success", "warning", "danger", "system"];

function toNotification(dto: NotifyDto): AppNotification {
  const kind = dto.kind?.toLowerCase() as NotificationKind;
  return {
    id: dto.id,
    title: dto.title,
    content: dto.content,
    kind: KINDS.includes(kind) ? kind : "info",
    priority: dto.priority ?? "NORMAL",
    source: dto.sourceType ?? "SYSTEM",
    sender: dto.createdByName,
    sentAt: dto.createdAt,
    read: dto.readAt !== null,
    requiresAcknowledgement: dto.requiresAcknowledgement,
    acknowledgedAt: dto.acknowledgedAt,
    targetPath: dto.targetPath,
  };
}

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

export function notificationsApi(request: ApiClient) {
  return {
    list: async (size = 50) => {
      const page = await request<PageResponse<NotifyDto>>(`/notifications?page=0&size=${size}`);
      return page.content.map(toNotification);
    },
    unreadCount: async () => (await request<{ unreadCount: number }>("/notifications/unread-count")).unreadCount,
    markRead: (id: string) => request<NotifyDto>(`/notifications/${encodeURIComponent(id)}/read`).then(toNotification),
    markAllRead: () => request<{ updatedCount: number }>("/notifications/read-all"),
    acknowledge: (id: string) => request<NotifyDto>(`/notifications/${encodeURIComponent(id)}/acknowledgement`).then(toNotification),
  };
}
