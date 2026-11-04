import { File } from "expo-file-system";
import { Platform } from "react-native";
import type { AvatarResponse } from "../models/auth.model";
import type { ApiClient } from "../shared/api";

/** Đổi / gỡ ảnh đại diện của tài khoản đang đăng nhập (`POST /auth/avatar`, `/auth/avatar/remove`). */
export class AvatarService {
  constructor(private readonly request: ApiClient) {}

  async change(uri: string): Promise<AvatarResponse> {
    const form = new FormData();
    await AvatarService.appendImage(form, uri);
    return this.request<AvatarResponse>("/auth/avatar", { form });
  }

  remove(): Promise<AvatarResponse> {
    return this.request<AvatarResponse>("/auth/avatar/remove", { method: "POST" });
  }

  /** Trên native, fetch của Expo cần part có `bytes()` (giống upload ảnh minh chứng), nên đọc file qua expo-file-system. */
  private static async appendImage(form: FormData, uri: string) {
    const raw = uri.split("/").pop()?.split("?")[0] || `avatar-${Date.now()}`;
    const name = raw.includes(".") ? raw : `${raw}.jpg`;
    if (Platform.OS === "web") {
      form.append("file", await (await fetch(uri)).blob(), name);
      return;
    }
    const type = /\.png$/i.test(name) ? "image/png" : /\.webp$/i.test(name) ? "image/webp" : "image/jpeg";
    const file = new File(uri);
    form.append("file", { name, type, bytes: () => file.bytes() } as unknown as Blob);
  }
}
