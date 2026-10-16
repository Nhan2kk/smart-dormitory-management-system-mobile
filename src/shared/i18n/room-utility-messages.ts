import type { TranslationKey } from "./types";
const messages: Record<string, string> = {
  "Không tìm thấy phòng": "m0",
  "Sinh viên không đang ở phòng này": "m1",
  "Đại diện hiện tại phải bàn giao và người mới chấp nhận trước khi thay đổi":
    "m2",
  "Chỉ người đại diện hiện tại được đề nghị bàn giao": "m3",
  "Chọn thành viên khác trong phòng": "m4",
  "Bạn không phải người được đề nghị nhận bàn giao": "m5",
  "Ghi rõ cách xử lý công nợ (ít nhất 10 ký tự)": "m6",
  "Phòng đã có mốc chốt, không thể khởi tạo lại": "m7",
  "Mốc bắt đầu không được ở tương lai": "m8",
  "Cấu hình chỉ được áp dụng từ thời điểm tương lai": "m9",
  "Chưa có lịch chốt điện nước có hiệu lực": "m10",
  "Mốc chốt phải tròn giờ theo dữ liệu công tơ": "m11",
  "BQL cần khởi tạo mốc chỉ số đầu kỳ cho phòng": "m12",
  "Mốc chốt phải sau mốc đã chốt và không ở tương lai": "m13",
  "Phòng chưa có người đại diện": "m14",
  "Thiếu hoặc trùng dữ liệu công tơ trong kỳ. Chưa thể phát hành hóa đơn.":
    "m15",
  "Đơn giá chưa đủ hoặc thay đổi giữa kỳ. Cần chốt tách kỳ tại mốc đổi đơn giá.":
    "m16",
  "Không tìm thấy hóa đơn phòng": "m17",
  "Bạn không thuộc hóa đơn phòng này": "m18",
  "Chỉ đại diện hiện tại được tạo QR thanh toán toàn bộ hóa đơn": "m19",
  "Hóa đơn đã thanh toán": "m20",
  "Thanh toán SePay chưa được bật": "m21",
  "Cần bàn giao vai trò đại diện cho thành viên khác và được chấp nhận trước khi chuyển/trả phòng":
    "m22",
  "Thành viên cuối phải thanh toán hết điện nước trước khi rời phòng": "m23",
  "Cần chốt và quyết toán điện nước cuối phòng đến giờ hiện tại trước khi hoàn tất":
    "m24",
  "BQL cần xử lý công nợ và xác nhận người tiếp tục phụ trách trước khi duyệt":
    "m25",
  "Chỉ đại diện hiện tại được hủy đề nghị bàn giao": "m26",
  "Phòng có lịch sử hóa đơn điện nước, không thể xóa; hãy ngừng sử dụng phòng":
    "m27",
  "Chỉ quyết toán cuối phòng khi còn một thành viên": "m28",
  "Người đại diện điện nước": "m29",
  "Đề nghị bàn giao đại diện": "m30",
  "Kết quả bàn giao đại diện": "m31",
  "Hóa đơn điện nước mới": "m32",
  "Phòng đã thanh toán điện nước": "m33",
  "Đến hạn đóng điện nước": "m34",
  "Hóa đơn điện nước quá hạn": "m35",
  "Nhắc thanh toán điện nước trước hạn 15 phút": "m36",
  "Nhắc thanh toán điện nước trước hạn 1 ngày": "m37",
  "Phòng còn công nợ điện nước": "m38",
  "Phòng chưa thể chốt điện nước": "m39",
  "Thời gian cảnh báo trước hạn không được dài hơn thời gian được đóng tiền": "m40",
  "Mốc ghi lỗi phải sau mốc cảnh báo mức 2 (để sinh viên có thời gian phản hồi)": "m41",
  "Mốc đề nghị kỷ luật (mức 3) phải sau mốc ghi lỗi": "m42",
  "Chỉ báo cáo khi hóa đơn đã quá hạn mà phòng chưa đóng": "m43",
  "Đã quá thời hạn báo cáo, hệ thống đã ghi lỗi cho kỳ này": "m44",
  "Phòng chưa có trưởng phòng": "m45",
  "Trưởng phòng không thể tự báo cáo": "m46",
  "Bạn đã báo cáo cho hóa đơn này": "m47",
  "Người nộp tiền không thuộc phòng của hóa đơn này": "m48",
  "Đã đến kỳ đóng tiền điện nước": "m49",
  "Cảnh báo mức 1: sắp hết hạn đóng tiền điện nước": "m50",
  "Hóa đơn điện nước đã quá hạn": "m51",
  "Phòng quá hạn đóng điện nước": "m52",
  "Cảnh báo mức 3: phòng bị đề nghị xử lý kỷ luật": "m53",
  "Bạn bị ghi lỗi vi phạm nội quy tài chính": "m54",
  "Đã ghi lỗi cho trưởng phòng": "m55",
  "Báo cáo trưởng phòng chưa đóng điện nước": "m56",
  "Thành viên phòng đã báo bạn chưa đóng tiền điện nước": "m57",
  "Phòng đã đóng tiền điện nước": "m58",
};
export function roomUtilityError(
  message: string,
  t: (key: TranslationKey) => string,
) {
  const key = messages[message];
  return key ? t(("roomUtility.messages." + key) as TranslationKey) : message;
}
