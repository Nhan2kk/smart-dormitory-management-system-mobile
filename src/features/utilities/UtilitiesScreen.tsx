import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AreaChart } from "../../shared/charts/AreaChart";
import { CompareBar } from "../../shared/charts/BarChart";
import { DonutChart } from "../../shared/charts/DonutChart";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { AppHeader, BottomSheet, Card, Gradient, IconBadge, InfoRow, Screen, SectionHeader, SegmentedControl } from "../../shared/ui";
import { ResidencyRepository } from "../residency/residency.mock";
import { UtilityCalendar } from "./UtilityCalendar";
import { DailyRecord, UtilityMetric, UtilityRange, UtilityRepository } from "./utilities.mock";

export function UtilitiesScreen() {
  const { t, l } = useI18n();
  const { colors, tones, shadow } = useTheme();
  const styles = useStyles();
  const [range, setRange] = useState<UtilityRange>("day");
  const [metric, setMetric] = useState<UtilityMetric>("electricity");
  const [day, setDay] = useState<DailyRecord | null>(null);
  const residence = ResidencyRepository.current();
  const data = UtilityRepository.get(range);
  const isElectricity = metric === "electricity";
  const total = isElectricity ? data.electricityTotal : data.waterTotal;
  const change = data.changePercent[metric];
  const unit = isElectricity ? "kWh" : "m³";
  const electricityCost = UtilityRepository.cost("electricity", data.electricityTotal);
  const waterCost = UtilityRepository.cost("water", data.waterTotal);
  const totalCost = electricityCost + waterCost;
  const labels = data.labels === "weekdays" ? UtilityRepository.weekLabels() : data.labels;
  const period = { day: t("utilities.vsDay"), week: t("utilities.vsWeek"), month: t("utilities.vsMonth") }[range];
  const subtotal = { day: t("utilities.subtotalDay"), week: t("utilities.subtotalWeek"), month: t("utilities.subtotalMonth") }[range];
  const metricName = isElectricity ? t("utilities.electricity") : t("utilities.water");

  return (
    <Screen inTabs header={<AppHeader title={t("utilities.title")} subtitle={t("utilities.subtitle", { room: residence.room, building: `${t("common.building")} ${residence.building}` })} hideBack />}>
      <SegmentedControl
        options={[
          { value: "day", label: t("utilities.day") },
          { value: "week", label: t("utilities.week") },
          { value: "month", label: t("utilities.month") },
        ]}
        value={range}
        onChange={setRange}
      />

      <View style={[styles.heroShadow, shadow(2)]}>
        <Gradient style={styles.hero}>
          <View style={styles.heroHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>{t("utilities.totalUsage", { metric: metricName.toLowerCase() })}</Text>
              <Text style={styles.heroValue}>
                {Formatter.decimal(total, 2)} <Text style={styles.heroUnit}>{unit}</Text>
              </Text>
              <Text style={styles.heroCaption}>{l(data.caption)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={styles.changePill}>
                <Ionicons name={change >= 0 ? "trending-up" : "trending-down"} size={14} color={colors.white} />
                <Text style={styles.changeText}>{Math.abs(change)}%</Text>
              </View>
              <Text style={styles.heroCaption}>{t("utilities.vs", { period })}</Text>
            </View>
          </View>
          <SegmentedControl
            options={[
              { value: "electricity", label: t("utilities.electricity") },
              { value: "water", label: t("utilities.water") },
            ]}
            value={metric}
            onChange={setMetric}
            tone="glass"
            style={{ marginVertical: spacing.lg }}
          />
          <AreaChart values={isElectricity ? data.electricity : data.water} labels={labels} height={130} />
        </Gradient>
      </View>

      <SectionHeader title={t("utilities.estimatedCost")} />
      <Card>
        <View style={styles.costRow}>
          <DonutChart size={128} thickness={20} segments={[{ value: electricityCost, color: colors.primary }, { value: waterCost, color: colors.info }]}>
            <Text style={styles.donutValue}>{Formatter.compactCurrency(totalCost)}</Text>
            <Text style={styles.caption}>{t("utilities.total")}</Text>
          </DonutChart>
          <View style={{ flex: 1, gap: spacing.md }}>
            <CostLegend color={colors.primary} label={t("utilities.electricity")} amount={electricityCost} detail={`${Formatter.decimal(data.electricityTotal, 2)} kWh × ${Formatter.currency(UtilityRepository.unitPrice("electricity"))}`} share={electricityCost / totalCost} />
            <CostLegend color={colors.info} label={t("utilities.water")} amount={waterCost} detail={`${Formatter.decimal(data.waterTotal, 2)} m³ × ${Formatter.currency(UtilityRepository.unitPrice("water"))}`} share={waterCost / totalCost} />
          </View>
        </View>
        <View style={styles.costFooter}>
          <IconBadge icon="receipt-outline" tone="success" size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.caption}>
              {t("utilities.subtotal")} {subtotal}
            </Text>
            <Text style={styles.costTotal}>{Formatter.currency(totalCost)}</Text>
          </View>
          <Text style={[styles.caption, { textAlign: "right" }]}>{t("utilities.splitAmong", { count: residence.roommates })}</Text>
        </View>
      </Card>

      <SectionHeader title={t("utilities.calendar", { month: Formatter.monthYear(`${UtilityRepository.calendarMonth}-01`) })} />
      <Card>
        <Text style={[styles.caption, { marginBottom: spacing.md }]}>{t("utilities.calendarHint")}</Text>
        <UtilityCalendar records={UtilityRepository.month()} onSelect={setDay} />
      </Card>

      <SectionHeader title={t("utilities.compare")} />
      <Card style={{ gap: spacing.lg }}>
        <CompareBar label={t("utilities.electricityThisMonth")} value={UtilityRepository.comparison.electricity.room} reference={UtilityRepository.comparison.electricity.average} unit="kWh" />
        <CompareBar label={t("utilities.waterThisMonth")} value={UtilityRepository.comparison.water.room} reference={UtilityRepository.comparison.water.average} unit="m³" color={colors.info} />
        <View style={styles.legend}>
          <LegendDot color={colors.primary} label={t("utilities.yourRoom")} />
          <LegendDot color={colors.border} label={t("utilities.buildingAverage")} />
        </View>
      </Card>

      <View style={styles.meters}>
        <Card style={styles.meter}>
          <IconBadge icon="flash" tone="primary" size={38} rounded="circle" />
          <Text style={styles.caption}>{t("utilities.electricityMeter")}</Text>
          <Text style={styles.meterValue}>{Formatter.decimal(UtilityRepository.meters.electricity)} kWh</Text>
        </Card>
        <Card style={styles.meter}>
          <IconBadge icon="water" tone="info" size={38} rounded="circle" />
          <Text style={styles.caption}>{t("utilities.waterMeter")}</Text>
          <Text style={styles.meterValue}>{Formatter.decimal(UtilityRepository.meters.water)} m³</Text>
        </Card>
      </View>
      <Text style={styles.meterUpdated}>{t("utilities.meterUpdated", { time: Formatter.dateTime(UtilityRepository.meters.updatedAt) })}</Text>

      <SectionHeader title={t("utilities.alerts")} />
      <View style={{ gap: spacing.md }}>
        {UtilityRepository.alerts().map((alert) => (
          <Card key={alert.id} style={styles.alert}>
            <View style={[styles.alertBar, { backgroundColor: tones[alert.tone].fg }]} />
            <IconBadge icon={alert.tone === "danger" ? "alert-circle-outline" : alert.tone === "warning" ? "water-outline" : "shield-checkmark-outline"} tone={alert.tone} size={40} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.alertTitle}>{l(alert.title)}</Text>
              <Text style={styles.alertBody}>{l(alert.description)}</Text>
              <Text style={styles.caption}>{Formatter.relative(alert.occurredAt)}</Text>
            </View>
          </Card>
        ))}
      </View>

      <BottomSheet visible={!!day} onClose={() => setDay(null)} title={day ? t("utilities.dayDetail", { date: Formatter.date(day.date) }) : ""}>
        {day && (
          <>
            <Card style={{ paddingVertical: spacing.xs }}>
              <View style={styles.sheetHead}>
                <Ionicons name="flash" size={16} color={colors.primary} />
                <Text style={styles.sheetTitle}>{t("utilities.electricity")}</Text>
              </View>
              <InfoRow label={t("utilities.startReading")} value={`${Formatter.decimal(day.electricityStart, 2)} kWh`} />
              <InfoRow label={t("utilities.endReading")} value={`${Formatter.decimal(day.electricityEnd, 2)} kWh`} />
              <InfoRow label={t("utilities.consumption")} value={`${Formatter.decimal(day.electricity, 2)} kWh`} strong />
              <InfoRow label={t("utilities.averagePower")} value={`${Formatter.decimal(day.averageKw, 2)} kW`} />
              <InfoRow label={t("utilities.peakPower")} value={`${Formatter.decimal(day.peakKw, 2)} kW`} divider={false} />
            </Card>
            <Card style={{ paddingVertical: spacing.xs }}>
              <View style={styles.sheetHead}>
                <Ionicons name="water" size={16} color={colors.info} />
                <Text style={styles.sheetTitle}>{t("utilities.water")}</Text>
              </View>
              <InfoRow label={t("utilities.startReading")} value={`${Formatter.decimal(day.waterStart, 3)} m³`} />
              <InfoRow label={t("utilities.endReading")} value={`${Formatter.decimal(day.waterEnd, 3)} m³`} />
              <InfoRow label={t("utilities.consumption")} value={`${Formatter.decimal(day.water, 3)} m³`} strong />
              <InfoRow label={t("utilities.averageFlow")} value={`${Formatter.decimal(day.averageLiterPerHour)} L/h`} />
              <InfoRow label={t("utilities.peakFlow")} value={`${Formatter.decimal(day.peakLiterPerHour)} L/h`} divider={false} />
            </Card>
            <Card variant="warm" style={styles.sheetTotal}>
              <Text style={styles.sheetTitle}>{t("utilities.amount")}</Text>
              <Text style={styles.costTotal}>{Formatter.currency(day.cost)}</Text>
            </Card>
          </>
        )}
      </BottomSheet>
    </Screen>
  );
}

function CostLegend({ color, label, amount, detail, share }: { color: string; label: string; amount: number; detail: string; share: number }) {
  const styles = useStyles();
  return (
    <View style={{ gap: 2 }}>
      <View style={styles.legendHead}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
        <Text style={styles.legendShare}>{Math.round(share * 100)}%</Text>
      </View>
      <Text style={styles.legendAmount}>{Formatter.currency(amount)}</Text>
      <Text style={styles.caption}>{detail}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const styles = useStyles();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

const white = "#FFFFFF";

const useStyles = makeStyles(({ colors, font }) => ({
  heroShadow: { marginTop: spacing.lg, borderRadius: radius.xl },
  hero: { borderRadius: radius.xl, padding: spacing.xl },
  heroHead: { flexDirection: "row", alignItems: "flex-start" },
  heroLabel: { color: "rgba(255,255,255,0.88)", fontSize: 14, fontWeight: "600" },
  heroValue: { color: white, fontSize: 38, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  heroUnit: { fontSize: 18, fontWeight: "700" },
  heroCaption: { color: "rgba(255,255,255,0.88)", fontSize: 12, marginTop: 4 },
  changePill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  changeText: { color: white, fontWeight: "800", fontSize: 14 },
  costRow: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  donutValue: { fontSize: 17, fontWeight: "800", color: colors.ink },
  caption: { ...font.caption },
  legendHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { ...font.label, flex: 1 },
  legendShare: { ...font.caption, fontWeight: "700", color: colors.inkSoft },
  legendAmount: { fontSize: 16, fontWeight: "800", color: colors.ink, marginLeft: 18 },
  costFooter: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  costTotal: { fontSize: 22, fontWeight: "800", color: colors.ink },
  legend: { flexDirection: "row", gap: spacing.lg },
  meters: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  meter: { flex: 1, gap: spacing.sm },
  meterValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
  meterUpdated: { ...font.caption, marginTop: spacing.sm, textAlign: "center" },
  alert: { flexDirection: "row", gap: spacing.md, overflow: "hidden", paddingLeft: spacing.lg + 4 },
  alertBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  alertTitle: { ...font.label, fontSize: 15 },
  alertBody: { ...font.body, fontSize: 13, lineHeight: 18 },
  sheetHead: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: spacing.md },
  sheetTitle: { ...font.label, fontSize: 15 },
  sheetTotal: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
}));
