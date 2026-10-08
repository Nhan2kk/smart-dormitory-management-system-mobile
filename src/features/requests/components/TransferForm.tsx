import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, View } from "react-native";
import { Formatter } from "../../../shared/format";
import { useI18n } from "../../../shared/i18n/I18nProvider";
import { Photos } from "../../../shared/images";
import { makeStyles, radius, spacing, useTheme } from "../../../shared/theme";
import { Card, Checkbox, ChipGroup, Field, FormSection, Glass, PhotoBackground, Touchable } from "../../../shared/ui";
import { RequestRepository } from "../requests.mock";
import { RequestFormShell } from "./RequestFormShell";

export function TransferForm() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const options = RequestRepository.transferOptions;
  const [buildingId, setBuildingId] = useState(options.buildings[0].id);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [bed, setBed] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [ack, setAck] = useState(false);

  const building = options.buildings.find((item) => item.id === buildingId)!;
  const room = building.rooms.find((item) => item.code === roomCode) ?? null;
  const monthlyDiff = room ? room.fee - options.current.monthlyFee : 0;
  const totalDiff = monthlyDiff * options.remainingMonths;
  const bldg = t("common.building");

  return (
    <RequestFormShell
      kind="roomTransfer"
      validate={() => (!room || !bed ? t("requestForm.errRoom") : !reason.trim() ? t("requestForm.errReason") : totalDiff !== 0 && !ack ? t("requestForm.errAck") : null)}
      summary={[
        { label: t("requestForm.current"), value: `${bldg} ${options.current.building} · ${options.current.room} · G${options.current.bed.slice(-2)}` },
        { label: t("requestForm.desired"), value: room && bed ? `${bldg} ${building.id} · ${room.code} · G${bed}` : "—" },
        { label: t("requestForm.difference"), value: totalDiff === 0 ? t("requestForm.noDifference") : `${totalDiff > 0 ? "+" : "−"} ${Formatter.currency(Math.abs(totalDiff))}` },
        { label: t("requestForm.transferReason"), value: reason.trim() },
      ]}
    >
      <PhotoBackground source={Photos.bunkBed(800)} style={styles.current}>
        <Glass variant="photo" strong style={styles.currentGlass}>
          <Ionicons name="bed" size={20} color={colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={styles.currentLabel}>{t("requestForm.currentPlace")}</Text>
            <Text style={styles.currentValue}>
              {bldg} {options.current.building} · {t("common.room")} {options.current.room} · {t("common.bed")} {options.current.bed.slice(-2)}
            </Text>
          </View>
          <Text style={styles.currentFee}>
            {Formatter.compactCurrency(options.current.monthlyFee)}
            {t("common.perMonthShort")}
          </Text>
        </Glass>
      </PhotoBackground>

      <FormSection title={t("requestForm.chooseBuilding")}>
        <ChipGroup
          value={buildingId}
          onChange={(value) => {
            setBuildingId(value);
            setRoomCode(null);
            setBed(null);
          }}
          options={options.buildings.map((item) => ({ value: item.id, label: `${bldg} ${item.id}`, icon: "business-outline" as const }))}
        />
      </FormSection>

      <FormSection title={t("requestForm.chooseRoom")}>
        <View style={{ gap: spacing.sm }}>
          {building.rooms.map((item) => {
            const selected = item.code === roomCode;
            return (
              <Touchable
                key={item.code}
                onPress={() => {
                  setRoomCode(item.code);
                  setBed(null);
                }}
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
                  <Text style={styles.roomMeta}>{t("requestForm.freeBeds", { count: item.beds.length })}</Text>
                </View>
                <Text style={styles.roomFee}>{Formatter.currency(item.fee)}</Text>
              </Touchable>
            );
          })}
        </View>
      </FormSection>

      {room && (
        <FormSection title={t("requestForm.chooseBed")}>
          <View style={styles.beds}>
            {room.beds.map((code) => {
              const selected = bed === code;
              return (
                <Touchable
                  key={code}
                  onPress={() => setBed(code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${t("common.bed")} ${code}`}
                  style={[styles.bed, selected && styles.bedSelected]}
                >
                  <Ionicons name="bed-outline" size={20} color={selected ? colors.onPrimary : colors.inkSoft} />
                  <Text style={[styles.bedText, selected && { color: colors.onPrimary }]}>G{code}</Text>
                </Touchable>
              );
            })}
          </View>
        </FormSection>
      )}

      {room && (
        <Card style={styles.estimate}>
          <Text style={styles.caption}>{t("requestForm.priceEstimate")}</Text>
          <Text style={[styles.estimateValue, { color: totalDiff > 0 ? colors.primary : totalDiff < 0 ? colors.success : colors.ink }]}>
            {totalDiff === 0 ? Formatter.currency(0) : `${totalDiff > 0 ? "+" : "−"}${Formatter.currency(Math.abs(totalDiff))}`}
          </Text>
          <Text style={styles.line}>{t("requestForm.priceLine", { from: Formatter.currency(options.current.monthlyFee), to: Formatter.currency(room.fee) })}</Text>
          <Text style={styles.line}>{t("requestForm.priceFormula", { monthly: Formatter.currency(Math.abs(monthlyDiff)), months: options.remainingMonths })}</Text>
          {totalDiff !== 0 && (
            <View style={{ marginTop: spacing.md }}>
              <Checkbox
                checked={ack}
                onChange={setAck}
                label={totalDiff > 0 ? t("requestForm.ackExtra", { amount: Formatter.currency(totalDiff) }) : t("requestForm.ackRefund", { amount: Formatter.currency(-totalDiff) })}
              />
            </View>
          )}
        </Card>
      )}

      <FormSection title={t("requestForm.transferReason")}>
        <Field multiline value={reason} onChangeText={setReason} placeholder={t("requestForm.transferReasonPlaceholder")} />
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
