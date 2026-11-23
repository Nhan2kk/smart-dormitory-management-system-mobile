import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from "react-native-svg";
import { useI18n } from "../i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme, withAlpha } from "../theme";
import { Gradient } from "./Gradient";
import { Touchable } from "./Touchable";

/**
 * Thẻ báo không tải được dữ liệu, căn giữa: minh hoạ đám mây đứt kết nối, lời nhắn từ API
 * và nút "Thử lại" màu chủ đạo. Dùng chung cho mọi màn tải dữ liệu lỗi.
 */
export function LoadErrorCard({ message, onRetry }: { message?: string | null; onRetry: () => void }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Gradient colors={[colors.surface, colors.dangerSoft]} direction="vertical" style={styles.card}>
      <View accessibilityRole="alert" style={styles.inner}>
        <OfflineArt />
        <Text style={styles.message}>{message || t("common.loadErrorTitle")}</Text>
        <Touchable onPress={onRetry} accessibilityLabel={t("common.retry")} pressScale={0.96} style={styles.retryWrap}>
          <View style={[styles.retry, { backgroundColor: colors.primary }]}>
            <Ionicons name="refresh" size={16} color={colors.onPrimary} />
            <Text style={[styles.retryText, { color: colors.onPrimary }]}>{t("common.retry")}</Text>
          </View>
        </Touchable>
      </View>
    </Gradient>
  );
}

/** Đám mây có đường gạch chéo, hai đầu dây cắm rời nhau và vài chấm trang trí. */
function OfflineArt() {
  const { colors } = useTheme();
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg width={150} height={96} viewBox="0 0 150 96">
        <Defs>
          <LinearGradient id="offlineCloud" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.surface} />
            <Stop offset="1" stopColor={colors.surfaceMuted} />
          </LinearGradient>
        </Defs>
        <Circle cx={75} cy={42} r={40} fill={colors.danger} fillOpacity={0.07} />
        <Circle cx={18} cy={22} r={3} fill={colors.danger} fillOpacity={0.3} />
        <Circle cx={134} cy={16} r={4} fill={colors.primary} fillOpacity={0.25} />
        <Circle cx={128} cy={74} r={2.5} fill={colors.danger} fillOpacity={0.35} />

        <G transform="translate(75 42) scale(0.76) translate(-75 -42)">
          <Path
            d="M 54 66 C 42 66 36 58 36 50 C 36 41 43 35 51 35 C 53 25 62 18 73 18 C 85 18 93 26 95 36 C 105 35 114 42 114 52 C 114 60 107 66 99 66 Z"
            fill="url(#offlineCloud)"
            stroke={withAlpha(colors.ink, 0.12)}
            strokeWidth={1.5}
          />
          <Path d="M61 28 L89 56" stroke={colors.danger} strokeWidth={5} strokeLinecap="round" />
        </G>

        <Path d="M22 84 L52 84" stroke={withAlpha(colors.ink, 0.25)} strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M52 78 L62 78 L62 90 L52 90 Z" fill={colors.inkSoft} />
        <Path d="M62 81 L67 81 M62 87 L67 87" stroke={colors.inkSoft} strokeWidth={2} strokeLinecap="round" />
        <Path d="M128 84 L98 84" stroke={withAlpha(colors.ink, 0.25)} strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M86 78 L98 78 L98 90 L86 90 Z" fill={colors.inkSoft} />
        <Path d="M72 78 L76 74 M75 84 L80 84 M72 90 L76 94" stroke={colors.warning} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: withAlpha(colors.danger, 0.14),
    overflow: "hidden",
  },
  inner: { alignItems: "center", paddingVertical: spacing.xl, paddingHorizontal: spacing.xl, gap: 6 },
  message: { ...font.body, fontSize: 14, lineHeight: 20, fontWeight: "600", color: colors.inkSoft, marginTop: spacing.sm, textAlign: "center", maxWidth: 280 },
  retryWrap: { marginTop: spacing.md },
  retry: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: spacing.xl, paddingVertical: 11, borderRadius: radius.pill },
  retryText: { fontSize: 14, fontWeight: "700" },
}));
