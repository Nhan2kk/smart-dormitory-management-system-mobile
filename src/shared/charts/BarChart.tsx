import { StyleSheet, Text, View } from "react-native";
import { Formatter } from "../format";
import { Theme, useTheme } from "../theme";

/** Biểu đồ cột dọc đơn giản bằng View; cột được chọn tô màu nhấn. */
export function BarChart({
  values,
  labels,
  height = 120,
  activeIndex,
  color,
  inactiveColor,
}: {
  values: number[];
  labels: string[];
  height?: number;
  activeIndex?: number;
  color?: string;
  inactiveColor?: string;
}) {
  const { colors } = useTheme();
  const styles = stylesFor(colors);
  const barColor = color ?? colors.primary;
  const inactive = inactiveColor ?? colors.primarySoft;
  const max = Math.max(...values, 1);
  const active = activeIndex ?? values.length - 1;
  return (
    <View>
      <View style={[styles.bars, { height }]}>
        {values.map((value, index) => (
          <View key={index} style={styles.col}>
            <View
              style={[
                styles.bar,
                { height: Math.max(6, (value / max) * height), backgroundColor: index === active ? barColor : inactive },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {labels.map((label, index) => (
          <Text key={index} style={[styles.label, index === active && { color: colors.ink, fontWeight: "800" }]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Thanh so sánh ngang: phòng của bạn vs trung bình. */
export function CompareBar({
  label,
  value,
  reference,
  unit,
  color,
}: {
  label: string;
  value: number;
  reference: number;
  unit: string;
  color?: string;
}) {
  const { colors } = useTheme();
  const styles = stylesFor(colors);
  const fill = color ?? colors.primary;
  const max = Math.max(value, reference) * 1.1;
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.compareLabel}>{label}</Text>
      <View style={styles.compareRow}>
        <View style={styles.compareTrack}>
          <View style={[styles.compareFill, { width: `${(value / max) * 100}%`, backgroundColor: fill }]} />
        </View>
        <Text style={styles.compareValue}>
          {Formatter.decimal(value)} {unit}
        </Text>
      </View>
      <View style={styles.compareRow}>
        <View style={styles.compareTrack}>
          <View style={[styles.compareFill, { width: `${(reference / max) * 100}%`, backgroundColor: colors.border }]} />
        </View>
        <Text style={[styles.compareValue, { color: colors.muted }]}>
          {Formatter.decimal(reference)} {unit}
        </Text>
      </View>
    </View>
  );
}

const stylesFor = (colors: Theme["colors"]) =>
  StyleSheet.create({
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  col: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" },
  bar: { width: "100%", maxWidth: 26, borderRadius: 8 },
  labels: { flexDirection: "row", gap: 8, marginTop: 8 },
  label: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: colors.muted },
  compareLabel: { fontSize: 14, fontWeight: "700", color: colors.ink },
  compareRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  compareTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.surfaceMuted, overflow: "hidden" },
  compareFill: { height: "100%", borderRadius: 5 },
  compareValue: { width: 74, textAlign: "right", fontSize: 13, fontWeight: "700", color: colors.ink },
  });
