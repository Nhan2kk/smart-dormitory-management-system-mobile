import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { radius, Tone, useTheme } from "../theme";

export type IconName = keyof typeof Ionicons.glyphMap;

/** Nhãn trạng thái dạng viên thuốc, luôn kèm chấm màu để không phụ thuộc hoàn toàn vào màu. */
export function StatusBadge({
  label,
  tone,
  style,
}: {
  label: string;
  tone: Tone;
  style?: ViewStyle;
}) {
  const palette = useTheme().tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: palette.fg }]} />
      <Text style={[styles.text, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Ô icon bo góc với nền nhạt theo tông màu. */
export function IconBadge({
  icon,
  tone = "primary",
  size = 44,
  rounded = "squircle",
}: {
  icon: IconName;
  tone?: Tone;
  size?: number;
  rounded?: "squircle" | "circle";
}) {
  const palette = useTheme().tones[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded === "circle" ? size / 2 : size * 0.32,
        backgroundColor: palette.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={size * 0.48} color={palette.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: "700" },
});
