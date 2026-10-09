import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { errorMessage, isNotFound } from "../../shared/api";
import { EvidencePhoto, pickPhoto, uploadPhotos } from "../../shared/attachments";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { Photos } from "../../shared/images";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import {
  AppHeader,
  BottomSheet,
  Button,
  Callout,
  Card,
  Checkbox,
  ChipGroup,
  EmptyState,
  Field,
  FooterBar,
  Glass,
  IconBadge,
  PhotoBackground,
  PhotoSlots,
  ProgressBar,
  Screen,
  StepProgress,
  Touchable,
  useToast,
} from "../../shared/ui";
import { useAuth } from "../auth/AuthProvider";
import { bedLabel } from "../registration/components/BedMap";
import { assetIcon, ISSUE_TYPES } from "./checkInHelpers";
import { CheckInRecord, CheckInSubmitResult, HandoverAsset } from "../../models/check-in.model";
import { CheckInService } from "../../services/check-in.service";
import { IssueType } from "../../enums/check-in.enum";

type Draft = { issueType: IssueType; note: string; photos: EvidencePhoto[] };

export function CheckInScreen() {
  const { notify } = useToast();
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const { request } = useAuth();
  const api = useMemo(() => new CheckInService(request), [request]);
  const steps = [t("checkIn.steps.inspect"), t("checkIn.steps.confirm"), t("checkIn.steps.complete")];
  const [record, setRecord] = useState<CheckInRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<CheckInSubmitResult | null>(null);
  const [savingAsset, setSavingAsset] = useState<string | null>(null);
  const [editing, setEditing] = useState<HandoverAsset | null>(null);
  const [draft, setDraft] = useState<Draft>({ issueType: "damaged", note: "", photos: [] });
  const [savingIssue, setSavingIssue] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    () =>
      api
        .mine()
        .then((value) => {
          setRecord(value);
          setLoadError(null);
        })
        .catch((error: unknown) => {
          if (isNotFound(error)) setRecord(null);
          else setLoadError(errorMessage(error));
        })
        .finally(() => setLoading(false)),
    [api],
  );

  // Tải lại khi quay về (vd. sau khi gửi yêu cầu chuyển phòng, biên bản bị khoá). Không tải lại
  // sau khi đã xác nhận nhận phòng vì biên bản lúc đó không còn ở trạng thái chờ.
  useFocusEffect(
    useCallback(() => {
      if (step !== 2) load();
    }, [load, step]),
  );

  const retry = () => {
    setLoading(true);
    setLoadError(null);
    load();
  };

  const assets = record?.assets ?? [];
  const locked = !!record?.lockedAt;
  const checked = assets.filter((asset) => asset.status !== "unchecked").length;
  const issues = assets.filter((asset) => asset.status === "issue");

  const markOk = async (asset: HandoverAsset) => {
    if (!record || locked || asset.status === "ok") return;
    setSavingAsset(asset.id);
    try {
      setRecord(await api.evaluate(record.id, asset.id, { status: "ok" }));
    } catch (error) {
      notify(errorMessage(error), "danger");
    } finally {
      setSavingAsset(null);
    }
  };

  const openIssue = (asset: HandoverAsset) => {
    if (locked) return;
    setDraft(
      asset.status === "issue"
        ? { issueType: asset.issueType ?? "damaged", note: asset.note ?? "", photos: asset.evidence.map((item) => ({ uri: item.url, id: item.id })) }
        : { issueType: "damaged", note: "", photos: [] },
    );
    setEditing(asset);
  };

  const addPhoto = async () => {
    const uri = await pickPhoto();
    if (uri === "permission") return notify(t("checkIn.photoPermission"), "warning");
    if (uri) setDraft((current) => ({ ...current, photos: [...current.photos, { uri }] }));
  };

  const saveIssue = async () => {
    if (!editing || !record) return;
    if (!draft.note.trim()) return notify(t("checkIn.reportRequired"), "warning");
    setSavingIssue(true);
    try {
      // Upload ảnh mới chọn trước, rồi gửi kèm id minh chứng khi đánh giá tài sản.
      const photos = await uploadPhotos(request, draft.photos);
      setDraft((current) => ({ ...current, photos }));
      const updated = await api.evaluate(record.id, editing.id, {
        status: "issue",
        issueType: draft.issueType,
        note: draft.note.trim(),
        evidenceAttachmentIds: photos.map((photo) => photo.id),
      });
      setRecord(updated);
      setEditing(null);
      notify(t("checkIn.reportSaved"));
    } catch (error) {
      notify(errorMessage(error), "danger");
    } finally {
      setSavingIssue(false);
    }
  };

  const next = async () => {
    if (!record) return;
    if (step === 0) {
      if (checked < assets.length) return notify(t("checkIn.requireAll"), "warning");
      return setStep(1);
    }
    setSubmitting(true);
    try {
      setResult(await api.submit(record.id));
      setStep(2);
      notify(t("checkIn.success"));
    } catch (error) {
      notify(errorMessage(error), "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const header = <AppHeader title={t("checkIn.title")} onBack={() => router.back()} />;

  if (loading && !record)
    return (
      <Screen edges={["top", "bottom"]} header={header}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );

  if (!record)
    return (
      <Screen edges={["top", "bottom"]} header={header}>
        {loadError ? (
          <EmptyState icon="cloud-offline-outline" title={t("common.notFound")} description={loadError} action={<Button label={t("common.retry")} size="md" variant="secondary" icon="refresh" onPress={retry} />} />
        ) : (
          <EmptyState
            icon="key-outline"
            title={t("checkIn.emptyTitle")}
            description={t("checkIn.emptyBody")}
            action={<Button label={t("checkIn.goRegister")} size="md" icon="clipboard-outline" onPress={() => router.replace("/register-dorm")} />}
          />
        )}
      </Screen>
    );

  if (step === 2)
    return (
      <Screen edges={["top", "bottom"]} header={header}>
        <View style={styles.doneIcon}>
          <Ionicons name="key" size={40} color={colors.onPrimary} />
        </View>
        <Text style={styles.doneTitle}>{t("checkIn.welcomeRoom", { room: record.roomCode })}</Text>
        <Text style={styles.doneBody}>{t("checkIn.lockedBody")}</Text>
        {!!result?.maintenanceRequests.length && (
          <Card style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Text style={styles.cardTitle}>{t("checkIn.generated", { count: result.maintenanceRequests.length })}</Text>
            {result.maintenanceRequests.map((item) => (
              <View key={item.id} style={styles.generated}>
                <Ionicons name="construct-outline" size={18} color={colors.primary} />
                <Text style={styles.generatedText}>{item.assetName}</Text>
                <Text style={styles.caption}>{t("checkIn.pending")}</Text>
              </View>
            ))}
          </Card>
        )}
        <View style={{ gap: spacing.md, marginTop: spacing.xxl }}>
          <Button label={t("checkIn.viewResidency")} icon="id-card-outline" onPress={() => router.replace("/residency-record")} />
          {!!result?.maintenanceRequests.length && <Button label={t("checkIn.requestTransfer")} variant="secondary" icon="swap-horizontal" onPress={() => router.replace("/request/create/roomTransfer")} />}
          <Button label={t("common.home")} variant="ghost" onPress={() => router.dismissTo("/")} />
        </View>
      </Screen>
    );

  return (
    <Screen
      header={
        <View>
          <AppHeader title={t("checkIn.title")} subtitle={record.id} onBack={() => (step === 0 ? router.back() : setStep(0))} />
          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
            <StepProgress steps={steps} current={step} />
          </View>
        </View>
      }
      footer={
        <FooterBar>
          {step === 1 && <Button label={t("common.back")} variant="ghost" onPress={() => setStep(0)} style={{ flex: 1 }} />}
          <Button
            label={step === 0 ? t("checkIn.continueCount", { checked, total: assets.length }) : t("checkIn.confirmCheckIn")}
            icon={step === 0 ? "arrow-forward" : "lock-closed"}
            iconPosition={step === 0 ? "right" : "left"}
            disabled={locked || (step === 1 && !agreed)}
            loading={submitting}
            onPress={next}
            style={{ flex: 2 }}
          />
        </FooterBar>
      }
    >
      {step === 0 && (
        <>
          <PhotoBackground source={Photos.bunkBed()} shade style={styles.room}>
            <Glass variant="photo" style={styles.roomGlass}>
              <Text style={styles.roomLabel}>{t("checkIn.receivingRoom")}</Text>
              <Text style={styles.roomName}>{record.roomCode}</Text>
              <Text style={styles.roomMeta}>
                {record.building} · {record.floor} · {t("common.bed")} {bedLabel(record.bedCode)}
                {record.roomType ? ` · ${record.roomType}` : ""}
              </Text>
              {record.expectedCheckInDate && <Text style={styles.roomMeta}>{t("checkIn.expected", { date: Formatter.date(record.expectedCheckInDate) })}</Text>}
            </Glass>
          </PhotoBackground>

          {locked && (
            <View style={{ marginTop: spacing.lg }}>
              <Callout tone="warning" icon="lock-closed" title={t("checkIn.lockedTitle")}>
                {t("checkIn.lockedPending")}
              </Callout>
            </View>
          )}

          <Card style={styles.progressCard}>
            <View style={styles.progressHead}>
              <Text style={styles.cardTitle}>{t("checkIn.assetList")}</Text>
              <Text style={[styles.progressCount, { color: colors.primary }]}>
                {checked}/{assets.length}
              </Text>
            </View>
            <ProgressBar value={assets.length ? checked / assets.length : 1} tone={checked === assets.length ? "success" : "primary"} />
            <Text style={styles.caption}>{assets.length ? t("checkIn.assetHint") : t("checkIn.noAssets")}</Text>
          </Card>

          <View style={{ gap: spacing.md }}>
            {assets.map((asset) => {
              const condition = asset.status;
              const name = asset.name;
              const saving = savingAsset === asset.id;
              return (
                <Card key={asset.id} style={[{ gap: spacing.md }, condition === "issue" && { borderColor: colors.danger, borderWidth: 1.5 }]}>
                  <View style={styles.assetHead}>
                    <IconBadge icon={assetIcon(asset)} tone={condition === "ok" ? "success" : condition === "issue" ? "danger" : "neutral"} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{name}</Text>
                      <Text style={styles.caption}>
                        {asset.category ? `${asset.category} · ` : ""}
                        {t("checkIn.quantity", { count: asset.quantity })}
                      </Text>
                    </View>
                    {saving && <ActivityIndicator color={colors.primary} />}
                  </View>
                  {condition === "issue" && (
                    <Touchable onPress={() => openIssue(asset)} disabled={locked} accessibilityLabel={t("checkIn.editReport", { asset: name })} style={styles.issueNote}>
                      <Ionicons name="alert-circle" size={16} color={colors.danger} />
                      <Text style={[styles.issueText, { color: colors.danger }]} numberOfLines={2}>
                        {asset.issueType ? t(`checkIn.issue.${asset.issueType}`) : ""}: {asset.note}
                      </Text>
                      <Ionicons name="create-outline" size={16} color={colors.danger} />
                    </Touchable>
                  )}
                  <View style={styles.actions}>
                    <Touchable
                      onPress={() => markOk(asset)}
                      disabled={locked || saving}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: condition === "ok", disabled: locked }}
                      accessibilityLabel={t("checkIn.markGood", { asset: name })}
                      style={[styles.choice, condition === "ok" && { backgroundColor: colors.success }]}
                    >
                      <Ionicons name="checkmark-circle" size={18} color={condition === "ok" ? colors.white : colors.success} />
                      <Text style={[styles.choiceText, { color: condition === "ok" ? colors.white : colors.success }]}>{t("checkIn.good")}</Text>
                    </Touchable>
                    <Touchable
                      onPress={() => openIssue(asset)}
                      disabled={locked || saving}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: condition === "issue", disabled: locked }}
                      accessibilityLabel={t("checkIn.markIssue", { asset: name })}
                      style={[styles.choice, condition === "issue" && { backgroundColor: colors.danger }]}
                    >
                      <Ionicons name="warning" size={17} color={condition === "issue" ? colors.white : colors.danger} />
                      <Text style={[styles.choiceText, { color: condition === "issue" ? colors.white : colors.danger }]}>{t("checkIn.hasIssue")}</Text>
                    </Touchable>
                  </View>
                </Card>
              );
            })}
          </View>

          {issues.length > 0 && !locked && (
            <View style={{ marginTop: spacing.lg }}>
              <Callout
                tone="warning"
                icon="swap-horizontal"
                title={t("checkIn.transferTitle")}
                action={
                  <Button
                    label={t("checkIn.transferAction")}
                    size="md"
                    variant="secondary"
                    icon="swap-horizontal"
                    onPress={() => router.push({ pathname: "/request/create/[kind]", params: { kind: "roomTransfer", checkInId: record.id } })}
                  />
                }
              >
                {t("checkIn.transferBody", { count: issues.length })}
              </Callout>
            </View>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.sectionTitle}>{t("checkIn.meters")}</Text>
          <View style={styles.meters}>
            <Card style={styles.meter}>
              <IconBadge icon="flash" tone="primary" size={40} rounded="circle" />
              <Text style={styles.caption}>{t("utilities.electricity")}</Text>
              <Text style={styles.meterValue}>{record.initialElectricity != null ? `${Formatter.decimal(record.initialElectricity)} kWh` : t("checkIn.meterPending")}</Text>
            </Card>
            <Card style={styles.meter}>
              <IconBadge icon="water" tone="info" size={40} rounded="circle" />
              <Text style={styles.caption}>{t("utilities.water")}</Text>
              <Text style={styles.meterValue}>{record.initialWater != null ? `${Formatter.decimal(record.initialWater)} m³` : t("checkIn.meterPending")}</Text>
            </Card>
          </View>
          {!!(record.stayStartDate ?? record.expectedCheckInDate) && (
            <Text style={[styles.caption, { marginTop: spacing.sm }]}>{t("checkIn.meterNote", { date: Formatter.date((record.stayStartDate ?? record.expectedCheckInDate) as string) })}</Text>
          )}

          <Text style={styles.sectionTitle}>{t("checkIn.summary")}</Text>
          <Card style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row" }}>
              <SummaryStat value={assets.length - issues.length} label={t("checkIn.goodAssets")} color={colors.success} />
              <SummaryStat value={issues.length} label={t("checkIn.issueAssets")} color={colors.danger} />
            </View>
            {issues.map((asset) => (
              <View key={asset.id} style={styles.generated}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.generatedText}>{asset.name}</Text>
                <Text style={styles.caption}>{asset.issueType ? t(`checkIn.issue.${asset.issueType}`) : ""}</Text>
              </View>
            ))}
          </Card>
          <View style={{ marginTop: spacing.lg }}>
            <Callout tone="warning" icon="lock-closed" title={t("checkIn.lockTitle")}>
              {t("checkIn.lockBody")}
            </Callout>
          </View>
          <Card style={{ marginTop: spacing.lg }}>
            <Checkbox checked={agreed} onChange={setAgreed} label={t("checkIn.agree")} />
          </Card>
        </>
      )}

      <BottomSheet
        visible={!!editing}
        onClose={() => !savingIssue && setEditing(null)}
        title={t("checkIn.reportTitle")}
        subtitle={editing?.name}
        footer={<Button label={t("checkIn.saveReport")} icon="checkmark" loading={savingIssue} onPress={saveIssue} />}
      >
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.cardTitle}>{t("checkIn.condition")}</Text>
          <ChipGroup<IssueType>
            scroll={false}
            value={draft.issueType}
            onChange={(value) => setDraft((current) => ({ ...current, issueType: value }))}
            options={ISSUE_TYPES.map((key) => ({ value: key, label: t(`checkIn.issue.${key}`) }))}
          />
        </View>
        <Field label={t("requestForm.description")} multiline value={draft.note} onChangeText={(note) => setDraft((current) => ({ ...current, note }))} placeholder={t("checkIn.reportPlaceholder")} />
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.cardTitle}>{t("requestForm.evidence")}</Text>
          <PhotoSlots
            count={draft.photos.length}
            uris={draft.photos.map((photo) => photo.uri)}
            onAdd={addPhoto}
            onRemove={(index) => setDraft((current) => ({ ...current, photos: current.photos.filter((_, i) => i !== index) }))}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}

function SummaryStat({ value, label, color }: { value: number; label: string; color: string }) {
  const styles = useStyles();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color }}>{value}</Text>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  caption: { ...font.caption },
  room: { height: 190, borderRadius: radius.xl, justifyContent: "flex-end", padding: spacing.sm },
  roomGlass: { borderRadius: radius.lg, padding: spacing.lg },
  roomLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },
  roomName: { color: "#FFFFFF", fontSize: 30, fontWeight: "800" },
  roomMeta: { color: "rgba(255,255,255,0.9)", fontSize: 13 },
  progressCard: { marginVertical: spacing.lg, gap: spacing.sm },
  progressHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressCount: { fontSize: 16, fontWeight: "800" },
  cardTitle: { ...font.label, fontSize: 15 },
  assetHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm },
  choice: { flex: 1, height: 44, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.surfaceMuted },
  choiceText: { fontSize: 14, fontWeight: "700" },
  issueNote: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.dangerSoft, borderRadius: radius.sm, padding: spacing.md },
  issueText: { flex: 1, fontSize: 13, fontWeight: "600" },
  sectionTitle: { ...font.heading, marginTop: spacing.lg, marginBottom: spacing.md },
  meters: { flexDirection: "row", gap: spacing.md },
  meter: { flex: 1, gap: 6 },
  meterValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
  generated: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  generatedText: { ...font.label, flex: 1 },
  doneIcon: { alignSelf: "center", width: 92, height: 92, borderRadius: 46, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: spacing.xxl },
  doneTitle: { ...font.title, textAlign: "center", marginTop: spacing.xl },
  doneBody: { ...font.body, textAlign: "center", marginTop: spacing.sm },
}));
