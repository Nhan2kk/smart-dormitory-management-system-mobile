import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProgressRing } from "../../shared/charts/DonutChart";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { Photos } from "../../shared/images";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { AppHeader, BottomSheet, Button, Card, CircleButton, FooterBar, Glass, InfoRow, LightStatusBar, PhotoBackground, Screen, SectionHeader, StatusBadge, Touchable, useToast } from "../../shared/ui";
import { ResidencyHistory, ResidencyLocation, ResidencyRepository } from "./residency.mock";

export function ResidencyRecordScreen() {
  const { notify } = useToast();
  const { t, l } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const current = ResidencyRepository.current();
  const history = ResidencyRepository.history();
  const [selected, setSelected] = useState<ResidencyHistory | null>(null);
  const place = (location: ResidencyLocation) => `${t("common.building")} ${location.building} · ${location.room} · G${location.bed.slice(-2)}`;

  const copy = async () => {
    await Clipboard.setStringAsync(`${current.recordCode} - ${place(current)}`);
    notify(t("residency.copiedInfo"));
  };

  return (
    <Screen
      padded={false}
      edges={[]}
      footer={
        <FooterBar>
          <Button label={t("residency.download")} icon="download-outline" variant="dark" onPress={() => notify(t("residency.downloaded"), "info")} style={{ flex: 1 }} />
        </FooterBar>
      }
    >
      <LightStatusBar />
      <PhotoBackground source={Photos.bunkBed()} shade style={[styles.hero, { paddingTop: insets.top }]}>
        <AppHeader title={t("residency.title")} onPhoto right={<CircleButton icon="copy-outline" label={t("residency.copyInfo")} variant="photo" onPress={copy} />} />
        <View style={styles.heroBody}>
          <Glass variant="photo" style={styles.pass}>
            <View style={styles.passHead}>
              <View>
                <Text style={styles.passLabel}>{t("residency.recordCode")}</Text>
                <Text style={styles.passCode}>{current.recordCode}</Text>
              </View>
              <View style={styles.activeChip}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>{t("residency.inDorm")}</Text>
              </View>
            </View>
            <View style={styles.location}>
              <Cell label={t("common.building")} value={current.building} />
              <Cell label={t("common.floor")} value={`${current.floor}`} />
              <Cell label={t("common.room")} value={current.room} />
              <Cell label={t("common.bed")} value={current.bed.slice(-2)} />
            </View>
            <View style={styles.passFoot}>
              <View style={{ flex: 1 }}>
                <Text style={styles.passLabel}>{t("residency.stayPeriod")}</Text>
                <Text style={styles.passValue}>
                  {Formatter.date(current.checkInDate)} → {Formatter.date(current.expiryDate)}
                </Text>
              </View>
              <ProgressRing value={ResidencyRepository.progress()} size={58} thickness={6} color={colors.white} track="rgba(255,255,255,0.25)">
                <Text style={styles.ringValue}>{ResidencyRepository.remainingDays()}</Text>
                <Text style={styles.ringLabel}>{t("residency.days")}</Text>
              </ProgressRing>
            </View>
          </Glass>
        </View>
      </PhotoBackground>

      <View style={styles.body}>
        <SectionHeader title={t("residency.roomInfo")} />
        <Card style={{ paddingVertical: spacing.xs }}>
          <InfoRow label={t("residency.roomType")} value={t(`common.${current.roomType}`)} />
          <InfoRow label={t("residency.occupants")} value={`${current.roommates}/${current.capacity}`} />
          <InfoRow label={t("residency.price")} value={`${Formatter.currency(current.monthlyFee)}${t("common.perMonth")}`} />
          <InfoRow label={t("residency.linked")} value={current.linkedRequest} divider={false} />
        </Card>

        <SectionHeader title={t("residency.history")} />
        {history.map((record, index) => (
          <View key={record.id} style={styles.historyRow}>
            <View style={styles.rail}>
              <View style={[styles.railDot, record.active && styles.railDotActive]}>
                <Ionicons name={record.type === "room_transfer" ? "swap-horizontal" : record.type === "checkout" ? "exit" : "home"} size={14} color={record.active ? colors.onPrimary : colors.inkSoft} />
              </View>
              {index < history.length - 1 && <View style={styles.railLine} />}
            </View>
            <Touchable onPress={() => setSelected(record)} accessibilityLabel={`${t(`residency.types.${record.type}`)} ${record.location.room}`} style={{ flex: 1 }} pressScale={0.98}>
              <Card style={styles.historyCard}>
                <View style={styles.historyHead}>
                  <Text style={styles.historyType}>{t(`residency.types.${record.type}`)}</Text>
                  <StatusBadge label={record.active ? t("residency.active") : t("residency.ended")} tone={record.active ? "success" : "neutral"} />
                </View>
                <Text style={styles.historyRoom}>
                  {record.previous ? `${record.previous.room} → ` : ""}
                  {record.location.room} · {t("common.bed")} {record.location.bed.slice(-2)}
                </Text>
                <Text style={styles.caption}>
                  {record.endedDate
                    ? t("residency.fromTo", { from: Formatter.date(record.effectiveDate), to: Formatter.date(record.endedDate) })
                    : t("residency.from", { from: Formatter.date(record.effectiveDate) })}
                </Text>
              </Card>
            </Touchable>
          </View>
        ))}
      </View>

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)} title={t("residency.detail")} subtitle={selected?.id}>
        {selected && (
          <Card style={{ paddingVertical: spacing.xs }}>
            <InfoRow label={t("residency.type")} value={t(`residency.types.${selected.type}`)} />
            <InfoRow label={t("residency.location")} value={place(selected.location)} />
            {selected.previous && <InfoRow label={t("residency.previous")} value={place(selected.previous)} />}
            <InfoRow label={t("residency.effective")} value={Formatter.date(selected.effectiveDate)} />
            {selected.endedDate && <InfoRow label={t("residency.endedDate")} value={Formatter.date(selected.endedDate)} />}
            <InfoRow label={t("residency.linked")} value={selected.linkedRequest} divider={!!selected.note} />
            {selected.note && <InfoRow label={t("residency.note")} value={l(selected.note)} divider={false} />}
          </Card>
        )}
      </BottomSheet>
    </Screen>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  );
}

const white = "#FFFFFF";

const useStyles = makeStyles(({ colors, font }) => ({
  hero: { borderBottomLeftRadius: radius.xl + 8, borderBottomRightRadius: radius.xl + 8, paddingBottom: spacing.xl },
  heroBody: { paddingHorizontal: spacing.xl, marginTop: 90 },
  pass: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg },
  passHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  passLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  passCode: { color: white, fontSize: 18, fontWeight: "800", marginTop: 2, letterSpacing: 0.5 },
  passValue: { color: white, fontSize: 14, fontWeight: "700", marginTop: 2 },
  activeChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#5BE49B" },
  activeText: { color: white, fontSize: 12, fontWeight: "700" },
  location: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.14)", borderRadius: radius.md, paddingVertical: spacing.md },
  cell: { flex: 1, alignItems: "center", gap: 2 },
  cellLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "600" },
  cellValue: { color: white, fontSize: 20, fontWeight: "800" },
  passFoot: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  ringValue: { color: white, fontWeight: "800", fontSize: 15 },
  ringLabel: { color: "rgba(255,255,255,0.8)", fontSize: 9, marginTop: -2 },
  body: { paddingHorizontal: spacing.xl },
  caption: { ...font.caption },
  historyRow: { flexDirection: "row", gap: spacing.md },
  rail: { alignItems: "center", width: 30 },
  railDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", marginTop: spacing.lg },
  railDotActive: { backgroundColor: colors.primary },
  railLine: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },
  historyCard: { gap: 6, marginBottom: spacing.md },
  historyHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  historyType: { ...font.label, fontSize: 15 },
  historyRoom: { ...font.body, fontSize: 14, color: colors.ink, fontWeight: "600" },
}));
