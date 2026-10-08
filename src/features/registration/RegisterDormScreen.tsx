import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  FooterBar,
  Glass,
  IconName,
  InfoRow,
  LightStatusBar,
  PhotoBackground,
  ProgressBar,
  Screen,
  SectionHeader,
  SegmentedControl,
  StatusBadge,
  StepProgress,
  Touchable,
  useToast,
} from "../../shared/ui";
import { DebtRepository } from "../debts/debts.mock";
import { BedMap } from "./components/BedMap";
import { applicationTone, PricingPeriod, RegistrationRepository, roomStatusTone } from "./registration.mock";

type Phase = "overview" | "wizard" | "held";
const HOLD_SECONDS = 24 * 3600;

export function RegisterDormScreen() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("overview");
  const [held, setHeld] = useState<{ building: string; room: string; bed: string; total: number } | null>(null);
  if (phase === "overview") return <Overview onStart={() => setPhase("wizard")} />;
  if (phase === "held" && held) return <Held {...held} onCancelled={() => setPhase("overview")} />;
  return (
    <Wizard
      onExit={() => setPhase("overview")}
      onSubmitted={(value) => {
        setHeld(value);
        setPhase("held");
      }}
      title={t("registration.title")}
    />
  );
}

/** Tổng quan: đợt đăng ký đang mở, cảnh báo công nợ, đơn đã gửi. */
function Overview({ onStart }: { onStart: () => void }) {
  const { t, l } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const campaign = RegistrationRepository.campaign;
  return (
    <Screen
      padded={false}
      edges={[]}
      footer={
        <FooterBar>
          <Button label={t("registration.newApplication")} icon="add" onPress={onStart} style={{ flex: 1 }} />
        </FooterBar>
      }
    >
      <LightStatusBar />
      <PhotoBackground source={Photos.dormVietnam()} shade style={[styles.cover, { paddingTop: insets.top }]}>
        <AppHeader title={t("registration.title")} onPhoto />
        <Glass variant="photo" style={styles.campaign}>
          <View style={styles.campaignTag}>
            <Ionicons name="megaphone" size={16} color={colors.primaryLight} />
            <Text style={styles.campaignTagText}>{t("registration.openCampaign")}</Text>
          </View>
          <Text style={styles.campaignName}>{l(campaign.name)}</Text>
          <View style={styles.campaignGrid}>
            <CampaignCell icon="people-outline" label={t("registration.audience")} value={l(campaign.audience)} />
            <CampaignCell icon="calendar-outline" label={t("registration.period")} value={campaign.registration} />
            <CampaignCell icon="key-outline" label={t("registration.checkIn")} value={campaign.checkIn} />
          </View>
        </Glass>
      </PhotoBackground>

      <View style={styles.body}>
        {DebtRepository.hasOverdue() && (
          <View style={{ marginTop: spacing.xl }}>
            <Callout tone="danger" icon="alert-circle" title={t("registration.debtWarningTitle")} action={<Button label={t("registration.payDebt")} size="md" variant="danger" onPress={() => router.push("/debts")} />}>
              {t("registration.debtWarning")}
            </Callout>
          </View>
        )}
        <SectionHeader title={t("registration.instructions")} />
        <Callout tone="info" icon="document-text-outline">
          {l(campaign.instructions)}
        </Callout>
        <SectionHeader title={t("registration.myApplications")} />
        <View style={{ gap: spacing.md }}>
          {RegistrationRepository.applications.map((application) => (
            <Card key={application.id} style={styles.app}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.caption}>{application.id}</Text>
                <Text style={styles.appTitle}>{l(application.campaign)}</Text>
                <Text style={styles.caption}>
                  {application.place} · {Formatter.currency(application.amount)}
                </Text>
              </View>
              <StatusBadge label={t(`registration.appStatus.${application.status}`)} tone={applicationTone[application.status]} />
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function Wizard({ onExit, onSubmitted, title }: { onExit: () => void; onSubmitted: (value: { building: string; room: string; bed: string; total: number }) => void; title: string }) {
  const { t, l } = useI18n();
  const { notify } = useToast();
  const { colors, shadow } = useTheme();
  const styles = useStyles();
  const buildings = RegistrationRepository.buildings();
  const steps = [t("registration.steps.building"), t("registration.steps.floor"), t("registration.steps.room"), t("registration.steps.bed"), t("registration.steps.confirm")];
  const [step, setStep] = useState(0);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [floorNo, setFloorNo] = useState<number | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [bedCode, setBedCode] = useState<string | null>(null);
  const [period, setPeriod] = useState<PricingPeriod>("sixMonths");
  const [payment, setPayment] = useState<"now" | "later">("now");
  const [submitting, setSubmitting] = useState(false);

  const building = buildings.find((item) => item.id === buildingId) ?? null;
  const floor = building?.floors.find((item) => item.number === floorNo) ?? null;
  const room = floor?.rooms.find((item) => item.code === roomCode) ?? null;
  const months = RegistrationRepository.months[period];
  const total = room ? room.price * months : 0;
  const canNext = [!!building, !!floor, !!room, !!bedCode, true][step];
  const bldg = t("common.building");

  const back = () => (step === 0 ? onExit() : setStep(step - 1));
  const next = () => {
    if (step < steps.length - 1) return setStep(step + 1);
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      notify(payment === "now" ? t("registration.held") : t("registration.heldLater"));
      if (building && room && bedCode) onSubmitted({ building: `${bldg} ${building.id}`, room: room.code, bed: bedCode, total });
    }, 800);
  };

  return (
    <Screen
      header={
        <View>
          <AppHeader title={title} onBack={back} />
          <View style={styles.progress}>
            <StepProgress steps={steps} current={step} />
          </View>
        </View>
      }
      footer={
        <FooterBar>
          {step > 0 && <Button label={t("common.back")} variant="ghost" onPress={back} style={{ flex: 1 }} />}
          <Button
            label={step === steps.length - 1 ? (payment === "now" ? t("registration.submitPay") : t("registration.submit")) : t("common.continue")}
            icon={step === steps.length - 1 ? "send" : "arrow-forward"}
            iconPosition="right"
            disabled={!canNext}
            loading={submitting}
            onPress={next}
            style={{ flex: 2 }}
          />
        </FooterBar>
      }
    >
      {step === 0 && (
        <>
          <Text style={styles.stepTitle}>{t("registration.whichBuilding")}</Text>
          <View style={{ gap: spacing.md }}>
            {buildings.map((item) => {
              const selected = item.id === buildingId;
              const available = RegistrationRepository.availableBeds(item);
              const sample = item.floors[0].rooms[0];
              return (
                <Touchable
                  key={item.id}
                  onPress={() => {
                    setBuildingId(item.id);
                    setFloorNo(null);
                    setRoomCode(null);
                    setBedCode(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${bldg} ${item.id}, ${t("registration.freeBeds", { count: available })}`}
                  pressScale={0.98}
                  style={[styles.buildingShadow, shadow(1)]}
                >
                  <PhotoBackground source={Photos.building(item.id)} shade style={[styles.building, selected && styles.buildingSelected]}>
                    <View style={styles.buildingTop}>
                      <Glass variant="photo" style={styles.buildingBadge}>
                        <Text style={styles.buildingBadgeText}>
                          {bldg} {item.id}
                        </Text>
                      </Glass>
                      <Glass variant="photo" style={styles.buildingBadge}>
                        <Ionicons name={sample.gender === "male" ? "male" : "female"} size={13} color={colors.white} />
                        <Text style={styles.buildingBadgeText}>{t(`common.${sample.gender}`)}</Text>
                      </Glass>
                    </View>
                    <Glass variant="photo" strong style={styles.buildingInfo}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.buildingDesc} numberOfLines={1}>
                          {l(item.description)}
                        </Text>
                        <Text style={styles.buildingFree}>{t("registration.freeBeds", { count: available })}</Text>
                      </View>
                      <Text style={styles.buildingPrice}>
                        {Formatter.compactCurrency(sample.price)}
                        <Text style={styles.buildingUnit}>{t("common.perMonthShort")}</Text>
                      </Text>
                      {selected && <Ionicons name="checkmark-circle" size={26} color={colors.primaryLight} />}
                    </Glass>
                  </PhotoBackground>
                </Touchable>
              );
            })}
          </View>
        </>
      )}

      {step === 1 && building && (
        <>
          <Text style={styles.stepTitle}>{t("registration.chooseFloor", { building: `${bldg} ${building.id}` })}</Text>
          <View style={styles.floors}>
            {building.floors.map((item) => {
              const available = RegistrationRepository.floorAvailability(item);
              const capacity = item.rooms.reduce((sum, r) => sum + r.capacity, 0);
              const selected = item.number === floorNo;
              return (
                <Touchable
                  key={item.number}
                  disabled={available === 0}
                  onPress={() => {
                    setFloorNo(item.number);
                    setRoomCode(null);
                    setBedCode(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${t("common.floor")} ${item.number}, ${t("registration.free", { count: available })}`}
                  style={[styles.floor, selected && styles.selected]}
                >
                  <Text style={styles.caption}>{t("common.floor")}</Text>
                  <Text style={[styles.floorNum, selected && { color: colors.primary }]}>{item.number}</Text>
                  <ProgressBar value={available / capacity} tone="success" height={5} />
                  <Text style={styles.floorFree}>{t("registration.free", { count: available })}</Text>
                </Touchable>
              );
            })}
          </View>
        </>
      )}

      {step === 2 && floor && (
        <>
          <Text style={styles.stepTitle}>{t("registration.chooseRoom", { floor: floor.number })}</Text>
          <View style={{ gap: spacing.sm }}>
            {floor.rooms.map((item) => {
              const selected = item.code === roomCode;
              const disabled = item.status !== "available" || item.available === 0;
              return (
                <Touchable
                  key={item.code}
                  disabled={disabled}
                  onPress={() => {
                    setRoomCode(item.code);
                    setBedCode(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled }}
                  accessibilityLabel={`${t("common.room")} ${item.code}, ${t(`registration.roomStatus.${item.status}`)}`}
                  style={[styles.room, selected && styles.selected]}
                >
                  <View style={[styles.roomIcon, selected && { backgroundColor: colors.primary }]}>
                    <Text style={[styles.roomIconText, selected && { color: colors.onPrimary }]}>{item.code.slice(-2)}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.roomCode}>
                      {t("common.room")} {item.code}
                    </Text>
                    <Text style={styles.caption}>{t("registration.roomMeta", { capacity: item.capacity, available: item.available, gender: t(`common.${item.gender}`) })}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <StatusBadge label={t(`registration.roomStatus.${item.status}`)} tone={roomStatusTone[item.status]} />
                    <Text style={styles.roomPrice}>
                      {Formatter.compactCurrency(item.price)}
                      {t("common.perMonthShort")}
                    </Text>
                  </View>
                </Touchable>
              );
            })}
          </View>
        </>
      )}

      {step === 3 && room && (
        <>
          <Text style={styles.stepTitle}>{t("registration.chooseBed", { room: room.code })}</Text>
          <BedMap beds={room.beds} value={bedCode} onChange={setBedCode} />
        </>
      )}

      {step === 4 && building && floor && room && bedCode && (
        <>
          <Text style={styles.stepTitle}>{t("registration.review")}</Text>
          <PhotoBackground source={Photos.building(building.id, 800)} style={styles.summaryPhoto}>
            <Glass variant="photo" strong style={styles.summary}>
              <SummaryCell label={t("common.building")} value={building.id} />
              <SummaryCell label={t("common.floor")} value={`${floor.number}`} />
              <SummaryCell label={t("common.room")} value={room.code} />
              <SummaryCell label={t("common.bed")} value={bedCode} />
            </Glass>
          </PhotoBackground>
          <Text style={styles.subTitle}>{t("registration.duration")}</Text>
          <SegmentedControl<PricingPeriod>
            value={period}
            onChange={setPeriod}
            options={[
              { value: "sixMonths", label: t("registration.sixMonths") },
              { value: "oneYear", label: t("registration.oneYear") },
            ]}
          />
          <Card style={{ marginTop: spacing.md, paddingVertical: spacing.xs }}>
            <InfoRow label={t("residency.price")} value={`${Formatter.currency(room.price)}${t("common.perMonth")}`} />
            <InfoRow label={t("registration.duration")} value={t("common.months", { count: months })} />
            <InfoRow label={t("registration.totalPay")} value={Formatter.currency(total)} strong divider={false} />
          </Card>
          <Text style={styles.subTitle}>{t("registration.paymentMethod")}</Text>
          <View style={{ gap: spacing.sm }}>
            <PayOption selected={payment === "now"} onPress={() => setPayment("now")} icon="flash" title={t("registration.payNow")} body={t("registration.payNowBody")} badge={t("registration.recommended")} />
            <PayOption selected={payment === "later"} onPress={() => setPayment("later")} icon="time" title={t("registration.payLater")} body={t("registration.payLaterBody")} />
          </View>
        </>
      )}
    </Screen>
  );
}

/** Đã giữ chỗ: đếm ngược 24 giờ, thanh toán hoặc huỷ đăng ký. */
function Held({ building, room, bed, total, onCancelled }: { building: string; room: string; bed: string; total: number; onCancelled: () => void }) {
  const { t } = useI18n();
  const { notify } = useToast();
  const { colors } = useTheme();
  const styles = useStyles();
  const [seconds, setSeconds] = useState(HOLD_SECONDS);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Screen edges={["top", "bottom"]} header={<AppHeader title={t("registration.title")} onBack={() => router.back()} />}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark" size={46} color={colors.white} />
      </View>
      <Text style={styles.successTitle}>{t("registration.heldTitle")}</Text>
      <Text style={styles.successBody}>{t("registration.heldBody", { bed, room, building })}</Text>
      <Card style={styles.hold}>
        <Text style={[styles.caption, { textAlign: "center" }]}>{t("registration.holdLeft")}</Text>
        <Text style={styles.holdTime}>{Formatter.countdown(seconds)}</Text>
        <ProgressBar value={seconds / HOLD_SECONDS} tone="warning" />
        <InfoRow label={t("registration.amountDue")} value={Formatter.currency(total)} strong divider={false} />
      </Card>
      <Callout tone="warning" icon="alert-circle">
        {t("registration.holdWarning")}
      </Callout>
      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <Button
          label={t("registration.payNow")}
          icon="qr-code-outline"
          onPress={() => router.push({ pathname: "/debts/pay/[id]", params: { id: "DK-2026-5521", amount: String(total), title: `${t("debts.billType.registration")} · ${room} · G${bed}` } })}
        />
        <Button label={t("registration.cancel")} variant="danger" icon="close-circle-outline" onPress={() => setConfirmCancel(true)} />
      </View>
      <BottomSheet
        visible={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title={t("registration.cancelTitle")}
        subtitle={t("registration.cancelBody")}
        footer={
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Button label={t("common.back")} variant="ghost" onPress={() => setConfirmCancel(false)} style={{ flex: 1 }} />
            <Button
              label={t("registration.cancel")}
              variant="dark"
              onPress={() => {
                setConfirmCancel(false);
                notify(t("registration.cancelled"));
                onCancelled();
              }}
              style={{ flex: 1 }}
            />
          </View>
        }
      />
    </Screen>
  );
}

function CampaignCell({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.campaignCell}>
      <Ionicons name={icon} size={16} color={colors.primaryLight} />
      <Text style={styles.campaignLabel}>{label}</Text>
      <Text style={styles.campaignValue}>{value}</Text>
    </View>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function PayOption({ selected, onPress, icon, title, body, badge }: { selected: boolean; onPress: () => void; icon: IconName; title: string; body: string; badge?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Touchable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={title} style={[styles.pay, selected && styles.selected]}>
      <View style={[styles.payIcon, selected && { backgroundColor: colors.primary }]}>
        <Ionicons name={icon} size={18} color={selected ? colors.onPrimary : colors.inkSoft} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.payTitle}>{title}</Text>
          {badge && <Text style={styles.payBadge}>{badge}</Text>}
        </View>
        <Text style={styles.caption}>{body}</Text>
      </View>
      <View style={[styles.radio, selected && { borderColor: colors.primary }]}>{selected && <View style={styles.radioDot} />}</View>
    </Touchable>
  );
}

const white = "#FFFFFF";

const useStyles = makeStyles(({ colors, font }) => ({
  caption: { ...font.caption, fontSize: 12 },
  cover: { paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xl + 8, borderBottomRightRadius: radius.xl + 8 },
  campaign: { marginHorizontal: spacing.xl, marginTop: 70, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  campaignTag: { flexDirection: "row", alignItems: "center", gap: 8 },
  campaignTagText: { color: colors.primaryLight, fontWeight: "700", fontSize: 13 },
  campaignName: { color: white, fontSize: 19, fontWeight: "800", lineHeight: 25 },
  campaignGrid: { flexDirection: "row", gap: spacing.sm },
  campaignCell: { flex: 1, gap: 3, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.sm, padding: spacing.sm },
  campaignLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" },
  campaignValue: { color: white, fontSize: 12, fontWeight: "700", lineHeight: 16 },
  body: { paddingHorizontal: spacing.xl },
  app: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  appTitle: { ...font.label, fontSize: 15 },
  progress: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  stepTitle: { ...font.heading, marginTop: spacing.lg, marginBottom: spacing.md },
  subTitle: { ...font.label, fontSize: 15, marginTop: spacing.xl, marginBottom: spacing.sm },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceWarm },
  buildingShadow: { borderRadius: radius.lg },
  building: { height: 170, borderRadius: radius.lg, padding: spacing.sm, justifyContent: "space-between", borderWidth: 2, borderColor: "transparent" },
  buildingSelected: { borderColor: colors.primary },
  buildingTop: { flexDirection: "row", justifyContent: "space-between" },
  buildingBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, height: 30, borderRadius: radius.pill },
  buildingBadgeText: { color: white, fontSize: 12, fontWeight: "800" },
  buildingInfo: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md },
  buildingDesc: { color: white, fontSize: 14, fontWeight: "700" },
  buildingFree: { color: "#5BE49B", fontSize: 12, fontWeight: "700", marginTop: 2 },
  buildingPrice: { color: white, fontSize: 18, fontWeight: "800" },
  buildingUnit: { fontSize: 12, fontWeight: "600" },
  floors: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  floor: { width: "31%", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1.5, borderColor: colors.border, gap: 6 },
  floorNum: { fontSize: 30, fontWeight: "800", color: colors.ink, marginTop: -4 },
  floorFree: { ...font.caption, fontWeight: "700", color: colors.success },
  room: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1.5, borderColor: colors.border },
  roomIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  roomIconText: { fontSize: 17, fontWeight: "800", color: colors.ink },
  roomCode: { ...font.label, fontSize: 15 },
  roomPrice: { ...font.label, fontSize: 13 },
  summaryPhoto: { borderRadius: radius.lg, padding: spacing.sm, minHeight: 130, justifyContent: "flex-end" },
  summary: { flexDirection: "row", paddingVertical: spacing.md, borderRadius: radius.md },
  summaryLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  summaryValue: { fontSize: 20, fontWeight: "800", color: white },
  pay: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1.5, borderColor: colors.border },
  payIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  payTitle: { ...font.label, fontSize: 15 },
  payBadge: { fontSize: 10, fontWeight: "800", color: colors.success, backgroundColor: colors.successSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill, overflow: "hidden" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  successIcon: { alignSelf: "center", width: 92, height: 92, borderRadius: 46, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", marginTop: spacing.xxl },
  successTitle: { ...font.title, textAlign: "center", marginTop: spacing.xl },
  successBody: { ...font.body, textAlign: "center", marginTop: spacing.sm },
  hold: { marginTop: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
  holdTime: { fontSize: 32, fontWeight: "800", color: colors.warning, textAlign: "center", letterSpacing: 1 },
}));
