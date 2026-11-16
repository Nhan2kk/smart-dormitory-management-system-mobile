import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Kích thước thanh tab nổi; dùng chung cho thanh tab và khoảng chừa ở cuối các trang trong tab. */
export class TabBarMetrics {
  /** Chiều cao thanh tab. */
  static readonly HEIGHT = 72;
  /** Khoảng thở giữa nội dung cuối trang và mép trên thanh tab. */
  private static readonly BREATHING = 32;

  /**
   * Khoảng từ thanh tab tới mép dưới màn hình. Bản web (app cài ra màn hình chính) để thanh sát đáy, vạch
   * home của iPhone nằm đè lên mép dưới thanh như ứng dụng gốc; bản native giữ khoảng tránh vạch home.
   */
  static bottomGap(insetBottom: number): number {
    return Platform.OS === "web" ? Math.max(insetBottom - 24, 10) : Math.max(insetBottom - 6, 12);
  }

  /** Khoảng trống cuối trang để nội dung cuối cùng nằm hẳn trên thanh tab. */
  static space(insetBottom: number): number {
    return TabBarMetrics.HEIGHT + TabBarMetrics.bottomGap(insetBottom) + TabBarMetrics.BREATHING;
  }
}

/** Khoảng trống cuối trang cho màn hình nằm trong tab (theo vùng an toàn của máy). */
export function useTabBarSpace(): number {
  return TabBarMetrics.space(useSafeAreaInsets().bottom);
}
