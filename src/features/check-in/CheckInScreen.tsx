import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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
import { AssetReport, CheckInRepository, HandoverAsset, ISSUE_TYPES, IssueType } from "./check-in.mock";

export function CheckInScreen() {
  const { notify } = useToast();
  const { t, l } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const info = CheckInRepository.registration;
  const assets = CheckInRepository.assets;
  const steps = [t("checkIn.steps.inspect"), t("checkIn.steps.confirm"), t("checkIn.steps.complete")];
  const [step, setStep] = useState(0);
  const [reports, setReports] = useState<Record<string, AssetReport>>({});
  const [editing, setEditing] = useState<HandoverAsset | null>(null);
  const [draft, setDraft] = useState<AssetReport>({ condition: "issue" });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const checked = assets.filter((asset) => (reports[asset.id]?.condition ?? "unchecked") !== "unchecked").length;
  const issues = assets.filter((asset) => reports[asset.id]?.condition === "issue");

  const openIssue = (asset: HandoverAsset) => {
    setDraft(reports[asset.id]?.condition === "issue" ? reports[asset.id] : { condition: "issue", issueType: "damaged", photos: 0 });
    setEditing(asset);
  };
  const saveIssue = () => {
    if (!editing) return;
    if (!draft.note?.trim()) return notify(t("checkIn.reportRequired"), "warning");
    setReports((current) => ({ ...current, [editing.id]: draft }));
    setEditing(null);
    notify(t("checkIn.reportSaved"));
  };
  const next = () => {
    if (step === 0) {
      if (checked < assets.length) return notify(t("checkIn.requireAll"), "warning");
      return setStep(1);
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep(2);
      notify(t("checkIn.success"));
    }, 900);
  };

  if (step === 2)
    return (
      <Screen edges={["top", "bottom"]} header={<AppHeader title={t("checkIn.title")} onBack={() => router.back()} />}>
        <View style={styles.doneIcon}>
          <Ionicons name="key" size={40} color={colors.onPrimary} />
        </View>
        <Text style={styles.doneTitle}>{t("checkIn.welcomeRoom", { room: info.room })}</Text>
        <Text style={styles.doneBody}>{t("checkIn.lockedBody")}</Text>
        {issues.length > 0 && (
          <Card style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Text style={styles.cardTitle}>{t("checkIn.generated", { count: issues.length })}</Text>
            {issues.map((asset) => (
              <View key={asset.id} style={styles.generated}>
                <Ionicons name="construct-outline" size={18} color={colors.primary} />
                <Text style={styles.generatedText}>{l(asset.name)}</Text>
                <Text style={styles.caption}>{t("checkIn.pending")}</Text>
              </View>
            ))}
          </Card>
        )}
        <View style={{ gap: spacing.md, marginTop: spacing.xxl }}>
          <Button label={t("checkIn.viewResidency")} icon="id-card-outline" onPress={() => router.replace("/residency-record")} />
          {issues.length > 0 && <Button label={t("checkIn.requestTransfer")} variant="secondary" icon="swap-horizontal" onPress={() => router.replace("/request/create/roomTransfer")} />}
          <Button label={t("common.home")} variant="ghost" onPress={() => router.dismissTo("/")} />
        </View>
      </Screen>
    );

  return (
    <Screen
      header={
        <View>
          <AppHeader title={t("checkIn.title")} subtitle={info.code} onBack={() => (step === 0 ? router.back() : setStep(0))} />
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
            disabled={step === 1 && !agreed}
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
              <Text style={styles.roomName}>{info.room}</Text>
              <Text style={styles.roomMeta}>
                {t("common.building")} {info.building} · {t("common.floor")} {info.floor} · {t("common.bed")} {info.bed.slice(-2)} · {t("common.roomEight")}
              </Text>
            </Glass>
          </PhotoBackground>

          <Card style={styles.progressCard}>
            <View style={styles.progressHead}>
              <Text style={styles.cardTitle}>{t("checkIn.assetList")}</Text>
              <Text style={[styles.progressCount, { color: colors.primary }]}>
                {checked}/{assets.length}
              </Text>
            </View>
            <ProgressBar value={checked / assets.length} tone={checked === assets.length ? "success" : "primary"} />
            <Text style={styles.caption}>{t("checkIn.assetHint")}</Text>
          </Card>

          <View style={{ gap: spacing.md }}>
            {assets.map((asset) => {
              const report = reports[asset.id];
              const condition = report?.condition ?? "unchecked";
              const name = l(asset.name);
              return (
                <Card key={asset.id} style={[{ gap: spacing.md }, condition === "issue" && { borderColor: colors.danger, borderWidth: 1.5 }]}>
                  <View style={styles.assetHead}>
                    <IconBadge icon={asset.icon} tone={condition === "ok" ? "success" : condition === "issue" ? "danger" : "neutral"} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{name}</Text>
                      <Text style={styles.caption}>
                        {asset.code} · {t("checkIn.quantity", { count: asset.quantity })}
                      </Text>
                    </View>
                  </View>
                  {condition === "issue" && report && (
                    <Touchable onPress={() => openIssue(asset)} accessibilityLabel={t("checkIn.editReport", { asset: name })} style={styles.issueNote}>
                      <Ionicons name="alert-circle" size={16} color={colors.danger} />
                      <Text style={[styles.issueText, { color: colors.danger }]} numberOfLines={2}>
                        {report.issueType ? t(`checkIn.issue.${report.issueType}`) : ""}: {report.note}
                      </Text>
                      <Ionicons name="create-outline" size={16} color={colors.danger} />
                    </Touchable>
                  )}
                  <View style={styles.actions}>
                    <Touchable
                      onPress={() => setReports((current) => ({ ...current, [asset.id]: { condition: "ok" } }))}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: condition === "ok" }}
                      accessibilityLabel={t("checkIn.markGood", { asset: name })}
                      style={[styles.choice, condition === "ok" && { backgroundColor: colors.success }]}
                    >
                      <Ionicons name="checkmark-circle" size={18} color={condition === "ok" ? colors.white : colors.success} />
                      <Text style={[styles.choiceText, { color: condition === "ok" ? colors.white : colors.success }]}>{t("checkIn.good")}</Text>
                    </Touchable>
                    <Touchable
                      onPress={() => openIssue(asset)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: condition === "issue" }}
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
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.sectionTitle}>{t("checkIn.meters")}</Text>
          <View style={styles.meters}>
            <Card style={styles.meter}>
              <IconBadge icon="flash" tone="primary" size={40} rounded="circle" />
              <Text style={styles.caption}>{t("utilities.electricity")}</Text>
              <Text style={styles.meterValue}>{Formatter.decimal(info.meters.electricity)} kWh</Text>
            </Card>
            <Card style={styles.meter}>
              <IconBadge icon="water" tone="info" size={40} rounded="circle" />
              <Text style={styles.caption}>{t("utilities.water")}</Text>
              <Text style={styles.meterValue}>{Formatter.decimal(info.meters.water)} m³</Text>
            </Card>
          </View>
          <Text style={[styles.caption, { marginTop: spacing.sm }]}>{t("checkIn.meterNote", { date: Formatter.date(info.stayStartDate) })}</Text>

          <Text style={styles.sectionTitle}>{t("checkIn.summary")}</Text>
          <Card style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row" }}>
              <SummaryStat value={assets.length - issues.length} label={t("checkIn.goodAssets")} color={colors.success} />
              <SummaryStat value={issues.length} label={t("checkIn.issueAssets")} color={colors.danger} />
            </View>
            {issues.map((asset) => (
              <View key={asset.id} style={styles.generated}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.generatedText}>{l(asset.name)}</Text>
                <Text style={styles.caption}>{reports[asset.id]?.issueType ? t(`checkIn.issue.${reports[asset.id].issueType!}`) : ""}</Text>
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

      <BottomSheet visible={!!editing} onClose={() => setEditing(null)} title={t("checkIn.reportTitle")} subtitle={editing ? l(editing.name) : undefined} footer={<Button label={t("checkIn.saveReport")} icon="checkmark" onPress={saveIssue} />}>
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.cardTitle}>{t("checkIn.condition")}</Text>
          <ChipGroup<IssueType>
            scroll={false}
            value={draft.issueType ?? "damaged"}
            onChange={(value) => setDraft((current) => ({ ...current, issueType: value }))}
            options={ISSUE_TYPES.map((key) => ({ value: key, label: t(`checkIn.issue.${key}`) }))}
          />
        </View>
        <Field label={t("requestForm.description")} multiline value={draft.note ?? ""} onChangeText={(note) => setDraft((current) => ({ ...current, note }))} placeholder={t("checkIn.reportPlaceholder")} />
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.cardTitle}>{t("requestForm.evidence")}</Text>
          <PhotoSlots
            count={draft.photos ?? 0}
            onAdd={() => setDraft((current) => ({ ...current, photos: (current.photos ?? 0) + 1 }))}
            onRemove={() => setDraft((current) => ({ ...current, photos: Math.max(0, (current.photos ?? 0) - 1) }))}
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
