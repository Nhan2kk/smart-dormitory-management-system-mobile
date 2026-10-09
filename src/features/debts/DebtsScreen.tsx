import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import type { Tone } from "../../shared/theme";
import { AppHeader, BottomSheet, Button, Callout, Card, EmptyState, Gradient, IconBadge, IconName, InfoRow, Screen, SegmentedControl, StatusBadge, Touchable } from "../../shared/ui";
import { BillStatus, BillType, DebtStatus } from "../../enums/debt.enum";
import type { BillResponse, Debt } from "../../models/debt.model";
import { DebtLedger } from "./DebtLedger";
import { useDebts } from "./useDebts";

type Tab = "unpaid" | "bills" | "history";

const debtStatusTone: Record<DebtStatus, Tone> = { overdue: "danger", due: "warning", upcoming: "info", paid: "success" };
const billStatusTone: Record<BillStatus, Tone> = { pending: "warning", paid: "success", failed: "danger", cancelled: "neutral" };
const billTypeMeta: Record<BillType, { icon: IconName; tone: Tone }> = {
  maintenanceCost: { icon: "construct-outline", tone: "warning" },
  checkoutSettlement: { icon: "exit-outline", tone: "violet" },
  roomTransferSettlement: { icon: "swap-horizontal-outline", tone: "primary" },
};

/** Mở màn QR thanh toán cho một hoá đơn; xác nhận sẽ gọi `POST /student/bills/{id}/payment`. */
function openPayment(bill: BillResponse) {
  router.push({ pathname: "/debts/pay/[id]", params: { id: bill.id, billId: bill.id, amount: String(bill.amount), title: bill.title } });
}

/** Công nợ của sinh viên = các hoá đơn (`GET /student/bills`). */
export function DebtsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { ledger, error, loading, reload } = useDebts();

  return (
    <Screen header={<AppHeader title={t("debts.title")} subtitle={ledger ? t("debts.unpaidCount", { count: ledger.unpaid().length }) : undefined} />}>
      {error && (
        <View style={{ marginBottom: spacing.lg }}>
          <Callout tone="danger" icon="cloud-offline-outline" title={t("debts.loadError")} action={<Button label={t("common.retry")} size="md" variant="secondary" onPress={reload} />}>
            {error}
          </Callout>
        </View>
      )}
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} /> : ledger ? <DebtsContent ledger={ledger} /> : null}
    </Screen>
  );
}

function DebtsContent({ ledger }: { ledger: DebtLedger }) {
  const { t } = useI18n();
  const { colors, shadow } = useTheme();
  const styles = useStyles();
  const [tab, setTab] = useState<Tab>("unpaid");
  const [receipt, setReceipt] = useState<BillResponse | null>(null);
  const overdue = ledger.sumBy(DebtStatus.Overdue);
  const due = ledger.sumBy(DebtStatus.Due);
  const upcoming = ledger.sumBy(DebtStatus.Upcoming);
  const unpaid = ledger.unpaid();
  const paid = ledger.paid();
  const next = unpaid.find((debt) => debt.status !== DebtStatus.Overdue);
  const focus = unpaid.find((debt) => debt.status === DebtStatus.Overdue) ?? next;

  return (
    <>
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
          <Text style={styles.heroAmount}>{Formatter.currency(ledger.totalUnpaid())}</Text>
          {next?.bill.dueDate && <Text style={styles.heroSub}>{t("debts.nextDue", { date: Formatter.date(next.bill.dueDate), title: next.bill.title })}</Text>}

          {unpaid.length > 0 && (
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
          )}

          {focus && (
            <Touchable onPress={() => openPayment(focus.bill)} accessibilityLabel={focus.status === DebtStatus.Overdue ? t("debts.payOverdue") : t("debts.payNext")} style={styles.heroCta}>
              <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
              <Text style={[styles.heroCtaText, { color: colors.primary }]} numberOfLines={1}>
                {focus.status === DebtStatus.Overdue ? t("debts.payOverdue") : t("debts.payNext")}
              </Text>
              <Text style={[styles.heroCtaAmount, { color: colors.primary }]}>{Formatter.compactCurrency(focus.bill.amount)}</Text>
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

      {tab === "unpaid" &&
        (unpaid.length === 0 ? (
          <EmptyState icon="checkmark-done-outline" title={t("debts.allPaid")} description={t("debts.allPaidBody")} />
        ) : (
          <View style={{ gap: spacing.md }}>
            {unpaid.map((debt) => (
              <DebtCard key={debt.bill.id} debt={debt} />
            ))}
            <Callout tone="warning" icon="alarm-outline" title={t("debts.noticeTitle")}>
              {t("debts.notice")}
            </Callout>
          </View>
        ))}

      {tab === "bills" &&
        (ledger.bills.length === 0 ? (
          <EmptyState icon="receipt-outline" title={t("debts.noBills")} />
        ) : (
          <View style={{ gap: spacing.md }}>
            {ledger.bills.map((bill) => (
              <Card key={bill.id} style={{ gap: spacing.md }}>
                <View style={styles.row}>
                  <IconBadge icon={billTypeMeta[bill.billType]?.icon ?? "receipt-outline"} tone={billTypeMeta[bill.billType]?.tone ?? "violet"} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.caption}>
                      {t(`debts.billType.${bill.billType}`)} · {Formatter.date(bill.createdAt)}
                    </Text>
                    <Text style={styles.title}>{bill.title}</Text>
                  </View>
                </View>
                <View style={styles.rowBetween}>
                  <StatusBadge label={t(`debts.billStatus.${bill.status}`)} tone={billStatusTone[bill.status]} />
                  <Text style={styles.amount}>{Formatter.currency(bill.amount)}</Text>
                </View>
                {(bill.status === BillStatus.Pending || bill.status === BillStatus.Failed) && <Button label={t("debts.payBill")} size="md" icon="qr-code-outline" onPress={() => openPayment(bill)} />}
              </Card>
            ))}
          </View>
        ))}

      {tab === "history" &&
        (paid.length === 0 ? (
          <EmptyState icon="receipt-outline" title={t("debts.empty")} />
        ) : (
          <Card style={{ paddingVertical: spacing.xs }}>
            {paid.map(({ bill }, index, list) => (
              <Touchable key={bill.id} onPress={() => setReceipt(bill)} accessibilityLabel={`${t("debts.receipt")} ${bill.title}`} pressScale={0.99}>
                <View style={[styles.history, index < list.length - 1 && styles.divider]}>
                  <View style={styles.historyIcon}>
                    <Ionicons name="checkmark" size={18} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                      {bill.title}
                    </Text>
                    <Text style={styles.caption}>
                      {bill.paidAt ? Formatter.dateTime(bill.paidAt) : ""}
                      {bill.paymentMethod ? ` · ${paymentMethodLabel(bill.paymentMethod, t)}` : ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={styles.amountSmall}>−{Formatter.currency(bill.amount)}</Text>
                    <Text style={styles.link}>{t("debts.receipt")}</Text>
                  </View>
                </View>
              </Touchable>
            ))}
          </Card>
        ))}

      <BottomSheet visible={!!receipt} onClose={() => setReceipt(null)} title={t("debts.receiptTitle")} subtitle={receipt?.id}>
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
              <InfoRow label={t("debts.content")} value={receipt.title} />
              <InfoRow label={t("debts.billCode")} value={receipt.id} />
              <InfoRow label={t("debts.paidAt")} value={receipt.paidAt ? Formatter.dateTime(receipt.paidAt) : "—"} />
              <InfoRow label={t("debts.method")} value={receipt.paymentMethod ? paymentMethodLabel(receipt.paymentMethod, t) : "—"} divider={false} />
            </Card>
          </>
        )}
      </BottomSheet>
    </>
  );
}

function paymentMethodLabel(method: string, t: ReturnType<typeof useI18n>["t"]): string {
  return method === "bank_transfer" ? t("debts.bankTransfer") : method;
}

function DebtCard({ debt }: { debt: Debt }) {
  const { t } = useI18n();
  const { tones } = useTheme();
  const styles = useStyles();
  const type = billTypeMeta[debt.bill.billType] ?? { icon: "receipt-outline" as IconName, tone: "violet" as Tone };
  const tone = debtStatusTone[debt.status];
  const days = debt.daysLeft;
  const hint = days == null ? null : days < 0 ? t("debts.overdueDays", { count: Math.abs(days) }) : days === 0 ? t("debts.dueToday") : t("debts.daysLeft", { count: days });
  return (
    <Card style={[{ gap: spacing.md }, debt.status === DebtStatus.Overdue && { borderColor: tones.danger.fg, borderWidth: 1.5 }]}>
      <View style={styles.row}>
        <IconBadge icon={type.icon} tone={type.tone} size={46} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{debt.bill.title}</Text>
          <Text style={styles.caption}>{debt.bill.dueDate ? t("debts.dueOn", { date: Formatter.date(debt.bill.dueDate) }) : t(`debts.billType.${debt.bill.billType}`)}</Text>
        </View>
        <StatusBadge label={debt.bill.status === BillStatus.Failed ? t("debts.billStatus.failed") : t(`debts.status.${debt.status}`)} tone={debt.bill.status === BillStatus.Failed ? "danger" : tone} />
      </View>
      <View style={styles.debtFoot}>
        <View>
          <Text style={styles.amount}>{Formatter.currency(debt.bill.amount)}</Text>
          {hint && <Text style={[styles.hint, { color: tones[tone].fg }]}>{hint}</Text>}
        </View>
        <Button label={t("debts.pay")} size="md" icon="qr-code-outline" onPress={() => openPayment(debt.bill)} variant={debt.status === DebtStatus.Upcoming ? "secondary" : "primary"} />
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
