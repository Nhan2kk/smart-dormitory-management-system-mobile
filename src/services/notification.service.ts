import type { ApiClient } from "../shared/api";
import { NotificationKind } from "../enums/notification.enum";
import type {
  AppNotification,
  NotificationPageResponse,
  NotificationResponse,
} from "../models/notification.model";

const KINDS = Object.values(NotificationKind) as NotificationKind[];

export class NotificationService {
  constructor(private readonly request: ApiClient) {}

  async list(size = 50): Promise<AppNotification[]> {
    const page = await this.request<NotificationPageResponse>(
      `/notifications?page=0&size=${size}`,
    );
    return page.content.map(NotificationService.toNotification);
  }

  async unreadCount(): Promise<number> {
    return (
      await this.request<{ unreadCount: number }>("/notifications/unread-count")
    ).unreadCount;
  }

  markRead(id: string): Promise<AppNotification> {
    return this.request<NotificationResponse>(
      `/notifications/${encodeURIComponent(id)}/read`,
    ).then(NotificationService.toNotification);
  }

  markAllRead(): Promise<{ updatedCount: number }> {
    return this.request<{ updatedCount: number }>("/notifications/read-all");
  }

  acknowledge(id: string): Promise<AppNotification> {
    return this.request<NotificationResponse>(
      `/notifications/${encodeURIComponent(id)}/acknowledgement`,
    ).then(NotificationService.toNotification);
  }

  private static toNotification(dto: NotificationResponse): AppNotification {
    const kind = dto.kind?.toLowerCase() as NotificationKind;
    return {
      id: dto.id,
      title: dto.title,
      content: dto.content,
      kind: KINDS.includes(kind) ? kind : NotificationKind.Info,
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
}
