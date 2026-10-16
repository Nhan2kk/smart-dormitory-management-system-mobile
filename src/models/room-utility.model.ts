import type {
  BillMilestoneKey,
  RoomServiceState,
  RoomUtilityBillStage,
  RoomUtilityPayer,
  UtilityReportStatus,
  UtilityReportType,
  ViolationReason,
  ViolationStatus,
  ViolationTarget,
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
  reportDeadline: string | null;
  mine: boolean;
  aboutMe: boolean;
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
  stage: RoomUtilityBillStage;
  milestones: RoomUtilityMilestone[];
  /** Mốc sắp tới gần nhất (null nếu đã đóng hoặc đã qua mọi mốc). */
  nextMilestone: RoomUtilityMilestone | null;
  overdueDays: number;
  memberCount: number;
  /** Số tiền mỗi người, chỉ để tham khảo khi góp cho trưởng phòng. */
  sharePerMember: number;
  payableBy: RoomUtilityPayer;
  canPay: boolean;
  canReport: boolean;
  /** Hạn cuối gửi báo cáo (= hết ân hạn). */
  reportDeadline: string | null;
  reportableMembers: { id: string; name: string }[];
  myReport: RoomUtilityReport | null;
  reportedAgainstMe: boolean;
  violationTarget: ViolationTarget | null;
  violationRecordedAt: string | null;
  violatedStudents: {
    id: string;
    name: string;
    reason: ViolationReason;
    status: ViolationStatus;
  }[];
  suspensionEnabled: boolean;
  serviceState: RoomServiceState;
  serviceNote: string | null;
  disciplineProposedAt: string | null;
  paymentMethod: "SEPAY" | "CASH" | "ZERO" | null;
  cashReceiptNo: string | null;
};

export type RoomUtilityViolation = {
  id: string;
  billId: string;
  roomCode: string;
  reason: ViolationReason;
  status: ViolationStatus;
  amount: number;
  overdueDays: number;
  createdAt: string;
  revokeReason: string | null;
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
  schedule: {
    dueSoonWarningHours: number;
    dailyReminderHour: number;
    gracePeriodDays: number;
    suspensionEnabled: boolean;
    disciplineOverdueDays: number;
    disciplineViolationCount: number;
    disciplineWindowMonths: number;
  } | null;
  example: {
    month: string;
    closeAt: string;
    dueSoonAt: string;
    dueAt: string;
    graceEndsAt: string;
    disciplineAt: string;
  };
};
