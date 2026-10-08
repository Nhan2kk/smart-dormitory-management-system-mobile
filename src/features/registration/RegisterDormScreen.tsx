import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError, errorMessage, isNotFound } from "../../shared/api";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import type { TranslationKey } from "../../shared/i18n/types";
import { Photos } from "../../shared/images";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import {
  AppHeader,
  BottomSheet,
  Button,
  Callout,
  Card,
  EmptyState,
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
import { useAuth } from "../auth/AuthProvider";
import { BedMap, bedLabel } from "./components/BedMap";
import {
  ACTIVE_STATUSES,
  applicationTone,
  BuildingDto,
  Floor,
  floorAvailability,
  groupFloors,
  isInScope,
  PERIOD_MONTHS,
  primaryAudience,
  PricingPeriod,
  Registration,
  registrationApi,
  roomStatusTone,
  StudentCampaign,
  StudentCampaignState,
} from "./registrationApi";

type Phase = "overview" | "wizard" | "held";
type Api = ReturnType<typeof registrationApi>;
type DebtBlock = { message: string; actionPath?: string };

const DEBT_CODE = "DORM_DEBT_UNSETTLED";

/** Mở màn thanh toán QR cho đơn đăng ký; xác nhận chuyển khoản sẽ gọi API thanh toán đơn. */
function openPayment(registration: Registration, title: string) {
  router.push({
    pathname: "/debts/pay/[id]",
    params: { id: registration.id, registrationId: registration.id, amount: String(registration.totalAmount), title: `${title} · ${registration.roomCode} · ${bedLabel(registration.bedCode)}` },
  });
}

export function RegisterDormScreen() {
  const { t } = useI18n();
  const { request } = useAuth();
  const api = useMemo(() => registrationApi(request), [request]);
  const [phase, setPhase] = useState<Phase>("overview");
  const [campaignState, setCampaignState] = useState<StudentCampaignState | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [debt, setDebt] = useState<DebtBlock | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [state, mine] = await Promise.all([
        api.currentCampaign(),
        api.mine().catch((error: unknown) => {
          if (isNotFound(error)) return null;
          throw error;
        }),
      ]);
      setCampaignState(state);
      setRegistration(mine);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Tải lại mỗi khi quay lại màn hình (vd. sau khi thanh toán xong ở màn QR).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Trạng thái đợt do BE tính theo giờ máy chủ: hỏi lại khi tới mốc mở/đóng đăng ký.
  const boundary = campaignState?.campaign ? (campaignState.state === "OPEN" ? campaignState.campaign.registrationEnd : campaignState.state === "UPCOMING" ? campaignState.campaign.registrationStart : null) : null;
  useEffect(() => {
    if (!boundary) return;
    const delay = Math.min(Math.max(new Date(boundary).getTime() - Date.now(), 0) + 1000, 2 ** 31 - 1);
    const timer = setTimeout(() => {
      api.currentCampaign().then(setCampaignState).catch(() => undefined);
    }, delay);
    return () => clearTimeout(timer);
  }, [boundary, api]);

  // Đơn đã thanh toán/huỷ/hết hạn thì màn giữ chỗ tự rơi về Tổng quan.
  if (phase === "held" && registration?.status === "pending_payment")
    return <Held api={api} registration={registration} onChanged={setRegistration} />;
  if (phase === "wizard" && campaignState?.state === "OPEN" && campaignState.campaign)
    return (
      <Wizard
        api={api}
        campaign={campaignState.campaign}
        title={t("registration.title")}
        onExit={() => setPhase("overview")}
        onCampaign={setCampaignState}
        onDebt={(block) => {
          setDebt(block);
          setPhase("overview");
        }}
        onCreated={(created, payNow) => {
          setRegistration(created);
          setPhase("held");
          if (payNow) openPayment(created, t("debts.billType.registration"));
        }}
      />
    );
  return (
    <Overview
      loading={loading}
      loadError={loadError}
      campaignState={campaignState}
      registration={registration}
      debt={debt}
      onRetry={() => {
        setLoading(true);
        load();
      }}
      onStart={() => {
        setDebt(null);
        setPhase("wizard");
      }}
      onHeld={() => setPhase("held")}
    />
  );
}

/** Tổng quan: đợt đăng ký hiện tại, cảnh báo công nợ, đơn đã gửi. */
function Overview({
  loading,
  loadError,
  campaignState,
  registration,
  debt,
  onRetry,
  onStart,
  onHeld,
}: {
  loading: boolean;
  loadError: string | null;
  campaignState: StudentCampaignState | null;
  registration: Registration | null;
  debt: DebtBlock | null;
  onRetry: () => void;
  onStart: () => void;
  onHeld: () => void;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const campaign = campaignState?.campaign ?? null;
  const state = campaignState?.state ?? "NONE";
  const audience = campaign ? primaryAudience(campaign) : null;
  const active = registration && ACTIVE_STATUSES.includes(registration.status) ? registration : null;
  const range = (from?: string | null, to?: string | null) => (from && to ? `${Formatter.shortDate(from)} – ${Formatter.date(to)}` : "—");
  const tag: { icon: IconName; key: TranslationKey } =
    state === "OPEN" ? { icon: "megaphone", key: "registration.openCampaign" } : state === "UPCOMING" ? { icon: "time-outline", key: "registration.upcomingCampaign" } : { icon: "information-circle-outline", key: "registration.noCampaign" };

  const footer = active ? (
    active.status === "pending_payment" ? (
      <Button label={t("registration.continuePayment")} icon="qr-code-outline" onPress={onHeld} style={{ flex: 1 }} />
    ) : (
      <Button label={t("registration.goCheckIn")} icon="key-outline" onPress={() => router.push("/check-in")} style={{ flex: 1 }} />
    )
  ) : (
    <Button label={state === "OPEN" ? t("registration.newApplication") : t("registration.notOpen")} icon="add" disabled={state !== "OPEN" || loading} onPress={onStart} style={{ flex: 1 }} />
  );

  return (
    <Screen padded={false} edges={[]} footer={<FooterBar>{footer}</FooterBar>}>
      <LightStatusBar />
      <PhotoBackground source={Photos.dormVietnam()} shade style={[styles.cover, { paddingTop: insets.top }]}>
        <AppHeader title={t("registration.title")} onPhoto />
        <Glass variant="photo" style={styles.campaign}>
          {loading && !campaignState ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <View style={styles.campaignTag}>
                <Ionicons name={tag.icon} size={16} color={colors.primaryLight} />
                <Text style={styles.campaignTagText}>{t(tag.key)}</Text>
              </View>
              <Text style={styles.campaignName}>{campaign?.name ?? t("registration.noCampaign")}</Text>
              {campaign && (
                <View style={styles.campaignGrid}>
                  <CampaignCell icon="people-outline" label={t("registration.audience")} value={!audience || audience.audienceCode.toUpperCase() === "ALL" ? t("registration.allStudents") : audience.audienceCode} />
                  <CampaignCell icon="calendar-outline" label={t("registration.period")} value={range(audience?.registrationStart ?? campaign.registrationStart, audience?.registrationEnd ?? campaign.registrationEnd)} />
                  <CampaignCell icon="key-outline" label={t("registration.checkIn")} value={range(audience?.checkInStart, audience?.checkInEnd)} />
                </View>
              )}
              {state !== "OPEN" && <Text style={styles.campaignMessage}>{campaignState?.message ?? t("registration.noCampaignBody")}</Text>}
            </>
          )}
        </Glass>
      </PhotoBackground>

      <View style={styles.body}>
        {loadError && (
          <View style={{ marginTop: spacing.xl }}>
            <Callout tone="danger" icon="cloud-offline-outline" title={t("registration.loadFailed")} action={<Button label={t("common.retry")} size="md" variant="secondary" onPress={onRetry} />}>
              {loadError}
            </Callout>
          </View>
        )}
        {debt && (
          <View style={{ marginTop: spacing.xl }}>
            <Callout tone="danger" icon="alert-circle" title={t("registration.debtWarningTitle")} action={<Button label={t("registration.payDebt")} size="md" variant="danger" onPress={() => router.push("/debts")} />}>
              {debt.message || t("registration.debtWarning")}
            </Callout>
          </View>
        )}
        <SectionHeader title={t("registration.instructions")} />
        <Callout tone="info" icon="document-text-outline">
          {campaign?.checkInInstructions?.trim() || t("registration.defaultInstructions")}
        </Callout>
        <SectionHeader title={t("registration.myApplications")} />
        {registration ? (
          <Touchable
            disabled={!active}
            onPress={() => (registration.status === "pending_payment" ? onHeld() : router.push("/check-in"))}
            accessibilityRole="button"
            accessibilityLabel={`${registration.id}, ${t(`registration.appStatus.${registration.status}`)}`}
            pressScale={0.98}
          >
            <Card style={styles.app}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.caption}>{registration.id}</Text>
                <Text style={styles.appTitle}>
                  {registration.buildingName} · {registration.floorName}
                </Text>
                <Text style={styles.caption}>
                  {registration.roomCode} · {bedLabel(registration.bedCode)} · {Formatter.currency(registration.totalAmount)}
                </Text>
              </View>
              <StatusBadge label={t(`registration.appStatus.${registration.status}`)} tone={applicationTone[registration.status] ?? "neutral"} />
            </Card>
          </Touchable>
        ) : (
          !loading && <Text style={styles.caption}>{t("registration.noApplications")}</Text>
        )}
      </View>
    </Screen>
  );
}

function Wizard({
  api,
  campaign,
  title,
  onExit,
  onCampaign,
  onDebt,
  onCreated,
}: {
  api: Api;
  campaign: StudentCampaign;
  title: string;
  onExit: () => void;
  onCampaign: (state: StudentCampaignState) => void;
  onDebt: (block: DebtBlock) => void;
  onCreated: (registration: Registration, payNow: boolean) => void;
}) {
  const { t } = useI18n();
  const { notify } = useToast();
  const { colors, shadow } = useTheme();
  const styles = useStyles();
  const steps = [t("registration.steps.building"), t("registration.steps.floor"), t("registration.steps.room"), t("registration.steps.bed"), t("registration.steps.confirm")];
  const [step, setStep] = useState(0);
  const [buildings, setBuildings] = useState<BuildingDto[] | null>(null);
  const [floors, setFloors] = useState<Floor[] | null>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [bedId, setBedId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PricingPeriod>("6months");
  const [payment, setPayment] = useState<"now" | "later">("now");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .buildings()
      .then((items) => alive && setBuildings(items.filter((item) => isInScope(campaign, item.id))))
      .catch((error: unknown) => {
        if (!alive) return;
        setBuildings([]);
        notify(errorMessage(error), "danger");
      });
    return () => {
      alive = false;
    };
  }, [api, campaign, notify]);

  const loadFloors = useCallback(
    async (id: string) => {
      const [floorItems, roomItems] = await Promise.all([api.floors(id), api.rooms(id)]);
      return groupFloors(floorItems, roomItems);
    },
    [api],
  );

  useEffect(() => {
    if (!buildingId) return;
    let alive = true;
    loadFloors(buildingId)
      .then((items) => alive && setFloors(items))
      .catch((error: unknown) => {
        if (!alive) return;
        setFloors([]);
        notify(errorMessage(error), "danger");
      });
    return () => {
      alive = false;
    };
  }, [buildingId, loadFloors, notify]);

  const building = buildings?.find((item) => item.id === buildingId) ?? null;
  const floor = floors?.find((item) => item.id === floorId) ?? null;
  const room = floor?.rooms.find((item) => item.id === roomId) ?? null;
  const bed = room?.beds.find((item) => item.id === bedId) ?? null;
  const months = PERIOD_MONTHS[period];
  const total = room ? room.price * months : 0;
  const canNext = [!!building, !!floor, !!room, !!bed, true][step];
  const floorTitle = (item: Floor) => (item.number !== null ? `${t("common.floor")} ${item.number}` : item.name);

  const back = () => (step === 0 ? onExit() : setStep(step - 1));

  /** Giường vừa bị người khác giữ/đợt hết chỉ tiêu: tải lại sơ đồ và quay lại bước chọn giường. */
  const refreshBeds = async () => {
    if (!buildingId) return;
    try {
      setFloors(await loadFloors(buildingId));
    } catch {
      // giữ dữ liệu cũ nếu tải lại thất bại
    }
    setBedId(null);
    setStep(3);
  };

  const submit = async () => {
    if (!building || !floor || !room || !bed) return;
    setSubmitting(true);
    try {
      // Hỏi lại đợt hiện tại ngay trước khi đặt giường để không dùng campaignId của đợt đã đóng/huỷ.
      const fresh = await api.currentCampaign();
      onCampaign(fresh);
      if (fresh.state !== "OPEN" || !fresh.campaign) return notify(t("registration.staleCampaign"), "warning");
      if (!isInScope(fresh.campaign, building.id)) return notify(t("registration.outOfScope"), "warning");
      const created = await api.create({ campaignId: fresh.campaign.id, buildingId: building.id, floorId: floor.id, roomId: room.id, bedId: bed.id, pricingPeriod: period });
      notify(payment === "now" ? t("registration.held") : t("registration.heldLater"));
      onCreated(created, payment === "now");
    } catch (error) {
      if (error instanceof ApiError && error.code === DEBT_CODE) return onDebt({ message: error.message, actionPath: error.actionPath });
      notify(errorMessage(error), "danger");
      if (error instanceof ApiError && error.status === 409) {
        await refreshBeds();
        notify(t("registration.bedRefreshed"), "warning");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => (step < steps.length - 1 ? setStep(step + 1) : submit());

  const loader = <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />;

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
          {!buildings ? (
            loader
          ) : buildings.length === 0 ? (
            <EmptyState icon="business-outline" title={t("registration.noBuildings")} />
          ) : (
            <View style={{ gap: spacing.md }}>
              {buildings.map((item, index) => {
                const selected = item.id === buildingId;
                const photoKey = item.name.trim().slice(-1).toUpperCase();
                return (
                  <Touchable
                    key={item.id}
                    onPress={() => {
                      if (item.id !== buildingId) setFloors(null);
                      setBuildingId(item.id);
                      setFloorId(null);
                      setRoomId(null);
                      setBedId(null);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${item.name}, ${t("registration.floorsCount", { count: item.floors })}`}
                    pressScale={0.98}
                    style={[styles.buildingShadow, shadow(1)]}
                  >
                    <PhotoBackground source={Photos.building(/[A-Z]/.test(photoKey) ? photoKey : "ABCD"[index % 4])} shade style={[styles.building, selected && styles.buildingSelected]}>
                      <View style={styles.buildingTop}>
                        <Glass variant="photo" style={styles.buildingBadge}>
                          <Text style={styles.buildingBadgeText}>{item.name}</Text>
                        </Glass>
                        <Glass variant="photo" style={styles.buildingBadge}>
                          <Ionicons name="layers-outline" size={13} color={colors.white} />
                          <Text style={styles.buildingBadgeText}>{t("registration.floorsCount", { count: item.floors })}</Text>
                        </Glass>
                      </View>
                      <Glass variant="photo" strong style={styles.buildingInfo}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.buildingDesc} numberOfLines={1}>
                            {t("registration.buildingMeta", { rooms: item.rooms, rate: Formatter.decimal(item.occupancyRate) })}
                          </Text>
                        </View>
                        {item.baseRoomPrice != null && (
                          <Text style={styles.buildingPrice}>
                            {Formatter.compactCurrency(Number(item.baseRoomPrice))}
                            <Text style={styles.buildingUnit}>{t("common.perMonthShort")}</Text>
                          </Text>
                        )}
                        {selected && <Ionicons name="checkmark-circle" size={26} color={colors.primaryLight} />}
                      </Glass>
                    </PhotoBackground>
                  </Touchable>
                );
              })}
            </View>
          )}
        </>
      )}

      {step === 1 && building && (
        <>
          <Text style={styles.stepTitle}>{t("registration.chooseFloor", { building: building.name })}</Text>
          {!floors ? (
            loader
          ) : (
            <View style={styles.floors}>
              {floors.map((item) => {
                const available = floorAvailability(item);
                const capacity = item.rooms.reduce((sum, r) => sum + r.capacity, 0);
                const selected = item.id === floorId;
                return (
                  <Touchable
                    key={item.id}
                    disabled={available === 0}
                    onPress={() => {
                      setFloorId(item.id);
                      setRoomId(null);
                      setBedId(null);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: available === 0 }}
                    accessibilityLabel={`${floorTitle(item)}, ${t("registration.free", { count: available })}`}
                    style={[styles.floor, selected && styles.selected, available === 0 && { opacity: 0.55 }]}
                  >
                    <Text style={styles.caption}>{t("common.floor")}</Text>
                    <Text style={[styles.floorNum, selected && { color: colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>
                      {item.number ?? item.name}
                    </Text>
                    <ProgressBar value={capacity ? available / capacity : 0} tone="success" height={5} />
                    <Text style={styles.floorFree}>{t("registration.free", { count: available })}</Text>
                  </Touchable>
                );
              })}
            </View>
          )}
        </>
      )}

      {step === 2 && floor && (
        <>
          <Text style={styles.stepTitle}>{t("registration.chooseRoom", { floor: floorTitle(floor) })}</Text>
          {floor.rooms.length === 0 ? (
            <EmptyState icon="grid-outline" title={t("registration.noRooms")} />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {floor.rooms.map((item) => {
                const selected = item.id === roomId;
                const disabled = item.status !== "available" || item.available === 0;
                return (
                  <Touchable
                    key={item.id}
                    disabled={disabled}
                    onPress={() => {
                      setRoomId(item.id);
                      setBedId(null);
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
                      <Text style={styles.caption}>
                        {t("registration.roomMeta", { capacity: item.capacity, available: item.available })}
                        {item.type ? ` · ${item.type}` : ""}
                      </Text>
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
          )}
        </>
      )}

      {step === 3 && room && (
        <>
          <Text style={styles.stepTitle}>{t("registration.chooseBed", { room: room.code })}</Text>
          {room.beds.length === 0 ? <EmptyState icon="bed-outline" title={t("registration.noBeds")} /> : <BedMap beds={room.beds} value={bedId} onChange={setBedId} />}
        </>
      )}

      {step === 4 && building && floor && room && bed && (
        <>
          <Text style={styles.stepTitle}>{t("registration.review")}</Text>
          <PhotoBackground source={Photos.building(building.name.trim().slice(-1).toUpperCase(), 800)} style={styles.summaryPhoto}>
            <Glass variant="photo" strong style={styles.summary}>
              <SummaryCell label={t("common.building")} value={building.name.replace(/^(tòa|toà|tòa nhà)\s+/i, "")} />
              <SummaryCell label={t("common.floor")} value={floor.number !== null ? `${floor.number}` : floor.name} />
              <SummaryCell label={t("common.room")} value={room.code} />
              <SummaryCell label={t("common.bed")} value={bedLabel(bed.code)} />
            </Glass>
          </PhotoBackground>
          <Text style={styles.subTitle}>{t("registration.duration")}</Text>
          <SegmentedControl<PricingPeriod>
            value={period}
            onChange={setPeriod}
            options={[
              { value: "6months", label: t("registration.sixMonths") },
              { value: "1year", label: t("registration.oneYear") },
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

/** Đã giữ chỗ: đếm ngược tới hạn thanh toán của BE, thanh toán hoặc huỷ đăng ký. */
function Held({ api, registration, onChanged }: { api: Api; registration: Registration; onChanged: (registration: Registration | null) => void }) {
  const { t } = useI18n();
  const { notify } = useToast();
  const { colors } = useTheme();
  const styles = useStyles();
  const deadline = registration.paymentDeadline ? new Date(registration.paymentDeadline).getTime() : null;
  const windowSeconds = deadline ? Math.max(1, Math.round((deadline - new Date(registration.createdAt).getTime()) / 1000)) : 1;
  const remaining = () => (deadline ? Math.max(0, Math.round((deadline - Date.now()) / 1000)) : 0);
  const [seconds, setSeconds] = useState(remaining);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => setSeconds(Math.max(0, Math.round((deadline - Date.now()) / 1000))), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  // Hết hạn: hỏi lại BE một lần (BE tự chuyển đơn sang "expired" và nhả giường).
  const expiredHandled = useRef(false);
  useEffect(() => {
    if (!deadline || seconds > 0 || expiredHandled.current) return;
    expiredHandled.current = true;
    notify(t("registration.holdExpired"), "warning");
    api
      .mine()
      .then(onChanged)
      .catch(() => onChanged({ ...registration, status: "expired" }));
  }, [deadline, seconds, api, onChanged, registration, notify, t]);

  const cancel = async () => {
    setCancelling(true);
    try {
      const cancelled = await api.cancel(registration.id);
      setConfirmCancel(false);
      notify(t("registration.cancelled"));
      onChanged(cancelled);
    } catch (error) {
      notify(errorMessage(error), "danger");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Screen edges={["top", "bottom"]} header={<AppHeader title={t("registration.title")} onBack={() => router.back()} />}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark" size={46} color={colors.white} />
      </View>
      <Text style={styles.successTitle}>{t("registration.heldTitle")}</Text>
      <Text style={styles.successBody}>{t("registration.heldBody", { bed: bedLabel(registration.bedCode), room: registration.roomCode, building: registration.buildingName })}</Text>
      <Card style={styles.hold}>
        <Text style={[styles.caption, { textAlign: "center" }]}>{t("registration.holdLeft")}</Text>
        <Text style={styles.holdTime}>{Formatter.countdown(seconds)}</Text>
        <ProgressBar value={seconds / windowSeconds} tone="warning" />
        <InfoRow label={t("registration.amountDue")} value={Formatter.currency(registration.totalAmount)} strong divider={false} />
      </Card>
      <Callout tone="warning" icon="alert-circle">
        {t("registration.holdWarning", { deadline: registration.paymentDeadline ? Formatter.dateTime(registration.paymentDeadline) : "—" })}
      </Callout>
      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <Button label={t("registration.payNow")} icon="qr-code-outline" disabled={seconds === 0} onPress={() => openPayment(registration, t("debts.billType.registration"))} />
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
            <Button label={t("registration.cancel")} variant="dark" loading={cancelling} onPress={cancel} style={{ flex: 1 }} />
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
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
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
  campaignMessage: { color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 19 },
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
