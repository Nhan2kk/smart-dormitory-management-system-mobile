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
