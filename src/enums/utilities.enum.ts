/* eslint-disable @typescript-eslint/no-redeclare -- hằng `as const` và kiểu cùng tên là chủ đích (dùng như enum). */
// Dạng hằng `as const` + kiểu cùng tên: dùng như enum (`X.Member`) mà chuỗi backend vẫn gán được trực tiếp.

/** Khoảng thời gian của biểu đồ điện nước. */
export const UtilityRange = {
  Day: "day",
  Week: "week",
  Month: "month",
} as const;
export type UtilityRange = (typeof UtilityRange)[keyof typeof UtilityRange];

/** Loại số đo. */
export const UtilityMetric = {
  Electricity: "electricity",
  Water: "water",
} as const;
export type UtilityMetric = (typeof UtilityMetric)[keyof typeof UtilityMetric];

/** Loại nhận xét rút ra từ số đo. */
export const UtilityInsightKind = {
  ElectricityUp: "electricityUp",
  ElectricityDown: "electricityDown",
  WaterUp: "waterUp",
  WaterDown: "waterDown",
  PeakHour: "peakHour",
  Stable: "stable",
} as const;
export type UtilityInsightKind = (typeof UtilityInsightKind)[keyof typeof UtilityInsightKind];
