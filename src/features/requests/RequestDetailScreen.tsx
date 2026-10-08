import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, spacing, useTheme } from "../../shared/theme";
import { AppHeader, BottomSheet, Button, Callout, Card, EmptyState, Field, FooterBar, IconBadge, InfoRow, Screen, SectionHeader, StatusBadge, Timeline, useToast } from "../../shared/ui";
import { ProfileRepository } from "../profile/profile.mock";
import { requestKindMeta, RequestRepository, requestStatusTone } from "./requests.mock";

export function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notify } = useToast();
  const { t, l } = useI18n();
  const { tones, colors } = useTheme();
  const styles = useStyles();
  const request = RequestRepository.find(String(id));
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  if (!request)
    return (
      <Screen header={<AppHeader title={t("requests.detailTitle")} />}>
        <EmptyState icon="search-outline" title={t("common.notFound")} />
      </Screen>
    );

  const kind = requestKindMeta[request.kind];
  const awaitingConfirm = request.action === "confirmRepair" && !confirmed;
  const settlement = request.settlement;
  const bank = ProfileRepository.get().bank;

  const footer = awaitingConfirm ? (
    <FooterBar>
      <Button label={t("requests.notDone")} variant="ghost" onPress={() => setFeedbackOpen(true)} style={{ flex: 1 }} />
      <Button
        label={t("requests.isDone")}
        icon="checkmark"
        onPress={() => {
          setConfirmed(true);
          notify(t("requests.confirmedDone"));
        }}
        style={{ flex: 1 }}
      />
    </FooterBar>
  ) : request.action === "pay" && settlement?.billId ? (
    <FooterBar>
      <Button label={`${t("requests.payNow")} · ${Formatter.currency(settlement.total)}`} icon="qr-code-outline" onPress={() => router.push(`/debts/pay/${settlement.billId}`)} style={{ flex: 1 }} />
    </FooterBar>
  ) : request.action === "checkIn" ? (
    <FooterBar>
      <Button label={t("requests.goCheckIn")} icon="key-outline" onPress={() => router.push("/check-in")} style={{ flex: 1 }} />
    </FooterBar>
  ) : request.action === "resubmit" ? (
    <FooterBar>
      <Button label={t("requests.resubmit")} icon="refresh" onPress={() => router.replace(`/request/create/${request.kind}`)} style={{ flex: 1 }} />
    </FooterBar>
  ) : undefined;

  return (
    <Screen header={<AppHeader title={t("requests.detailTitle")} subtitle={request.id} />} footer={footer}>
      <Card style={{ gap: spacing.md }}>
        <View style={styles.summaryHead}>
          <IconBadge icon={kind.icon} tone={kind.tone} size={52} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.kind, { color: tones[kind.tone].fg }]}>{t(`requests.kind.${request.kind}`)}</Text>
            <Text style={styles.title}>{l(request.title)}</Text>
          </View>
        </View>
        <Text style={styles.body}>{l(request.summary)}</Text>
        <View style={styles.statusRow}>
          <StatusBadge label={confirmed ? t("requests.status.completed") : t(`requests.status.${request.status}`)} tone={confirmed ? "success" : requestStatusTone[request.status]} />
          <Text style={styles.time}>{t("requests.submittedAt", { time: Formatter.dateTime(request.submittedAt) })}</Text>
        </View>
      </Card>

      {awaitingConfirm && (
        <View style={{ marginTop: spacing.lg }}>
          <Callout tone="primary" icon="hand-left" title={t("requests.confirmTitle")}>
            {t("requests.confirmBody")}
          </Callout>
        </View>
      )}
      {request.notice && (
        <View style={{ marginTop: spacing.lg }}>
          <Callout tone={request.notice.tone}>{l(request.notice.text)}</Callout>
        </View>
      )}
      {request.rejectReason && (
        <View style={{ marginTop: spacing.lg }}>
          <Callout tone="danger" icon="close-circle" title={t("requests.rejectReason")}>
            {l(request.rejectReason)}
          </Callout>
        </View>
      )}

      {settlement && (
        <>
          <SectionHeader title={settlement.refund ? t("requests.refund") : t("requests.settlement")} />
          <Card style={{ paddingVertical: spacing.xs }}>
            {settlement.lines.map((line) => (
              <InfoRow key={l(line.label)} label={l(line.label)} value={Formatter.currency(line.amount)} />
            ))}
            <View style={styles.totalRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.totalLabel}>{settlement.refund ? t("requests.refund") : t("debts.toPay")}</Text>
                {settlement.dueAt && <Text style={styles.time}>{t("requests.settlementDue", { date: Formatter.date(settlement.dueAt) })}</Text>}
              </View>
              <Text style={[styles.total, { color: settlement.refund ? colors.success : colors.primary }]}>
                {settlement.refund ? "+" : ""}
                {Formatter.currency(settlement.total)}
              </Text>
            </View>
            {settlement.refund && (
              <View style={styles.refund}>
                <StatusBadge label={settlement.refunded ? t("requests.refundDone") : t("requests.refundPending")} tone={settlement.refunded ? "success" : "warning"} />
                <View style={styles.refundAccount}>
                  <Ionicons name="card-outline" size={14} color={colors.muted} />
                  <Text style={styles.time}>{t("requests.refundAccount", { bank: bank.name, account: bank.accountNumber })}</Text>
                </View>
              </View>
            )}
          </Card>
        </>
      )}

      <SectionHeader title={t("requests.progress")} />
      <Card>
        <Timeline
          items={request.timeline.map((item) => ({
            title: l(item.title),
            description: item.description ? l(item.description) : undefined,
            time: item.time,
            state: confirmed && item.state !== "failed" ? "done" : item.state,
          }))}
        />
      </Card>

      <SectionHeader title={t("requests.information")} />
      <Card style={{ paddingVertical: spacing.xs }}>
        <InfoRow label={t("requests.code")} value={request.id} />
        {request.details.map((detail, index) => (
          <InfoRow key={l(detail.label)} label={l(detail.label)} value={typeof detail.value === "string" ? detail.value : l(detail.value)} divider={index < request.details.length - 1} />
        ))}
      </Card>

      <BottomSheet
        visible={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title={t("requests.notDoneTitle")}
        subtitle={t("requests.notDoneSubtitle")}
        footer={
          <Button
            label={t("requests.sendFeedback")}
            icon="send"
            disabled={!reason.trim()}
            onPress={() => {
              setFeedbackOpen(false);
              setConfirmed(true);
              notify(t("requests.feedbackSent"), "info");
            }}
          />
        }
      >
        <Field multiline value={reason} onChangeText={setReason} placeholder={t("requests.notDonePlaceholder")} label={t("requests.reason")} />
      </BottomSheet>
    </Screen>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  summaryHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  kind: { ...font.caption, fontWeight: "700" },
  title: { ...font.title, fontSize: 20, lineHeight: 26 },
  body: { ...font.body },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: spacing.sm },
  time: { ...font.caption },
  totalRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
  totalLabel: { ...font.label, fontSize: 15 },
  total: { fontSize: 22, fontWeight: "800" },
  refund: { gap: spacing.sm, paddingBottom: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.md },
  refundAccount: { flexDirection: "row", alignItems: "center", gap: 6 },
}));
