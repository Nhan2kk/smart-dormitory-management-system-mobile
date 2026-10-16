/** Giai đoạn xử lý của hóa đơn điện nước phòng (backend `RoomUtilityBillStage`), theo thứ tự tiến triển. */
export enum RoomUtilityBillStage {
  /** Trong hạn: vừa phát hành. */
  InTerm = "IN_TERM",
  /** Sắp hết hạn: đã nhắc trước hạn. */
  DueSoon = "DUE_SOON",
  /** Quá hạn, còn trong ân hạn: mọi thành viên được đóng thay. */
  OverdueInGrace = "OVERDUE_IN_GRACE",
  /** Cảnh báo cuối trước khi hết ân hạn. */
  GraceFinalWarning = "GRACE_FINAL_WARNING",
  /** Hết ân hạn nhưng còn báo cáo chờ BQL xét: hoãn ghi lỗi. */
  ViolationPendingReview = "VIOLATION_PENDING_REVIEW",
  /** Đã ghi lỗi vi phạm. */
  ViolationRecorded = "VIOLATION_RECORDED",
  /** Đã đề nghị kỷ luật. */
  DisciplineProposed = "DISCIPLINE_PROPOSED",
  /** Đã thanh toán. */
  Paid = "PAID",
}

/** Trạng thái điện nước của phòng (BQL thao tác ngoài thực tế rồi xác nhận). */
export enum RoomServiceState {
  Normal = "NORMAL",
  SuspensionProposed = "SUSPENSION_PROPOSED",
  Suspended = "SUSPENDED",
  RestoreRequired = "RESTORE_REQUIRED",
}

/** Các mốc thời gian của hóa đơn. */
export enum BillMilestoneKey {
  DueSoon = "DUE_SOON",
  Due = "DUE",
  FinalWarning = "FINAL_WARNING",
  GraceEnd = "GRACE_END",
  Discipline = "DISCIPLINE",
}

/** Ai được thanh toán lúc này. */
export enum RoomUtilityPayer {
  RepresentativeOnly = "REPRESENTATIVE_ONLY",
  AllMembers = "ALL_MEMBERS",
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

/** Lý do ghi lỗi vi phạm. */
export enum ViolationReason {
  RoomUnpaid = "ROOM_UNPAID",
  RepresentativeCollected = "REPRESENTATIVE_COLLECTED",
  MemberNotContributed = "MEMBER_NOT_CONTRIBUTED",
}

/** Trạng thái lỗi vi phạm. */
export enum ViolationStatus {
  Active = "ACTIVE",
  Revoked = "REVOKED",
}

/** Ai bị ghi lỗi của hóa đơn. */
export enum ViolationTarget {
  Room = "ROOM",
  ReportedMembers = "REPORTED_MEMBERS",
}
