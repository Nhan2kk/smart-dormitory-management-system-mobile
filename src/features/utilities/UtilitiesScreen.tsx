import { RoomUtilityBills } from "./RoomUtilityBills";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AreaChart } from "../../shared/charts/AreaChart";
import { CompareBar } from "../../shared/charts/BarChart";
import { DonutChart } from "../../shared/charts/DonutChart";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { AppHeader, BottomSheet, Button, Callout, Card, EmptyState, Gradient, IconBadge, IconName, InfoRow, Screen, SectionHeader, SegmentedControl } from "../../shared/ui";
import { UtilityCalendar } from "./UtilityCalendar";
import { DailyRecord } from "../../models/utilities.model";
import { UtilityInsightKind, UtilityMetric, UtilityRange } from "../../enums/utilities.enum";
import { UtilityUsage } from "./UtilityUsage";
import { useRealtime } from "../realtime/RealtimeProvider";
import { useUtilities } from "./useUtilities";

const INSIGHT_ICONS: Record<UtilityInsightKind, IconName> = {
  electricityUp: "flash-outline",
  electricityDown: "leaf-outline",
  waterUp: "water-outline",
  waterDown: "leaf-outline",
  peakHour: "time-outline",
  stable: "shield-checkmark-outline",
};

/** Điện & nước của phòng hiện tại, lấy từ `POST /student/utilities` (số đo IoT theo giờ). */
export function UtilitiesScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { usage, error, noRoom, loading, reload } = useUtilities();
  const { lastIncident } = useRealtime();
  const liveIncident = usage && lastIncident?.status === "OPEN" && lastIncident.roomCode.toUpperCase() === usage.roomCode.toUpperCase() ? lastIncident : null;
  const retry = <Button label={t("common.retry")} size="md" variant="secondary" onPress={reload} />;
  const header = <AppHeader title={t("utilities.title")} subtitle={usage ? t("utilities.subtitle", { room: usage.roomCode }) : undefined} />;

  return (
    <Screen inTabs header={header}>
      <RoomUtilityBills />
      {liveIncident && (
        <View style={{ marginBottom: spacing.lg }}>
          <Callout tone={liveIncident.severity === "DANGER" ? "danger" : "warning"} icon="warning-outline" title={t("utilities.liveIncidentTitle")}>
            {liveIncident.reasons[0] ?? t("utilities.liveIncidentBody", { time: Formatter.dateTime(liveIncident.lastDetectedAt) })}
          </Callout>
        </View>
      )}
      {error && (
        <View style={{ marginBottom: spacing.lg }}>
          <Callout tone="danger" icon="cloud-offline-outline" title={t("utilities.loadError")} action={retry}>
            {error}
          </Callout>
        </View>
      )}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : noRoom ? (
        <EmptyState icon="home-outline" title={t("utilities.noRoomTitle")} description={t("utilities.noRoomBody")} />
      ) : usage?.notCheckedIn ? (
        <EmptyState icon="key-outline" title={t("utilities.notCheckedInTitle")} description={t("utilities.notCheckedInBody")} />
      ) : usage && !usage.hasData ? (
        <EmptyState icon="pulse-outline" title={t("utilities.emptyTitle")} description={t("utilities.emptyBody")} action={retry} />
      ) : usage ? (
        <UtilitiesContent usage={usage} />
      ) : null}
    </Screen>
  );
}

function UtilitiesContent({ usage }: { usage: UtilityUsage }) {
  const { t } = useI18n();
  const { colors, tones, shadow } = useTheme();
  const styles = useStyles();
  const [range, setRange] = useState<UtilityRange>("day");
  const [metric, setMetric] = useState<UtilityMetric>("electricity");
  const [day, setDay] = useState<DailyRecord | null>(null);
  const data = usage.series(range);
  const isElectricity = metric === "electricity";
  const total = isElectricity ? data.electricityTotal : data.waterTotal;
  const change = data.changePercent[metric];
  const unit = isElectricity ? "kWh" : "m³";
  const electricityCost = usage.cost("electricity", data.electricityTotal);
  const waterCost = usage.cost("water", data.waterTotal);
  const hasCost = electricityCost != null || waterCost != null;
  const totalCost = (electricityCost ?? 0) + (waterCost ?? 0);
  const labels = range === "week" ? data.labels.map((date) => Formatter.weekday(UtilityUsage.dateOf(date))) : data.labels;
  const period = { day: t("utilities.vsDay"), week: t("utilities.vsWeek"), month: t("utilities.vsMonth") }[range];
  const subtotal = { day: t("utilities.subtotalDay"), week: t("utilities.subtotalWeek"), month: t("utilities.subtotalMonth") }[range];
  const metricName = isElectricity ? t("utilities.electricity") : t("utilities.water");
  const caption =
    range === "day"
      ? t("utilities.captionDay", { date: Formatter.date(UtilityUsage.dateOf(data.to)) })
      : range === "week"
        ? t("utilities.captionRange", { from: Formatter.shortDate(UtilityUsage.dateOf(data.from)), to: Formatter.date(UtilityUsage.dateOf(data.to)) })
        : t("utilities.captionMonth", { month: Formatter.monthYear(UtilityUsage.dateOf(data.from)) });
  const monthToDate = usage.monthToDate();
  const meters = usage.meters();
  const insights = usage.insights();
  /** "2,4 kWh × ≈2.370đ" — đơn giá trung bình tháng do BE tính theo bảng giá. */
  const priceDetail = (target: UtilityMetric, amount: number) => {
    const price = usage.unitPrice(target);
    const quantity = target === "electricity" ? `${Formatter.decimal(amount, 2)} kWh` : `${Formatter.decimal(amount, 3)} m³`;
    return price == null ? quantity : t("utilities.unitPrice", { amount: quantity, price: Formatter.currency(Math.round(price)) });
  };

  return (
    <>
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
                {Formatter.decimal(total, isElectricity ? 2 : 3)} <Text style={styles.heroUnit}>{unit}</Text>
              </Text>
              <Text style={styles.heroCaption}>{caption}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              {change == null ? (
                <Text style={styles.heroCaption}>{t("utilities.noPrevious")}</Text>
              ) : (
                <>
                  <View style={styles.changePill}>
                    <Ionicons name={change >= 0 ? "trending-up" : "trending-down"} size={14} color={white} />
                    <Text style={styles.changeText}>{Math.abs(change)}%</Text>
                  </View>
                  <Text style={styles.heroCaption}>{t("utilities.vs", { period })}</Text>
                </>
              )}
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
      {hasCost ? (
        <Card>
          <View style={styles.costRow}>
            <DonutChart size={128} thickness={20} segments={[{ value: electricityCost ?? 0, color: colors.primary }, { value: waterCost ?? 0, color: colors.info }]}>
              <Text style={styles.donutValue}>{Formatter.compactCurrency(totalCost)}</Text>
              <Text style={styles.caption}>{t("utilities.total")}</Text>
            </DonutChart>
            <View style={{ flex: 1, gap: spacing.md }}>
              <CostLegend color={colors.primary} label={t("utilities.electricity")} amount={electricityCost} detail={priceDetail("electricity", data.electricityTotal)} share={totalCost ? (electricityCost ?? 0) / totalCost : 0} />
              <CostLegend color={colors.info} label={t("utilities.water")} amount={waterCost} detail={priceDetail("water", data.waterTotal)} share={totalCost ? (waterCost ?? 0) / totalCost : 0} />
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
            <Text style={[styles.caption, { textAlign: "right" }]}>{t("utilities.splitAmong")}</Text>
          </View>
        </Card>
      ) : (
        <Callout tone="info" icon="pricetag-outline">
          {t("utilities.priceUnavailable")}
        </Callout>
      )}

      <SectionHeader title={t("utilities.calendar", { month: Formatter.monthYear(UtilityUsage.dateOf(`${usage.month}-01`)) })} />
      <Card>
        <Text style={[styles.caption, { marginBottom: spacing.md }]}>
          {t("utilities.calendarHint")}
          {usage.visibleFrom ? ` ${t(usage.roomWide ? "utilities.visibleSinceRoom" : "utilities.visibleSince", { time: Formatter.dateTime(usage.visibleFrom) })}` : ""}
        </Text>
        <UtilityCalendar month={usage.month} records={usage.days()} firstStayDate={usage.firstStayDate} metric={metric} onSelect={setDay} />
      </Card>

      <SectionHeader title={t("utilities.compare")} />
      <Card style={{ gap: spacing.lg }}>
        <CompareBar label={t("utilities.electricityThisMonth")} value={monthToDate.electricity.current} reference={monthToDate.electricity.previous} unit="kWh" />
        <CompareBar label={t("utilities.waterThisMonth")} value={monthToDate.water.current} reference={monthToDate.water.previous} unit="m³" color={colors.info} />
        <View style={styles.legend}>
          <LegendDot color={colors.primary} label={t("utilities.yourRoom")} />
          <LegendDot color={colors.border} label={t("utilities.buildingAverage")} />
        </View>
      </Card>

      <View style={styles.meters}>
        <Card style={styles.meter}>
          <IconBadge icon="flash" tone="primary" size={38} rounded="circle" />
          <Text style={styles.caption}>{t("utilities.electricityMeter")}</Text>
          <Text style={styles.meterValue}>{meters.electricity == null ? t("utilities.noReading") : `${Formatter.decimal(meters.electricity)} kWh`}</Text>
        </Card>
        <Card style={styles.meter}>
          <IconBadge icon="water" tone="info" size={38} rounded="circle" />
          <Text style={styles.caption}>{t("utilities.waterMeter")}</Text>
          <Text style={styles.meterValue}>{meters.water == null ? t("utilities.noReading") : `${Formatter.decimal(meters.water)} m³`}</Text>
        </Card>
      </View>
      {meters.updatedAt && <Text style={styles.meterUpdated}>{t("utilities.meterUpdated", { time: Formatter.dateTime(meters.updatedAt) })}</Text>}

      {insights.length > 0 && <SectionHeader title={t("utilities.alerts")} />}
      <View style={{ gap: spacing.md }}>
        {insights.map((insight) => (
          <Card key={insight.kind} style={[styles.alert, { borderLeftColor: tones[insight.tone].fg }]}>
            <IconBadge icon={INSIGHT_ICONS[insight.kind]} tone={insight.tone} size={40} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.alertTitle}>{t(`utilities.insightTitle.${insight.kind}`)}</Text>
              <Text style={styles.alertBody}>{t(`utilities.insight.${insight.kind}`, { value: insight.value, next: (insight.value + 1) % 24 })}</Text>
            </View>
          </Card>
        ))}
      </View>

      <BottomSheet visible={!!day} onClose={() => setDay(null)} title={day ? t("utilities.dayDetail", { date: Formatter.date(UtilityUsage.dateOf(day.date)) }) : ""}>
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
            {day.cost != null && (
              <Card variant="warm" style={styles.sheetTotal}>
                <Text style={styles.sheetTitle}>{t("utilities.amount")}</Text>
                <Text style={styles.costTotal}>{Formatter.currency(day.cost)}</Text>
              </Card>
            )}
          </>
        )}
      </BottomSheet>
    </>
  );
}

function CostLegend({ color, label, amount, detail, share }: { color: string; label: string; amount: number | null; detail: string; share: number }) {
  const styles = useStyles();
  return (
    <View style={{ gap: 2 }}>
      <View style={styles.legendHead}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
        <Text style={styles.legendShare}>{Math.round(share * 100)}%</Text>
      </View>
      <Text style={styles.legendAmount}>{amount == null ? "—" : Formatter.currency(amount)}</Text>
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
  // Viền trái theo tông: dùng border của chính thẻ nên bo cong theo góc thẻ.
  alert: { flexDirection: "row", gap: spacing.md, borderLeftWidth: 4 },
  alertTitle: { ...font.label, fontSize: 15 },
  alertBody: { ...font.body, fontSize: 13, lineHeight: 18 },
  sheetHead: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: spacing.md },
  sheetTitle: { ...font.label, fontSize: 15 },
  sheetTotal: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
}));
