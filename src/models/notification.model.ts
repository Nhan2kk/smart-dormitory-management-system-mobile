import type {
  NotificationKind,
  NotificationPriority,
  NotificationSource,
} from "../enums/notification.enum";

export interface NotificationResponse {
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
}

export interface NotificationPageResponse {
  content: NotificationResponse[];
  last: boolean;
}

export interface AppNotification {
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
  targetPath: string | null;
}
