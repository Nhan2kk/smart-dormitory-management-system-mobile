import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../theme";

type Props = {
  colors?: readonly string[];
  /** "diagonal" (trái trên → phải dưới) hoặc "vertical". */
  direction?: "diagonal" | "vertical";
  /**
   * Chuyển màu theo đường cong mềm (nhiều điểm màu) thay vì đường thẳng 2 điểm:
   * tránh vệt sọc và mép gãy khi ảnh / thẻ hoà vào màu nền. Chỉ áp dụng khi có đúng 2 màu.
   */
  eased?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

type Rgba = [number, number, number, number];

/** Sinh dải màu mượt giữa hai màu (hex #rrggbb hoặc rgba()). */
export class EasedGradient {
  private static readonly STEPS = 16;

  static stops(
    from: string,
    to: string,
  ): { colors: string[]; locations: number[] } | null {
    const start = EasedGradient.parse(from);
    const end = EasedGradient.parse(to);
    if (!start || !end) return null;
    const colors: string[] = [];
    const locations: number[] = [];
    for (let index = 0; index < EasedGradient.STEPS; index++) {
      const position = index / (EasedGradient.STEPS - 1);
      const t = EasedGradient.ease(position);
      // Màu trong suốt mượn RGB của màu đặc để không ngả xám/đen khi pha.
      const rgbFrom = start[3] === 0 ? end : start;
      const rgbTo = end[3] === 0 ? start : end;
      const channel = (i: number) =>
        Math.round(rgbFrom[i] + (rgbTo[i] - rgbFrom[i]) * t);
      const alpha = start[3] + (end[3] - start[3]) * t;
      colors.push(
        `rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${alpha.toFixed(4)})`,
      );
      locations.push(position);
    }
    return { colors, locations };
  }

  /** Ease-in-out dạng sin: đầu và cuối dải đổi rất chậm nên không thấy mép. */
  private static ease(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  private static parse(color: string): Rgba | null {
    const value = color.trim();
    if (/^#[0-9a-f]{6}$/i.test(value)) {
      const number = parseInt(value.slice(1), 16);
      return [(number >> 16) & 255, (number >> 8) & 255, number & 255, 1];
    }
    const match = /^rgba?\(([^)]+)\)$/i.exec(value);
    if (!match) return null;
    const parts = match[1].split(",").map((part) => Number(part.trim()));
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    return [parts[0], parts[1], parts[2], parts[3] ?? 1];
  }
}

/**
 * Nền chuyển màu dùng expo-linear-gradient (gradient gốc của hệ điều hành).
 * Không dùng SVG vì iOS không nhận màu rgba trong stop SVG và tô thành đen đặc.
 */
export function Gradient({
  colors,
  direction = "diagonal",
  eased = false,
  style,
  children,
}: Props) {
  const theme = useTheme();
  const source = colors ?? theme.gradients.accent;
  const smooth =
    eased && source.length === 2
      ? EasedGradient.stops(source[0], source[1])
      : null;
  const stops = (smooth?.colors ?? source) as unknown as readonly [
    string,
    string,
    ...string[],
  ];
  const locations = smooth?.locations as unknown as
    | readonly [number, number, ...number[]]
    | undefined;
  return (
    <LinearGradient
      colors={stops}
      locations={locations}
      start={{ x: 0, y: 0 }}
      end={direction === "diagonal" ? { x: 1, y: 1 } : { x: 0, y: 1 }}
      style={[{ overflow: "hidden" }, style]}
      pointerEvents={children ? "auto" : "none"}
    >
      {children}
    </LinearGradient>
  );
}
