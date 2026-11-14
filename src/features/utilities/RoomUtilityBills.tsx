import { roomUtilityError } from "../../shared/i18n/room-utility-messages";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../auth/AuthProvider";
import { RoomUtilityService } from "../../services/room-utility.service";
import type {
  RoomUtilityAccount,
  RoomUtilityBill,
  RoomUtilityHandover,
  RoomUtilityPolicy,
} from "../../models/room-utility.model";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { Button, Card, InfoRow, BottomSheet, useToast } from "../../shared/ui";
import { useTheme, spacing } from "../../shared/theme";
import { Formatter } from "../../shared/format";
import { errorMessage } from "../../shared/api";
import { RoomUtilityBillCard } from "./RoomUtilityBillCard";
import { RoomUtilityPolicySection } from "./RoomUtilityPolicySection";

/**
 * Điện nước phòng của sinh viên: người đại diện và bàn giao, quy định đang áp dụng, các hóa đơn theo
 * giai đoạn (dòng thời gian, báo cáo tách trách nhiệm, thanh toán), lỗi vi phạm của bạn.
 */
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
  const [policy, setPolicy] = useState<RoomUtilityPolicy | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b, p] = await Promise.all([api.mine(), api.bills(), api.policy()]);
      setAccount(a);
      setRows(b);
      setPolicy(p);
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
  const run = async (
    fn: () => Promise<unknown>,
    done: string = t("roomUtility.saved"),
  ) => {
    setBusy(true);
    try {
      await fn();
      await load();
      notify(done, "success");
      return true;
    } catch (e) {
      notify(roomUtilityError(errorMessage(e), t), "danger");
      return false;
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
        {policy && <RoomUtilityPolicySection policy={policy} />}
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
          <RoomUtilityBillCard
            key={b.id}
            bill={b}
            busy={busy}
            onReport={(accusedId, content) =>
              run(
                () => api.report(b.id, accusedId, content),
                t("roomUtility.reportSent"),
              )
            }
            onWithdraw={(reportId) =>
              void run(
                () => api.withdrawReport(reportId),
                t("roomUtility.reportWithdrawn"),
              )
            }
            onBeforePay={() => setOpen(false)}
          />
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
