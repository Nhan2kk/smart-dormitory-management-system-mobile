import { useId, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";

type Props = {
  values: number[];
  labels: string[];
  height?: number;
  color?: string;
  /** Màu chữ trục và lưới (nền tối dùng màu sáng). */
  axisColor?: string;
  highlightIndex?: number;
  unit?: string;
};

/** Đường cong mượt (Catmull-Rom → Bezier) có tô vùng bên dưới, giống thẻ thống kê năng lượng. */
export class SmoothPath {
  static build(points: { x: number; y: number }[]): string {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }
}

export function AreaChart({
  values,
  labels,
  height = 150,
  color = "#FFFFFF",
  axisColor = "rgba(255,255,255,0.75)",
  highlightIndex,
  unit = "",
}: Props) {
  const id = `a${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [width, setWidth] = useState(0);
  const axisWidth = 34;
  const chartWidth = Math.max(0, width - axisWidth);
  const max = Math.max(...values, 1) * 1.15;
  const step = values.length > 1 ? chartWidth / (values.length - 1) : chartWidth;
  const points = values.map((value, index) => ({ x: index * step, y: height - (value / max) * height }));
  const line = SmoothPath.build(points);
  const area = points.length ? `${line} L ${chartWidth} ${height} L 0 ${height} Z` : "";
  const focus = highlightIndex ?? values.indexOf(Math.max(...values));
  const focusPoint = points[focus];
  const ticks = [max, max / 2, 0].map((tick) => (max < 10 ? Number(tick.toFixed(1)) : Math.round(tick)));

  return (
    <View onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: chartWidth, height }}>
          {width > 0 && (
            <Svg width={chartWidth} height={height} style={{ overflow: "visible" }}>
              <Defs>
                <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={color} stopOpacity={0.35} />
                  <Stop offset="1" stopColor={color} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              {[0, 0.5, 1].map((ratio) => (
                <Line
                  key={ratio}
                  x1={0}
                  x2={chartWidth}
                  y1={height * ratio}
                  y2={height * ratio}
                  stroke={axisColor}
                  strokeOpacity={0.25}
                  strokeDasharray="3 5"
                />
              ))}
              <Path d={area} fill={`url(#${id})`} />
              <Path d={line} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
              {focusPoint && (
                <>
                  <Line
                    x1={focusPoint.x}
                    x2={focusPoint.x}
                    y1={focusPoint.y}
                    y2={height}
                    stroke={color}
                    strokeDasharray="3 4"
                    strokeOpacity={0.8}
                  />
                  <Circle cx={focusPoint.x} cy={focusPoint.y} r={9} fill={color} fillOpacity={0.3} />
                  <Circle cx={focusPoint.x} cy={focusPoint.y} r={5} fill={color} />
                </>
              )}
            </Svg>
          )}
        </View>
        <View style={[styles.axis, { height, width: axisWidth }]}>
          {ticks.map((tick, index) => (
            <Text key={index} style={[styles.axisText, { color: axisColor }]}>
              {String(tick).replace(".", ",")}
              {index === 0 ? unit : ""}
            </Text>
          ))}
        </View>
      </View>
      <View style={[styles.labels, { width: chartWidth }]}>
        {labels.map((label, index) => (
          <Text key={`${label}-${index}`} style={[styles.axisText, { color: axisColor }]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { justifyContent: "space-between", alignItems: "flex-end", marginTop: -7, marginBottom: -7 },
  axisText: { fontSize: 11, fontWeight: "600" },
  labels: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
});
