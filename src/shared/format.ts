import type { Dictionary, Language } from "./i18n/types";

/** Định dạng hiển thị dùng chung, theo ngôn ngữ đang chọn. */
export class Formatter {
  /** Mốc "bây giờ" cố định để dữ liệu mock hiển thị nhất quán. */
  static readonly now = new Date("2026-10-08T09:00:00+07:00");
  private static lang: Language = "vi";
  private static dictionary: Dictionary | null = null;

  static setLanguage(lang: Language, dictionary: Dictionary) {
    Formatter.lang = lang;
    Formatter.dictionary = dictionary;
  }

  private static get locale() {
    return Formatter.lang === "en" ? "en-US" : "vi-VN";
  }

  private static text(
    path:
      | "justNow"
      | "minutes"
      | "hours"
      | "days"
      | "morning"
      | "noon"
      | "afternoon"
      | "evening",
    count?: number,
  ) {
    const value = Formatter.dictionary?.time[path] ?? path;
    return count === undefined
      ? value
      : value.replace("{{count}}", String(count));
  }

  static currency(amount: number): string {
    const number = new Intl.NumberFormat("vi-VN").format(amount);
    return Formatter.lang === "en" ? `${number} ₫` : `${number}đ`;
  }

  /** 2.800.000 → "2,8tr" / "2.8M" — dùng cho thẻ tóm tắt hẹp. */
  static compactCurrency(amount: number): string {
    const en = Formatter.lang === "en";
    if (amount >= 1_000_000) {
      const value = (amount / 1_000_000).toFixed(1).replace(/\.0$/, "");
      return en ? `${value}M` : `${value.replace(".", ",")}tr`;
    }
    if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
    return Formatter.currency(amount);
  }

  static decimal(value: number, digits = 1): string {
    return value.toLocaleString(Formatter.locale, {
      maximumFractionDigits: digits,
    });
  }

  static date(value: string | Date): string {
    const date = typeof value === "string" ? new Date(value) : value;
    const [d, m, y] = [
      Formatter.pad(date.getDate()),
      Formatter.pad(date.getMonth() + 1),
      date.getFullYear(),
    ];
    return Formatter.lang === "en" ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
  }

  static shortDate(value: string | Date): string {
    const date = typeof value === "string" ? new Date(value) : value;
    const [d, m] = [
      Formatter.pad(date.getDate()),
      Formatter.pad(date.getMonth() + 1),
    ];
    return Formatter.lang === "en" ? `${m}/${d}` : `${d}/${m}`;
  }

  static monthYear(value: string | Date): string {
    const date = typeof value === "string" ? new Date(value) : value;
    return `${Formatter.pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  static time(value: string | Date): string {
    const date = typeof value === "string" ? new Date(value) : value;
    return `${Formatter.pad(date.getHours())}:${Formatter.pad(date.getMinutes())}`;
  }

  static dateTime(value: string | Date): string {
    return `${Formatter.time(value)} · ${Formatter.date(value)}`;
  }

  static weekday(value: Date): string {
    const names = (
      Formatter.dictionary?.time.weekdays ?? "CN,T2,T3,T4,T5,T6,T7"
    ).split(",");
    return names[value.getDay()];
  }

  /** "Vừa xong", "5 phút trước", "2 giờ trước", "3 ngày trước". */
  static relative(value: string, now: Date = Formatter.now): string {
    const minutes = Math.max(
      0,
      Math.round((now.getTime() - new Date(value).getTime()) / 60000),
    );
    if (minutes < 1) return Formatter.text("justNow");
    if (minutes < 60) return Formatter.text("minutes", minutes);
    const hours = Math.round(minutes / 60);
    if (hours < 24) return Formatter.text("hours", hours);
    const days = Math.round(hours / 24);
    if (days < 7) return Formatter.text("days", days);
    return Formatter.date(value);
  }

  static countdown(totalSeconds: number): string {
    const safe = Math.max(0, totalSeconds);
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const s = safe % 60;
    return h > 0
      ? `${Formatter.pad(h)}:${Formatter.pad(m)}:${Formatter.pad(s)}`
      : `${Formatter.pad(m)}:${Formatter.pad(s)}`;
  }

  /** "Thứ Bảy" / "Saturday" theo ngôn ngữ đang chọn. */
  static weekdayLong(value: Date): string {
    const names = (
      Formatter.dictionary?.time.weekdaysLong ??
      "Chủ Nhật,Thứ Hai,Thứ Ba,Thứ Tư,Thứ Năm,Thứ Sáu,Thứ Bảy"
    ).split(",");
    return names[value.getDay()];
  }

  /** Tên gọi thân mật: `words` chữ cuối của họ tên ("Nguyễn Văn Nhân" → "Văn Nhân"). */
  static callName(fullName: string, words = 2): string {
    return fullName.trim().split(/\s+/).filter(Boolean).slice(-words).join(" ");
  }

  static greeting(hour: number = new Date().getHours()): string {
    if (hour < 11) return Formatter.text("morning");
    if (hour < 14) return Formatter.text("noon");
    if (hour < 18) return Formatter.text("afternoon");
    return Formatter.text("evening");
  }

  static iso(date: Date): string {
    return `${date.getFullYear()}-${Formatter.pad(date.getMonth() + 1)}-${Formatter.pad(date.getDate())}`;
  }

  /** "Nguyễn Hoàng Nam" → "HN" (hai chữ đầu của tên đệm cuối và tên) cho ảnh đại diện. */
  static initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "S";
    return (
      parts.length > 1
        ? parts[parts.length - 2][0] + parts[parts.length - 1][0]
        : parts[0][0]
    ).toUpperCase();
  }

  private static pad(value: number): string {
    return String(value).padStart(2, "0");
  }
}
