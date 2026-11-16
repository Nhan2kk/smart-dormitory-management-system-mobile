import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Lưu chuỗi trên thiết bị: SecureStore trên iOS/Android, localStorage trên web
 * (expo-secure-store không hỗ trợ web, gọi vào sẽ lỗi "setValueWithKeyAsync is not a function").
 */
export class DeviceStorage {
  private static get isWeb(): boolean {
    return Platform.OS === "web";
  }

  static async getItem(key: string): Promise<string | null> {
    if (DeviceStorage.isWeb) return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  }

  static async setItem(key: string, value: string): Promise<void> {
    if (DeviceStorage.isWeb) {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  }

  static async removeItem(key: string): Promise<void> {
    if (DeviceStorage.isWeb) {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }
}
