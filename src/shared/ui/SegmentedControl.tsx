import { Text, View, ViewStyle } from "react-native";
import { makeStyles, radius, useTheme } from "../theme";
import { Touchable } from "./Touchable";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
  /** "glass": dùng trên nền màu/ảnh. */
  tone?: "light" | "glass";
};

/** Thanh chọn phân đoạn (Ngày / Tuần / Tháng). */
export function SegmentedControl<T extends string>({ options, value, onChange, style, tone = "light" }: Props<T>) {
  const styles = useStyles();
  const { shadow } = useTheme();
  const glass = tone === "glass";
  return (
    <View style={[styles.track, glass && styles.trackGlass, style]} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Touchable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            pressScale={0.98}
            style={[styles.item, active && (glass ? styles.activeGlass : styles.active), active && !glass && shadow(1)]}
          >
            <Text style={[styles.label, glass && styles.labelGlass, active && (glass ? styles.labelActiveGlass : styles.labelActive)]} numberOfLines={1}>
              {option.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(({ colors, isDark }) => ({
  track: { flexDirection: "row", backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, padding: 4 },
  trackGlass: { backgroundColor: "rgba(255,255,255,0.18)" },
  item: { flex: 1, height: 40, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  active: { backgroundColor: isDark ? colors.primarySoft : colors.surface },
  activeGlass: { backgroundColor: "rgba(255,255,255,0.95)" },
  label: { fontSize: 14, fontWeight: "600", color: colors.muted },
  labelGlass: { color: "rgba(255,255,255,0.9)" },
  labelActive: { color: colors.primary },
  labelActiveGlass: { color: "#1F1B17" },
}));
