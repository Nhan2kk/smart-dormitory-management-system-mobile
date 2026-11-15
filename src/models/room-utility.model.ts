import type {
  BillMilestoneKey,
  RoomUtilityBillStage,
  UtilityReportStatus,
  UtilityCommodity,
  UtilityReportType,
} from "../enums/room-utility.enum";

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

/** Một mốc thời gian của hóa đơn; `reached` = đã tới mốc. */
export type RoomUtilityMilestone = {
  key: BillMilestoneKey;
  at: string;
  reached: boolean;
};

/** Báo cáo tách trách nhiệm. Người bị báo không thấy người báo (`reporterName` = null). */
export type RoomUtilityReport = {
  id: string;
  billId: string;
  roomCode: string;
  type: UtilityReportType;
  status: UtilityReportStatus;
  reporterName: string | null;
  accusedStudentId: string;
  accusedName: string;
  content: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  reviewNote: string | null;
  mine: boolean;
  aboutMe: boolean;
};

/** Tiền một bậc giá trong hóa đơn. */
export type RoomUtilityChargeLine = {
  from: number | null;
  to: number | null;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
};

/** Tiền của một loại (điện hoặc nước) trong hóa đơn. */
export type RoomUtilityCharge = {
  commodity: UtilityCommodity;
  unit: string;
  consumption: number | null;
  amount: number;
  lines: RoomUtilityChargeLine[];
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
  /** Tiền điện, tiền nước; tổng bằng amount. Rỗng với hóa đơn quyết toán 0 ₫. */
  charges: RoomUtilityCharge[];
  status: "PENDING" | "PAID" | "OVERDUE";
  paidAt: string | null;
  stage: RoomUtilityBillStage;
  milestones: RoomUtilityMilestone[];
  /** Mốc sắp tới gần nhất (null nếu đã đóng hoặc đã qua mọi mốc). */
  nextMilestone: RoomUtilityMilestone | null;
  /** Hết thời gian được đóng trễ; chưa đóng sau mốc này là quá hạn. */
  lateUntil: string;
  /** Số ngày đã qua ngày thanh toán (0 nếu chưa qua hoặc đã đóng). */
  overdueDays: number;
  memberCount: number;
  /** Số tiền mỗi người, chỉ để tham khảo khi góp cho người đóng. */
  sharePerMember: number;
  /** Người xem là thành viên phòng và hóa đơn chưa đóng: được đóng toàn bộ. */
  canPay: boolean;
  canReport: boolean;
  reportableMembers: { id: string; name: string }[];
  myReport: RoomUtilityReport | null;
  reportedAgainstMe: boolean;
  paymentMethod: "SEPAY" | "CASH" | "ZERO" | null;
  cashReceiptNo: string | null;
};

export type RoomUtilityHandover = {
  id: string;
  previousRepresentativeId: string | null;
  representativeId: string;
  actorId: string;
  action: string;
  createdAt: string;
};

/** Quy định đóng tiền điện nước đang áp dụng và các mốc ví dụ của kỳ hiện tại. */
export type RoomUtilityPolicy = {
  /** Null khi BQL chưa cấu hình (áp dụng mặc định: chốt 01, hạn 10, trễ 5 ngày, nhắc trước 3 ngày). */
  schedule: {
    closeDay: number;
    dueDay: number;
    lateDays: number;
    reminderDays: number;
  } | null;
  example: {
    month: string;
    closeAt: string;
    reminderAt: string;
    dueAt: string;
    lateUntil: string;
  };
};

/** Sự kiện `/user/queue/room-utility-accounts`: trưởng phòng hoặc đề nghị bàn giao của phòng vừa đổi. */
export interface RoomUtilityAccountEvent {
  roomId: string;
  action: "PROPOSED" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "APPOINTED" | "CHECK_IN";
  representativeId: string | null;
  proposedRepresentativeId: string | null;
}
