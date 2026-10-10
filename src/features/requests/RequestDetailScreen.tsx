import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { errorMessage, isNotFound } from "../../shared/api";
import { EvidencePhoto, pickPhoto, uploadPhotos } from "../../shared/attachments";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, spacing, useTheme } from "../../shared/theme";
import { AppHeader, BottomSheet, Button, Callout, Card, EmptyState, Field, FooterBar, IconBadge, InfoRow, PhotoSlots, Screen, SectionHeader, StatusBadge, Timeline, useToast } from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { useNotifyRefresh } from "../notifications/NotificationsProvider";
import { fromCheckout, fromSupport, fromTransfer, kindFromId, requestKindMeta, requestStatusTone } from "./requestModel";
import { RequestDetail } from "../../models/request.model";
import { RequestKind } from "../../enums/request.enum";
import { RequestService } from "../../services/request.service";

export function RequestDetailScreen() {
  const params = useLocalSearchParams<{ id: string; kind?: string }>();
  const id = String(params.id);
  const kind = (params.kind as RequestKind | undefined) ?? kindFromId(id);
  const { notify } = useToast();
  const { t, l } = useI18n();
  const { tones, colors } = useTheme();
  const styles = useStyles();
  const { request: client } = useAuth();
  const api = useMemo(() => new RequestService(client), [client]);
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [photos, setPhotos] = useState<EvidencePhoto[]>([]);
  const [confirming, setConfirming] = useState<"done" | "not_done" | null>(null);

  const load = useCallback(() => {
    const fetchDetail =
      kind === "roomTransfer" ? api.transfer(id).then(fromTransfer) : kind === "roomCheckout" ? api.checkout(id).then(fromCheckout) : kind === "supportMaintenance" ? api.support(id).then(fromSupport) : Promise.resolve(null);
    return fetchDetail
      .then((detail) => {
        setRequest(detail);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (isNotFound(error)) setRequest(null);
        else setLoadError(errorMessage(error));
      })
      .finally(() => setLoading(false));
  }, [api, id, kind]);

  // Tải lại khi quay về (vd. sau khi thanh toán hoá đơn tất toán).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Thông báo mới về đúng yêu cầu này → tải lại chi tiết.
  useNotifyRefresh([`/student/requests?kind=${kind}&id=${id}`], load);

  const confirm = async (result: "done" | "not_done") => {
    setConfirming(result);
    try {
      const attachmentIds = result === "not_done" ? (await uploadPhotos(client, photos)).map((photo) => photo.id) : undefined;
      setRequest(fromSupport(await api.confirmSupport(id, { result, note: result === "not_done" ? reason.trim() : undefined, attachmentIds })));
      setFeedbackOpen(false);
      setReason("");
      setPhotos([]);
      notify(result === "done" ? t("requests.confirmedDone") : t("requests.feedbackSent"), result === "done" ? "success" : "info");
    } catch (error) {
      notify(errorMessage(error), "danger");
    } finally {
      setConfirming(null);
    }
  };

  const addPhoto = async () => {
    const uri = await pickPhoto();
    if (uri === "permission") return notify(t("checkIn.photoPermission"), "warning");
    if (uri === "too_large") return notify(t("checkIn.photoTooLarge"), "warning");
    if (uri) setPhotos((current) => [...current, { uri }]);
  };

  if (loading || !request)
    return (
      <Screen header={<AppHeader title={t("requests.detailTitle")} subtitle={id} />}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : (
          <EmptyState
            icon={loadError ? "cloud-offline-outline" : "search-outline"}
            title={t("common.notFound")}
            description={loadError ?? undefined}
            action={loadError ? <Button label={t("common.retry")} size="md" variant="secondary" onPress={load} /> : undefined}
          />
        )}
      </Screen>
    );

  const meta = requestKindMeta[request.kind];
  const awaitingConfirm = request.action === "confirmRepair";
  const settlement = request.settlement;

  const footer = awaitingConfirm ? (
    <FooterBar>
      <Button label={t("requests.notDone")} variant="ghost" disabled={!!confirming} onPress={() => setFeedbackOpen(true)} style={{ flex: 1 }} />
      <Button label={t("requests.isDone")} icon="checkmark" loading={confirming === "done"} onPress={() => confirm("done")} style={{ flex: 1 }} />
    </FooterBar>
  ) : request.action === "pay" && settlement?.billId ? (
    <FooterBar>
      <Button
        label={`${t("requests.payNow")} · ${Formatter.currency(settlement.total)}`}
        icon="qr-code-outline"
        onPress={() =>
          router.push({
            pathname: "/debts/pay/[id]",
            params: { id: settlement.billId!, billId: settlement.billId!, amount: String(settlement.total), title: `${t(`requests.kind.${request.kind}`)} · ${request.id}` },
          })
        }
        style={{ flex: 1 }}
      />
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
          <IconBadge icon={meta.icon} tone={meta.tone} size={52} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.kind, { color: tones[meta.tone].fg }]}>{t(`requests.kind.${request.kind}`)}</Text>
            <Text style={styles.title}>{l(request.title)}</Text>
          </View>
        </View>
        {request.summary && <Text style={styles.body}>{l(request.summary)}</Text>}
        <View style={styles.statusRow}>
          <StatusBadge label={t(`requests.status.${request.status}`)} tone={requestStatusTone[request.status]} />
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
            {request.rejectReason}
          </Callout>
        </View>
      )}

      {settlement && (
        <>
          <SectionHeader title={settlement.refund ? t("requests.refund") : t("requests.settlement")} />
          <Card style={{ paddingVertical: spacing.xs }}>
            {settlement.lines.map((line, index) => (
              <InfoRow key={`${l(line.label)}-${index}`} label={l(line.label)} value={`${line.amount < 0 ? "−" : ""}${Formatter.currency(Math.abs(line.amount))}`} />
            ))}
            <View style={styles.totalRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.totalLabel}>{settlement.refund ? t("requests.refund") : settlement.billId ? t("debts.toPay") : t("requests.paid")}</Text>
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
                  <Text style={styles.time}>{request.refundAccount ? t("requests.refundAccount", request.refundAccount) : t("requests.refundNoAccount")}</Text>
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
            state: item.state,
          }))}
        />
      </Card>

      <SectionHeader title={t("requests.information")} />
      <Card style={{ paddingVertical: spacing.xs }}>
        <InfoRow label={t("requests.code")} value={request.id} />
        {request.details.map((detail, index) => (
          <InfoRow key={`${l(detail.label)}-${index}`} label={l(detail.label)} value={typeof detail.value === "string" ? detail.value : l(detail.value)} divider={index < request.details.length - 1} />
        ))}
      </Card>

      <BottomSheet
        visible={feedbackOpen}
        onClose={() => !confirming && setFeedbackOpen(false)}
        title={t("requests.notDoneTitle")}
        subtitle={t("requests.notDoneSubtitle")}
        footer={<Button label={t("requests.sendFeedback")} icon="send" disabled={!reason.trim()} loading={confirming === "not_done"} onPress={() => confirm("not_done")} />}
      >
        <Field multiline value={reason} onChangeText={setReason} placeholder={t("requests.notDonePlaceholder")} label={t("requests.reason")} />
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.photoTitle}>{t("requestForm.evidence")}</Text>
          <PhotoSlots count={photos.length} uris={photos.map((photo) => photo.uri)} onAdd={addPhoto} onRemove={(index) => setPhotos((current) => current.filter((_, i) => i !== index))} />
        </View>
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
  photoTitle: { ...font.label, fontSize: 15 },
}));
