import { L } from "../../shared/i18n/localized";
import type { Localized } from "../../shared/i18n/types";
import type { Tone } from "../../shared/theme";
import type { IconName } from "../../shared/ui";

export type RequestKind = "roomTransfer" | "roomCheckout" | "supportMaintenance";

export type RequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "inspection_scheduled"
  | "inspected"
  | "awaiting_settlement"
  | "received"
  | "repaired"
  | "completed"
  | "expired";

/** Hành động sinh viên cần làm tiếp với yêu cầu. */
export type RequestAction = "confirmRepair" | "pay" | "checkIn" | "resubmit";

export type StudentRequest = {
  id: string;
  kind: RequestKind;
  title: Localized;
  summary: Localized;
  submittedAt: string;
  status: RequestStatus;
  details: { label: Localized; value: Localized | string }[];
  timeline: { title: Localized; description?: Localized; time?: string; state: "done" | "current" | "upcoming" | "failed" }[];
  notice?: { tone: Tone; text: Localized };
  rejectReason?: Localized;
  /** Tất toán (sinh viên trả thêm) hoặc hoàn tiền (KTX trả lại). */
  settlement?: { lines: { label: Localized; amount: number }[]; total: number; dueAt?: string; billId?: string; refund?: boolean; refunded?: boolean };
  action?: RequestAction;
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
  completed: "success",
  expired: "neutral",
};

const S = {
  sent: L("Đã gửi yêu cầu", "Request sent"),
  received: L("BQL tiếp nhận", "Office received"),
  repaired: L("Đã sửa chữa", "Repaired"),
  confirm: L("Sinh viên xác nhận", "Student confirms"),
  approval: L("Chờ BQL duyệt", "Awaiting approval"),
  approved: L("BQL đã duyệt", "Approved"),
  settlement: L("Tất toán chênh lệch", "Settle difference"),
  checkIn: L("Nhận phòng mới", "Check in to new room"),
  room: L("Phòng", "Room"),
  issueType: L("Loại sự cố", "Issue type"),
  location: L("Vị trí", "Location"),
  priority: L("Mức ưu tiên", "Priority"),
};

export class RequestRepository {
  private static readonly records: StudentRequest[] = [
    {
      id: "BT-2026-0312",
      kind: "supportMaintenance",
      title: L("Đèn phòng không hoạt động", "Room light not working"),
      summary: L("Bóng đèn trần khu giường số 1–4 không sáng từ tối qua.", "The ceiling light over beds 1–4 has been off since last night."),
      submittedAt: "2026-10-06T20:12:00+07:00",
      status: "repaired",
      action: "confirmRepair",
      details: [
        { label: S.issueType, value: L("Điện", "Electrical") },
        { label: S.location, value: L("Phòng A101", "Room A101") },
        { label: S.priority, value: L("Cao", "High") },
        { label: L("Kỹ thuật viên", "Technician"), value: "Trần Minh Đức" },
      ],
      timeline: [
        { title: S.sent, time: "20:12 · 06/10/2026", state: "done" },
        { title: S.received, description: L("Đã phân công kỹ thuật viên.", "Technician assigned."), time: "07:40 · 07/10/2026", state: "done" },
        { title: S.repaired, description: L("Thay bóng đèn LED mới 18W.", "Replaced with a new 18W LED tube."), time: "15:05 · 07/10/2026", state: "current" },
        { title: S.confirm, state: "upcoming" },
      ],
    },
    {
      id: "CP-2026-0102",
      kind: "roomTransfer",
      title: L("Chuyển sang phòng B205", "Transfer to room B205"),
      summary: L("Xin chuyển từ A101 sang B205 do gần lớp học hơn.", "Moving from A101 to B205 to be closer to class."),
      submittedAt: "2026-10-03T09:30:00+07:00",
      status: "awaiting_settlement",
      action: "pay",
      notice: {
        tone: "warning",
        text: L("Yêu cầu đã được duyệt. Thanh toán hoá đơn tất toán trước 10/10/2026 để hoàn tất chuyển phòng.", "Approved. Pay the settlement bill before 10/10/2026 to complete the transfer."),
      },
      details: [
        { label: L("Hiện tại", "Current"), value: L("Tòa A · A101 · Giường 01", "Bldg A · A101 · Bed 01") },
        { label: L("Mong muốn", "Requested"), value: L("Tòa B · B205 · Giường 03", "Bldg B · B205 · Bed 03") },
        { label: L("Lý do", "Reason"), value: L("Gần khu giảng đường hơn", "Closer to lecture halls") },
      ],
      settlement: {
        lines: [
          { label: L("Chênh lệch tiền phòng (3 tháng)", "Rent difference (3 months)"), amount: 300_000 },
          { label: L("Đền bù tài sản phòng cũ", "Old room asset compensation"), amount: 0 },
        ],
        total: 300_000,
        dueAt: "2026-10-10",
        billId: "HD-0240",
      },
      timeline: [
        { title: S.sent, time: "09:30 · 03/10/2026", state: "done" },
        { title: S.approved, description: L("Đã kiểm tra tài sản phòng cũ: bình thường.", "Old room assets inspected: OK."), time: "14:10 · 06/10/2026", state: "done" },
        { title: S.settlement, description: L("Chờ bạn thanh toán 300.000đ.", "Waiting for your 300,000₫ payment."), state: "current" },
        { title: S.checkIn, state: "upcoming" },
      ],
    },
    {
      id: "TP-2026-0051",
      kind: "roomCheckout",
      title: L("Trả phòng cuối kỳ", "End-of-term check-out"),
      summary: L("Trả phòng do đi thực tập dài hạn tại Đà Nẵng.", "Checking out for a long internship in Da Nang."),
      submittedAt: "2026-10-01T16:00:00+07:00",
      status: "inspection_scheduled",
      notice: {
        tone: "info",
        text: L("Ban quản lý sẽ kiểm tra phòng vào ngày 08/01/2027. Vui lòng có mặt hoặc chuẩn bị phòng.", "The office will inspect your room on 01/08/2027. Please be present or have the room ready."),
      },
      details: [
        { label: L("Ngày trả dự kiến", "Expected check-out"), value: "10/01/2027" },
        { label: L("Ngày kiểm tra", "Inspection date"), value: "08/01/2027" },
        { label: L("Lý do", "Reason"), value: L("Đi thực tập", "Internship") },
      ],
      timeline: [
        { title: S.sent, time: "16:00 · 01/10/2026", state: "done" },
        { title: L("BQL tiếp nhận · hẹn kiểm tra", "Received · inspection booked"), time: "08:20 · 02/10/2026", state: "done" },
        { title: L("Kiểm tra tài sản phòng", "Room inspection"), description: L("Đối chiếu với biên bản nhận phòng.", "Compared with your check-in record."), state: "current" },
        { title: L("Quyết toán & hoàn tiền", "Settlement & refund"), state: "upcoming" },
        { title: L("Hoàn tất trả phòng", "Check-out completed"), state: "upcoming" },
      ],
    },
    {
      id: "CP-2026-0087",
      kind: "roomTransfer",
      title: L("Chuyển sang phòng A101", "Transfer to room A101"),
      summary: L("Chuyển từ B205 sang A101 (phòng rẻ hơn).", "Moved from B205 to A101 (cheaper room)."),
      submittedAt: "2026-02-20T10:00:00+07:00",
      status: "approved",
      details: [
        { label: L("Phòng cũ", "Old room"), value: "B205 · G03" },
        { label: L("Phòng mới", "New room"), value: "A101 · G01" },
      ],
      settlement: {
        lines: [{ label: L("Chênh lệch tiền phòng (3 tháng)", "Rent difference (3 months)"), amount: 300_000 }],
        total: 300_000,
        refund: true,
        refunded: true,
      },
      timeline: [
        { title: S.sent, time: "10:00 · 20/02/2026", state: "done" },
        { title: S.approved, time: "09:00 · 24/02/2026", state: "done" },
        { title: L("KTX hoàn trả chênh lệch", "Dorm refunded the difference"), time: "15:30 · 01/03/2026", state: "done" },
        { title: S.checkIn, time: "08:10 · 02/03/2026", state: "done" },
      ],
    },
    {
      id: "BT-2026-0290",
      kind: "supportMaintenance",
      title: L("WiFi trong phòng không kết nối", "Room Wi-Fi not connecting"),
      summary: L("Router phòng nhấp nháy đỏ, không vào được mạng.", "The room router blinks red and there's no internet."),
      submittedAt: "2026-09-28T18:45:00+07:00",
      status: "completed",
      details: [
        { label: S.issueType, value: "Internet" },
        { label: S.location, value: L("Phòng A101", "Room A101") },
        { label: S.priority, value: L("Trung bình", "Medium") },
      ],
      timeline: [
        { title: S.sent, time: "18:45 · 28/09/2026", state: "done" },
        { title: S.received, time: "08:10 · 29/09/2026", state: "done" },
        { title: S.repaired, description: L("Khởi động lại & thay dây mạng.", "Restarted and replaced the cable."), time: "10:30 · 29/09/2026", state: "done" },
        { title: S.confirm, time: "12:00 · 29/09/2026", state: "done" },
      ],
    },
    {
      id: "BT-2026-0201",
      kind: "supportMaintenance",
      title: L("Rò rỉ nước ở lavabo", "Leaking washbasin"),
      summary: L("Nước rỉ dưới chân lavabo khu vệ sinh chung tầng 1.", "Water leaks under the washbasin in the floor 1 bathroom."),
      submittedAt: "2026-09-12T07:20:00+07:00",
      status: "received",
      details: [
        { label: S.issueType, value: L("Nước", "Plumbing") },
        { label: S.location, value: L("Khu vực chung · Tầng 1", "Common area · Floor 1") },
        { label: S.priority, value: L("Trung bình", "Medium") },
      ],
      timeline: [
        { title: S.sent, time: "07:20 · 12/09/2026", state: "done" },
        { title: S.received, time: "08:00 · 12/09/2026", state: "current" },
        { title: L("Sửa chữa", "Repair"), state: "upcoming" },
        { title: S.confirm, state: "upcoming" },
      ],
    },
    {
      id: "TP-2026-0044",
      kind: "roomCheckout",
      title: L("Trả phòng kỳ hè", "Summer check-out"),
      summary: L("Trả phòng do về quê nghỉ hè.", "Checking out to go home for summer."),
      submittedAt: "2026-06-10T14:00:00+07:00",
      status: "rejected",
      action: "resubmit",
      rejectReason: L("Hợp đồng còn hiệu lực trong kỳ; vui lòng gửi lại sau ngày 01/07.", "Your contract is still active this term; please resubmit after 07/01."),
      details: [
        { label: L("Ngày trả dự kiến", "Expected check-out"), value: "20/06/2026" },
        { label: L("Ngày kiểm tra", "Inspection date"), value: "18/06/2026" },
      ],
      timeline: [
        { title: S.sent, time: "14:00 · 10/06/2026", state: "done" },
        { title: L("Bị từ chối", "Rejected"), description: L("Hợp đồng còn hiệu lực trong kỳ.", "Contract still active."), time: "09:00 · 11/06/2026", state: "failed" },
      ],
    },
  ];

  static all(): StudentRequest[] {
    return RequestRepository.records;
  }

  static find(id: string): StudentRequest | undefined {
    return RequestRepository.records.find((request) => request.id === id);
  }

  static stats() {
    const records = RequestRepository.records;
    const processing: RequestStatus[] = ["pending", "received", "inspection_scheduled", "inspected", "awaiting_settlement", "repaired"];
    return {
      total: records.length,
      processing: records.filter((r) => processing.includes(r.status)).length,
      done: records.filter((r) => r.status === "completed" || r.status === "approved").length,
      rejected: records.filter((r) => r.status === "rejected").length,
    };
  }

  /** Dữ liệu chọn phòng cho form chuyển phòng. */
  static readonly transferOptions = {
    current: { building: "A", room: "A101", bed: "A101-01", monthlyFee: 450_000 },
    buildings: [
      { id: "A", rooms: [{ code: "A203", fee: 450_000, beds: ["03", "06"] }, { code: "A305", fee: 450_000, beds: ["02"] }] },
      { id: "B", rooms: [{ code: "B205", fee: 550_000, beds: ["03", "04"] }, { code: "B310", fee: 550_000, beds: ["01", "05", "06"] }] },
      { id: "C", rooms: [{ code: "C102", fee: 380_000, beds: ["02", "07"] }] },
    ],
    remainingMonths: 3,
  };
}
