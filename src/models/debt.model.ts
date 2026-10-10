import type { BillStatus, BillType, ChargeType, DebtSource, DebtStatus, LedgerStatus } from "../enums/debt.enum";
import type { PaymentAttemptStatus } from "../enums/payment.enum";

// ---- Dữ liệu server trả về / nhận ----

/** Một hoá đơn trong `GET /student/bills` và `GET /student/bills/{id}` (BillResponse). */
export interface BillResponse {
  id: string;
  studentCode: string | null;
  billType: BillType;
  sourceType: string | null;
  sourceId: string | null;
  title: string;
  relatedAsset: string | null;
  amount: number;
  dueDate: string | null;
  status: BillStatus;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface BillPageResponse {
  content: BillResponse[];
  last: boolean;
}

/** Một khoản trong `POST /student/debts/search`: phí đăng ký KTX chờ thanh toán hoặc hoá đơn phát sinh. */
export interface StudentDebt {
  id: string;
  sourceType: DebtSource;
  code: string;
  title: string;
  chargeType: ChargeType;
  amount: number;
  status: LedgerStatus;
  /** Còn nợ và đến hạn trong 7 ngày tới. */
  dueSoon: boolean;
  /** Số ngày còn tới hạn theo lịch Việt Nam; âm khi quá hạn; null nếu không có hạn. */
  daysLeft: number | null;
  dueDate: string | null;
  createdAt: string;
  paidAt: string | null;
  method: "transfer" | "cash" | "other" | null;
  transactionCode: string | null;
  referenceCode: string | null;
  /** Thanh toán được ngay bằng QR (phí đăng ký đã hết giữ chỗ thì không). */
  payable: boolean;
}

export interface StudentDebtPage {
  content: StudentDebt[];
  totalElements: number;
  last: boolean;
}

/** `POST /student/debts/summary` (VND). "Còn nợ" gồm cả khoản quá hạn. */
export interface StudentDebtSummary {
  outstandingAmount: number;
  outstandingCount: number;
  overdueAmount: number;
  overdueCount: number;
  dueSoonAmount: number;
  dueSoonCount: number;
  paidAmount: number;
  paidCount: number;
  paidThisYearAmount: number;
}

/** `POST /student/bills/{id}/payment-init`: QR SePay 15 phút để trả hoá đơn. */
export interface BillPaymentQr {
  billId: string;
  attemptId: string;
  paymentCode: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  transferContent: string;
  qrImageUrl: string;
  qrExpiresAt: string;
  serverTime: string;
  attemptStatus: PaymentAttemptStatus;
  billStatus: string;
}

/** `POST /student/bills/{id}/payment-status`. */
export interface BillPaymentStatus {
  billId: string;
  billStatus: string;
  attemptId: string | null;
  paymentCode: string | null;
  attemptStatus: PaymentAttemptStatus | null;
  qrExpiresAt: string | null;
  paidAt: string | null;
  serverTime: string;
}

/** Sự kiện `/user/queue/bill-payments` khi hoá đơn được xác nhận đã thanh toán. */
export interface BillPaymentEvent {
  billId: string;
  attemptId: string | null;
  status: "PAID";
  billStatus: string;
  paidAt: string | null;
  amount: number;
}

/** Một khoản còn nợ cùng mức hạn để tô màu (quá hạn / đến hạn trong 7 ngày / còn xa). */
export interface Debt {
  item: StudentDebt;
  status: DebtStatus;
}

/** Thông tin chuyển khoản tối thiểu để mở app ngân hàng (dùng chung cho QR đăng ký và hoá đơn). */
export interface TransferInfo {
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  transferContent: string;
}
