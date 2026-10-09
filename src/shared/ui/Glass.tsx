import { BlurView } from "expo-blur";
import { ReactNode } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../theme";

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** "surface": kính theo theme; "photo": kính tối đặt trên ảnh, chữ trắng. */
  variant?: "surface" | "photo";
  intensity?: number;
  /** Lớp phủ đậm hơn khi cần đọc nhiều chữ. */
  strong?: boolean;
};

/**
 * Lớp kính mờ (glassmorphism). iOS/web làm mờ thật nội dung phía sau; Android dùng lớp phủ bán trong suốt
 * đậm hơn vì blur trên Android cần cấu hình riêng.
 */
export function Glass({
  children,
  style,
  variant = "surface",
  intensity = 45,
  strong,
}: Props) {
  const { colors, isDark } = useTheme();
  const onPhoto = variant === "photo";
  const tint = onPhoto || isDark ? "dark" : "light";
  const android = Platform.OS === "android";
  const fill = onPhoto
    ? android
      ? "rgba(20,14,10,0.55)"
      : strong
        ? "rgba(20,14,10,0.45)"
        : "rgba(20,14,10,0.22)"
    : android || strong
      ? colors.glassStrong
      : colors.glass;
  return (
    <View
      style={[
        styles.base,
        {
          borderColor: onPhoto ? "rgba(255,255,255,0.28)" : colors.glassBorder,
        },
        style,
      ]}
    >
      {!android && (
        <BlurView
          intensity={intensity}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: fill }]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: "hidden", borderWidth: StyleSheet.hairlineWidth * 2 },
});
