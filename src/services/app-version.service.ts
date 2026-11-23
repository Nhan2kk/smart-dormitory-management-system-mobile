import { Platform } from "react-native";
import { webPath } from "../shared/baseUrl";

/** Tệp JS của bản build web (tên có mã hash, đổi mỗi lần deploy có thay đổi code). */
const BUNDLE_PATTERN = /\/_expo\/static\/js\/web\/[^"'\s]+\.js/g;

/**
 * Phát hiện bản web mới đã deploy: so `index.html` mới nhất trên máy chủ với bản đang chạy, gồm các tệp JS có
 * mã hash và phần CSS / script viết tay trong `<head>` (deploy chỉ sửa HTML thì tên tệp JS không đổi). iPhone giữ app cài ra màn hình chính trong bộ nhớ, mở lại không tự tải bản mới.
 * Chỉ chạy ở bản build web (dev server không có tệp hash nên luôn coi là không có bản mới).
 */
export class AppVersionService {
  private readonly current: string | null;

  constructor() {
    this.current = AppVersionService.supported ? AppVersionService.fingerprint(document) : null;
  }

  static get supported(): boolean {
    return Platform.OS === "web" && typeof document !== "undefined" && typeof fetch !== "undefined";
  }

  /** Dấu vân tay của bản mới nhất nếu khác bản đang chạy; null nếu không có bản mới hoặc không kiểm tra được. */
  async newerVersion(): Promise<string | null> {
    if (!this.current) return null;
    try {
      const response = await fetch(`${webPath("/")}?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return null;
      const html = await response.text();
      const latest = AppVersionService.fingerprint(new DOMParser().parseFromString(html, "text/html"));
      return latest && latest !== this.current ? latest : null;
    } catch {
      return null;
    }
  }

  /** Tải lại để chạy bản mới (giữ nguyên phiên đăng nhập trong localStorage). */
  static reload(): void {
    window.location.reload();
  }

  /**
   * Dấu vân tay của một bản build: tệp JS có mã hash + CSS reset + script viết tay trong `<head>`. Chỉ lấy những
   * phần app không tự sửa lúc chạy (không lấy meta theme-color hay style do react-native-web chèn thêm).
   * Không có tệp JS hash (dev server) thì trả null để không bao giờ báo bản mới.
   */
  private static fingerprint(doc: Document): string | null {
    const sources = Array.from(doc.querySelectorAll("script[src]"))
      .map((script) => script.getAttribute("src") ?? "")
      .join(" ");
    const files = Array.from(new Set(sources.match(BUNDLE_PATTERN) ?? [])).sort();
    if (!files.length) return null;
    const inline = [
      doc.getElementById("expo-reset")?.textContent ?? "",
      ...Array.from(doc.head.querySelectorAll("script:not([src])")).map((script) => script.textContent ?? ""),
    ];
    return [...files, AppVersionService.hash(inline.join("\n"))].join("|");
  }

  /** Băm chuỗi ngắn gọn (FNV-1a 32-bit) để so sánh, không dùng cho bảo mật. */
  private static hash(text: string): string {
    let value = 0x811c9dc5;
    for (let index = 0; index < text.length; index++) {
      value ^= text.charCodeAt(index);
      value = Math.imul(value, 0x01000193);
    }
    return (value >>> 0).toString(16);
  }
}
