import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useI18n } from "../i18n/I18nProvider";
import { makeStyles, spacing, Tone, useTheme } from "../theme";

/** Thanh tiến trình dạng đoạn cho luồng nhiều bước (wizard). */
export function StepProgress({ steps, current }: { steps: string[]; current: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View style={styles.wrap} accessibilityLabel={t("common.stepLabel", { current: current + 1, total: steps.length, name: steps[current] })}>
      <View style={styles.head}>
        <Text style={styles.stepName}>{steps[current]}</Text>
        <Text style={styles.counter}>{t("common.step", { current: current + 1, total: steps.length })}</Text>
      </View>
      <View style={styles.bars}>
        {steps.map((step, index) => (
          <View key={step} style={[styles.bar, { backgroundColor: index <= current ? colors.primary : colors.border }]} />
        ))}
      </View>
    </View>
  );
}

export type TimelineItem = { title: string; description?: string; time?: string; state: "done" | "current" | "upcoming" | "failed" };

/** Dòng thời gian dọc thể hiện tiến trình xử lý yêu cầu. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  const styles = useStyles();
  const { colors, tones } = useTheme();
  return (
    <View>
      {items.map((item, index) => {
        const tone: Tone = item.state === "done" ? "success" : item.state === "current" ? "primary" : item.state === "failed" ? "danger" : "neutral";
        const palette = tones[tone];
        const last = index === items.length - 1;
        const upcoming = item.state === "upcoming";
        return (
          <View key={`${item.title}-${index}`} style={styles.tlRow}>
            <View style={styles.tlRail}>
              <View style={[styles.tlDot, { backgroundColor: upcoming ? colors.surface : palette.fg, borderColor: upcoming ? colors.border : palette.fg }]}>
                {item.state === "done" && <Ionicons name="checkmark" size={13} color={colors.white} />}
                {item.state === "failed" && <Ionicons name="close" size={13} color={colors.white} />}
                {item.state === "current" && <View style={styles.tlPulse} />}
              </View>
              {/* Đoạn nối tô xanh khi cả 2 bước hai đầu đều đã tới (đúng cho cả thứ tự cũ→mới lẫn mới→cũ) */}
              {!last && <View style={[styles.tlLine, !upcoming && items[index + 1].state !== "upcoming" && { backgroundColor: colors.success }]} />}
            </View>
            <View style={[styles.tlBody, last && { paddingBottom: 0 }]}>
              <Text style={[styles.tlTitle, upcoming && { color: colors.muted }]}>{item.title}</Text>
              {!!item.description && <Text style={styles.tlDescription}>{item.description}</Text>}
              {!!item.time && <Text style={styles.tlTime}>{item.time}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  wrap: { gap: spacing.sm },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  stepName: { ...font.label, fontSize: 15 },
  counter: { ...font.caption, fontSize: 13 },
  bars: { flexDirection: "row", gap: 6 },
  bar: { flex: 1, height: 5, borderRadius: 3 },
  tlRow: { flexDirection: "row", gap: spacing.md },
  tlRail: { alignItems: "center", width: 22 },
  tlDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  tlPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  tlLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 3 },
  tlBody: { flex: 1, paddingBottom: spacing.xl },
  tlTitle: { ...font.label, fontSize: 15 },
  tlDescription: { ...font.body, fontSize: 13, marginTop: 2, lineHeight: 18 },
  tlTime: { ...font.caption, marginTop: 4 },
}));
