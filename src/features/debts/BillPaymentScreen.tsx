import { roomUtilityError } from "../../shared/i18n/room-utility-messages";
import { RoomUtilityService } from "../../services/room-utility.service";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, spacing, useTheme } from "../../shared/theme";
import { AppHeader, Button, Card, CircleButton, Screen, useToast } from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { useRealtime } from "../realtime/RealtimeProvider";
import { DebtService } from "../../services/debt.service";
import type { BillPaymentQr } from "../../models/debt.model";
import { BankAppPicker } from "./BankAppPicker";
import { PaymentSuccessView } from "./PaymentSuccessView";
import { formatCountdown, useSepayPayment } from "./useSepayPayment";

/**
 * Thanh toán hoá đơn phát sinh bằng QR SePay (mỗi mã hiệu lực 15 phút). Chỉ webhook SePay xác nhận tiền
 * mới chuyển hoá đơn sang đã thanh toán; màn tự chuyển sang thành công qua socket hoặc lần hỏi trạng thái.
 */
export function BillPaymentScreen({ billId, title, roomUtility=false }: { billId: string; title?: string; roomUtility?:boolean }) {
  const { request } = useAuth();
  const service = useMemo(() => new DebtService(request), [request]);
  const roomService=useMemo(()=>new RoomUtilityService(request),[request]);
  const { notify } = useToast();
  const { t } = useI18n();
  const { connected, lastBillPayment } = useRealtime();
  const styles = useStyles();
  const { qr, phase, createQr, qrRemaining } = useSepayPayment<BillPaymentQr>({
    key: billId,
    init: () => roomUtility ? roomService.payment(billId) : service.initPayment(billId),
    status: async () => {
      const status = await (roomUtility ? roomService.status(billId) : service.paymentStatus(billId));
      return {
        state: status.billStatus === "PAID" ? "paid" : status.billStatus === "CANCELLED" ? "closed" : "open",
        qrExpiresAt: status.qrExpiresAt,
        serverTime: status.serverTime,
      };
    },
    liveState: !roomUtility && lastBillPayment?.billId === billId ? "paid" : null,
    connected,
    onError: (message) => notify(roomUtility ? roomUtilityError(message,t) : message, "danger"),
  });

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    notify(t("payment.copiedValue", { label }));
  };
  const close = <CircleButton icon="close" label={t("common.close")} onPress={() => router.back()} />;

  return (
    <Screen edges={["top", "bottom"]} header={<AppHeader title={t("payment.billTitle")} subtitle={title} hideBack right={close} />}>
      {phase === "loading" && <ActivityIndicator style={{ marginTop: spacing.xl }} />}
      {phase === "paid" && (
        <PaymentSuccessView
          title={t("payment.success")}
          hint={t(roomUtility ? "roomUtility.paidHint" : "payment.billPaid")}
          rows={[
            ...(title ? [{ label: t("payment.bill"), value: title }] : []),
            ...(qr
              ? [
                  { label: t("payment.amount"), value: Formatter.currency(qr.amount) },
                  { label: t("payment.paymentCode"), value: qr.paymentCode },
                ]
              : []),
          ]}
          actionLabel={t(roomUtility ? "utilities.title" : "payment.backToDebts")}
          closeLabel={t("common.close")}
          onAction={() => router.replace(roomUtility ? "/utilities" : "/debts")}
          onClose={() => router.back()}
        />
      )}
      {phase === "closed" && (
        <View style={styles.center}>
          <Text style={styles.title}>{t("payment.billClosed")}</Text>
          <Button label={t(roomUtility ? "utilities.title" : "payment.backToDebts")} onPress={() => router.replace(roomUtility ? "/utilities" : "/debts")} />
        </View>
      )}
      {!qr && phase === "qr_expired" && (
        <View style={styles.center}>
          <Text style={styles.centerText}>{t("payment.expired")}</Text>
          <Button label={t("payment.newQr")} onPress={() => void createQr()} />
        </View>
      )}
      {qr && (phase === "waiting" || phase === "qr_expired") && (
        <View style={styles.body}>
          <Text style={styles.amount}>{Formatter.currency(qr.amount)}</Text>
          <Card style={styles.qrCard}>
            <Image
              source={{ uri: qr.qrImageUrl }}
              style={[styles.qrImage, phase === "qr_expired" && { opacity: 0.3 }]}
              resizeMode="contain"
              accessibilityLabel={t("payment.qrLabel")}
            />
            <Text style={styles.centerText}>
              {phase === "waiting" ? t("payment.qrRemaining", { time: formatCountdown(qrRemaining) }) : t("payment.expired")}
            </Text>
            {phase === "qr_expired" && <Button label={t("payment.newQr")} onPress={() => void createQr()} />}
          </Card>
          <BankAppPicker qr={qr} />
          <Card style={styles.details}>
            <Detail label={t("payment.bank")} value={qr.bankCode} />
            <Detail label={t("payment.accountNumber")} value={qr.accountNumber} onCopy={() => void copy(t("payment.accountNumber"), qr.accountNumber)} />
            <Detail label={t("payment.holder")} value={qr.accountHolder} />
            <Detail label={t("payment.amount")} value={Formatter.currency(qr.amount)} onCopy={() => void copy(t("payment.amountCopy"), String(qr.amount))} />
            <Detail label={t("payment.content")} value={qr.transferContent} onCopy={() => void copy(t("payment.content"), qr.transferContent)} />
          </Card>
          <Text style={styles.centerText}>{t("payment.autoUpdate")}</Text>
        </View>
      )}
    </Screen>
  );
}

function Detail({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.detailRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
      {onCopy && (
        <Pressable onPress={onCopy} hitSlop={8} accessibilityRole="button" accessibilityLabel={t("common.copy")}>
          <Ionicons name="copy-outline" size={22} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  body: { gap: spacing.lg },
  center: { alignItems: "center", gap: spacing.lg, paddingTop: spacing.xxl },
  title: { fontSize: 20, fontWeight: "700", color: colors.ink, textAlign: "center" },
  amount: { fontSize: 32, fontWeight: "800", color: colors.ink, textAlign: "center", marginTop: spacing.md },
  qrCard: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
  // Ảnh VietQR mẫu compact (khung SePay/Napas/ngân hàng) có tỉ lệ 540×714.
  qrImage: { width: "100%", maxWidth: 320, aspectRatio: 540 / 714 },
  centerText: { textAlign: "center", color: colors.ink },
  details: { gap: spacing.md },
  detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailLabel: { color: colors.muted, fontSize: 13 },
  detailValue: { color: colors.ink, fontWeight: "700", fontSize: 15 },
}));
