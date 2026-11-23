import { Platform } from "react-native";
import { webPath } from "../shared/baseUrl";

/** Tệp JS của bản build web (tên có mã hash, đổi mỗi lần deploy có thay đổi code). */
const BUNDLE_PATTERN = /\/_expo\/static\/js\/web\/[^"'\s]+\.js/g;

/**
 * Phát hiện bản web mới đã deploy: so các tệp JS có mã hash trong `index.html` mới nhất trên máy chủ với
 * các tệp đang chạy. iPhone giữ app cài ra màn hình chính trong bộ nhớ, mở lại không tự tải bản mới.
 * Chỉ chạy ở bản build web (dev server không có tệp hash nên luôn coi là không có bản mới).
 */
export class AppVersionService {
  private readonly current: string | null;

  constructor() {
    this.current = AppVersionService.supported ? AppVersionService.loadedFingerprint() : null;
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
      const latest = AppVersionService.fingerprint(await response.text());
      return latest && latest !== this.current ? latest : null;
    } catch {
      return null;
    }
  }

  /** Tải lại để chạy bản mới (giữ nguyên phiên đăng nhập trong localStorage). */
  static reload(): void {
    window.location.reload();
  }

  private static loadedFingerprint(): string | null {
    const sources = Array.from(document.querySelectorAll("script[src]"))
      .map((script) => script.getAttribute("src") ?? "")
      .join(" ");
    return AppVersionService.fingerprint(sources);
  }

  private static fingerprint(text: string): string | null {
    const files = Array.from(new Set(text.match(BUNDLE_PATTERN) ?? [])).sort();
    return files.length ? files.join("|") : null;
  }
}
