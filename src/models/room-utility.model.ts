export type RoomUtilityAccount = {
  roomId: string;
  roomCode: string;
  representativeId: string | null;
  representativeName: string;
  proposedRepresentativeId: string | null;
  members: { id: string; name: string }[];
  lastClosedAt: string | null;
  debtConfirmedAt: string | null;
  debtResolution: string | null;
};
export type RoomUtilityBill = {
  id: string;
  roomId: string;
  roomCode: string;
  periodFrom: string;
  periodTo: string;
  dueAt: string;
  representativeId: string | null;
  representativeName: string;
  electricityKwh: number;
  waterM3: number;
  amount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  paidAt: string | null;
  canPay: boolean;
  pricingSnapshot: string;
  /** 0 chưa cảnh báo, 1 sắp tới hạn, 2 quá hạn, 3 đề nghị kỷ luật. */
  warningLevel: 0 | 1 | 2 | 3;
  overdueDays: number;
  violationRecordedAt: string | null;
  violationTarget: "ROOM" | "REPRESENTATIVE" | null;
  /** Mốc hệ thống ghi lỗi nếu phòng vẫn chưa đóng. */
  violationAt: string;
  canReport: boolean;
  reported: boolean;
  paymentMethod: "SEPAY" | "CASH" | "ZERO" | null;
  cashReceiptNo: string | null;
};
export type RoomUtilityViolation = {
  id: string;
  billId: string;
  roomCode: string;
  reason: "ROOM_UNPAID" | "REPRESENTATIVE_COLLECTED";
  amount: number;
  overdueDays: number;
  createdAt: string;
};
export type RoomUtilitySchedule = {
  id: string;
  closeDay: number;
  closeHour: number;
  paymentDays: number;
  dueHour: number;
  automaticIssue: boolean;
  effectiveFrom: string;
};
export type RoomUtilityPreview = {
  account: RoomUtilityAccount;
  from: string;
  to: string;
  dueAt: string;
  electricityKwh: number;
  waterM3: number;
  amount: number;
  pricingSnapshot: string;
};
export type RoomUtilityHandover = {
  id: string;
  previousRepresentativeId: string | null;
  representativeId: string;
  actorId: string;
  action: string;
  createdAt: string;
};
