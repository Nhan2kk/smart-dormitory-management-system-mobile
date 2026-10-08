import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { errorMessage } from "../../shared/api";
import { QrCode } from "../../shared/charts/QrCode";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { AppHeader, Button, Card, CircleButton, EmptyState, FooterBar, Screen, Touchable, useToast } from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { registrationApi } from "../registration/registrationApi";
import { requestsApi } from "../requests/requestsApi";
import { DebtRepository, Payable } from "./debts.mock";

const QR_LIFETIME = 15 * 60;

/**
 * Màn hình thanh toán bằng mã QR chuyển khoản. Xác nhận chuyển khoản gọi API thật cho:
 * - đơn đăng ký KTX (`registrationId`): `POST /student/registrations/{id}/payment` — BE hoàn tất đăng ký và tạo biên bản nhận phòng;
 * - hoá đơn (`billId`, vd. tất toán chuyển/trả phòng, chi phí sửa chữa): `POST /student/bills/{id}/payment`.
 * Các khoản khác vẫn là mock.
 */
export function PaymentScreen() {
  const { id, amount, title, registrationId, billId } = useLocalSearchParams<{ id: string; amount?: string; title?: string; registrationId?: string; billId?: string }>();
  const { notify } = useToast();
  const { t, l } = useI18n();
  const { shadow } = useTheme();
  const styles = useStyles();
  const { request } = useAuth();
  const api = useMemo(() => registrationApi(request), [request]);
  const bills = useMemo(() => requestsApi(request), [request]);
  // Khoản phát sinh ngay trong app (vd. đăng ký KTX) truyền số tiền qua tham số.
  const item: Payable | undefined = DebtRepository.find(String(id)) ?? (amount && title ? { id: String(id), amount: Number(amount), title: { vi: String(title), en: String(title) } } : undefined);
  const [seconds, setSeconds] = useState(QR_LIFETIME);
  const [phase, setPhase] = useState<"waiting" | "checking" | "done">("waiting");

  useEffect(() => {
    if (phase !== "waiting") return;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const close = <CircleButton icon="close" label={t("common.close")} onPress={() => router.back()} />;

  if (!item)
    return (
      <Screen edges={["top", "bottom"]} header={<AppHeader title={t("payment.title")} hideBack right={close} />}>
        <EmptyState icon="search-outline" title={t("payment.notFound")} />
      </Screen>
    );

  const account = DebtRepository.account;
  const content = DebtRepository.transferContent(item.id);
  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value.replace(/\s/g, ""));
    notify(t("common.copied", { label }));
  };

  if (phase === "done")
    return (
      <Screen edges={["top", "bottom"]} scroll={false} contentStyle={styles.doneWrap}>
        <View style={[styles.doneIcon, shadow(2)]}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.doneTitle}>{t("payment.success")}</Text>
        <Text style={styles.doneAmount}>{Formatter.currency(item.amount)}</Text>
        <Text style={styles.doneBody}>{l(item.title)}</Text>
        <Card variant="outline" style={styles.receipt}>
          <ReceiptRow label={t("debts.transactionCode")} value={`GD${item.id.replace(/\D/g, "")}8812`} />
          <ReceiptRow label={t("debts.paidAt")} value={Formatter.dateTime(new Date())} />
          <ReceiptRow label={t("debts.method")} value={`QR · ${account.bank}`} />
        </Card>
        {registrationId ? (
          <>
            <Text style={[styles.doneBody, { marginTop: spacing.lg }]}>{t("payment.registrationDone")}</Text>
            <Button label={t("payment.goCheckIn")} icon="key-outline" onPress={() => router.replace("/check-in")} style={{ alignSelf: "stretch", marginTop: spacing.xl }} />
            <Button label={t("common.done")} variant="ghost" onPress={() => router.back()} style={{ alignSelf: "stretch", marginTop: spacing.sm }} />
          </>
        ) : (
          <Button label={t("common.done")} onPress={() => router.back()} style={{ alignSelf: "stretch", marginTop: spacing.xxl }} />
        )}
      </Screen>
    );

  const confirmTransfer = async () => {
    setPhase("checking");
    if (!registrationId && !billId) {
      setTimeout(() => setPhase("done"), 1600);
      return;
    }
    try {
      if (registrationId) await api.pay(String(registrationId));
      else await bills.payBill(String(billId));
      setPhase("done");
    } catch (error) {
      notify(errorMessage(error), "danger");
      setPhase("waiting");
    }
  };

  return (
    <Screen
      edges={["top"]}
      header={<AppHeader title={t("payment.title")} subtitle={item.id} hideBack right={close} />}
      footer={
        <FooterBar>
          <Button
            label={phase === "checking" ? t("payment.checking") : t("payment.transferred")}
            icon="checkmark-done"
            loading={phase === "checking"}
            disabled={seconds === 0}
            onPress={confirmTransfer}
            style={{ flex: 1 }}
          />
        </FooterBar>
      }
    >
      <View style={styles.amountBox}>
        <Text style={styles.caption}>{t("payment.amount")}</Text>
        <Text style={styles.amount}>{Formatter.currency(item.amount)}</Text>
        <Text style={styles.amountFor}>{l(item.title)}</Text>
      </View>

      <Card style={[styles.qrCard, shadow(2)]}>
        <View style={styles.qrFrame} accessibilityLabel={t("payment.qrLabel")}>
          {seconds > 0 ? (
            <QrCode seed={content} size={200} />
          ) : (
            <View style={styles.qrExpired}>
              <Ionicons name="refresh" size={32} color="#8C837B" />
              <Text style={styles.expiredText}>{t("payment.expired")}</Text>
            </View>
          )}
          {phase === "checking" && (
            <View style={styles.qrChecking}>
              <ActivityIndicator color="#E2601F" size="large" />
            </View>
          )}
        </View>
        <Text style={styles.qrHint}>{t("payment.scanHint")}</Text>
        {seconds > 0 ? (
          <View style={styles.timer}>
            <Ionicons name="time-outline" size={16} color={styles.timerText.color} />
            <Text style={styles.timerText}>{t("payment.expiresIn", { time: Formatter.countdown(seconds) })}</Text>
          </View>
        ) : (
          <Button label={t("payment.newQr")} size="md" variant="secondary" icon="refresh" onPress={() => setSeconds(QR_LIFETIME)} />
        )}
      </Card>

      <Text style={styles.manualTitle}>{t("payment.manual")}</Text>
      <Card style={{ paddingVertical: spacing.xs }}>
        <CopyRow label={t("payment.bank")} value={account.bank} />
        <CopyRow label={t("payment.accountNumber")} value={account.accountNumber} onCopy={copy} />
        <CopyRow label={t("payment.holder")} value={account.holder} />
        <CopyRow label={t("payment.content")} value={content} onCopy={copy} last />
      </Card>
      <Text style={styles.footnote}>{t("payment.autoUpdate")}</Text>
    </Screen>
  );
}

function CopyRow({ label, value, onCopy, last }: { label: string; value: string; onCopy?: (label: string, value: string) => void; last?: boolean }) {
  const styles = useStyles();
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={[styles.copyRow, !last && styles.divider]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.caption}>{label}</Text>
        <Text style={styles.copyValue}>{value}</Text>
      </View>
      {onCopy && (
        <Touchable onPress={() => onCopy(label, value)} accessibilityLabel={`${t("common.copy")} ${label}`} style={styles.copyBtn}>
          <Ionicons name="copy-outline" size={16} color={colors.primary} />
          <Text style={styles.copyText}>{t("common.copy")}</Text>
        </Touchable>
      )}
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.caption}>{label}</Text>
      <Text style={styles.receiptValue}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  caption: { ...font.caption, fontSize: 12 },
  amountBox: { alignItems: "center", paddingVertical: spacing.md },
  amount: { fontSize: 36, fontWeight: "800", color: colors.ink, marginTop: 4, letterSpacing: -0.5 },
  amountFor: { ...font.body, fontSize: 14, marginTop: 2, textAlign: "center" },
  qrCard: { alignItems: "center", gap: spacing.md, marginTop: spacing.md, paddingVertical: spacing.xl },
  qrFrame: { padding: 12, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.primarySoft, backgroundColor: "#FFFFFF" },
  qrExpired: { width: 200, height: 200, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#F1ECE6", borderRadius: radius.md },
  expiredText: { fontSize: 14, fontWeight: "600", color: "#8C837B" },
  qrChecking: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center", borderRadius: radius.lg },
  qrHint: { ...font.body, fontSize: 14, textAlign: "center" },
  timer: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primarySoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  timerText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  manualTitle: { ...font.heading, fontSize: 16, marginTop: spacing.xxl, marginBottom: spacing.md },
  copyRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  copyValue: { ...font.label, fontSize: 15, marginTop: 2 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, height: 36, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  copyText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  footnote: { ...font.caption, textAlign: "center", marginTop: spacing.lg },
  doneWrap: { alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xxl },
  doneIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  doneTitle: { ...font.title, marginTop: spacing.xl },
  doneAmount: { fontSize: 32, fontWeight: "800", color: colors.success, marginTop: spacing.sm },
  doneBody: { ...font.body, marginTop: 4, textAlign: "center" },
  receipt: { alignSelf: "stretch", marginTop: spacing.xl, gap: spacing.sm },
  receiptRow: { flexDirection: "row", justifyContent: "space-between" },
  receiptValue: { ...font.label, fontSize: 13 },
}));
