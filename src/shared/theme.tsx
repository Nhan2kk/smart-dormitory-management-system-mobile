import { createContext, ReactNode, useContext, useMemo } from "react";
import { Platform, StyleSheet, useColorScheme, ViewStyle } from "react-native";

export type Tone = "primary" | "success" | "warning" | "danger" | "info" | "violet" | "neutral";
export type ThemeMode = "light" | "dark" | "system";
export type PresetName = "sunset" | "lavender" | "sage" | "forest" | "lagoon" | "fresh";
export type GlassLevel = "soft" | "medium" | "clear";
export type WallpaperName = "lobby" | "campus" | "dorm" | "room";

/** Màu nền tảng của một bộ chủ đề ở một chế độ (sáng hoặc tối). */
type Base = {
  background: string;
  surface: string;
  surfaceMuted: string;
  ink: string;
  inkSoft: string;
  muted: string;
  border: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  onPrimary: string;
  inverse: string;
  onInverse: string;
};

const darkNeutral = { surfaceMuted: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.10)" };

/**
 * Sáu bộ chủ đề lấy cảm hứng từ các mẫu thiết kế:
 * Hoàng hôn (cam), Oải hương (chàm – mẫu Settings), Xô thơm (xanh rêu – HomeNest),
 * Rừng thông (xanh rừng – SoundNest), Đầm phá (ngọc – TravelMate), Tươi mát (xanh lá – GreenMart).
 */
export const PRESETS: Record<PresetName, { light: Base; dark: Base }> = {
  sunset: {
    light: { background: "#F7F3EE", surface: "#FFFFFF", surfaceMuted: "#F1ECE6", ink: "#1F1B17", inkSoft: "#4F4740", muted: "#8C837B", border: "#ECE4DB", primary: "#E2601F", primaryDark: "#C24E14", primaryLight: "#F59A5B", onPrimary: "#FFFFFF", inverse: "#26201B", onInverse: "#FFFFFF" },
    dark: { background: "#16110E", surface: "#231B16", ...darkNeutral, ink: "#F6EFE9", inkSoft: "#D5C9BF", muted: "#9C8E83", primary: "#F07A3A", primaryDark: "#C24E14", primaryLight: "#F8A56E", onPrimary: "#FFFFFF", inverse: "#F6EFE9", onInverse: "#16110E" },
  },
  lavender: {
    light: { background: "#F4F4FB", surface: "#FFFFFF", surfaceMuted: "#ECECF7", ink: "#16173A", inkSoft: "#45476E", muted: "#8A8BAA", border: "#E3E3F2", primary: "#3F3D9C", primaryDark: "#2E2C7A", primaryLight: "#8B8BF5", onPrimary: "#FFFFFF", inverse: "#16173A", onInverse: "#FFFFFF" },
    dark: { background: "#10122B", surface: "#1A1D3D", ...darkNeutral, ink: "#F1F1FF", inkSoft: "#C5C6E8", muted: "#8C8EB8", primary: "#6C6CF0", primaryDark: "#4B4BD0", primaryLight: "#A5A6FF", onPrimary: "#FFFFFF", inverse: "#F1F1FF", onInverse: "#10122B" },
  },
  sage: {
    light: { background: "#F5F3EE", surface: "#FFFFFF", surfaceMuted: "#EDEAE2", ink: "#1E241D", inkSoft: "#4A5247", muted: "#8B9086", border: "#E6E2D8", primary: "#3F5D3A", primaryDark: "#2E4629", primaryLight: "#8DAA7F", onPrimary: "#FFFFFF", inverse: "#23301F", onInverse: "#FFFFFF" },
    dark: { background: "#121610", surface: "#1C221A", ...darkNeutral, ink: "#EEF2EA", inkSoft: "#C8D0C2", muted: "#8E9A88", primary: "#6E9A5E", primaryDark: "#557D47", primaryLight: "#A9C79B", onPrimary: "#FFFFFF", inverse: "#EEF2EA", onInverse: "#121610" },
  },
  forest: {
    light: { background: "#EFEDE7", surface: "#FBFAF7", surfaceMuted: "#E7E4DC", ink: "#16241E", inkSoft: "#3F4E47", muted: "#85908A", border: "#E0DCD2", primary: "#173D31", primaryDark: "#0F2B22", primaryLight: "#4E8A70", onPrimary: "#FFFFFF", inverse: "#173D31", onInverse: "#FFFFFF" },
    dark: { background: "#0D1713", surface: "#15241D", ...darkNeutral, ink: "#EAF2EE", inkSoft: "#BFD0C7", muted: "#84998F", primary: "#3D8B68", primaryDark: "#256B4C", primaryLight: "#7CC4A2", onPrimary: "#FFFFFF", inverse: "#EAF2EE", onInverse: "#0D1713" },
  },
  lagoon: {
    light: { background: "#EEF5F4", surface: "#FFFFFF", surfaceMuted: "#E3EEEC", ink: "#0E2427", inkSoft: "#3B5558", muted: "#7F9799", border: "#DAE8E6", primary: "#0F766E", primaryDark: "#0B5A54", primaryLight: "#5EEAD4", onPrimary: "#FFFFFF", inverse: "#0E2A2D", onInverse: "#FFFFFF" },
    dark: { background: "#0B1F22", surface: "#133136", ...darkNeutral, ink: "#E8F6F4", inkSoft: "#B4CFCC", muted: "#7FA3A0", primary: "#6EE7C8", primaryDark: "#34C6A6", primaryLight: "#A7F3E0", onPrimary: "#0B2A26", inverse: "#E8F6F4", onInverse: "#0B1F22" },
  },
  fresh: {
    light: { background: "#F7F9F5", surface: "#FFFFFF", surfaceMuted: "#EEF2EA", ink: "#18241A", inkSoft: "#455247", muted: "#869086", border: "#E4EADF", primary: "#2F5E3B", primaryDark: "#224A2C", primaryLight: "#7DB88A", onPrimary: "#FFFFFF", inverse: "#1F3B26", onInverse: "#FFFFFF" },
    dark: { background: "#0F1610", surface: "#18221A", ...darkNeutral, ink: "#EEF5EF", inkSoft: "#C3D2C6", muted: "#88998B", primary: "#4FA866", primaryDark: "#357A4A", primaryLight: "#8FD3A0", onPrimary: "#FFFFFF", inverse: "#EEF5EF", onInverse: "#0F1610" },
  },
};

export type Palette = Base & {
  surfaceWarm: string;
  primarySoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  violet: string;
  violetSoft: string;
  overlay: string;
  /** Lớp kính mờ phủ trên ảnh/nội dung. */
  glass: string;
  glassStrong: string;
  glassBorder: string;
  white: string;
};

export type ThemeOptions = { isDark: boolean; preset: PresetName; glass: boolean; glassLevel: GlassLevel; wallpaper: WallpaperName };

export type Theme = ThemeOptions & {
  colors: Palette;
  tones: Record<Tone, { fg: string; bg: string }>;
  gradients: { accent: readonly string[]; ember: readonly string[]; shade: readonly string[] };
  font: ReturnType<typeof buildFont>;
  shadow: (level?: 1 | 2 | 3) => ViewStyle;
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };
/** Khoảng trống dưới cùng để nội dung không bị thanh tab nổi che. */
export const TAB_BAR_SPACE = 120;

/** Độ đục của bề mặt khi bật chế độ kính (càng nhỏ càng trong). */
const GLASS_ALPHA: Record<GlassLevel, number> = { soft: 0.78, medium: 0.6, clear: 0.42 };

export function withAlpha(hex: string, alpha: number) {
  if (!hex.startsWith("#")) return hex;
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

const serif = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, 'Times New Roman', serif" });

function buildFont(c: Palette) {
  return {
    display: { fontSize: 30, lineHeight: 36, fontWeight: "800" as const, color: c.ink },
    /** Tiêu đề kiểu tạp chí (chữ có chân) cho các màn trang trọng. */
    serif: { fontSize: 30, lineHeight: 36, fontWeight: "600" as const, color: c.ink, fontFamily: serif },
    title: { fontSize: 22, lineHeight: 28, fontWeight: "800" as const, color: c.ink },
    heading: { fontSize: 17, lineHeight: 23, fontWeight: "700" as const, color: c.ink },
    body: { fontSize: 15, lineHeight: 21, fontWeight: "400" as const, color: c.inkSoft },
    label: { fontSize: 14, lineHeight: 19, fontWeight: "600" as const, color: c.ink },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const, color: c.muted },
  };
}

/** Sinh bộ màu đầy đủ từ chủ đề, chế độ sáng/tối và tuỳ chọn kính trong suốt. */
export class ThemeFactory {
  static create(options: ThemeOptions): Theme {
    const { isDark, preset, glass, glassLevel } = options;
    const base = PRESETS[preset][isDark ? "dark" : "light"];
    const soft = (hex: string, light: string) => (isDark ? withAlpha(hex, 0.18) : light);
    const alpha = GLASS_ALPHA[glassLevel];
    const status = isDark
      ? { success: "#4ADE9B", warning: "#F5B547", danger: "#F87171", info: "#60A5FA", violet: "#A78BFA" }
      : { success: "#2F9461", warning: "#B7730C", danger: "#D64545", info: "#2F78BE", violet: "#7A5BD0" };

    const colors: Palette = {
      ...base,
      // Kính: bề mặt bán trong suốt để ảnh nền mờ phía sau lộ ra.
      surface: glass ? withAlpha(base.surface, alpha) : base.surface,
      surfaceMuted: glass && !isDark ? withAlpha(base.surfaceMuted, alpha) : base.surfaceMuted,
      surfaceWarm: withAlpha(base.primary, isDark ? 0.14 : 0.07),
      primarySoft: withAlpha(base.primary, isDark ? 0.22 : 0.12),
      ...status,
      successSoft: soft(status.success, "#E1F3E8"),
      warningSoft: soft(status.warning, "#FDF1DA"),
      dangerSoft: soft(status.danger, "#FCE5E4"),
      infoSoft: soft(status.info, "#E2EEF9"),
      violetSoft: soft(status.violet, "#EEE8FB"),
      overlay: isDark ? "rgba(0,0,0,0.6)" : withAlpha(base.ink, 0.45),
      glass: withAlpha(base.surface, isDark ? 0.5 : 0.55),
      glassStrong: withAlpha(base.surface, isDark ? 0.8 : 0.82),
      glassBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.65)",
      white: "#FFFFFF",
    };

    const tones: Theme["tones"] = {
      primary: { fg: colors.primary, bg: colors.primarySoft },
      success: { fg: colors.success, bg: colors.successSoft },
      warning: { fg: colors.warning, bg: colors.warningSoft },
      danger: { fg: colors.danger, bg: colors.dangerSoft },
      info: { fg: colors.info, bg: colors.infoSoft },
      violet: { fg: colors.violet, bg: colors.violetSoft },
      neutral: { fg: colors.inkSoft, bg: colors.surfaceMuted },
    };

    const shadow = (level: 1 | 2 | 3 = 1): ViewStyle => {
      const map = {
        1: { opacity: 0.06, radius: 12, y: 4, elevation: 2 },
        2: { opacity: 0.12, radius: 18, y: 8, elevation: 5 },
        3: { opacity: 0.2, radius: 24, y: 12, elevation: 10 },
      }[level];
      const opacity = isDark ? map.opacity * 2.5 : map.opacity;
      return Platform.select<ViewStyle>({
        web: { boxShadow: `0px ${map.y}px ${map.radius}px rgba(20, 20, 30, ${opacity})` } as ViewStyle,
        default: {
          shadowColor: "#141420",
          shadowOpacity: opacity,
          shadowRadius: map.radius,
          shadowOffset: { width: 0, height: map.y },
          elevation: isDark || glass ? 0 : map.elevation,
        },
      })!;
    };

    return {
      ...options,
      colors,
      tones,
      gradients: {
        accent: [base.primaryLight, base.primary, base.primaryDark],
        ember: [withAlpha(base.inverse, 0.92), base.inverse, base.inverse],
        shade: ["rgba(10,8,6,0.25)", "rgba(10,8,6,0.35)", "rgba(10,8,6,0.85)"],
      },
      font: buildFont(colors),
      shadow,
    };
  }
}

const ThemeContext = createContext<Theme>(ThemeFactory.create({ isDark: false, preset: "sunset", glass: false, glassLevel: "medium", wallpaper: "lobby" }));

type ProviderProps = { mode: ThemeMode; preset: PresetName; glass: boolean; glassLevel: GlassLevel; wallpaper: WallpaperName; children: ReactNode };

export function ThemeProvider({ mode, preset, glass, glassLevel, wallpaper, children }: ProviderProps) {
  const system = useColorScheme();
  const isDark = mode === "dark" || (mode === "system" && system === "dark");
  const theme = useMemo(() => ThemeFactory.create({ isDark, preset, glass, glassLevel, wallpaper }), [isDark, preset, glass, glassLevel, wallpaper]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Tạo hook style phụ thuộc theme; kết quả được nhớ theo từng theme nên không tạo lại mỗi lần render.
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: Theme) => T) {
  const cache = new WeakMap<Theme, T>();
  return function useStyles(): T {
    const theme = useTheme();
    let styles = cache.get(theme);
    if (!styles) {
      styles = StyleSheet.create(factory(theme));
      cache.set(theme, styles);
    }
    return styles;
  };
}
