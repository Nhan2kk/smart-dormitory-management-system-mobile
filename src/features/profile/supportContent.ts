import { L } from "../../shared/i18n/localized";
import type { Localized } from "../../shared/i18n/types";

/** Một câu hỏi thường gặp kèm câu trả lời song ngữ. */
export type FaqItem = { question: Localized; answer: Localized };

/** Câu hỏi thường gặp, trả lời theo đúng các chức năng đang có trong ứng dụng. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: L("Thanh toán tiền phòng, điện nước như thế nào?", "How do I pay rent and utility bills?"),
    answer: L(
      "Vào Cá nhân → Công nợ & hoá đơn, chọn hoá đơn cần trả rồi quét mã QR bằng ứng dụng ngân hàng. Hệ thống tự xác nhận khi nhận được tiền, bạn không cần gửi biên lai.",
      "Go to Profile → Debts & bills, pick a bill and scan its QR code with your banking app. Payment is confirmed automatically once the money arrives — no receipt needed.",
    ),
  },
  {
    question: L("Thiết bị trong phòng bị hỏng thì báo ở đâu?", "Something in my room is broken. Where do I report it?"),
    answer: L(
      "Mở tab Yêu cầu, bấm dấu + và chọn Hỗ trợ & bảo trì, mô tả sự cố và đính kèm ảnh. Khi kỹ thuật báo đã sửa xong, bạn kiểm tra thực tế rồi xác nhận kết quả hoặc báo chưa khắc phục.",
      "Open the Requests tab, tap + and choose Support & maintenance, then describe the problem and attach photos. When the technician marks it fixed, check it and confirm or report that it's not fixed.",
    ),
  },
  {
    question: L("Muốn chuyển phòng hoặc trả phòng thì làm sao?", "How do I move to another room or check out?"),
    answer: L(
      "Tạo yêu cầu Chuyển phòng hoặc Trả phòng ở tab Yêu cầu. Ban quản lý sẽ hẹn kiểm tra tài sản trong phòng, sau đó tất toán các khoản còn lại trước khi hoàn tất.",
      "Create a Room transfer or Check-out request in the Requests tab. The office will book a room inspection, then settle any remaining charges before completing it.",
    ),
  },
  {
    question: L("Số điện nước trong ứng dụng lấy từ đâu?", "Where do the utility readings come from?"),
    answer: L(
      "Cảm biến IoT gắn ở đồng hồ của phòng gửi số đo mỗi giờ. Tab Điện nước hiển thị lượng dùng và chi phí ước tính theo bảng giá hiện hành; hoá đơn chính thức do Ban quản lý chốt cuối kỳ.",
      "IoT sensors on your room's meters send readings every hour. The Utilities tab shows usage and an estimated cost at current rates; the official bill is issued by the office at the end of the period.",
    ),
  },
  {
    question: L("Vì sao tôi bị đăng xuất khỏi ứng dụng?", "Why was I signed out?"),
    answer: L(
      "Mỗi tài khoản chỉ đăng nhập trên một điện thoại. Đăng nhập ở máy khác sẽ đăng xuất máy cũ. Đổi mật khẩu cũng đăng xuất mọi thiết bị đang dùng tài khoản.",
      "Each account can be signed in on one phone at a time, so signing in on another phone signs out the old one. Changing your password also signs out every device.",
    ),
  },
  {
    question: L("Quên mật khẩu thì phải làm gì?", "I forgot my password. What should I do?"),
    answer: L(
      "Bấm \"Quên mật khẩu?\" ở màn đăng nhập, nhập MSSV và email đã đăng ký để nhận mã 6 số, rồi đặt mật khẩu mới. Nếu email không còn dùng được, hãy liên hệ Ban quản lý KTX.",
      "Tap \"Forgot password?\" on the sign-in screen, enter your student ID and registered email to get a 6-digit code, then set a new password. If you no longer have that email, contact the dorm office.",
    ),
  },
];

/** Những gì có trong phiên bản hiện tại của ứng dụng. */
export const RELEASE_NOTES: Localized[] = [
  L("Theo dõi điện nước theo giờ từ cảm biến IoT, so sánh với tháng trước.", "Hourly utility tracking from IoT sensors, compared with last month."),
  L("Thanh toán hoá đơn bằng mã QR, tự xác nhận khi nhận tiền.", "Pay bills by QR code with automatic confirmation."),
  L("Gửi và theo dõi yêu cầu hỗ trợ, chuyển phòng, trả phòng.", "Send and track support, room transfer and check-out requests."),
  L("Nhắn tin trực tiếp với Ban quản lý và hỏi Trợ lý AI về nội quy.", "Chat with the dorm office and ask the AI assistant about rules."),
  L("Mỗi tài khoản đăng nhập trên một điện thoại để bảo vệ tài khoản.", "One phone per account to keep your account safe."),
];
