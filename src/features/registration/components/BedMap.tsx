import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../../shared/theme";
import { Touchable } from "../../../shared/ui";
import { Bed, BedStatus } from "../registration.mock";

/** Sơ đồ giường tầng trong phòng: mỗi cụm gồm giường tầng 1 và tầng 2. */
export function BedMap({ beds, value, onChange }: { beds: Bed[]; value: string | null; onChange: (code: string) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const palette: Record<BedStatus, { bg: string; fg: string; border: string }> = {
    available: { bg: colors.surface, fg: colors.success, border: colors.success },
    occupied: { bg: colors.surfaceMuted, fg: colors.muted, border: colors.surfaceMuted },
    reserved: { bg: colors.warningSoft, fg: colors.warning, border: colors.warningSoft },
    maintenance: { bg: colors.surfaceMuted, fg: colors.muted, border: colors.border },
  };
  const clusters: Bed[][] = [];
  for (let i = 0; i < beds.length; i += 2) clusters.push(beds.slice(i, i + 2));

  return (
    <View style={styles.room}>
      <View style={styles.door}>
        <Ionicons name="enter-outline" size={16} color={colors.muted} />
        <Text style={styles.doorText}>{t("registration.entrance")}</Text>
      </View>
      <View style={styles.grid}>
        {clusters.map((cluster, index) => (
          <View key={index} style={styles.cluster}>
            <Text style={styles.clusterLabel}>{t("registration.cluster", { number: index + 1 })}</Text>
            {[...cluster]
              .sort((a, b) => b.level - a.level)
              .map((bed) => {
                const selected = bed.code === value;
                const look = palette[bed.status];
                const disabled = bed.status !== "available";
                return (
                  <Touchable
                    key={bed.code}
                    disabled={disabled}
                    onPress={() => onChange(bed.code)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled }}
                    accessibilityLabel={t("registration.bedLabel", { code: bed.code, level: bed.level, status: t(`registration.bedStatus.${bed.status}`) })}
                    style={[styles.bed, { backgroundColor: look.bg, borderColor: look.border }, selected && styles.bedSelected, disabled && { opacity: 1 }]}
                  >
                    <Ionicons name="bed" size={18} color={selected ? colors.onPrimary : look.fg} />
                    <View>
                      <Text style={[styles.bedCode, selected && { color: colors.onPrimary }, disabled && { color: colors.muted }]}>G{bed.code}</Text>
                      <Text style={[styles.bedLevel, selected && { color: "rgba(255,255,255,0.85)" }]}>
                        {t("common.floor")} {bed.level}
                      </Text>
                    </View>
                  </Touchable>
                );
              })}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        {(["available", "reserved", "occupied"] as BedStatus[]).map((status) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: palette[status].bg, borderColor: palette[status].border }]} />
            <Text style={styles.legendText}>{t(`registration.bedStatus.${status}`)}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.primary, borderColor: colors.primary }]} />
          <Text style={styles.legendText}>{t("registration.selected")}</Text>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  room: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  door: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  doorText: { ...font.caption, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  cluster: { width: "48%", gap: 6, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border },
  clusterLabel: { ...font.caption, fontSize: 11, fontWeight: "700", textAlign: "center" },
  bed: { flexDirection: "row", alignItems: "center", gap: 8, height: 52, borderRadius: radius.sm, borderWidth: 1.5, paddingHorizontal: 10 },
  bedSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  bedCode: { ...font.label, fontSize: 14 },
  bedLevel: { ...font.caption, fontSize: 11 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "center", paddingTop: spacing.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 14, height: 14, borderRadius: 4, borderWidth: 1.5 },
  legendText: { ...font.caption, fontSize: 12 },
}));
