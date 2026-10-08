import type { Href } from "expo-router";
import { L } from "../../shared/i18n/localized";
import type { Localized } from "../../shared/i18n/types";
import type { Tone } from "../../shared/theme";
import type { IconName } from "../../shared/ui";

export type NotificationKind = "info" | "success" | "warning" | "danger" | "system";
export type NotificationPriority = "NORMAL" | "IMPORTANT" | "URGENT";
export type NotificationSource = "ANNOUNCEMENT" | "MANUAL" | "SYSTEM";

export type AppNotification = {
  id: string;
  title: Localized;
  body: Localized;
  content: Localized;
  kind: NotificationKind;
  priority: NotificationPriority;
  source: NotificationSource;
  sender: Localized;
  sentAt: string;
  read: boolean;
  /** Đường dẫn trong app để mở nhanh nội dung liên quan. */
  link?: { label: Localized; href: Href };
};

export const notificationKindMeta: Record<NotificationKind, { icon: IconName; tone: Tone }> = {
  info: { icon: "megaphone-outline", tone: "info" },
  success: { icon: "checkmark-done-outline", tone: "success" },
  warning: { icon: "time-outline", tone: "warning" },
  danger: { icon: "alert-circle-outline", tone: "danger" },
  system: { icon: "sparkles-outline", tone: "violet" },
};

const SYSTEM = L("Hệ thống tự động", "Automated system");
const OFFICE = L("Ban quản lý KTX", "Dormitory office");

export class NotificationRepository {
  private static readonly records: AppNotification[] = [
    {
      id: "n1",
      title: L("Khoản điện nước tháng 09 đã quá hạn", "September utilities are overdue"),
      body: L("Vui lòng thanh toán 210.200đ để tránh phát sinh phí trễ hạn.", "Please pay 210,200₫ to avoid late fees."),
      content: L(
        "Khoản điện, nước tháng 09/2026 của phòng A101 đã quá hạn 3 ngày. Vui lòng thanh toán sớm qua ứng dụng để tránh bị tính phí trễ hạn theo quy định của KTX.",
        "Room A101's September 2026 utilities bill is 3 days overdue. Please pay in the app soon to avoid late fees under dorm rules.",
      ),
      kind: "danger",
      priority: "URGENT",
      source: "SYSTEM",
      sender: SYSTEM,
      sentAt: "2026-10-08T07:00:00+07:00",
      read: false,
      link: { label: L("Thanh toán ngay", "Pay now"), href: "/debts" },
    },
    {
      id: "n2",
      title: L("Yêu cầu chuyển phòng đã được duyệt", "Room transfer approved"),
      body: L("Thanh toán 300.000đ chênh lệch trước 10/10 để hoàn tất.", "Pay the 300,000₫ difference before 10/10 to complete it."),
      content: L(
        "Yêu cầu chuyển sang phòng B205 đã được duyệt. Vui lòng thanh toán hoá đơn tất toán HD-0240 trước ngày 10/10/2026, sau đó nhận phòng mới trong ứng dụng.",
        "Your transfer to room B205 is approved. Pay settlement bill HD-0240 before 10/10/2026, then check in to the new room in the app.",
      ),
      kind: "warning",
      priority: "IMPORTANT",
      source: "SYSTEM",
      sender: SYSTEM,
      sentAt: "2026-10-06T14:12:00+07:00",
      read: false,
      link: { label: L("Xem yêu cầu", "View request"), href: "/request/CP-2026-0102" },
    },
    {
      id: "n3",
      title: L("Yêu cầu BT-2026-0312 đã được sửa chữa", "Request BT-2026-0312 repaired"),
      body: L("Kỹ thuật viên đã thay bóng đèn. Hãy xác nhận kết quả giúp BQL nhé.", "The technician replaced the light. Please confirm the result."),
      content: L(
        "Yêu cầu hỗ trợ “Đèn phòng không hoạt động” đã được xử lý lúc 15:05 ngày 07/10/2026. Vui lòng kiểm tra và xác nhận kết quả sửa chữa trong ứng dụng.",
        "Your request “Room light not working” was handled at 15:05 on 10/07/2026. Please check and confirm the repair in the app.",
      ),
      kind: "success",
      priority: "NORMAL",
      source: "SYSTEM",
      sender: SYSTEM,
      sentAt: "2026-10-07T15:06:00+07:00",
      read: false,
      link: { label: L("Xác nhận kết quả", "Confirm result"), href: "/request/BT-2026-0312" },
    },
    {
      id: "n4",
      title: L("Lịch cắt điện bảo trì tòa A", "Planned power outage in building A"),
      body: L("Thứ Bảy 11/10, từ 8:00 đến 11:00 để bảo trì trạm biến áp.", "Saturday 10/11, 8:00–11:00 for transformer maintenance."),
      content: L(
        "Tòa A sẽ tạm ngừng cấp điện từ 8:00 đến 11:00 ngày 11/10/2026 để bảo trì định kỳ trạm biến áp. Sinh viên vui lòng sạc đầy thiết bị và rút phích cắm các thiết bị điện trước thời gian trên.",
        "Building A will have no power from 8:00 to 11:00 on 10/11/2026 for scheduled transformer maintenance. Please charge your devices and unplug appliances beforehand.",
      ),
      kind: "warning",
      priority: "IMPORTANT",
      source: "ANNOUNCEMENT",
      sender: OFFICE,
      sentAt: "2026-10-06T10:00:00+07:00",
      read: true,
    },
    {
      id: "n5",
      title: L("Mở đợt đăng ký KTX học kỳ II", "Semester II registration opens"),
      body: L("Đăng ký từ 15/10 đến 30/10/2026 cho sinh viên năm nhất và năm hai.", "Register from 10/15 to 10/30/2026, for first and second-year students."),
      content: L(
        "Đợt đăng ký ký túc xá học kỳ II năm học 2026–2027 mở từ 15/10 đến 30/10/2026. Sinh viên đăng ký và thanh toán trực tiếp trên ứng dụng. Giường được giữ chỗ trong 24 giờ kể từ khi đăng ký.",
        "Dormitory registration for semester II 2026–2027 runs from 10/15 to 10/30/2026. Register and pay directly in the app. Beds are held for 24 hours after registering.",
      ),
      kind: "info",
      priority: "NORMAL",
      source: "ANNOUNCEMENT",
      sender: OFFICE,
      sentAt: "2026-10-04T09:00:00+07:00",
      read: true,
      link: { label: L("Xem đợt đăng ký", "View registration"), href: "/register-dorm" },
    },
    {
      id: "n6",
      title: L("Trợ lý AI đã có nội quy mới", "AI assistant knows the new rules"),
      body: L("Hỏi Trợ lý AI về giờ giấc, khách thăm và an toàn PCCC.", "Ask about curfew, visitors and fire safety."),
      content: L("Trợ lý AI vừa được cập nhật Nội quy KTX phiên bản 2026. Bạn có thể hỏi bất kỳ lúc nào.", "The AI assistant now knows the 2026 dormitory rules. Ask any time."),
      kind: "system",
      priority: "NORMAL",
      source: "SYSTEM",
      sender: SYSTEM,
      sentAt: "2026-09-30T08:00:00+07:00",
      read: true,
      link: { label: L("Mở Trợ lý AI", "Open AI assistant"), href: "/assistant" },
    },
  ];

  static all(): AppNotification[] {
    return NotificationRepository.records;
  }

  static find(id: string): AppNotification | undefined {
    return NotificationRepository.records.find((item) => item.id === id);
  }

  static unreadCount(): number {
    return NotificationRepository.records.filter((item) => !item.read).length;
  }
}
