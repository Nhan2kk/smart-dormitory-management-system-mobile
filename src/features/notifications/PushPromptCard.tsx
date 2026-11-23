import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme, withAlpha } from "../../shared/theme";
import { Gradient, Touchable } from "../../shared/ui";

/** Pha màu hex để có các sắc sáng/tối từ màu chủ đạo (chuông nổi khối đổi màu theo chủ đề). */
class Shade {
  static mix(hex: string, target: "#FFFFFF" | "#000000", amount: number): string {
    const from = Shade.rgb(hex);
    const to = Shade.rgb(target);
    if (!from || !to) return hex;
    const parts = from.map((value, index) => Math.round(value + (to[index] - value) * amount));
    return `#${parts.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  }

  private static rgb(hex: string): number[] | null {
    const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!match) return null;
    const number = parseInt(match[1], 16);
    return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
  }
}

/**
 * Thẻ mời bật thông báo đẩy: nền chuyển màu nhạt có sóng mờ, chuông bóng khối kèm thẻ công tắc
 * đang bật, tiêu đề, mô tả, nút bật dạng viên thuốc và nút ẩn ở góc.
 */
export function PushPromptCard({ onEnable, onDismiss }: { onEnable: () => void; onDismiss: () => void }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Gradient colors={[colors.primarySoft, colors.surface]} direction="diagonal" style={styles.card}>
      <Waves color={colors.primary} />
      <BellArt />
      <View style={styles.body}>
        <Text style={styles.title}>{t("notifications.enablePushTitle")}</Text>
        <Text style={styles.text}>{t("notifications.enablePushBody")}</Text>
        <Touchable onPress={onEnable} accessibilityLabel={t("notifications.enablePush")} pressScale={0.96} style={styles.buttonWrap}>
          <View style={[styles.button, { backgroundColor: colors.primary }]}>
            <Ionicons name="notifications-outline" size={16} color={colors.onPrimary} />
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{t("notifications.enablePush")}</Text>
          </View>
        </Touchable>
      </View>
      <Touchable onPress={onDismiss} accessibilityLabel={t("common.close")} style={styles.close}>
        <View style={styles.closeCircle}>
          <Ionicons name="close" size={16} color={colors.inkSoft} />
        </View>
      </Touchable>
    </Gradient>
  );
}

/** Sóng mờ ở góc dưới phải của thẻ. */
function Waves({ color }: { color: string }) {
  return (
    <Svg style={{ position: "absolute", right: 0, bottom: 0 }} width={260} height={90} viewBox="0 0 260 90" pointerEvents="none">
      <Path d="M0 70 C60 40 110 95 170 60 C210 37 235 40 260 30 L260 90 L0 90 Z" fill={color} fillOpacity={0.05} />
      <Path d="M40 85 C90 60 140 95 190 72 C220 58 240 58 260 52 L260 90 L40 90 Z" fill={color} fillOpacity={0.07} />
    </Svg>
  );
}

/** Chuông bóng khối (gradient + vệt sáng + vành + quả lắc), chấm đỏ có tia, thẻ công tắc nổi đè góc dưới. */
function BellArt() {
  const { colors } = useTheme();
  const styles = useStyles();
  const light = Shade.mix(colors.primary, "#FFFFFF", 0.75);
  const mid = Shade.mix(colors.primary, "#FFFFFF", 0.35);
  const dark = Shade.mix(colors.primary, "#000000", 0.1);
  const rim = colors.primary;
  return (
    <View style={styles.art} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg width={108} height={98} viewBox="0 0 124 112">
        <Defs>
          <LinearGradient id="pushBellBody" x1="0" y1="0" x2="1" y2="0.4">
            <Stop offset="0" stopColor={light} />
            <Stop offset="0.45" stopColor={mid} />
            <Stop offset="1" stopColor={dark} />
          </LinearGradient>
          <LinearGradient id="pushBellRim" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={mid} />
            <Stop offset="1" stopColor={rim} />
          </LinearGradient>
          <RadialGradient id="pushBellClapper" cx="0.35" cy="0.35" r="0.7">
            <Stop offset="0" stopColor={light} />
            <Stop offset="1" stopColor={dark} />
          </RadialGradient>
          <RadialGradient id="pushBellShadow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={dark} stopOpacity={0.28} />
            <Stop offset="1" stopColor={dark} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Ellipse cx={56} cy={104} rx={40} ry={6} fill="url(#pushBellShadow)" />

        <G transform="rotate(-14 56 58)">
          <Circle cx={56} cy={92} r={9} fill="url(#pushBellClapper)" />
          <Circle cx={56} cy={16} r={7} fill="url(#pushBellBody)" />
          <Path
            d="M56 20 C34 20 24 38 24 58 L24 72 C24 80 18 84 12 88 L100 88 C94 84 88 80 88 72 L88 58 C88 38 78 20 56 20 Z"
            fill="url(#pushBellBody)"
          />
          <Ellipse cx={56} cy={88} rx={46} ry={8} fill="url(#pushBellRim)" />
          <Path d="M38 36 C32 44 31 56 31 68" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Circle cx={42} cy={29} r={3} fill="#FFFFFF" fillOpacity={0.7} />
        </G>

        <Circle cx={93} cy={20} r={8} fill={colors.danger} />
        <Circle cx={90.5} cy={17.5} r={2.5} fill="#FFFFFF" fillOpacity={0.5} />
        <Path d="M98 6 L101 1" stroke={colors.warning} strokeWidth={3} strokeLinecap="round" />
        <Path d="M106 14 L112 11" stroke={colors.warning} strokeWidth={3} strokeLinecap="round" />
        <Path d="M106 24 L112 25" stroke={colors.warning} strokeWidth={3} strokeLinecap="round" />
      </Svg>

      <View style={[styles.mini, { backgroundColor: colors.surface }]}>
        <Ionicons name="notifications" size={15} color={colors.primary} />
        <View style={[styles.switch, { backgroundColor: colors.primary }]}>
          <View style={styles.knob} />
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font, shadow }) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    paddingLeft: spacing.sm,
    paddingRight: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.12),
    overflow: "hidden",
  },
  art: { width: 112, height: 104, justifyContent: "center" },
  mini: {
    position: "absolute",
    bottom: 6,
    right: -2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    ...shadow(2),
  },
  switch: { width: 28, height: 16, borderRadius: 8, justifyContent: "center", alignItems: "flex-end", paddingHorizontal: 2 },
  knob: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#FFFFFF" },
  body: { flex: 1, gap: 4, paddingRight: spacing.lg },
  title: { ...font.heading, fontSize: 17 },
  text: { ...font.caption, fontSize: 13, lineHeight: 19, color: colors.inkSoft },
  buttonWrap: { alignSelf: "flex-start", marginTop: spacing.sm },
  button: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill },
  buttonText: { fontSize: 14, fontWeight: "700" },
  close: { position: "absolute", top: spacing.sm, right: spacing.sm },
  closeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    ...shadow(1),
  },
}));
