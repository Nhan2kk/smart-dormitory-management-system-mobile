import { Formatter } from "../../shared/format";
import { L } from "../../shared/i18n/localized";
import type { Localized } from "../../shared/i18n/types";
import type { Tone } from "../../shared/theme";
import type { IconName } from "../../shared/ui";
import type { Bill, Location, RefundRecipient, RequestKind, RequestSummary, RoomCheckoutRequest, RoomTransferRequest, SupportMaintenanceRequest, TimelineEntry } from "./requestsApi";

export type { RequestKind } from "./requestsApi";

export type RequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "inspection_scheduled"
  | "inspected"
  | "awaiting_settlement"
  | "received"
  | "repaired"
  | "reopened"
  | "completed"
  | "expired";

/** Hành động sinh viên cần làm tiếp với yêu cầu. */
export type RequestAction = "confirmRepair" | "pay" | "checkIn" | "resubmit";

export type TimelineState = "done" | "current" | "upcoming" | "failed";

/** Dữ liệu hiển thị chung cho mọi loại yêu cầu (danh sách, trang chủ, chi tiết). */
export type StudentRequest = {
  id: string;
  kind: RequestKind;
  title: Localized;
  summary?: Localized;
  submittedAt: string;
  status: RequestStatus;
  action?: RequestAction;
};

export type RequestDetail = StudentRequest & {
  details: { label: Localized; value: Localized | string }[];
  timeline: { title: Localized; description?: Localized; time?: string; state: TimelineState }[];
  notice?: { tone: Tone; text: Localized };
  rejectReason?: string;
  /** Tất toán (sinh viên trả thêm) hoặc hoàn tiền (KTX trả lại). */
  settlement?: { lines: { label: Localized; amount: number }[]; total: number; dueAt?: string; billId?: string; refund?: boolean; refunded?: boolean };
  refundAccount?: { bank: string; account: string };
  /** Biên bản nhận phòng mới cần hoàn tất sau khi chuyển phòng. */
  checkInId?: string;
};

export const requestKindMeta: Record<RequestKind, { icon: IconName; tone: Tone }> = {
  supportMaintenance: { icon: "construct-outline", tone: "primary" },
  roomTransfer: { icon: "swap-horizontal-outline", tone: "info" },
  roomCheckout: { icon: "exit-outline", tone: "violet" },
};

export const requestStatusTone: Record<RequestStatus, Tone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  inspection_scheduled: "info",
  inspected: "info",
  awaiting_settlement: "warning",
  received: "info",
  repaired: "violet",
  reopened: "warning",
  completed: "success",
  expired: "neutral",
};

const KNOWN_STATUSES = Object.keys(requestStatusTone) as RequestStatus[];
const PROCESSING: RequestStatus[] = ["pending", "received", "inspection_scheduled", "inspected", "awaiting_settlement", "repaired", "reopened"];

function status(value: string): RequestStatus {
  const normalized = value.toLowerCase() as RequestStatus;
  return KNOWN_STATUSES.includes(normalized) ? normalized : "pending";
}

const same = (text: string) => L(text, text);
const isUnpaid = (bill: Bill) => ["pending", "failed"].includes(bill.status.toLowerCase());

export function requestStats(requests: StudentRequest[]) {
  return {
    total: requests.length,
    processing: requests.filter((r) => PROCESSING.includes(r.status)).length,
    done: requests.filter((r) => r.status === "completed" || r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };
}

/** Phần tử danh sách từ `GET /student/requests` (chỉ có `summary` = lý do/tiêu đề). */
export function fromSummary(item: RequestSummary): StudentRequest {
  const value = status(item.status);
  const unpaid = !!item.billId && ["pending", "failed"].includes((item.billStatus ?? "").toLowerCase());
  return {
    id: item.id,
    kind: item.kind,
    title: same(item.summary || item.id),
    submittedAt: item.submittedAt,
    status: value,
    action: value === "repaired" && item.kind === "supportMaintenance" ? "confirmRepair" : unpaid ? "pay" : undefined,
  };
}

// ---- Tiến trình ----

const STEP: Record<string, Localized> = {
  submitted: L("Đã gửi yêu cầu", "Request sent"),
  awaiting_approval: L("Chờ BQL tiếp nhận", "Awaiting acceptance"),
  awaiting_settlement: L("BQL đã duyệt · chờ tất toán", "Approved · awaiting settlement"),
  inspection_scheduled: L("BQL tiếp nhận · hẹn kiểm tra", "Received · inspection booked"),
  inspected: L("Đã kiểm tra tài sản phòng", "Room inspected"),
  received: L("BQL tiếp nhận", "Office received"),
  repaired: L("Đã sửa chữa", "Repaired"),
  reopened: L("Bạn báo chưa khắc phục", "You reported it's not fixed"),
  completed: L("Hoàn tất", "Completed"),
  vacated: L("Hoàn tất trả phòng", "Check-out completed"),
  rejected: L("Bị từ chối", "Rejected"),
  expired: L("Đã hết hạn", "Expired"),
};
const APPROVED: Record<RequestKind, Localized> = {
  roomTransfer: L("Hoàn tất chuyển phòng", "Transfer completed"),
  roomCheckout: L("BQL đã duyệt trả phòng", "Check-out approved"),
  supportMaintenance: L("Đã duyệt", "Approved"),
};
const CHECK_IN_NEW = L("Nhận phòng mới", "Check in to new room");

/** Các bước chuẩn của từng loại, dùng để nối các bước sắp tới sau mốc hiện tại. */
const FLOW: Record<RequestKind, string[]> = {
  // BQL hẹn & kiểm tra tài sản phòng cũ trước khi duyệt chuyển phòng (giống trả phòng).
  roomTransfer: ["submitted", "inspection_scheduled", "inspected", "approved"],
  roomCheckout: ["submitted", "inspection_scheduled", "inspected", "approved", "vacated"],
  supportMaintenance: ["submitted", "received", "repaired", "completed"],
};

function buildTimeline(kind: RequestKind, history: TimelineEntry[], finished: boolean): RequestDetail["timeline"] {
  const label = (key: string) => (key === "approved" ? APPROVED[kind] : STEP[key] ?? same(key));
  const failed = history.some((entry) => entry.status === "rejected" || entry.status === "expired");
  const items: RequestDetail["timeline"] = history.map((entry, index) => {
    const last = index === history.length - 1;
    const actor = entry.actor && entry.actor !== "system" ? entry.actor : null;
    return {
      title: label(entry.status),
      description: actor ? L(`Người xử lý: ${actor}`, `Handled by ${actor}`) : undefined,
      time: entry.occurredAt ? Formatter.dateTime(entry.occurredAt) : undefined,
      state: last && failed ? "failed" : last && !finished ? "current" : "done",
    };
  });
  if (!failed && !finished) {
    const flow = FLOW[kind];
    // "Chờ tất toán" xảy ra ngay sau khi duyệt → tính như đã qua bước kiểm tra.
    const reached = Math.max(...history.map((entry) => flow.indexOf(entry.status === "awaiting_settlement" ? "inspected" : entry.status)), 0);
    for (const key of flow.slice(reached + 1)) items.push({ title: label(key), state: "upcoming" });
  }
  return items;
}

// ---- Chi tiết từng loại ----

function place(location: { building?: string | null; room?: string | null; bed?: string | null } | null): string {
  if (!location) return "—";
  return [location.building, location.room, location.bed ? `G${location.bed}` : null].filter(Boolean).join(" · ") || "—";
}

function refundAccount(recipient: RefundRecipient | null) {
  return recipient?.accountNumber ? { bank: recipient.bankName ?? "—", account: recipient.accountNumber } : undefined;
}

export function fromTransfer(request: RoomTransferRequest): RequestDetail {
  const value = status(request.status);
  const desired: Location | null = request.desiredLocation;
  const unpaid = request.settlementBills.filter(isUnpaid);
  const pendingCheckIn = value === "approved" && !!request.postTransferCheckInId && request.postTransferCheckInStatus === "pending";
  const lines: { label: Localized; amount: number }[] = [];
  if (request.priceDifferenceAmount) lines.push({ label: L("Chênh lệch tiền phòng", "Rent difference"), amount: Number(request.priceDifferenceAmount) });
  if (request.compensationAmount) lines.push({ label: L("Đền bù tài sản phòng cũ", "Old room asset compensation"), amount: Number(request.compensationAmount) });
  const timeline = buildTimeline("roomTransfer", request.history, value === "approved" && !pendingCheckIn);
  if (pendingCheckIn) timeline.push({ title: CHECK_IN_NEW, state: "current" });
  else if (value === "approved" && request.postTransferCheckInId) timeline.push({ title: CHECK_IN_NEW, state: "done" });

  return {
    id: request.id,
    kind: "roomTransfer",
    title: L(`Chuyển sang phòng ${desired?.room ?? "—"}`, `Transfer to room ${desired?.room ?? "—"}`),
    summary: same(request.reason),
    submittedAt: request.submittedAt,
    status: value,
    action: unpaid.length ? "pay" : pendingCheckIn ? "checkIn" : value === "rejected" || value === "expired" ? "resubmit" : undefined,
    checkInId: pendingCheckIn ? request.postTransferCheckInId! : undefined,
    rejectReason: value === "rejected" ? request.processedNote ?? undefined : undefined,
    notice:
      value === "pending"
        ? { tone: "warning", text: L("Yêu cầu đang chờ BQL tiếp nhận và hẹn ngày kiểm tra tài sản phòng hiện tại của bạn.", "Waiting for the office to accept the request and schedule an inspection of your current room.") }
        : value === "inspection_scheduled" && request.inspectionDate
          ? {
              tone: "info",
              text: L(
                `BQL sẽ kiểm tra tài sản phòng hiện tại của bạn vào ngày ${Formatter.date(request.inspectionDate)}. Vui lòng có mặt để bàn giao.`,
                `The office will inspect your current room on ${Formatter.date(request.inspectionDate)}. Please be present for the handover.`,
              ),
            }
          : value === "inspected"
            ? {
                tone: "info",
                text: request.compensationAmount
                  ? L(
                      `BQL đã kiểm tra phòng hiện tại, ghi nhận đền bù ${Formatter.currency(Number(request.compensationAmount))} (lập hoá đơn khi duyệt). Yêu cầu đang chờ duyệt.`,
                      `The office inspected your current room and recorded ${Formatter.currency(Number(request.compensationAmount))} in compensation (billed on approval). Awaiting approval.`,
                    )
                  : L("BQL đã kiểm tra phòng hiện tại, không ghi nhận hư hao. Yêu cầu đang chờ duyệt.", "The office inspected your current room with no damage recorded. Awaiting approval."),
              }
            : value === "awaiting_settlement" && unpaid.length
        ? {
            tone: "warning",
            text: request.settlementDueAt
              ? L(`Yêu cầu đã được duyệt. Thanh toán hoá đơn tất toán trước ${Formatter.date(request.settlementDueAt)} để hoàn tất chuyển phòng.`, `Approved. Pay the settlement bill before ${Formatter.date(request.settlementDueAt)} to complete the transfer.`)
              : L("Yêu cầu đã được duyệt. Thanh toán hoá đơn tất toán để hoàn tất chuyển phòng.", "Approved. Pay the settlement bill to complete the transfer."),
          }
        : value === "awaiting_settlement" && request.refundAmount && !request.refundConfirmed
          ? { tone: "info", text: L("Yêu cầu đã được duyệt, đang chờ BQL hoàn trả tiền chênh lệch cho bạn.", "Approved — waiting for the office to refund the difference.") }
          : pendingCheckIn
            ? { tone: "success", text: L("Chuyển phòng đã hoàn tất. Hãy làm thủ tục nhận phòng mới và kiểm tra tài sản.", "Transfer completed. Check in to your new room and inspect its assets.") }
            : request.originCheckInId
              ? { tone: "info", text: L("Yêu cầu được gửi từ biên bản nhận phòng có tài sản sự cố.", "Sent from a check-in record with reported asset issues.") }
              : undefined,
    settlement: request.refundAmount
      ? { lines: [{ label: L("Chênh lệch tiền phòng", "Rent difference"), amount: Number(request.refundAmount) }], total: Number(request.refundAmount), refund: true, refunded: request.refundConfirmed }
      : lines.length && !["pending", "inspection_scheduled", "inspected"].includes(value)
        ? {
            lines,
            total: unpaid.length ? unpaid.reduce((sum, bill) => sum + Number(bill.amount), 0) : lines.reduce((sum, line) => sum + line.amount, 0),
            dueAt: unpaid.length ? request.settlementDueAt ?? undefined : undefined,
            billId: unpaid[0]?.id,
          }
        : undefined,
    refundAccount: refundAccount(request.refundRecipient),
    details: [
      { label: L("Hiện tại", "Current"), value: place(request.currentLocation) },
      { label: L("Mong muốn", "Requested"), value: place(desired) },
      { label: L("Lý do", "Reason"), value: request.reason },
      ...(request.preferredInspectionDate ? [{ label: L("Ngày kiểm tra đề xuất", "Preferred inspection"), value: Formatter.date(request.preferredInspectionDate) }] : []),
      ...(request.inspectionDate ? [{ label: L("Ngày BQL kiểm tra", "Inspection date"), value: Formatter.date(request.inspectionDate) }] : []),
      ...(request.assetEvaluations?.some((item) => item.status === "issue")
        ? [
            {
              label: L("Tài sản hư hao phòng cũ", "Damaged old-room assets"),
              value: request.assetEvaluations
                .filter((item) => item.status === "issue")
                .map((item) => item.assetName)
                .join(", "),
            },
          ]
        : []),
      ...(request.acknowledgedPriceDifference
        ? [{ label: L("Chênh lệch đã xác nhận", "Acknowledged difference"), value: `${Number(request.acknowledgedPriceDifference) > 0 ? "+" : "−"} ${Formatter.currency(Math.abs(Number(request.acknowledgedPriceDifference)))}` }]
        : []),
      ...(request.attachments.length ? [{ label: L("Đính kèm", "Attachments"), value: L(`${request.attachments.length} tệp`, `${request.attachments.length} files`) }] : []),
    ],
    timeline,
  };
}

export function fromCheckout(request: RoomCheckoutRequest): RequestDetail {
  const value = status(request.status);
  const unpaid = request.bills.filter(isUnpaid);
  const refund = Number(request.refundPayoutAmount ?? request.rentRefundAmount ?? 0);
  return {
    id: request.id,
    kind: "roomCheckout",
    title: L(`Trả phòng ${request.room ?? ""}`.trim(), `Check-out ${request.room ?? ""}`.trim()),
    summary: same(request.reason),
    submittedAt: request.submittedAt,
    status: value,
    action: unpaid.length ? "pay" : value === "rejected" || value === "expired" ? "resubmit" : undefined,
    rejectReason: value === "rejected" ? request.processedNote ?? undefined : undefined,
    notice:
      value === "inspection_scheduled" && request.inspectionDate
        ? { tone: "info", text: L(`BQL sẽ kiểm tra phòng vào ngày ${Formatter.date(request.inspectionDate)}. Vui lòng có mặt hoặc chuẩn bị phòng.`, `The office will inspect your room on ${Formatter.date(request.inspectionDate)}. Please be present or have the room ready.`) }
        : request.settlementMessage
          ? { tone: "warning", text: same(request.settlementMessage) }
          : undefined,
    settlement: unpaid.length
      ? { lines: unpaid.map((bill) => ({ label: same(bill.title ?? bill.id), amount: Number(bill.amount) })), total: unpaid.reduce((sum, bill) => sum + Number(bill.amount), 0), billId: unpaid[0].id, dueAt: unpaid[0].dueDate ?? undefined }
      : refund > 0
        ? {
            lines: [
              ...(request.rentRefundAmount ? [{ label: L("Tiền phòng chưa sử dụng", "Unused rent"), amount: Number(request.rentRefundAmount) }] : []),
              ...(request.debtOffsetAmount ? [{ label: L("Cấn trừ công nợ", "Offset against balance"), amount: -Number(request.debtOffsetAmount) }] : []),
            ],
            total: refund,
            refund: true,
            refunded: request.refundConfirmed,
          }
        : undefined,
    refundAccount: refundAccount(request.refundRecipient),
    details: [
      { label: L("Vị trí", "Location"), value: place(request) },
      { label: L("Ngày trả dự kiến", "Expected check-out"), value: Formatter.date(request.expectedCheckoutDate) },
      ...(request.preferredInspectionDate ? [{ label: L("Ngày kiểm tra đề xuất", "Preferred inspection"), value: Formatter.date(request.preferredInspectionDate) }] : []),
      ...(request.inspectionDate ? [{ label: L("Ngày BQL kiểm tra", "Inspection date"), value: Formatter.date(request.inspectionDate) }] : []),
      { label: L("Lý do", "Reason"), value: request.reason },
      ...(request.studentNote ? [{ label: L("Ghi chú", "Note"), value: request.studentNote }] : []),
    ],
    timeline: buildTimeline("roomCheckout", request.history, request.history.some((entry) => entry.status === "vacated")),
  };
}

const ISSUE: Record<string, Localized> = {
  electrical: L("Điện", "Electrical"),
  plumbing: L("Nước", "Plumbing"),
  internet: L("Internet", "Internet"),
  doorLock: L("Cửa / khoá", "Door / lock"),
  appliance: L("Thiết bị, nội thất", "Appliance, furniture"),
  other: L("Khác", "Other"),
};
const PRIORITY: Record<string, Localized> = { low: L("Thấp", "Low"), medium: L("Trung bình", "Medium"), high: L("Cao", "High") };

export function fromSupport(request: SupportMaintenanceRequest): RequestDetail {
  const value = status(request.status);
  const bill = request.bill && isUnpaid(request.bill) ? request.bill : null;
  const location = request.issueLocation === "room" ? [request.building, request.room].filter(Boolean).join(" · ") || L("Phòng của tôi", "My room") : L("Khu vực chung", "Common area");
  return {
    id: request.id,
    kind: "supportMaintenance",
    title: same(request.title),
    summary: same(request.description),
    submittedAt: request.submittedAt,
    status: value,
    action: value === "repaired" ? "confirmRepair" : bill ? "pay" : value === "rejected" ? "resubmit" : undefined,
    rejectReason: value === "rejected" ? request.processedNote ?? undefined : undefined,
    notice:
      value === "reopened"
        ? { tone: "warning", text: L("Bạn đã báo sự cố chưa được khắc phục. BQL sẽ xử lý lại.", "You reported the issue isn't fixed. The office will handle it again.") }
        : value === "received" && request.processedNote
          ? { tone: "info", text: same(request.processedNote) }
          : undefined,
    settlement:
      request.costAmount && request.costResponsibility === "student"
        ? { lines: [{ label: L("Chi phí sửa chữa", "Repair cost"), amount: Number(request.costAmount) }], total: Number(request.costAmount), billId: bill?.id, dueAt: bill?.dueDate ?? undefined }
        : undefined,
    details: [
      { label: L("Loại sự cố", "Issue type"), value: ISSUE[request.issueType] ?? request.issueType },
      { label: L("Vị trí", "Location"), value: location },
      { label: L("Mức ưu tiên", "Priority"), value: PRIORITY[request.priority] ?? request.priority },
      ...(request.source === "check_in" ? [{ label: L("Nguồn", "Source"), value: L("Biên bản nhận phòng", "Check-in record") }] : []),
      ...(request.processedBy ? [{ label: L("Người xử lý", "Handled by"), value: request.processedBy }] : []),
      ...(request.attachments.length ? [{ label: L("Ảnh minh chứng", "Photos"), value: L(`${request.attachments.length} ảnh`, `${request.attachments.length} photos`) }] : []),
    ],
    timeline: buildTimeline("supportMaintenance", request.history, value === "completed"),
  };
}
