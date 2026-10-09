import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useTheme } from "../theme";

export type DonutSegment = { value: number; color: string };

/** Biểu đồ vành khuyên, các đoạn có khe hở nhỏ, nội dung tuỳ ý ở giữa. */
export function DonutChart({
  segments,
  size = 132,
  thickness = 22,
  children,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const gap = segments.length > 1 ? 4 : 0;
  const lengths = segments.map(
    (segment) => (segment.value / total) * circumference,
  );
  const offsets = lengths.map((_, index) =>
    lengths.slice(0, index).reduce((sum, length) => sum + length, 0),
  );
  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surfaceMuted}
          strokeWidth={thickness}
          fill="none"
        />
        <G>
          {segments.map((segment, index) => {
            const dash = Math.max(0, lengths[index] - gap);
            return (
              <Circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={segment.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offsets[index]}
                strokeLinecap="butt"
                fill="none"
              />
            );
          })}
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

/** Vòng tiến độ đơn (ví dụ: số ngày lưu trú còn lại). */
export function ProgressRing({
  value,
  size = 64,
  thickness = 7,
  color,
  track,
  children,
}: {
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const stroke = color ?? colors.primary;
  const trackColor = track ?? colors.surfaceMuted;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = Math.min(1, Math.max(0, value)) * circumference;
  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={thickness}
          fill="none"
        />
        <G>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={stroke}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
