import type { BillStatus, BillType, DebtStatus } from "../enums/debt.enum";

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

/** `POST /student/bills/{id}/payment`. */
export interface BillPayRequest {
  paymentMethod: string;
}

// ---- Dữ liệu cho màn hình ----

/** Hoá đơn kèm mức hạn và số ngày còn lại (âm = đã quá hạn). */
export interface Debt {
  bill: BillResponse;
  status: DebtStatus;
  daysLeft: number | null;
}

/** Tài khoản nhận chuyển khoản của KTX. */
export interface PaymentAccount {
  bank: string;
  accountNumber: string;
  holder: string;
}

/** Khoản đang thanh toán trên màn QR. */
export interface Payable {
  id: string;
  title: string;
  amount: number;
}
