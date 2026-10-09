/* eslint-disable @typescript-eslint/no-redeclare -- hằng `as const` và kiểu cùng tên là chủ đích (dùng như enum). */
// Dạng hằng `as const` + kiểu cùng tên: dùng như enum (`X.Member`) mà chuỗi backend vẫn gán được trực tiếp.

/** Loại thông báo (đã chuẩn hoá chữ thường). */
export const NotificationKind = {
  Info: "info",
  Success: "success",
  Warning: "warning",
  Danger: "danger",
  System: "system",
} as const;
export type NotificationKind = (typeof NotificationKind)[keyof typeof NotificationKind];

/** Mức ưu tiên thông báo. */
export const NotificationPriority = {
  Normal: "NORMAL",
  Important: "IMPORTANT",
  Urgent: "URGENT",
} as const;
export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];

/** Nguồn tạo thông báo. */
export const NotificationSource = {
  Announcement: "ANNOUNCEMENT",
  Manual: "MANUAL",
  System: "SYSTEM",
} as const;
export type NotificationSource = (typeof NotificationSource)[keyof typeof NotificationSource];
