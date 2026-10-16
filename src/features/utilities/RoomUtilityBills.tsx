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
  RoomUtilityViolation,
} from "../../models/room-utility.model";
import { useI18n } from "../../shared/i18n/I18nProvider";
import {
  Button,
  Callout,
  Card,
  Field,
  InfoRow,
  BottomSheet,
  useToast,
} from "../../shared/ui";
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
  const [violations, setViolations] = useState<RoomUtilityViolation[]>([]);
  // Hóa đơn đang mở ô "báo trưởng phòng chưa đóng" và nội dung báo cáo.
  const [reporting, setReporting] = useState<string | null>(null);
  const [reportText, setReportText] = useState("");
  // Mốc thời gian lúc tải hóa đơn, dùng tính số giờ còn lại tới hạn.
  const [now, setNow] = useState(() => Date.now());
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b, v] = await Promise.all([
        api.mine(),
        api.bills(),
        api.violations(),
      ]);
      setAccount(a);
      setRows(b);
      setViolations(v);
      setNow(Date.now());
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
  /** Nội dung cảnh báo của hóa đơn chưa đóng theo mức hiện tại. */
  const warnings = (b: RoomUtilityBill): string[] => {
    const lines: string[] = [];
    const amount = Formatter.currency(b.amount);
    if (b.status === "PENDING" && b.warningLevel >= 1) {
      const hours = Math.max(
        1,
        Math.round((new Date(b.dueAt).getTime() - now) / 3_600_000),
      );
      lines.push(
        t("roomUtility.banner.level1", {
          hours,
          amount,
          due: Formatter.dateTime(b.dueAt),
        }),
      );
    } else if (b.status === "OVERDUE" && !b.violationRecordedAt) {
      lines.push(
        b.warningLevel >= 2
          ? t("roomUtility.banner.level2", {
              days: b.overdueDays,
              deadline: Formatter.dateTime(b.violationAt),
            })
          : t("roomUtility.banner.overdue", { days: b.overdueDays }),
      );
    }
    if (b.violationRecordedAt)
      lines.push(
        t(
          b.violationTarget === "REPRESENTATIVE"
            ? "roomUtility.banner.violationRepresentative"
            : "roomUtility.banner.violationRoom",
          { amount },
        ),
      );
    if (b.warningLevel >= 3) lines.push(t("roomUtility.banner.level3"));
    return lines;
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
            {b.paymentMethod && (
              <InfoRow
                label={t("roomUtility.paymentMethod")}
                value={
                  t(`roomUtility.methods.${b.paymentMethod}`) +
                  (b.cashReceiptNo
                    ? " · " + t("roomUtility.receipt", { no: b.cashReceiptNo })
                    : "")
                }
              />
            )}
            {b.status !== "PAID" && warnings(b).length > 0 && (
              <View style={{ marginTop: spacing.sm }}>
                <Callout
                  tone={b.status === "OVERDUE" ? "danger" : "warning"}
                  icon={b.warningLevel >= 3 ? "shield-outline" : "warning-outline"}
                  title={t(`roomUtility.levels.${b.warningLevel}`)}
                >
                  {warnings(b).join("\n")}
                </Callout>
              </View>
            )}
            {b.reported && (
              <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
                {t("roomUtility.reported")}
              </Text>
            )}
            {b.canReport && reporting !== b.id && (
              <Button
                label={t("roomUtility.reportAction")}
                variant="secondary"
                size="md"
                onPress={() => {
                  setReporting(b.id);
                  setReportText("");
                }}
                style={{ marginTop: spacing.sm }}
              />
            )}
            {b.canReport && reporting === b.id && (
              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                <Text style={{ color: colors.ink, fontWeight: "600" }}>
                  {t("roomUtility.reportTitle")}
                </Text>
                <Text style={{ color: colors.muted }}>
                  {t("roomUtility.reportHint", {
                    deadline: Formatter.dateTime(b.violationAt),
                  })}
                </Text>
                <Field
                  multiline
                  value={reportText}
                  onChangeText={setReportText}
                  maxLength={1000}
                  placeholder={t("roomUtility.reportPlaceholder")}
                />
                <Button
                  label={t("roomUtility.reportSubmit")}
                  loading={busy}
                  disabled={reportText.trim().length < 10}
                  onPress={() =>
                    void run(
                      () => api.report(b.id, reportText.trim()),
                      t("roomUtility.reportSent"),
                    ).then((ok) => ok && setReporting(null))
                  }
                />
                <Button
                  label={t("common.cancel")}
                  variant="ghost"
                  disabled={busy}
                  onPress={() => setReporting(null)}
                />
              </View>
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
        {violations.length > 0 && (
          <Card style={{ padding: spacing.md, marginBottom: spacing.md }}>
            <Text style={{ color: colors.danger, fontWeight: "700" }}>
              {t("roomUtility.myViolations")} ({violations.length})
            </Text>
            {violations.map((v) => (
              <View key={v.id} style={{ marginTop: spacing.sm }}>
                <Text style={{ color: colors.ink, fontWeight: "600" }}>
                  {t(`roomUtility.reasons.${v.reason}`)}
                </Text>
                <Text style={{ color: colors.muted }}>
                  {v.roomCode} · {Formatter.currency(v.amount)} ·{" "}
                  {t("roomUtility.overdueDaysValue", { count: v.overdueDays })} ·{" "}
                  {Formatter.dateTime(v.createdAt)}
                </Text>
              </View>
            ))}
          </Card>
        )}
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
