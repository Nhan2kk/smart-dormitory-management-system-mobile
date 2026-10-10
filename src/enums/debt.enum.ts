/** Trạng thái hoá đơn backend trả về. */
export enum BillStatus {
  Pending = "pending",
  Paid = "paid",
  Failed = "failed",
  Cancelled = "cancelled",
}

/** Loại hoá đơn backend trả về (`billType`). */
export enum BillType {
  MaintenanceCost = "maintenanceCost",
  CheckoutSettlement = "checkoutSettlement",
  RoomTransferSettlement = "roomTransferSettlement",
}

/** Mức hạn của khoản chưa trả, tính ở mobile từ `dueDate` (quá hạn / trong 7 ngày / còn xa). */
export enum DebtStatus {
  Overdue = "overdue",
  Due = "due",
  Upcoming = "upcoming",
  Paid = "paid",
}

/** Nhóm khoản trên màn công nợ (`POST /student/debts/search`, trường `group`). */
export enum DebtGroup {
  Outstanding = "outstanding",
  Overdue = "overdue",
  DueSoon = "dueSoon",
  Paid = "paid",
  All = "all",
}

/** Trạng thái khoản công nợ do backend tính (`StudentDebt.status`). */
export enum LedgerStatus {
  Paid = "paid",
  Unpaid = "unpaid",
  Overdue = "overdue",
}

/** Loại khoản công nợ (`StudentDebt.chargeType`). */
export enum ChargeType {
  Registration = "registration",
  MaintenanceCost = "maintenanceCost",
  CheckoutSettlement = "checkoutSettlement",
  RoomTransferSettlement = "roomTransferSettlement",
}

/** Khoản được trả qua đơn đăng ký KTX hay qua hoá đơn phát sinh. */
export enum DebtSource {
  Registration = "REGISTRATION",
  Bill = "BILL",
}
