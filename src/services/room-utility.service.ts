import type { ApiClient } from "../shared/api";
import type {
  RoomUtilityAccount,
  RoomUtilityBill,
  RoomUtilityHandover,
  RoomUtilityPolicy,
  RoomUtilityReport,
} from "../models/room-utility.model";
import type { BillPaymentQr } from "../models/debt.model";

/** API điện nước phòng cho sinh viên: đọc dữ liệu dùng POST, đổi trạng thái dùng PATCH. */
export class RoomUtilityService {
  constructor(private readonly request: ApiClient) {}
  mine() {
    return this.request<RoomUtilityAccount | null>(
      "/student/room-utilities/mine",
    );
  }
  bills() {
    return this.request<RoomUtilityBill[]>("/student/room-utilities/search", {
      body: { debtOnly: false },
    });
  }
  propose(roomId: string, studentId: string) {
    return this.request<RoomUtilityAccount>("/student/room-utilities/propose", {
      body: { roomId, studentId },
    });
  }
  cancel(roomId: string) {
    return this.request<RoomUtilityAccount>("/student/room-utilities/cancel", {
      body: { roomId },
    });
  }
  respond(roomId: string, accept: boolean) {
    return this.request<RoomUtilityAccount>(
      "/student/room-utilities/" + (accept ? "accept" : "reject"),
      { body: { roomId } },
    );
  }
  history(roomId: string) {
    return this.request<RoomUtilityHandover[]>(
      "/student/room-utilities/history",
      { body: { roomId } },
    );
  }
  payment(id: string) {
    return this.request<BillPaymentQr>("/student/room-utilities/payment", {
      body: { id },
    });
  }
  /**
   * Báo một người trong phòng (trưởng phòng đã thu mà chưa đóng, hoặc thành viên không góp tiền).
   * Chỉ khi hóa đơn đã quá hạn và trước khi hết ân hạn.
   */
  report(billId: string, accusedStudentId: string, content: string) {
    return this.request<RoomUtilityReport>("/student/room-utilities/report", {
      body: { billId, accusedStudentId, content },
    });
  }
  /** Rút báo cáo khi BQL chưa xét. */
  withdrawReport(id: string) {
    return this.request<RoomUtilityReport>(
      "/student/room-utilities/report/withdraw",
      { method: "PATCH", body: { id } },
    );
  }
  /** Quy định đang áp dụng (con số lấy từ cấu hình thật). */
  policy() {
    return this.request<RoomUtilityPolicy>("/student/room-utilities/policy");
  }
  status(id: string) {
    return this.request<{
      billStatus: string;
      qrExpiresAt: string | null;
      serverTime: string;
    }>("/student/room-utilities/payment-status", { body: { id } });
  }
}
