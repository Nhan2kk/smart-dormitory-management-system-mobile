import type { Attachment } from "../shared/attachments";
import type { Localized } from "../shared/i18n/types";
import type { Tone } from "../shared/theme";
import type {
  IssueLocation,
  Priority,
  RequestAction,
  RequestKind,
  RequestStatus,
  SupportIssueType,
  TimelineState,
} from "../enums/request.enum";

export type RequestPageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type TimelineEntry = {
  status: string;
  occurredAt: string | null;
  actor: string | null;
};

export type Bill = {
  id: string;
  billType:
    | "maintenanceCost"
    | "checkoutSettlement"
    | "roomTransferSettlement"
    | string;
  title: string | null;
  relatedAsset: string | null;
  amount: number;
  dueDate: string | null;
  status: "pending" | "paid" | "failed" | "cancelled" | string;
  paidAt: string | null;
};

export type RefundRecipient = {
  accountHolder: string | null;
  accountNumber: string | null;
  bankName: string | null;
  bankBranch: string | null;
};

export type RequestSummary = {
  requestType?: "normal" | "term_end" | null;
  id: string;
  kind: RequestKind;
  summary: string;
  submittedAt: string;
  status: string;
  billId: string | null;
  billStatus: string | null;
};

export type Location = {
  buildingId: string | null;
  building: string | null;
  floorId: string | null;
  floor: string | null;
  roomId: string | null;
  room: string | null;
  bedId: string | null;
  bed: string | null;
};

export type RoomTransferAssetEvaluation = {
  assetId: string;
  assetName: string;
  status: "ok" | "issue";
  issueType: string | null;
  note: string | null;
  costAmount: number | null;
  costResponsibility: string | null;
};

export type RoomTransferRequest = {
  id: string;
  submittedAt: string;
  status:
    | "pending"
    | "inspection_scheduled"
    | "inspected"
    | "awaiting_settlement"
    | "approved"
    | "rejected"
    | "expired";
  preferredInspectionDate: string | null;
  inspectionDate: string | null;
  assetEvaluations: RoomTransferAssetEvaluation[];
  currentLocation: Location | null;
  desiredLocation: Location | null;
  reason: string;
  attachments: Attachment[];
  processedNote: string | null;
  originCheckInId: string | null;
  priceDifferenceAmount: number | null;
  compensationAmount: number | null;
  settlementRequired: boolean;
  settlementDueAt: string | null;
  settlementBills: Bill[];
  refundAmount: number | null;
  refundConfirmed: boolean;
  history: TimelineEntry[];
  postTransferCheckInId: string | null;
  postTransferCheckInStatus: string | null;
  acknowledgedPriceDifference: number | null;
  refundRecipient: RefundRecipient | null;
};

export type RoomCheckoutRequest = {
  requestType?: "normal" | "term_end";
  id: string;
  building: string | null;
  floor: string | null;
  room: string | null;
  bed: string | null;
  submittedAt: string;
  expectedCheckoutDate: string;
  preferredInspectionDate: string | null;
  inspectionDate: string | null;
  status:
    | "pending"
    | "inspection_scheduled"
    | "inspected"
    | "awaiting_settlement"
    | "approved"
    | "rejected"
    | "expired";
  reason: string;
  studentNote: string | null;
  attachments: Attachment[];
  processedNote: string | null;
  outstandingDebt: number | null;
  compensationAmount: number | null;
  rentRefundAmount: number | null;
  debtOffsetAmount: number | null;
  refundPayoutAmount: number | null;
  refundConfirmed: boolean;
  bills: Bill[];
  history: TimelineEntry[];
  settlementMessage: string | null;
  refundRecipient: RefundRecipient | null;
};

export type SupportMaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  issueType: SupportIssueType;
  issueLocation: IssueLocation;
  priority: Priority;
  status:
    | "pending"
    | "received"
    | "repaired"
    | "completed"
    | "reopened"
    | "rejected";
  building: string | null;
  room: string | null;
  submittedAt: string;
  attachments: Attachment[];
  processedNote: string | null;
  processedBy: string | null;
  source: "student_submitted" | "check_in";
  costAmount: number | null;
  costResponsibility: string | null;
  bill: Bill | null;
  reopenCount: number;
  history: TimelineEntry[];
};

export type PricePreview = {
  priceDifferenceAmount: number | null;
  refundAmount: number | null;
  currentRoomPrice: number | null;
  desiredRoomPrice: number | null;
  monthlyDifference: number | null;
  remainingMonths: number | null;
  totalMonths: number | null;
};

export type Residency = {
  id: string;
  buildingId: string;
  buildingName: string;
  floorName: string;
  roomId: string;
  roomCode: string;
  bedId: string;
  bedCode: string;
};

export type RoomTransferCreateBody = {
  desiredBuildingId: string;
  desiredFloorId?: string;
  desiredRoomId: string;
  desiredBedId: string;
  reason: string;
  attachmentIds?: string[];
  priceDifferenceAcknowledged?: boolean;
  preferredInspectionDate: string;
};
export type RoomCheckoutCreateBody = {
  expectedCheckoutDate: string;
  preferredInspectionDate: string;
  reason: string;
  studentNote?: string;
  attachmentIds?: string[];
};
export type SupportCreateBody = {
  issueType: SupportIssueType;
  issueLocation: IssueLocation;
  priority: Priority;
  title: string;
  description: string;
  attachmentIds?: string[];
};

export type StudentRequest = {
  requestType?: "normal" | "term_end" | null;
  id: string;
  kind: RequestKind;
  title: Localized;
  summary?: Localized;
  submittedAt: string;
  status: RequestStatus;
  action?: RequestAction;
};

export type RequestDetail = StudentRequest & {
  attachments?: Attachment[];
  details: { label: Localized; value: Localized | string }[];
  timeline: {
    title: Localized;
    description?: Localized;
    time?: string;
    state: TimelineState;
  }[];
  notice?: { tone: Tone; text: Localized };
  rejectReason?: string;
  settlement?: {
    lines: { label: Localized; amount: number }[];
    total: number;
    dueAt?: string;
    billId?: string;
    refund?: boolean;
    refunded?: boolean;
  };
  refundAccount?: { bank: string; account: string };
  checkInId?: string;
};
