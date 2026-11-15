/* eslint-disable @typescript-eslint/no-redeclare -- hằng `as const` và kiểu cùng tên là chủ đích (dùng như enum). */
// Dạng hằng `as const` + kiểu cùng tên: dùng như enum (`X.Member`) mà chuỗi backend vẫn gán được trực tiếp.

/** Trạng thái đợt đăng ký hiện tại. */
export const CampaignState = {
  Open: "OPEN",
  Upcoming: "UPCOMING",
  None: "NONE",
} as const;
export type CampaignState = (typeof CampaignState)[keyof typeof CampaignState];

/** Phạm vi tòa nhà của đợt đăng ký. */
export const ScopeType = {
  AllBuildings: "ALL_BUILDINGS",
  SelectedBuildings: "SELECTED_BUILDINGS",
} as const;
export type ScopeType = (typeof ScopeType)[keyof typeof ScopeType];

/** Thời hạn đăng ký gửi lên BE. */
export const PricingPeriod = {
  SixMonths: "6months",
  OneYear: "1year",
} as const;
export type PricingPeriod = (typeof PricingPeriod)[keyof typeof PricingPeriod];

/** Trạng thái đơn đăng ký KTX. */
export const RegistrationStatus = {
  PendingPayment: "pending_payment",
  Paid: "paid",
  Approved: "approved",
  Cancelled: "cancelled",
  Expired: "expired",
  Completed: "completed",
} as const;
export type RegistrationStatus = (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

/** Tình trạng phòng hiển thị khi chọn phòng. */
export const RoomStatus = {
  Available: "available",
  Full: "full",
  Maintenance: "maintenance",
} as const;
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

/** Tình trạng giường. */
export const BedStatus = {
  Available: "available",
  Occupied: "occupied",
  Reserved: "reserved",
  Maintenance: "maintenance",
} as const;
export type BedStatus = (typeof BedStatus)[keyof typeof BedStatus];
