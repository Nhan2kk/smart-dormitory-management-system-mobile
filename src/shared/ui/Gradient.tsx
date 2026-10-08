import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../theme";

type Props = {
  colors?: readonly string[];
  /** "diagonal" (trái trên → phải dưới) hoặc "vertical". */
  direction?: "diagonal" | "vertical";
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Nền chuyển màu dùng expo-linear-gradient (gradient gốc của hệ điều hành).
 * Không dùng SVG vì iOS không nhận màu rgba trong stop SVG và tô thành đen đặc.
 */
export function Gradient({ colors, direction = "diagonal", style, children }: Props) {
  const theme = useTheme();
  const stops = (colors ?? theme.gradients.accent) as unknown as readonly [string, string, ...string[]];
  return (
    <LinearGradient
      colors={stops}
      start={{ x: 0, y: 0 }}
      end={direction === "diagonal" ? { x: 1, y: 1 } : { x: 0, y: 1 }}
      style={[{ overflow: "hidden" }, style]}
      pointerEvents={children ? "auto" : "none"}
    >
      {children}
    </LinearGradient>
  );
}
