import { roomUtilityError } from "../../shared/i18n/room-utility-messages";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../auth/AuthProvider";
import { RoomUtilityService } from "../../services/room-utility.service";
import type {
  RoomUtilityAccount,
  RoomUtilityBill,
  RoomUtilityHandover,
} from "../../models/room-utility.model";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { Button, Card, InfoRow, BottomSheet, useToast } from "../../shared/ui";
import { useTheme, spacing } from "../../shared/theme";
import { Formatter } from "../../shared/format";
import { errorMessage } from "../../shared/api";
export function RoomUtilityBills() {
  const { request, user } = useAuth();
  const api = useMemo(() => new RoomUtilityService(request), [request]);
  const { t } = useI18n();
  const { notify } = useToast();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<RoomUtilityAccount | null>(null);
  const [rows, setRows] = useState<RoomUtilityBill[]>([]);
  const [history, setHistory] = useState<RoomUtilityHandover[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([api.mine(), api.bills()]);
      setAccount(a);
      setRows(b);
      setHistory(a ? await api.history(a.roomId) : []);
    } catch (e) {
      notify(roomUtilityError(errorMessage(e), t), "danger");
    } finally {
      setLoading(false);
    }
  }, [api, notify, t]);
  useFocusEffect(
    useCallback(() => {
      if (open) void load();
    }, [open, load]),
  );
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await load();
      notify(t("roomUtility.saved"), "success");
    } catch (e) {
      notify(roomUtilityError(errorMessage(e), t), "danger");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        label={t("roomUtility.title")}
        variant="secondary"
        onPress={() => setOpen(true)}
        style={{ marginBottom: spacing.md }}
      />
      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={t("roomUtility.title")}
      >
        {loading && <ActivityIndicator color={colors.primary} />}
        {account && (
          <Card style={{ marginBottom: spacing.md, padding: spacing.md }}>
            <InfoRow
              label={t("roomUtility.representative")}
              value={account.representativeName || "—"}
            />
            {account.representativeId === user?.id &&
              account.members
                .filter((m) => m.id !== user.id)
                .map((m) => (
                  <Button
                    key={m.id}
                    label={t("roomUtility.propose") + ": " + m.name}
                    variant="secondary"
                    size="md"
                    loading={busy}
                    onPress={() =>
                      void run(() => api.propose(account.roomId, m.id))
                    }
                    style={{ marginTop: spacing.sm }}
                  />
                ))}
            {account.representativeId === user?.id &&
              account.proposedRepresentativeId && (
                <Button
                  label={t("roomUtility.cancelHandover")}
                  variant="secondary"
                  disabled={busy}
                  onPress={() => void run(() => api.cancel(account.roomId))}
                />
              )}
            {account.proposedRepresentativeId && (
              <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
                {t("roomUtility.pendingHandover", {
                  name:
                    account.members.find(
                      (m) => m.id === account.proposedRepresentativeId,
                    )?.name || "—",
                })}
              </Text>
            )}
            {account.proposedRepresentativeId === user?.id && (
              <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                <Button
                  label={t("roomUtility.accept")}
                  loading={busy}
                  onPress={() =>
                    void run(() => api.respond(account.roomId, true))
                  }
                />
                <Button
                  label={t("roomUtility.reject")}
                  variant="secondary"
                  disabled={busy}
                  onPress={() =>
                    void run(() => api.respond(account.roomId, false))
                  }
                />
              </View>
            )}
            {history.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={{ color: colors.ink, fontWeight: "600" }}>
                  {t("roomUtility.history")}
                </Text>
                {history.map((h) => (
                  <Text
                    key={h.id}
                    style={{ color: colors.muted, marginTop: spacing.sm }}
                  >
                    {Formatter.dateTime(h.createdAt)} ·{" "}
                    {h.action === "APPOINTED"
                      ? t("roomUtility.action.APPOINTED")
                      : h.action === "ACCEPTED"
                        ? t("roomUtility.action.ACCEPTED")
                        : t("roomUtility.action.DEBT_RESPONSIBILITY_CONFIRMED")}
                  </Text>
                ))}
              </View>
            )}
          </Card>
        )}
        {!loading && rows.length === 0 && (
          <Text style={{ color: colors.muted }}>{t("roomUtility.empty")}</Text>
        )}
        {rows.map((b) => (
          <Card
            key={b.id}
            style={{ padding: spacing.md, marginBottom: spacing.md }}
          >
            <InfoRow label={t("roomUtility.room")} value={b.roomCode} />
            <InfoRow
              label={t("roomUtility.from")}
              value={Formatter.dateTime(b.periodFrom)}
            />
            <InfoRow
              label={t("roomUtility.to")}
              value={Formatter.dateTime(b.periodTo)}
            />
            <InfoRow
              label={t("roomUtility.electricity")}
              value={Formatter.decimal(b.electricityKwh, 3)}
            />
            <InfoRow
              label={t("roomUtility.water")}
              value={Formatter.decimal(b.waterM3, 3)}
            />
            <InfoRow
              label={t("roomUtility.amount")}
              value={Formatter.currency(b.amount)}
              strong
            />
            <InfoRow
              label={t("roomUtility.dueAt")}
              value={Formatter.dateTime(b.dueAt)}
            />
            <InfoRow
              label={t("roomUtility.representative")}
              value={b.representativeName}
            />
            <InfoRow
              label={t("roomUtility.status")}
              value={
                b.status === "PAID"
                  ? t("roomUtility.statuses.PAID")
                  : b.status === "OVERDUE"
                    ? t("roomUtility.statuses.OVERDUE")
                    : t("roomUtility.statuses.PENDING")
              }
            />
            {b.paidAt && (
              <InfoRow
                label={t("roomUtility.paidAt")}
                value={Formatter.dateTime(b.paidAt)}
              />
            )}
            {b.canPay && (
              <Button
                label={t("roomUtility.payment")}
                onPress={() => {
                  setOpen(false);
                  router.push({
                    pathname: "/debts/pay/[id]",
                    params: {
                      id: b.id,
                      billId: b.id,
                      roomUtility: "true",
                      title: t("roomUtility.title") + " " + b.roomCode,
                    },
                  });
                }}
                style={{ marginTop: spacing.sm }}
              />
            )}
          </Card>
        ))}
        <Button
          label={t("roomUtility.refresh")}
          variant="secondary"
          loading={loading}
          onPress={() => void load()}
        />
      </BottomSheet>
    </>
  );
}
