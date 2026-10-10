import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { errorMessage } from "../../shared/api";
import { Formatter } from "../../shared/format";
import { makeStyles, spacing, useTheme } from "../../shared/theme";
import { useI18n } from "../../shared/i18n/I18nProvider";
import {
  AppHeader,
  Button,
  Card,
  CircleButton,
  Screen,
  useToast,
} from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { useRealtime } from "../realtime/RealtimeProvider";
import { RegistrationService } from "../../services/registration.service";
import type { PaymentQr } from "../../models/registration-payment.model";
import type { Registration } from "../../models/registration.model";
import { bedLabel } from "../registration/components/BedMap";
import { BankAppPicker } from "./BankAppPicker";
import {
  PERIOD_MONTHS,
  primaryAudience,
} from "../registration/registrationHelpers";
import { PaymentSuccessView, type PaymentSuccessRow } from "./PaymentSuccessView";

export function RegistrationPaymentScreen({
  registrationId,
}: {
  registrationId: string;
}) {
  const { request, user } = useAuth();
  const service = useMemo(() => new RegistrationService(request), [request]);
  const { notify } = useToast();
  const { t, lang } = useI18n();
  const { connected, lastRegistrationPayment } = useRealtime();
  const styles = useStyles();
  const [qr, setQr] = useState<PaymentQr | null>(null);
  const [phase, setPhase] = useState<
    "loading" | "waiting" | "qr_expired" | "paid" | "hold_expired"
  >("loading");
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [checkInStart, setCheckInStart] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(0);

  const checkStatus = useCallback(async () => {
    try {
      const status = await service.paymentStatus(registrationId);
      setOffset(new Date(status.serverTime).getTime() - Date.now());
      if (status.registrationStatus === "APPROVED") setPhase("paid");
      else if (
        ["EXPIRED", "CANCELLED", "REJECTED"].includes(status.registrationStatus)
      )
        setPhase("hold_expired");
      else if (
        !status.qrExpiresAt ||
        new Date(status.qrExpiresAt).getTime() <=
          new Date(status.serverTime).getTime()
      )
        setPhase("qr_expired");
    } catch (error) {
      notify(errorMessage(error), "danger");
    }
  }, [service, registrationId, notify]);

  const createQr = useCallback(async () => {
    setPhase("loading");
    try {
      const next = await service.initPayment(registrationId);
      setQr(next);
      setOffset(new Date(next.serverTime).getTime() - Date.now());
      setPhase("waiting");
    } catch (error) {
      notify(errorMessage(error), "danger");
      await checkStatus();
    }
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
  // Socket báo kết quả tức thì; vẫn hỏi lại trạng thái trong lúc chờ vì socket bị ngắt khi
  // sinh viên chuyển sang app ngân hàng để trả tiền, sự kiện gửi lúc đó sẽ bị lỡ.
  useEffect(() => {
    if (phase !== "waiting" && phase !== "qr_expired") return;
    const timer = setInterval(() => void checkStatus(), connected ? 4000 : 2000);
    return () => clearInterval(timer);
  }, [connected, phase, checkStatus]);

  // Thông tin đơn (sinh viên, phòng, thời hạn) hiển thị cạnh mã QR; lỗi tải không chặn thanh toán.
  useEffect(() => {
    let active = true;
    service
      .mine()
      .then((value) => active && setRegistration(value))
      .catch(() => undefined);
    service
      .currentCampaign()
      .then((value) => {
        const start = value.campaign
          ? primaryAudience(value.campaign)?.checkInStart
          : null;
        if (active && start) setCheckInStart(start);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [service]);

  const stayStart = registration
    ? new Date(
        checkInStart ?? registration.paymentDeadline ?? registration.createdAt,
      )
    : null;
  const stayEnd =
    registration && stayStart
      ? new Date(
          stayStart.getFullYear(),
          stayStart.getMonth() + PERIOD_MONTHS[registration.pricingPeriod],
          stayStart.getDate(),
        )
      : null;

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    notify(t("payment.copiedValue", { label }));
  };
  const remain = qr
    ? Math.max(0, new Date(qr.qrExpiresAt).getTime() - now - offset)
    : 0;
  const hold = qr
    ? Math.max(0, new Date(qr.paymentDeadline).getTime() - now - offset)
    : 0;
  const eventPhase =
    lastRegistrationPayment?.registrationId === registrationId
      ? lastRegistrationPayment.status === "PAID"
        ? "paid"
        : "hold_expired"
      : null;
  const currentPhase =
    eventPhase ??
    (phase === "waiting" && qr && now > 0
      ? hold === 0
        ? "hold_expired"
        : remain === 0
          ? "qr_expired"
          : "waiting"
      : phase);
  const clock = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const pad = (value: number) => value.toString().padStart(2, "0");
    const minutes = `${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
    return total >= 3600
      ? `${pad(Math.floor(total / 3600))}:${minutes}`
      : minutes;
  };
  const [paidRegistration, setPaidRegistration] = useState<Registration | null>(null);
  useEffect(() => {
    if (currentPhase !== "paid" || paidRegistration) return;
    service
      .mine()
      .then(setPaidRegistration)
      .catch((error: unknown) => notify(errorMessage(error), "danger"));
  }, [currentPhase, paidRegistration, service, notify]);
  const paidRows: PaymentSuccessRow[] = [
    ...(paidRegistration
      ? [
          { label: t("common.room"), value: paidRegistration.roomCode },
          { label: t("common.bed"), value: bedLabel(paidRegistration.bedCode) },
        ]
      : []),
    ...(qr
      ? [
          { label: t("payment.amount"), value: Formatter.currency(qr.amount) },
          { label: t("payment.paymentCode"), value: qr.paymentCode },
        ]
      : []),
  ];
  const close = (
    <CircleButton
      icon="close"
      label={t("common.close")}
      onPress={() => router.back()}
    />
  );

  return (
    <Screen
      edges={["top", "bottom"]}
      header={
        <AppHeader
          title={t("payment.registrationTitle")}
          hideBack
          right={close}
        />
      }
    >
      {currentPhase === "loading" && (
        <ActivityIndicator style={{ marginTop: spacing.xl }} />
      )}
      {currentPhase === "paid" && (
        <PaymentSuccessView
          title={t("payment.success")}
          hint={t("payment.registrationPaid")}
          rows={paidRows}
          actionLabel={t("payment.goCheckIn")}
          closeLabel={t("common.close")}
          onAction={() => router.replace("/check-in")}
          onClose={() => router.back()}
        />
      )}
      {currentPhase === "hold_expired" && (
        <View style={styles.center}>
          <Text style={styles.title}>{t("payment.holdExpired")}</Text>
          <Button
            label={t("payment.registerAgain")}
            onPress={() => router.replace("/register-dorm")}
          />
        </View>
      )}
      {!qr && currentPhase === "qr_expired" && (
        <View style={styles.center}>
          <Text>{t("payment.expired")}</Text>
          <Button label={t("payment.newQr")} onPress={() => void createQr()} />
        </View>
      )}
      {qr && (currentPhase === "waiting" || currentPhase === "qr_expired") && (
        <View style={styles.body}>
          <Text style={styles.amount}>{Formatter.currency(qr.amount)}</Text>
          <Card style={styles.qrCard}>
            <Image
              source={{ uri: qr.qrImageUrl }}
              style={[
                styles.qrImage,
                currentPhase === "qr_expired" && { opacity: 0.3 },
              ]}
              resizeMode="contain"
            />
            <Text style={styles.centerText}>
              {currentPhase === "waiting"
                ? t("payment.qrRemaining", { time: clock(remain) })
                : t("payment.expired")}
            </Text>
            <Text style={styles.centerText}>
              {t("payment.holdUntil", {
                date: new Intl.DateTimeFormat(
                  lang === "en" ? "en-GB" : "vi-VN",
                  {
                    timeZone: "Asia/Ho_Chi_Minh",
                    dateStyle: "short",
                    timeStyle: "short",
                  },
                ).format(new Date(qr.paymentDeadline)),
                time: clock(hold),
              })}
            </Text>
            {currentPhase === "qr_expired" && (
              <Button
                label={t("payment.newQr")}
                onPress={() => void createQr()}
              />
            )}
          </Card>
          <BankAppPicker qr={qr} />
          {registration && stayStart && stayEnd && (
            <Card style={styles.details}>
              <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                  <Detail
                    label={t("payment.student")}
                    value={user?.fullName ?? ""}
                  />
                </View>
                <View style={styles.pairItem}>
                  <Detail
                    label={t("payment.studentCode")}
                    value={user?.username ?? ""}
                  />
                </View>
              </View>
              <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                  <Detail
                    label={t("payment.registeredRoom")}
                    value={`${registration.roomCode} · ${bedLabel(registration.bedCode)}`}
                  />
                </View>
                <View style={styles.pairItem}>
                  <Detail
                    label={t("payment.stayDuration")}
                    value={t(
                      registration.pricingPeriod === "1year"
                        ? "registration.oneYear"
                        : "registration.sixMonths",
                    )}
                  />
                </View>
              </View>
              <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                  <Detail
                    label={t("payment.startDate")}
                    value={Formatter.date(stayStart)}
                  />
                </View>
                <View style={styles.pairItem}>
                  <Detail
                    label={t("payment.expectedEnd")}
                    value={Formatter.date(stayEnd)}
                  />
                </View>
              </View>
            </Card>
          )}
          <Card style={styles.details}>
            <Detail label={t("payment.bank")} value={qr.bankCode} />
            <Detail
              label={t("payment.accountNumber")}
              value={qr.accountNumber}
              onCopy={() =>
                void copy(t("payment.accountNumber"), qr.accountNumber)
              }
            />
            <Detail label={t("payment.holder")} value={qr.accountHolder} />
            <Detail
              label={t("payment.amount")}
              value={Formatter.currency(qr.amount)}
              onCopy={() =>
                void copy(t("payment.amountCopy"), String(qr.amount))
              }
            />
            <Detail
              label={t("payment.content")}
              value={qr.transferContent}
              onCopy={() => void copy(t("payment.content"), qr.transferContent)}
            />
          </Card>
          <Text style={styles.centerText}>{t("payment.autoUpdate")}</Text>
        </View>
      )}
    </Screen>
  );
}

function Detail({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text>{label}</Text>
        <Text style={{ fontWeight: "700" }}>{value}</Text>
      </View>
      {onCopy && (
        <Pressable
          onPress={onCopy}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("common.copy")}
        >
          <Ionicons name="copy-outline" size={22} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  body: { gap: spacing.lg },
  center: { alignItems: "center", gap: spacing.lg, paddingTop: spacing.xxl },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
  },
  amount: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
    marginTop: spacing.md,
  },
  qrCard: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  // Ảnh VietQR mẫu compact (khung SePay/Napas/ngân hàng) có tỉ lệ 540×714.
  qrImage: { width: "100%", maxWidth: 320, aspectRatio: 540 / 714 },
  centerText: { textAlign: "center", color: colors.ink },
  details: { gap: spacing.md },
  pairRow: { flexDirection: "row", gap: spacing.md },
  pairItem: { flex: 1 },
}));
