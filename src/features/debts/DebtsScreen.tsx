import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { AppHeader, BottomSheet, Button, Callout, Card, EmptyState, Gradient, IconBadge, InfoRow, Screen, SegmentedControl, StatusBadge, Touchable, useToast } from "../../shared/ui";
import { billStatusTone, Debt, DebtRepository, debtStatusTone, debtTypeMeta } from "./debts.mock";

type Tab = "unpaid" | "bills" | "history";

export function DebtsScreen() {
  const { t, l } = useI18n();
  const { colors, shadow } = useTheme();
  const { notify } = useToast();
  const styles = useStyles();
  const [tab, setTab] = useState<Tab>("unpaid");
  const [receipt, setReceipt] = useState<Debt | null>(null);
  const overdue = DebtRepository.sumBy("overdue");
  const due = DebtRepository.sumBy("due");
  const upcoming = DebtRepository.sumBy("upcoming");
  const unpaid = DebtRepository.unpaid();
  const next = [...unpaid].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).find((debt) => debt.status !== "overdue");
  const focus = unpaid.find((debt) => debt.status === "overdue") ?? next;

  return (
    <Screen header={<AppHeader title={t("debts.title")} subtitle={t("debts.year")} />}>
      {/* Thẻ tổng công nợ */}
      <View style={[styles.heroShadow, shadow(2)]}>
        <Gradient style={styles.hero}>
          <View style={[styles.blob, styles.blobA]} />
          <View style={[styles.blob, styles.blobB]} />
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="wallet" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.heroLabel}>{t("debts.currentTotal")}</Text>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{t("debts.items", { count: unpaid.length })}</Text>
            </View>
          </View>
          <Text style={styles.heroAmount}>{Formatter.currency(DebtRepository.totalUnpaid())}</Text>
          {next && <Text style={styles.heroSub}>{t("debts.nextDue", { date: Formatter.date(next.dueDate), title: l(next.title) })}</Text>}

          <View style={styles.panel}>
            <View style={styles.split}>
              <View style={{ flex: overdue, backgroundColor: colors.danger }} />
              <View style={{ flex: due, backgroundColor: colors.warning }} />
              <View style={{ flex: upcoming, backgroundColor: colors.info }} />
            </View>
            <View style={styles.breakdown}>
              <Breakdown color={colors.danger} label={t("debts.overdue")} amount={overdue} />
              <View style={styles.panelDivider} />
              <Breakdown color={colors.warning} label={t("debts.due")} amount={due} />
              <View style={styles.panelDivider} />
              <Breakdown color={colors.info} label={t("debts.upcoming")} amount={upcoming} />
            </View>
          </View>

          {focus && (
            <Touchable onPress={() => router.push(`/debts/pay/${focus.id}`)} accessibilityLabel={focus.status === "overdue" ? t("debts.payOverdue") : t("debts.payNext")} style={styles.heroCta}>
              <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
              <Text style={[styles.heroCtaText, { color: colors.primary }]} numberOfLines={1}>
                {focus.status === "overdue" ? t("debts.payOverdue") : t("debts.payNext")}
              </Text>
              <Text style={[styles.heroCtaAmount, { color: colors.primary }]}>{Formatter.compactCurrency(focus.amount)}</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
            </Touchable>
          )}
        </Gradient>
      </View>

      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        style={{ marginTop: spacing.xl, marginBottom: spacing.lg }}
        options={[
          { value: "unpaid", label: t("debts.toPay") },
          { value: "bills", label: t("debts.bills") },
          { value: "history", label: t("debts.history") },
        ]}
      />

      {tab === "unpaid" && (
        <View style={{ gap: spacing.md }}>
          {DebtRepository.unpaid().map((debt) => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
          <Callout tone="warning" icon="alarm-outline" title={t("debts.noticeTitle")}>
            {t("debts.notice")}
          </Callout>
        </View>
      )}

      {tab === "bills" && (
        <View style={{ gap: spacing.md }}>
          {DebtRepository.bills().map((bill) => (
            <Card key={bill.id} style={{ gap: spacing.md }}>
              <View style={styles.row}>
                <IconBadge icon="receipt-outline" tone="violet" size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.caption}>
                    {t(`debts.billType.${bill.type}`)} · {bill.id}
                  </Text>
                  <Text style={styles.title}>{l(bill.title)}</Text>
                </View>
              </View>
              <View style={styles.rowBetween}>
                <StatusBadge label={t(`debts.billStatus.${bill.status}`)} tone={billStatusTone[bill.status]} />
                <Text style={styles.amount}>{Formatter.currency(bill.amount)}</Text>
              </View>
              {bill.status === "pending" && <Button label={t("debts.payBill")} size="md" icon="qr-code-outline" onPress={() => router.push(`/debts/pay/${bill.id}`)} />}
            </Card>
          ))}
        </View>
      )}

      {tab === "history" &&
        (DebtRepository.paid().length === 0 ? (
          <EmptyState icon="receipt-outline" title={t("debts.empty")} />
        ) : (
          <Card style={{ paddingVertical: spacing.xs }}>
            {DebtRepository.paid().map((debt, index, list) => (
              <Touchable key={debt.id} onPress={() => setReceipt(debt)} accessibilityLabel={`${t("debts.receipt")} ${l(debt.title)}`} pressScale={0.99}>
                <View style={[styles.history, index < list.length - 1 && styles.divider]}>
                  <View style={styles.historyIcon}>
                    <Ionicons name="checkmark" size={18} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                      {l(debt.title)}
                    </Text>
                    <Text style={styles.caption}>
                      {debt.paidAt ? Formatter.dateTime(debt.paidAt) : ""} · {debt.method}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={styles.amountSmall}>−{Formatter.currency(debt.amount)}</Text>
                    <Text style={styles.link}>{t("debts.receipt")}</Text>
                  </View>
                </View>
              </Touchable>
            ))}
          </Card>
        ))}

      <BottomSheet
        visible={!!receipt}
        onClose={() => setReceipt(null)}
        title={t("debts.receiptTitle")}
        subtitle={receipt?.id}
        footer={
          <Button
            label={t("debts.downloadReceipt")}
            icon="download-outline"
            variant="dark"
            onPress={() => {
              setReceipt(null);
              notify(t("debts.receiptDownloaded"));
            }}
          />
        }
      >
        {receipt && (
          <>
            <View style={styles.receiptHead}>
              <View style={styles.receiptIcon}>
                <Ionicons name="checkmark" size={30} color={colors.white} />
              </View>
              <Text style={styles.receiptAmount}>{Formatter.currency(receipt.amount)}</Text>
              <StatusBadge label={t("debts.status.paid")} tone="success" />
            </View>
            <Card style={{ paddingVertical: spacing.xs }}>
              <InfoRow label={t("debts.content")} value={l(receipt.title)} />
              <InfoRow label={t("debts.transactionCode")} value={`GD${receipt.id.replace(/\D/g, "")}8812`} />
              <InfoRow label={t("debts.paidAt")} value={receipt.paidAt ? Formatter.dateTime(receipt.paidAt) : "—"} />
              <InfoRow label={t("debts.method")} value={receipt.method ?? "—"} divider={false} />
            </Card>
          </>
        )}
      </BottomSheet>
    </Screen>
  );
}

function DebtCard({ debt }: { debt: Debt }) {
  const { t, l } = useI18n();
  const { tones } = useTheme();
  const styles = useStyles();
  const type = debtTypeMeta[debt.type];
  const tone = debtStatusTone[debt.status];
  const days = debt.daysLeft ?? 0;
  const hint = days < 0 ? t("debts.overdueDays", { count: Math.abs(days) }) : days === 0 ? t("debts.dueToday") : t("debts.daysLeft", { count: days });
  return (
    <Card style={[{ gap: spacing.md }, debt.status === "overdue" && { borderColor: tones.danger.fg, borderWidth: 1.5 }]}>
      <View style={styles.row}>
        <IconBadge icon={type.icon} tone={type.tone} size={46} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{l(debt.title)}</Text>
          <Text style={styles.caption}>{t("debts.dueOn", { date: Formatter.date(debt.dueDate) })}</Text>
        </View>
        <StatusBadge label={t(`debts.status.${debt.status}`)} tone={tone} />
      </View>
      <View style={styles.debtFoot}>
        <View>
          <Text style={styles.amount}>{Formatter.currency(debt.amount)}</Text>
          <Text style={[styles.hint, { color: tones[tone].fg }]}>{hint}</Text>
        </View>
        <Button label={t("debts.pay")} size="md" icon="qr-code-outline" onPress={() => router.push(`/debts/pay/${debt.id}`)} variant={debt.status === "upcoming" ? "secondary" : "primary"} />
      </View>
    </Card>
  );
}

function Breakdown({ color, label, amount }: { color: string; label: string; amount: number }) {
  const styles = useStyles();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={styles.breakLabel}>{label}</Text>
      </View>
      <Text style={styles.breakAmount}>{Formatter.compactCurrency(amount)}</Text>
    </View>
  );
}

const white = "#FFFFFF";

const useStyles = makeStyles(({ colors, font }) => ({
  heroShadow: { borderRadius: radius.xl },
  hero: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm },
  blob: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" },
  blobA: { width: 180, height: 180, top: -70, right: -50 },
  blobB: { width: 110, height: 110, top: 60, right: 70, backgroundColor: "rgba(255,255,255,0.07)" },
  heroTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  heroIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  heroLabel: { flex: 1, color: "rgba(255,255,255,0.92)", fontSize: 14, fontWeight: "600" },
  countPill: { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  countText: { color: white, fontSize: 12, fontWeight: "800" },
  heroAmount: { color: white, fontSize: 36, fontWeight: "800", letterSpacing: -0.5, marginTop: spacing.sm },
  heroSub: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "500" },
  panel: { marginTop: spacing.md, backgroundColor: "rgba(255,255,255,0.96)", borderRadius: radius.lg, padding: spacing.md, gap: spacing.md },
  split: { flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", gap: 3 },
  breakdown: { flexDirection: "row", alignItems: "center" },
  panelDivider: { width: 1, height: 30, backgroundColor: "rgba(0,0,0,0.08)" },
  breakLabel: { color: "#6B6560", fontSize: 12, fontWeight: "600" },
  breakAmount: { color: "#1F1B17", fontSize: 16, fontWeight: "800" },
  heroCta: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: white, height: 48, borderRadius: radius.pill, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  heroCtaText: { flex: 1, fontSize: 14, fontWeight: "700" },
  heroCtaAmount: { fontSize: 15, fontWeight: "900" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  debtFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  title: { ...font.label, fontSize: 15 },
  caption: { ...font.caption, marginTop: 2 },
  amount: { fontSize: 20, fontWeight: "800", color: colors.ink },
  amountSmall: { ...font.label },
  hint: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  history: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  historyIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" },
  link: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  receiptHead: { alignItems: "center", gap: spacing.sm },
  receiptIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  receiptAmount: { fontSize: 28, fontWeight: "800", color: colors.ink },
}));
