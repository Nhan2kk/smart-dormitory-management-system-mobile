import type { ApiClient } from "../../shared/api";
import type { Attachment } from "../../shared/attachments";

// DTO đúng theo backend: /student/requests, /student/room-transfer-requests,
// /student/room-checkout-requests, /student/maintenance-requests, /student/bills, /student/residency-records.

export type RequestKind = "roomTransfer" | "roomCheckout" | "supportMaintenance";

type PageResponse<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number; last: boolean };

export type TimelineEntry = { status: string; occurredAt: string | null; actor: string | null };

export type Bill = {
  id: string;
  billType: "maintenanceCost" | "checkoutSettlement" | "roomTransferSettlement" | string;
  title: string | null;
  relatedAsset: string | null;
  amount: number;
  dueDate: string | null;
  status: "pending" | "paid" | "failed" | "cancelled" | string;
  paidAt: string | null;
};

export type RefundRecipient = { accountHolder: string | null; accountNumber: string | null; bankName: string | null; bankBranch: string | null };

export type RequestSummary = { id: string; kind: RequestKind; summary: string; submittedAt: string; status: string; billId: string | null; billStatus: string | null };

export type Location = { buildingId: string | null; building: string | null; floorId: string | null; floor: string | null; roomId: string | null; room: string | null; bedId: string | null; bed: string | null };

export type RoomTransferAssetEvaluation = { assetId: string; assetName: string; status: "ok" | "issue"; issueType: string | null; note: string | null; costAmount: number | null; costResponsibility: string | null };

/** pending (chờ BQL tiếp nhận) → inspection_scheduled (đã hẹn kiểm tra phòng cũ) → inspected (đã kiểm tra, chờ duyệt) → approved | awaiting_settlement. */
export type RoomTransferRequest = {
  id: string;
  submittedAt: string;
  status: "pending" | "inspection_scheduled" | "inspected" | "awaiting_settlement" | "approved" | "rejected" | "expired";
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
  id: string;
  building: string | null;
  floor: string | null;
  room: string | null;
  bed: string | null;
  submittedAt: string;
  expectedCheckoutDate: string;
  preferredInspectionDate: string | null;
  inspectionDate: string | null;
  status: "pending" | "inspection_scheduled" | "inspected" | "awaiting_settlement" | "approved" | "rejected" | "expired";
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

export type SupportIssueType = "electrical" | "plumbing" | "internet" | "doorLock" | "appliance" | "other";
export type IssueLocation = "room" | "commonArea";
export type Priority = "low" | "medium" | "high";

export type SupportMaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  issueType: SupportIssueType;
  issueLocation: IssueLocation;
  priority: Priority;
  status: "pending" | "received" | "repaired" | "completed" | "reopened" | "rejected";
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

export type Residency = { id: string; buildingId: string; buildingName: string; floorName: string; roomId: string; roomCode: string; bedId: string; bedCode: string };

export type RoomTransferCreateBody = {
  desiredBuildingId: string;
  desiredFloorId?: string;
  desiredRoomId: string;
  desiredBedId: string;
  reason: string;
  attachmentIds?: string[];
  priceDifferenceAcknowledged?: boolean;
  /** Ngày đề xuất BQL kiểm tra tài sản phòng hiện tại (yyyy-MM-dd, từ hôm nay) — bắt buộc. */
  preferredInspectionDate: string;
};
export type RoomCheckoutCreateBody = { expectedCheckoutDate: string; preferredInspectionDate: string; reason: string; studentNote?: string; attachmentIds?: string[] };
export type SupportCreateBody = { issueType: SupportIssueType; issueLocation: IssueLocation; priority: Priority; title: string; description: string; attachmentIds?: string[] };

const kindByPrefix: [string, RequestKind][] = [
  ["YCCP", "roomTransfer"],
  ["YCTP", "roomCheckout"],
  ["YCBT", "supportMaintenance"],
];

/** Mã yêu cầu mang tiền tố theo loại (YCCP-/YCTP-/YCBT-), dùng khi route không kèm `kind`. */
export function kindFromId(id: string): RequestKind | null {
  return kindByPrefix.find(([prefix]) => id.toUpperCase().startsWith(prefix))?.[1] ?? null;
}

const q = encodeURIComponent;

export function requestsApi(request: ApiClient) {
  return {
    /** Danh sách tổng hợp mọi loại yêu cầu của tôi, mới nhất trước. */
    mine: async (kind?: RequestKind) => {
      const page = await request<PageResponse<RequestSummary>>(`/student/requests?page=0&size=100${kind ? `&kind=${kind}` : ""}`, { method: "GET" });
      return page.content;
    },
    residency: () => request<Residency>("/student/residency-records", { method: "GET" }),

    transfer: (id: string) => request<RoomTransferRequest>(`/student/room-transfer-requests/${q(id)}`, { method: "GET" }),
    createTransfer: (body: RoomTransferCreateBody) => request<RoomTransferRequest>("/student/room-transfer-requests", { body }),
    previewTransferPrice: (desiredRoomId: string) => request<PricePreview>(`/student/room-transfer-requests/price-preview?desiredRoomId=${q(desiredRoomId)}`, { method: "GET" }),

    checkout: (id: string) => request<RoomCheckoutRequest>(`/student/room-checkout-requests/${q(id)}`, { method: "GET" }),
    createCheckout: (body: RoomCheckoutCreateBody) => request<RoomCheckoutRequest>("/student/room-checkout-requests", { body }),

    support: (id: string) => request<SupportMaintenanceRequest>(`/student/maintenance-requests/${q(id)}`, { method: "GET" }),
    createSupport: (body: SupportCreateBody) => request<SupportMaintenanceRequest>("/student/maintenance-requests", { body }),
    /** Sinh viên xác nhận kết quả sửa chữa (chỉ khi `repaired`). */
    confirmSupport: (id: string, body: { result: "done" | "not_done"; note?: string; attachmentIds?: string[] }) =>
      request<SupportMaintenanceRequest>(`/student/maintenance-requests/${q(id)}/confirmation`, { method: "PUT", body }),

    payBill: (id: string) => request<Bill>(`/student/bills/${q(id)}/payment`, { body: { paymentMethod: "bank_transfer" } }),
  };
}
