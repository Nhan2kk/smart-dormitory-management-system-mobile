/* eslint-disable @typescript-eslint/no-redeclare -- hằng `as const` và kiểu cùng tên là chủ đích (dùng như enum). */
// Dạng hằng `as const` + kiểu cùng tên: dùng như enum (`X.Member`) mà chuỗi backend vẫn gán được trực tiếp.

/** Loại yêu cầu của sinh viên. */
export const RequestKind = {
  RoomTransfer: "roomTransfer",
  RoomCheckout: "roomCheckout",
  SupportMaintenance: "supportMaintenance",
} as const;
export type RequestKind = (typeof RequestKind)[keyof typeof RequestKind];

/** Trạng thái yêu cầu hiển thị trên app. */
export const RequestStatus = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
  InspectionScheduled: "inspection_scheduled",
  Inspected: "inspected",
  AwaitingSettlement: "awaiting_settlement",
  Received: "received",
  Repaired: "repaired",
  Reopened: "reopened",
  Completed: "completed",
  Expired: "expired",
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

/** Hành động sinh viên cần làm tiếp với yêu cầu. */
export const RequestAction = {
  ConfirmRepair: "confirmRepair",
  Pay: "pay",
  CheckIn: "checkIn",
  Resubmit: "resubmit",
} as const;
export type RequestAction = (typeof RequestAction)[keyof typeof RequestAction];

/** Trạng thái một bước trên dòng thời gian. */
export const TimelineState = {
  Done: "done",
  Current: "current",
  Upcoming: "upcoming",
  Failed: "failed",
} as const;
export type TimelineState = (typeof TimelineState)[keyof typeof TimelineState];

/** Loại sự cố cần hỗ trợ sửa chữa. */
export const SupportIssueType = {
  Electrical: "electrical",
  Plumbing: "plumbing",
  Internet: "internet",
  DoorLock: "doorLock",
  Appliance: "appliance",
  Other: "other",
} as const;
export type SupportIssueType = (typeof SupportIssueType)[keyof typeof SupportIssueType];

/** Vị trí sự cố. */
export const IssueLocation = {
  Room: "room",
  CommonArea: "commonArea",
} as const;
export type IssueLocation = (typeof IssueLocation)[keyof typeof IssueLocation];

/** Mức ưu tiên yêu cầu hỗ trợ. */
export const Priority = {
  Low: "low",
  Medium: "medium",
  High: "high",
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];
