/* eslint-disable @typescript-eslint/no-redeclare -- hằng `as const` và kiểu cùng tên là chủ đích (dùng như enum). */
// Dạng hằng `as const` + kiểu cùng tên: dùng như enum (`X.Member`) mà chuỗi backend vẫn gán được trực tiếp.

/** Loại sự cố tài sản khi nhận phòng. */
export const IssueType = {
  Damaged: "damaged",
  Missing: "missing",
  NotWorking: "notWorking",
  Abnormal: "abnormal",
} as const;
export type IssueType = (typeof IssueType)[keyof typeof IssueType];

/** Tình trạng đánh giá tài sản. */
export const AssetCondition = {
  Unchecked: "unchecked",
  Ok: "ok",
  Issue: "issue",
} as const;
export type AssetCondition = (typeof AssetCondition)[keyof typeof AssetCondition];
