import { ApiError } from "../../shared/api";
import { DeviceStorage } from "../../shared/DeviceStorage";
import type { AuthUser } from "../../models/auth.model";

const SESSION_KEY = "sdms.session";
/** Khoá cũ chỉ lưu refresh token (trước khi lưu kèm thông tin người dùng). */
const LEGACY_TOKEN_KEY = "sdms.refreshToken";

export type SavedSession = { refreshToken: string; user: AuthUser | null };

/**
 * Phiên đăng nhập lưu trên máy (SecureStore trên mobile, localStorage trên web) để mở app là vào thẳng như Zalo:
 * giữ refresh token và thông tin người dùng cho tới khi đăng xuất hoặc server từ chối phiên.
 */
export class SessionStore {
  static async load(): Promise<SavedSession | null> {
    try {
      const raw = await DeviceStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedSession;
        if (parsed?.refreshToken)
          return {
            refreshToken: parsed.refreshToken,
            user: parsed.user ?? null,
          };
      }
      const legacy = await DeviceStorage.getItem(LEGACY_TOKEN_KEY);
      return legacy ? { refreshToken: legacy, user: null } : null;
    } catch {
      return null;
    }
  }

  static async save(refreshToken: string, user: AuthUser): Promise<void> {
    await DeviceStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ refreshToken, user } satisfies SavedSession),
    );
    await DeviceStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => undefined);
  }

  static async clear(): Promise<void> {
    await Promise.all(
      [
        DeviceStorage.removeItem(SESSION_KEY),
        DeviceStorage.removeItem(LEGACY_TOKEN_KEY),
      ].map((task) => task.catch(() => undefined)),
    );
  }

  /** Server từ chối phiên (token sai, hết hạn, bị thu hồi) → phải đăng nhập lại; lỗi mạng thì giữ phiên. */
  static isRejected(error: unknown): boolean {
    return error instanceof ApiError && [400, 401, 403].includes(error.status);
  }
}
