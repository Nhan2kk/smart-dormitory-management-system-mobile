/** Loại tiền trong hóa đơn điện nước (backend `RoomUtilityChargeReader`). */
export enum UtilityCommodity {
  Electricity = "ELECTRICITY",
  Water = "WATER",
}

/** Trạng thái hóa đơn điện nước phòng (backend `RoomUtilityBillStage`). */
export enum RoomUtilityBillStage {
  /** Chưa thanh toán, chưa hết thời gian được đóng trễ. */
  Unpaid = "UNPAID",
  /** Hết thời gian được đóng trễ mà chưa thanh toán. */
  Overdue = "OVERDUE",
  /** Đã thanh toán trước khi quá hạn. */
  Paid = "PAID",
  /** Thanh toán sau khi đã quá hạn. */
  PaidLate = "PAID_LATE",
}

/** Các mốc của hóa đơn, theo thứ tự xảy ra. */
export enum BillMilestoneKey {
  /** Nhắc sắp tới hạn thanh toán. */
  DueSoon = "DUE_SOON",
  /** Hạn thanh toán. */
  Due = "DUE",
  /** Hết thời gian được đóng trễ. */
  LateEnd = "LATE_END",
}

/** Loại báo cáo tách trách nhiệm (tự xác định theo người bị báo). */
export enum UtilityReportType {
  RepresentativeCollected = "REPRESENTATIVE_COLLECTED",
  MemberNotContributed = "MEMBER_NOT_CONTRIBUTED",
}

/** Trạng thái xét báo cáo. */
export enum UtilityReportStatus {
  Pending = "PENDING",
  Accepted = "ACCEPTED",
  Rejected = "REJECTED",
  Withdrawn = "WITHDRAWN",
}
