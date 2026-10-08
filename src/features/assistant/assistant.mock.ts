import { L } from "../../shared/i18n/localized";
import type { Language, Localized } from "../../shared/i18n/types";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  sources?: { title: string; page: number }[];
  feedback?: "up" | "down";
};

export type Conversation = { id: string; title: string; updatedAt: string; messages: ChatMessage[] };

type Answer = { keywords: string[]; text: Localized; sources: { title: Localized; page: number }[] };

/** Trả lời giả lập theo từ khoá — thay bằng API Chat AI (RAG) khi tích hợp. */
export class AssistantMockEngine {
  static readonly suggestions: Localized[] = [
    L("Giờ đóng cửa KTX là mấy giờ?", "What time does the dorm close?"),
    L("Làm sao để chuyển phòng?", "How do I transfer rooms?"),
    L("Đóng tiền phòng bằng cách nào?", "How do I pay my rent?"),
    L("Quy định về khách đến thăm", "Rules for visitors"),
  ];

  private static readonly answers: Answer[] = [
    {
      keywords: ["giờ", "đóng cửa", "close", "curfew"],
      text: L(
        "KTX mở cửa từ 5:30 và đóng cửa lúc 23:00 hằng ngày. Sau 23:00, sinh viên cần quẹt thẻ tại cổng chính và được ghi nhận vào sổ ra vào. Về trễ quá 3 lần/tháng sẽ bị nhắc nhở bằng văn bản.",
        "The dorm opens at 5:30 and closes at 23:00 every day. After 23:00, tap your card at the main gate and you'll be logged. Coming back late more than 3 times a month results in a written warning.",
      ),
      sources: [{ title: L("Nội quy KTX 2026", "Dorm rules 2026"), page: 4 }],
    },
    {
      keywords: ["chuyển phòng", "transfer"],
      text: L(
        "Vào mục Yêu cầu → nút “+” → Chuyển phòng, chọn tòa, phòng và giường mong muốn. Ứng dụng hiển thị chênh lệch giá dự kiến. Sau khi BQL duyệt và bạn tất toán chênh lệch, bạn nhận phòng mới và kiểm tra tài sản như lần nhận phòng đầu.",
        "Go to Requests → “+” → Room transfer and choose the building, room and bed. The app shows the estimated price difference. Once approved and settled, check in to the new room and inspect its assets just like your first check-in.",
      ),
      sources: [
        { title: L("Quy trình chuyển phòng", "Room transfer process"), page: 2 },
        { title: L("Nội quy KTX 2026", "Dorm rules 2026"), page: 9 },
      ],
    },
    {
      keywords: ["đóng tiền", "thanh toán", "tiền phòng", "pay", "rent"],
      text: L(
        "Vào mục Công nợ, chọn khoản cần thanh toán rồi quét mã QR bằng ứng dụng ngân hàng. Hệ thống tự cập nhật trạng thái sau vài giây. Tiền phòng cần thanh toán trước ngày 10 hằng tháng.",
        "Open Payments, pick the item and scan the QR code with your banking app. The status updates within seconds. Rent is due before the 10th of each month.",
      ),
      sources: [{ title: L("Hướng dẫn thanh toán", "Payment guide"), page: 1 }],
    },
    {
      keywords: ["khách", "thăm", "visit"],
      text: L(
        "Khách được tiếp tại phòng sinh hoạt chung từ 7:00 đến 21:00, cần đăng ký với bảo vệ và để lại giấy tờ tùy thân. Khách không được ở lại qua đêm.",
        "Visitors are welcome in the common room from 7:00 to 21:00. They must register with security and leave an ID. Overnight stays are not allowed.",
      ),
      sources: [{ title: L("Nội quy KTX 2026", "Dorm rules 2026"), page: 6 }],
    },
  ];

  static reply(question: string, lang: Language): ChatMessage {
    const normalized = question.toLowerCase();
    const match = AssistantMockEngine.answers.find((answer) => answer.keywords.some((keyword) => normalized.includes(keyword)));
    return {
      id: `a-${Date.now()}`,
      role: "assistant",
      text:
        match?.text[lang] ??
        (lang === "en"
          ? "I couldn't find this in the dorm documents. You can send a support request so the office can reply directly."
          : "Mình chưa tìm thấy thông tin chính xác trong tài liệu KTX. Bạn có thể gửi Yêu cầu hỗ trợ để Ban quản lý phản hồi trực tiếp nhé."),
      sources: match?.sources.map((source) => ({ title: source.title[lang], page: source.page })),
    };
  }

  /** Lịch sử trò chuyện mẫu. */
  static history(lang: Language): Conversation[] {
    const q1 = AssistantMockEngine.suggestions[0][lang];
    const q2 = AssistantMockEngine.suggestions[3][lang];
    return [
      { id: "c1", title: q1, updatedAt: "2026-10-07T21:40:00+07:00", messages: [{ id: "c1u", role: "user", text: q1 }, { ...AssistantMockEngine.reply(q1, lang), id: "c1a" }] },
      { id: "c2", title: q2, updatedAt: "2026-10-02T18:05:00+07:00", messages: [{ id: "c2u", role: "user", text: q2 }, { ...AssistantMockEngine.reply(q2, lang), id: "c2a" }] },
    ];
  }
}
