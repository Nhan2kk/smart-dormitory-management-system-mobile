import { AccessibilityInfo, Animated, Easing, Platform } from "react-native";

/** Thông số chuyển động dùng chung để mọi hiệu ứng trong app cùng nhịp. */
export class Motion {
  /** Thời lượng chuẩn (ms). */
  static readonly duration = { fast: 160, base: 260, slow: 340 } as const;

  /** Native driver chỉ có trên iOS/Android; web chạy bằng JS. */
  static readonly nativeDriver = Platform.OS !== "web";

  private static reduceMotion: boolean | null = null;

  /** Người dùng bật "Giảm chuyển động": bỏ hiệu ứng, hiện ngay. Đọc một lần rồi giữ lại. */
  static async prefersReducedMotion(): Promise<boolean> {
    if (Motion.reduceMotion !== null) return Motion.reduceMotion;
    try {
      Motion.reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
    } catch {
      Motion.reduceMotion = false;
    }
    return Motion.reduceMotion;
  }

  /** Chạy một giá trị tới đích theo đường cong ease-out (giảm tốc dần khi tới nơi). */
  static timing(value: Animated.Value, toValue: number, duration: number = Motion.duration.base) {
    return Animated.timing(value, {
      toValue,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Motion.nativeDriver,
    });
  }

  /** Lò xo nhẹ cho phản hồi khi nhấn. */
  static spring(value: Animated.Value, toValue: number) {
    return Animated.spring(value, {
      toValue,
      speed: 40,
      bounciness: 6,
      useNativeDriver: Motion.nativeDriver,
    });
  }
}
