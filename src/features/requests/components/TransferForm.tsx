import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { ApiError, errorMessage } from "../../../shared/api";
import { Formatter } from "../../../shared/format";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Photos } from "../../../shared/images";
import { makeStyles, radius, spacing, useTheme } from "../../../shared/theme";
import { Callout, Card, Checkbox, ChipGroup, DateStrip, DateStripModel, EmptyState, Field, FormSection, Glass, PhotoBackground, Touchable, useToast } from "../../../shared/ui";
import { useAuth } from "../../auth/AuthProvider";
import { checkInApi } from "../../check-in/checkInApi";
import { bedLabel } from "../../registration/components/BedMap";
import { BuildingDto, mapRoom, registrationApi, Room } from "../../registration/registrationApi";
import { PricePreview, requestsApi, Residency } from "../requestsApi";
import { RequestFormShell } from "./RequestFormShell";

/**
 * Form yêu cầu chuyển phòng. Khi có `checkInId`, yêu cầu được gửi từ biên bản nhận phòng có tài sản
 * sự cố (`POST /student/check-in/{id}/room-transfer-request`) — BE khoá biên bản ngay sau khi gửi.
 */
export function TransferForm({ checkInId }: { checkInId?: string }) {
  const { t } = useI18n();
  const { notify } = useToast();
  const { colors } = useTheme();
  const styles = useStyles();
  const { request } = useAuth();
  const api = useMemo(() => requestsApi(request), [request]);
  const facilities = useMemo(() => registrationApi(request), [request]);
  const [residency, setResidency] = useState<Residency | null>(null);
  const [currentFee, setCurrentFee] = useState<number | null>(null);
  const [residencyError, setResidencyError] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<BuildingDto[] | null>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [bedId, setBedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PricePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [reason, setReason] = useState("");
  const [ack, setAck] = useState(false);
  const [inspectionDate, setInspectionDate] = useState<string | null>(null);
  // BQL kiểm tra tài sản phòng hiện tại trước khi duyệt chuyển phòng: sinh viên đề xuất ngày từ hôm nay.
  const inspectionDates = useMemo(() => {
    const now = new Date();
    return DateStripModel.range(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 30);
  }, []);

  useEffect(() => {
    let alive = true;
    api
      .residency()
      .then(async (current) => {
        if (!alive) return;
        setResidency(current);
        const currentRooms = await facilities.rooms(current.buildingId).catch(() => []);
        const room = currentRooms.find((item) => item.id === current.roomId);
        if (alive && room?.price != null) setCurrentFee(Number(room.price));
      })
      .catch((error: unknown) => alive && setResidencyError(errorMessage(error)));
    facilities
      .buildings()
      .then((items) => {
        if (!alive) return;
        setBuildings(items);
        setBuildingId((current) => current ?? items[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setBuildings([]);
        notify(errorMessage(error), "danger");
      });
    return () => {
      alive = false;
    };
  }, [api, facilities, notify]);

  useEffect(() => {
    if (!buildingId) return;
    let alive = true;
    facilities
      .rooms(buildingId)
      .then((items) => alive && setRooms(items.map(mapRoom).filter((room) => room.status === "available" && room.available > 0)))
      .catch((error: unknown) => {
        if (!alive) return;
        setRooms([]);
        notify(errorMessage(error), "danger");
      });
    return () => {
      alive = false;
    };
  }, [buildingId, facilities, notify]);

  const building = buildings?.find((item) => item.id === buildingId) ?? null;
  const room = rooms?.find((item) => item.id === roomId) ?? null;
  const bed = room?.beds.find((item) => item.id === bedId) ?? null;
  const freeBeds = room?.beds.filter((item) => item.status === "available" && item.id !== residency?.bedId) ?? [];
  // Dương = sinh viên nộp thêm, âm = KTX hoàn trả.
  const totalDiff = preview ? (preview.priceDifferenceAmount ? Number(preview.priceDifferenceAmount) : preview.refundAmount ? -Number(preview.refundAmount) : 0) : 0;
  const monthlyDiff = Number(preview?.monthlyDifference ?? 0);

  const chooseRoom = (item: Room) => {
    setRoomId(item.id);
    setBedId(null);
    setAck(false);
    setPreview(null);
    setPreviewing(true);
    api
      .previewTransferPrice(item.id)
      .then(setPreview)
      .catch((error: unknown) => notify(errorMessage(error), "danger"))
      .finally(() => setPreviewing(false));
  };

  const submit = async () => {
    const body = {
      desiredBuildingId: building!.id,
      desiredFloorId: room!.floorId,
      desiredRoomId: room!.id,
      desiredBedId: bed!.id,
      reason: reason.trim(),
      priceDifferenceAcknowledged: totalDiff !== 0 ? ack : undefined,
      preferredInspectionDate: inspectionDate!,
    };
    try {
      const created = checkInId ? await checkInApi(request).requestTransfer(checkInId, body) : await api.createTransfer(body);
      return created.id;
    } catch (error) {
      // Giường vừa bị người khác chọn: tải lại danh sách phòng để chọn lại.
      if (error instanceof ApiError && error.status === 409 && buildingId) {
        setBedId(null);
        facilities
          .rooms(buildingId)
          .then((items) => setRooms(items.map(mapRoom).filter((item) => item.status === "available" && item.available > 0)))
          .catch(() => undefined);
      }
      throw error;
    }
  };

  const currentText = residency ? `${residency.buildingName} · ${t("common.room")} ${residency.roomCode} · ${t("common.bed")} ${bedLabel(residency.bedCode)}` : "—";

  return (
    <RequestFormShell
      kind="roomTransfer"
      subtitle={checkInId ? t("requestForm.fromCheckIn") : undefined}
      validate={() => (!residency ? residencyError ?? t("requestForm.errResidency") : !room || !bed ? t("requestForm.errRoom") : !inspectionDate ? t("requestForm.errInspection") : !reason.trim() ? t("requestForm.errReason") : previewing ? t("requestForm.errPreview") : totalDiff !== 0 && !ack ? t("requestForm.errAck") : null)}
      onSubmit={submit}
      confirmNote={checkInId ? t("requestForm.checkInLockNote") : undefined}
      summary={[
        { label: t("requestForm.current"), value: residency ? `${residency.buildingName} · ${residency.roomCode} · ${bedLabel(residency.bedCode)}` : "—" },
        { label: t("requestForm.desired"), value: building && room && bed ? `${building.name} · ${room.code} · ${bedLabel(bed.code)}` : "—" },
        { label: t("requestForm.difference"), value: totalDiff === 0 ? t("requestForm.noDifference") : `${totalDiff > 0 ? "+" : "−"} ${Formatter.currency(Math.abs(totalDiff))}` },
        { label: t("requestForm.inspectionDate"), value: inspectionDate ? Formatter.date(inspectionDate) : "—" },
        { label: t("requestForm.transferReason"), value: reason.trim() },
      ]}
    >
      {checkInId && (
        <View style={{ marginTop: spacing.sm }}>
          <Callout tone="warning" icon="alert-circle" title={t("requestForm.fromCheckInTitle")}>
            {t("requestForm.checkInLockNote")}
          </Callout>
        </View>
      )}

      <PhotoBackground source={Photos.bunkBed(800)} style={styles.current}>
        <Glass variant="photo" strong style={styles.currentGlass}>
          <Ionicons name="bed" size={20} color={colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={styles.currentLabel}>{t("requestForm.currentPlace")}</Text>
            <Text style={styles.currentValue}>{residencyError ?? currentText}</Text>
          </View>
          {currentFee != null && (
            <Text style={styles.currentFee}>
              {Formatter.compactCurrency(currentFee)}
              {t("common.perMonthShort")}
            </Text>
          )}
        </Glass>
      </PhotoBackground>

      <FormSection title={t("requestForm.chooseBuilding")}>
        {!buildings ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <ChipGroup
            value={buildingId ?? ""}
            onChange={(value) => {
              if (value !== buildingId) setRooms(null);
              setBuildingId(value);
              setRoomId(null);
              setBedId(null);
              setPreview(null);
            }}
            options={buildings.map((item) => ({ value: item.id, label: item.name, icon: "business-outline" as const }))}
          />
        )}
      </FormSection>

      <FormSection title={t("requestForm.chooseRoom")}>
        {!rooms ? (
          <ActivityIndicator color={colors.primary} />
        ) : rooms.length === 0 ? (
          <EmptyState icon="bed-outline" title={t("requestForm.noRooms")} />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {rooms.map((item) => {
              const selected = item.id === roomId;
              return (
                <Touchable
                  key={item.id}
                  onPress={() => chooseRoom(item)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${t("common.room")} ${item.code}`}
                  style={[styles.room, selected && styles.selected]}
                >
                  <View style={[styles.radio, selected && { borderColor: colors.primary }]}>{selected && <View style={styles.radioDot} />}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roomCode}>
                      {t("common.room")} {item.code}
                    </Text>
                    <Text style={styles.roomMeta}>
                      {t("requestForm.freeBeds", { count: item.available })}
                      {item.type ? ` · ${item.type}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.roomFee}>{Formatter.currency(item.price)}</Text>
                </Touchable>
              );
            })}
          </View>
        )}
      </FormSection>

      {room && (
        <FormSection title={t("requestForm.chooseBed")}>
          <View style={styles.beds}>
            {freeBeds.map((item) => {
              const selected = bedId === item.id;
              return (
                <Touchable
                  key={item.id}
                  onPress={() => setBedId(item.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${t("common.bed")} ${item.code}`}
                  style={[styles.bed, selected && styles.bedSelected]}
                >
                  <Ionicons name="bed-outline" size={20} color={selected ? colors.onPrimary : colors.inkSoft} />
                  <Text style={[styles.bedText, selected && { color: colors.onPrimary }]} numberOfLines={1}>
                    {bedLabel(item.code)}
                  </Text>
                </Touchable>
              );
            })}
          </View>
        </FormSection>
      )}

      {room && (
        <Card style={styles.estimate}>
          <Text style={styles.caption}>{t("requestForm.priceEstimate")}</Text>
          {previewing || !preview ? (
            <ActivityIndicator color={colors.primary} style={{ alignSelf: "flex-start", marginVertical: spacing.sm }} />
          ) : (
            <>
              <Text style={[styles.estimateValue, { color: totalDiff > 0 ? colors.primary : totalDiff < 0 ? colors.success : colors.ink }]}>
                {totalDiff === 0 ? Formatter.currency(0) : `${totalDiff > 0 ? "+" : "−"}${Formatter.currency(Math.abs(totalDiff))}`}
              </Text>
              {preview.currentRoomPrice != null && preview.desiredRoomPrice != null && (
                <Text style={styles.line}>{t("requestForm.priceLine", { from: Formatter.currency(Number(preview.currentRoomPrice)), to: Formatter.currency(Number(preview.desiredRoomPrice)) })}</Text>
              )}
              {preview.remainingMonths != null && monthlyDiff !== 0 && (
                <Text style={styles.line}>{t("requestForm.priceFormula", { monthly: Formatter.currency(Math.abs(monthlyDiff)), months: Formatter.decimal(Number(preview.remainingMonths)) })}</Text>
              )}
              <Text style={[styles.line, { marginTop: 4 }]}>{t("requestForm.priceEstimateNote")}</Text>
              {totalDiff !== 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <Checkbox
                    checked={ack}
                    onChange={setAck}
                    label={totalDiff > 0 ? t("requestForm.ackExtra", { amount: Formatter.currency(totalDiff) }) : t("requestForm.ackRefund", { amount: Formatter.currency(-totalDiff) })}
                  />
                </View>
              )}
            </>
          )}
        </Card>
      )}

      <FormSection title={t("requestForm.inspectionDate")} hint={t("requestForm.transferInspectionHint")}>
        <DateStrip dates={inspectionDates} value={inspectionDate} onChange={setInspectionDate} />
      </FormSection>

      <FormSection title={t("requestForm.transferReason")}>
        <Field multiline value={reason} onChangeText={setReason} placeholder={checkInId ? t("requestForm.checkInReasonPlaceholder") : t("requestForm.transferReasonPlaceholder")} maxLength={500} />
      </FormSection>
    </RequestFormShell>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  current: { borderRadius: radius.lg, padding: spacing.sm, marginTop: spacing.sm, minHeight: 120, justifyContent: "flex-end" },
  currentGlass: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radius.md, padding: spacing.md },
  currentLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  currentValue: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", marginTop: 2 },
  currentFee: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  room: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1.5, borderColor: colors.border },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceWarm },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  roomCode: { ...font.label, fontSize: 15 },
  roomMeta: { ...font.caption, marginTop: 2 },
  roomFee: { ...font.label },
  beds: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  bed: { width: 76, height: 64, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 2 },
  bedSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  bedText: { ...font.label, fontSize: 13 },
  estimate: { marginTop: spacing.xxl, gap: 4 },
  caption: { ...font.caption, fontSize: 13 },
  estimateValue: { fontSize: 28, fontWeight: "800" },
  line: { ...font.body, fontSize: 13 },
}));
