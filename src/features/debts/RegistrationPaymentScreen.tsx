import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, AppState, Image, Text, View } from "react-native";
import { errorMessage } from "../../shared/api";
import { Formatter } from "../../shared/format";
import { makeStyles, spacing } from "../../shared/theme";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { AppHeader, Button, Card, CircleButton, Screen, useToast } from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { useRealtime } from "../realtime/RealtimeProvider";
import { RegistrationService } from "../../services/registration.service";
import type { PaymentQr } from "../../models/registration-payment.model";

export function RegistrationPaymentScreen({ registrationId }: { registrationId: string }) {
  const { request } = useAuth();
  const service = useMemo(() => new RegistrationService(request), [request]);
  const { notify } = useToast();
  const { t, lang } = useI18n();
  const { connected, lastRegistrationPayment } = useRealtime();
  const styles = useStyles();
  const [qr, setQr] = useState<PaymentQr | null>(null);
  const [phase, setPhase] = useState<"loading" | "waiting" | "qr_expired" | "paid" | "hold_expired">("loading");
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(0);

  const checkStatus = useCallback(async () => {
    try {
      const status = await service.paymentStatus(registrationId);
      setOffset(new Date(status.serverTime).getTime() - Date.now());
      if (status.registrationStatus === "APPROVED") setPhase("paid");
      else if (["EXPIRED", "CANCELLED", "REJECTED"].includes(status.registrationStatus)) setPhase("hold_expired");
      else if (!status.qrExpiresAt || new Date(status.qrExpiresAt).getTime() <= new Date(status.serverTime).getTime()) setPhase("qr_expired");
    } catch (error) { notify(errorMessage(error), "danger"); }
  }, [service, registrationId, notify]);

  const createQr = useCallback(async () => {
    setPhase("loading");
    try {
      const next = await service.initPayment(registrationId);
      setQr(next);
      setOffset(new Date(next.serverTime).getTime() - Date.now());
      setPhase("waiting");
    } catch (error) { notify(errorMessage(error), "danger"); await checkStatus(); }
  }, [service, registrationId, notify, checkStatus]);

  useEffect(() => {
    const timer = setTimeout(() => void createQr(), 0);
    return () => clearTimeout(timer);
  }, [createQr]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkStatus();
    });
    return () => listener.remove();
  }, [checkStatus]);
  useEffect(() => {
    if (connected || phase === "paid" || phase === "hold_expired") return;
    const timer = setInterval(() => void checkStatus(), 5000);
    return () => clearInterval(timer);
  }, [connected, phase, checkStatus]);

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    notify(t("payment.copiedValue", { label }));
  };
  const remain = qr ? Math.max(0, new Date(qr.qrExpiresAt).getTime() - now - offset) : 0;
  const hold = qr ? Math.max(0, new Date(qr.paymentDeadline).getTime() - now - offset) : 0;
  const eventPhase = lastRegistrationPayment?.registrationId === registrationId
    ? (lastRegistrationPayment.status === "PAID" ? "paid" : "hold_expired") : null;
  const currentPhase = eventPhase ?? (phase === "waiting" && qr && now > 0
    ? (hold === 0 ? "hold_expired" : remain === 0 ? "qr_expired" : "waiting") : phase);
  const clock = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const pad = (value: number) => value.toString().padStart(2, "0");
    const minutes = `${pad(Math.floor(total % 3600 / 60))}:${pad(total % 60)}`;
    return total >= 3600 ? `${pad(Math.floor(total / 3600))}:${minutes}` : minutes;
  };
  const close = <CircleButton icon="close" label={t("common.close")} onPress={() => router.back()} />;

  return <Screen edges={["top", "bottom"]} header={<AppHeader title={t("payment.registrationTitle")} hideBack right={close} />}>
    {currentPhase === "loading" && <ActivityIndicator style={{ marginTop: spacing.xl }} />}
    {currentPhase === "paid" && <View style={styles.center}>
      <Ionicons name="checkmark-circle" size={80} color="#20804E" />
      <Text style={styles.title}>{t("payment.success")}</Text>
      <Text>{t("payment.registrationPaid")}</Text>
      <Button label={t("payment.goCheckIn")} onPress={() => router.replace("/check-in")} />
    </View>}
    {currentPhase === "hold_expired" && <View style={styles.center}>
      <Text style={styles.title}>{t("payment.holdExpired")}</Text>
      <Button label={t("payment.registerAgain")} onPress={() => router.replace("/register-dorm")} />
    </View>}
    {!qr && currentPhase === "qr_expired" && <View style={styles.center}>
      <Text>{t("payment.expired")}</Text>
      <Button label={t("payment.newQr")} onPress={() => void createQr()} />
    </View>}
    {qr && (currentPhase === "waiting" || currentPhase === "qr_expired") && <View style={styles.body}>
      <Text style={styles.amount}>{Formatter.currency(qr.amount)}</Text>
      <Card style={styles.qrCard}>
        <Image source={{ uri: qr.qrImageUrl }} style={[styles.qrImage, currentPhase === "qr_expired" && { opacity: 0.3 }]} resizeMode="contain" />
        <Text style={styles.centerText}>{currentPhase === "waiting" ? t("payment.qrRemaining", { time: clock(remain) }) : t("payment.expired")}</Text>
        <Text style={styles.centerText}>{t("payment.holdUntil", { date: new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(new Date(qr.paymentDeadline)), time: clock(hold) })}</Text>
        {currentPhase === "qr_expired" && <Button label={t("payment.newQr")} onPress={() => void createQr()} />}
      </Card>
      <Card style={styles.details}>
        <Detail label={t("payment.bank")} value={qr.bankCode} />
        <Detail label={t("payment.accountNumber")} value={qr.accountNumber} onCopy={() => void copy(t("payment.accountNumber"), qr.accountNumber)} />
        <Detail label={t("payment.holder")} value={qr.accountHolder} />
        <Detail label={t("payment.amount")} value={Formatter.currency(qr.amount)} onCopy={() => void copy(t("payment.amountCopy"), String(qr.amount))} />
        <Detail label={t("payment.content")} value={qr.transferContent} onCopy={() => void copy(t("payment.content"), qr.transferContent)} />
      </Card>
      <Text style={styles.centerText}>{t("payment.autoUpdate")}</Text>
    </View>}
  </Screen>;
}

function Detail({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  const { t } = useI18n();
  return <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
    <View><Text>{label}</Text><Text style={{ fontWeight: "700" }}>{value}</Text></View>
    {onCopy && <Button label={t("common.copy")} variant="ghost" onPress={onCopy} />}
  </View>;
}

const useStyles = makeStyles(({ colors }) => ({
  body: { gap: spacing.lg },
  center: { alignItems: "center", gap: spacing.lg, paddingTop: spacing.xxl },
  title: { fontSize: 24, fontWeight: "800", color: colors.ink, textAlign: "center" },
  amount: { fontSize: 32, fontWeight: "800", color: colors.ink, textAlign: "center", marginTop: spacing.md },
  qrCard: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
  qrImage: { width: 240, height: 240 },
  centerText: { textAlign: "center", color: colors.ink },
  details: { gap: spacing.md },
}));
