/** Giai đoạn ở KTX của sinh viên, quyết định nút chính trên Trang chủ. */
export enum StudentStage {
  /** Chưa có hồ sơ lưu trú: cần đăng ký KTX. */
  Register = "register",
  /** Đã đăng ký, còn biên bản nhận phòng đang chờ xác nhận. */
  CheckIn = "checkIn",
  /** Đã nhận phòng (hoặc chưa xác định được): dùng các dịch vụ thường ngày. */
  Resident = "resident",
}
