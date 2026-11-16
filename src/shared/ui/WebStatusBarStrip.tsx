import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Bản web trên iPhone: Safari làm mờ phần nội dung nằm dưới vùng giờ/pin (tai thỏ). Một dải màu đặc
 * `position: fixed` chạm mép trên khiến Safari tô vùng đó bằng màu của dải thay vì làm mờ.
 * iOS/Android native và trình duyệt không có tai thỏ (inset = 0) thì không vẽ gì.
 */
export function WebStatusBarStrip({ color }: { color: string }) {
  const { top } = useSafeAreaInsets();
  if (Platform.OS !== "web" || top <= 0) return null;
  return <View pointerEvents="none" style={[styles.strip, { height: top, backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  strip: {
    // react-native-web nhận "fixed"; kiểu của React Native chỉ khai báo absolute/relative.
    position: "fixed" as ViewStyle["position"],
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});
