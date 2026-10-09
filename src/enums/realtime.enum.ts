/* eslint-disable @typescript-eslint/no-redeclare -- hằng `as const` và kiểu cùng tên là chủ đích (dùng như enum). */
// Dạng hằng `as const` + kiểu cùng tên: dùng như enum (`X.Member`) mà chuỗi backend vẫn gán được trực tiếp.

/** Mức độ cảnh báo IoT. */
export const IncidentSeverity = {
  Info: "INFO",
  Warning: "WARNING",
  Danger: "DANGER",
} as const;
export type IncidentSeverity = (typeof IncidentSeverity)[keyof typeof IncidentSeverity];

/** Trạng thái xử lý cảnh báo IoT. */
export const IncidentStatus = {
  Open: "OPEN",
  Acknowledged: "ACKNOWLEDGED",
  Resolved: "RESOLVED",
} as const;
export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus];
